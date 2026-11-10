import {readFile} from 'node:fs/promises';

// Install only filming overlays. No application styles, data, or business actions change.
export async function installGuideOverlay(page) {
  if (await page.locator('#guide-video-overlay').count()) throw new Error('Guide overlay already installed');
  const css = await readFile(new URL('./guide-overlay.css', import.meta.url), 'utf8');
  const style = await page.addStyleTag({content: css});
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.id = 'guide-video-overlay';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <div class="gv-spot"></div>
      <div class="gv-caption"><div class="gv-main"></div><div class="gv-detail"></div></div>
      <div class="gv-pointer"></div>
      <div class="gv-card"><div class="gv-card-eyebrow"></div><div class="gv-card-title"></div><div class="gv-card-description"></div></div>`;
    document.body.appendChild(root);
    const pointer = root.querySelector('.gv-pointer');
    const spot = root.querySelector('.gv-spot');
    const state = {target: null, point: {x: 0, y: 0}, frame: 0};
    root.guideState = state;

    // A shared event position prevents a decorative cursor diverging from the real click.
    const move = event => {
      state.point = {x: event.clientX, y: event.clientY};
      Object.assign(pointer.style, {left: `${event.clientX}px`, top: `${event.clientY}px`, opacity: '1'});
    };
    const down = event => {
      move(event);
      const ring = document.createElement('div');
      ring.className = 'gv-ripple';
      Object.assign(ring.style, {left: `${event.clientX}px`, top: `${event.clientY}px`});
      root.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove(), {once: true});
    };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerdown', down, true);

    // Track scrolling, resizing, and modal movement without moving the cursor or scrolling the app.
    const frame = () => {
      const scale = Math.min(innerWidth / 1680, innerHeight / 1050);
      root.style.setProperty('--gv-scale', String(scale));
      const target = state.target;
      if (target?.isConnected) {
        const rect = target.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth && target.checkVisibility({checkVisibilityCSS: true});
        const gap = 5 * scale;
        Object.assign(spot.style, {
          left: `${rect.x - gap}px`, top: `${rect.y - gap}px`,
          width: `${rect.width + gap * 2}px`, height: `${rect.height + gap * 2}px`,
          opacity: visible ? '1' : '0'
        });
      } else {
        state.target = null;
        spot.style.opacity = '0';
      }
      state.frame = requestAnimationFrame(frame);
    };
    state.frame = requestAnimationFrame(frame);
    state.dispose = () => {
      cancelAnimationFrame(state.frame);
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerdown', down, true);
    };
  });

  // Caller controls reading time and workflow; text stays inert and captions may move above controls.
  const setCaption = async ({title, detail = '', placement = 'bottom'}) => {
    await page.locator('#guide-video-overlay').evaluate((root, {title, detail, placement}) => {
      const caption = root.querySelector('.gv-caption');
      caption.querySelector('.gv-main').textContent = title;
      caption.querySelector('.gv-detail').textContent = detail;
      caption.dataset.placement = placement;
      caption.style.display = 'block';
    }, {title, detail, placement});
  };
  const clearFocus = async ({hidePointer = false} = {}) => {
    await page.locator('#guide-video-overlay').evaluate((root, hidePointer) => {
      root.guideState.target = null;
      root.querySelector('.gv-spot').style.opacity = '0';
      if (hidePointer) root.querySelector('.gv-pointer').style.opacity = '0';
    }, hidePointer);
  };

  // Fade in a fresh highlight only after the prior one fades out; never teleport the pointer.
  const focus = async (locator, {dim = .18} = {}) => {
    await clearFocus();
    await page.waitForTimeout(190);
    await locator.evaluate((element, dim) => {
      const root = document.getElementById('guide-video-overlay');
      root.querySelector('.gv-spot').style.setProperty('--gv-dim', String(dim));
      root.guideState.target = element;
    }, dim);
    await page.waitForTimeout(200);
  };

  // Mouse steps are paced in wall-clock time; Playwright's steps alone would move too quickly.
  const moveTo = async (locator, {duration = 650} = {}) => {
    const box = await locator.boundingBox();
    const viewport = await page.evaluate(() => ({width: innerWidth, height: innerHeight}));
    if (!box || box.x < 0 || box.y < 0 || box.x + box.width > viewport.width || box.y + box.height > viewport.height) {
      throw new Error('Scroll the target into view smoothly before moveTo()');
    }
    const from = await page.locator('#guide-video-overlay').evaluate(root => root.guideState.point);
    const to = {x: box.x + box.width / 2, y: box.y + box.height / 2};
    const frames = Math.max(1, Math.ceil(duration / 16));
    for (let i = 1; i <= frames; i++) {
      const t = i / frames;
      const ease = t * t * (3 - 2 * t);
      await page.mouse.move(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease);
      await page.waitForTimeout(duration / frames);
    }
  };

  // Cards are editorial layers; both intro and outro share the reference treatment.
  const showCard = async ({eyebrow = '', title, description = ''}) => {
    await clearFocus({hidePointer: true});
    await page.locator('#guide-video-overlay').evaluate((root, {eyebrow, title, description}) => {
      root.querySelector('.gv-caption').style.display = 'none';
      const card = root.querySelector('.gv-card');
      card.querySelector('.gv-card-eyebrow').textContent = eyebrow;
      card.querySelector('.gv-card-title').textContent = title;
      card.querySelector('.gv-card-description').textContent = description;
      card.dataset.visible = 'true';
    }, {eyebrow, title, description});
    await page.waitForTimeout(320);
  };
  const hideCard = async () => {
    await page.locator('#guide-video-overlay .gv-card').evaluate(card => card.dataset.visible = 'false');
    await page.waitForTimeout(320);
  };

  return {
    setCaption, focus, clearFocus, moveTo, showCard, hideCard,
    showIntro: showCard, hideIntro: hideCard,
    async hideCaption() {
      await page.locator('#guide-video-overlay .gv-caption').evaluate(caption => caption.style.display = 'none');
    },
    async destroy() {
      await page.locator('#guide-video-overlay').evaluate(root => {
        root.guideState.dispose();
        root.remove();
      });
      await style.evaluate(element => element.remove());
    }
  };
}
