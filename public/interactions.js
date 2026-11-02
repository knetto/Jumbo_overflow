import { icon } from './ui.js';

const enhanced = new WeakMap();
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let current = null;
let initialized = false;
let sequence = 0;
let repositionFrame = 0;
let pressedButton = null;
const closing = new Set();
const gsap = () => window.gsap;
const motionAllowed = () => !motionPreference.matches && !!gsap();

function labelFor(select) {
  return select.labels?.[0] || null;
}

function updateTrigger(control) {
  const { select, trigger } = control;
  const selected = select.selectedOptions[0];
  trigger.querySelector('.dropdown-value').textContent = selected?.textContent || 'Kies een optie';
  const leading = trigger.querySelector('.dropdown-leading');
  const leadingIcon = selected?.dataset.icon || select.dataset.icon;
  leading.innerHTML = leadingIcon ? icon(leadingIcon, 'sm') : '';
  leading.hidden = !leadingIcon;
  trigger.disabled = select.disabled;
  trigger.setAttribute('aria-required', String(select.required));
}

function enhance(select) {
  if (enhanced.has(select) || select.multiple || select.dataset.native !== undefined) return;
  if (!select.id) select.id = `select-${++sequence}`;
  const wrapper = document.createElement('div');
  wrapper.className = `custom-select${select.classList.contains('sort-select') ? ' is-compact' : ''}`;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = `${select.id}-trigger`;
  trigger.className = 'dropdown-trigger';
  trigger.dataset.selectId = select.id;
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `${select.id}-listbox`);
  trigger.innerHTML = `<span class="dropdown-leading" aria-hidden="true"></span><span class="dropdown-value"></span><span class="dropdown-chevron" aria-hidden="true">${icon('down','sm')}</span>`;
  const label = labelFor(select);
  if (label) {
    if (!label.id) label.id = `${select.id}-label`;
    trigger.setAttribute('aria-labelledby', label.id);
    label.htmlFor = trigger.id;
  } else {
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || 'Kies een optie');
  }
  const control = { select, trigger, wrapper, label };
  enhanced.set(select, control);
  select.before(wrapper);
  wrapper.append(select, trigger);
  // Keep the original control for FormData, validation and existing change handlers.
  select.hidden = true;
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.addEventListener('change', () => updateTrigger(control));
  select.addEventListener('invalid', event => {
    event.preventDefault();
    trigger.setAttribute('aria-invalid', 'true');
    trigger.focus();
  });
  updateTrigger(control);
}

export function enhanceSelects(root = document) {
  if (current && !current.select.isConnected) closeDropdown(true);
  for (const menu of closing) if (!menu.isConnected) removeMenu(menu);
  root.querySelectorAll('select').forEach(enhance);
}

function enabledIndices(control) {
  return [...control.select.options].flatMap((option, index) =>
    option.disabled || option.hidden || option.parentElement.disabled ? [] : [index]);
}

function removeMenu(menu) {
  gsap()?.killTweensOf(menu);
  gsap()?.killTweensOf(menu.querySelectorAll('.dropdown-option'));
  if (typeof menu.hidePopover === 'function' && menu.matches(':popover-open')) menu.hidePopover();
  menu.remove();
  closing.delete(menu);
}

export function closeDropdown(immediate = false) {
  if (!current) return;
  const { trigger, wrapper, menu } = current;
  current = null;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.removeAttribute('aria-activedescendant');
  wrapper.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  menu.style.pointerEvents = 'none';
  if (!immediate && motionAllowed() && menu.isConnected) {
    closing.add(menu);
    gsap().to(menu, { opacity: 0, y: -3, scale: .995, duration: .12,
      ease: 'power2.out', overwrite: true, onComplete: () => removeMenu(menu) });
  } else removeMenu(menu);
}

function positionMenu(control) {
  const { trigger, menu, list } = control;
  const rect = trigger.getBoundingClientRect();
  const viewport = window.visualViewport;
  const originX = viewport?.offsetLeft || 0;
  const originY = viewport?.offsetTop || 0;
  const viewportWidth = viewport?.width || innerWidth;
  const viewportHeight = viewport?.height || innerHeight;
  const minY = originY + 12;
  const maxY = originY + viewportHeight - 12;
  if (rect.bottom < minY || rect.top > maxY) { closeDropdown(true); return; }
  const width = Math.min(Math.max(rect.width, control.wrapper.classList.contains('is-compact') ? 226 : 0), viewportWidth - 24);
  menu.style.width = `${width}px`;
  const below = maxY - rect.bottom - 7;
  const above = rect.top - minY - 7;
  const wanted = Math.min(control.items.size * 45 + 52, 360);
  const upward = below < wanted && above > below;
  const available = Math.max(84, Math.min(360, upward ? above : below));
  list.style.maxHeight = `${Math.max(44, available - 50)}px`;
  const height = menu.getBoundingClientRect().height;
  menu.style.left = `${Math.max(originX + 12, Math.min(rect.left, originX + viewportWidth - width - 12))}px`;
  menu.style.top = `${upward ? Math.max(minY, rect.top - height - 7) : rect.bottom + 7}px`;
  menu.dataset.side = upward ? 'top' : 'bottom';
  menu.style.transformOrigin = upward ? 'center bottom' : 'center top';
}

function highlight(control, index, scroll = true) {
  if (index < 0 || !control.items.has(index)) return;
  control.active = index;
  for (const [i, row] of control.items) row.classList.toggle('is-active', i === index);
  const row = control.items.get(index);
  control.trigger.setAttribute('aria-activedescendant', row.id);
  if (scroll) {
    const { list } = control;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
    }
  }
}

function openDropdown(control) {
  closeDropdown(true);
  for (const menu of closing) removeMenu(menu);
  if (control.select.disabled) return;
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.id = `${control.select.id}-listbox`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', control.trigger.getAttribute('aria-label') || control.label?.textContent || 'Opties');
  const caption = document.createElement('div');
  caption.className = 'dropdown-caption';
  caption.setAttribute('aria-hidden', 'true');
  caption.textContent = control.select.dataset.menuLabel || control.trigger.getAttribute('aria-label') || control.label?.textContent || 'Kies een optie';
  const list = document.createElement('div');
  list.className = 'dropdown-options';
  list.setAttribute('role', 'presentation');
  const items = new Map();
  [...control.select.options].forEach((option, index) => {
    if (option.hidden) return;
    const row = document.createElement('div');
    row.className = 'dropdown-option';
    row.id = `${menu.id}-option-${index}`;
    row.dataset.index = String(index);
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(index === control.select.selectedIndex));
    row.setAttribute('aria-disabled', String(option.disabled || !!option.parentElement.disabled));
    const text = document.createElement('span');
    text.className = 'dropdown-option-label';
    text.textContent = option.textContent;
    if (option.dataset.icon) {
      const leading = document.createElement('span');
      leading.className = 'dropdown-option-icon';
      leading.innerHTML = icon(option.dataset.icon, 'sm');
      row.append(leading);
    }
    const tick = document.createElement('span');
    tick.className = 'dropdown-check';
    tick.innerHTML = icon('check', 'sm');
    row.append(text, tick);
    list.append(row);
    items.set(index, row);
  });
  menu.append(caption, list);
  // Native top-layer positioning prevents clipping at the dialog or card edges.
  const topLayer = typeof menu.showPopover === 'function';
  if (topLayer) menu.setAttribute('popover', 'manual');
  (control.trigger.closest('.modal') || document.body).append(menu);
  if (topLayer) menu.showPopover();
  current = { ...control, menu, list, items, active: control.select.selectedIndex, typed: '', typedAt: 0 };
  control.wrapper.classList.add('is-open');
  control.trigger.setAttribute('aria-expanded', 'true');
  positionMenu(current);
  if (!current) return;
  highlight(current, current.active);
  if (motionAllowed()) {
    const direction = menu.dataset.side === 'top' ? 1 : -1;
    gsap().fromTo(menu, { opacity: 0, y: direction * 5, scale: .985 },
      { opacity: 1, y: 0, scale: 1, duration: .26, ease: 'back.out(1.05)', overwrite: true });
    gsap().fromTo(list.children, { opacity: 0, y: direction * 2 },
      { opacity: 1, y: 0, duration: .15, delay: .025, stagger: .009, ease: 'power2.out' });
  }
}

function commit(control, index) {
  if (!enabledIndices(control).includes(index)) return;
  const { select } = control;
  const selectId = select.id;
  const changed = select.selectedIndex !== index;
  select.selectedIndex = index;
  control.trigger.removeAttribute('aria-invalid');
  updateTrigger(control);
  closeDropdown();
  if (changed) {
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // Filtering can replace the entire view. Restore focus to its new control.
  enhanceSelects();
  document.getElementById(`${selectId}-trigger`)?.focus({ preventScroll: true });
}

function controlFor(trigger) {
  return enhanced.get(document.getElementById(trigger.dataset.selectId));
}

function onKeyDown(event) {
  const trigger = event.target.closest('.dropdown-trigger');
  if (!trigger) return;
  const control = controlFor(trigger);
  if (!control) return;
  const key = event.key;
  if (key === 'Escape' && current?.trigger === trigger) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeDropdown();
    trigger.focus({ preventScroll: true });
    return;
  }
  if (key === 'Tab') {
    if (current?.trigger === trigger) commit(current, current.active);
    return;
  }
  if (event.ctrlKey || event.metaKey) return;
  const navigation = ['ArrowDown','ArrowUp','Home','End','PageUp','PageDown'].includes(key);
  const activation = key === 'Enter' || key === ' ';
  const printable = key.length === 1 && !event.altKey;
  if (!navigation && !activation && !printable) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const wasOpen = current?.trigger === trigger;
  if (wasOpen && (activation || (event.altKey && key === 'ArrowUp'))) {
    commit(current, current.active);
    return;
  }
  if (!wasOpen) openDropdown(control);
  if (!current) return;
  const enabled = enabledIndices(current);
  const at = Math.max(0, enabled.indexOf(current.active));
  if (key === 'Home') highlight(current, enabled[0]);
  else if (key === 'End') highlight(current, enabled.at(-1));
  else if (key === 'ArrowDown' && wasOpen) highlight(current, enabled[Math.min(at + 1, enabled.length - 1)]);
  else if (key === 'ArrowUp' && wasOpen) highlight(current, enabled[Math.max(at - 1, 0)]);
  else if (key === 'PageDown') highlight(current, enabled[Math.min(at + 10, enabled.length - 1)]);
  else if (key === 'PageUp') highlight(current, enabled[Math.max(at - 10, 0)]);
  else if (printable && key !== ' ') {
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('nl');
    const now = performance.now();
    current.typed = now - current.typedAt < 700 ? current.typed + key : key;
    current.typedAt = now;
    const repeated = [...current.typed].every(letter => letter === current.typed[0]);
    const query = normalize(repeated ? key : current.typed);
    const order = repeated ? [...enabled.slice(at + 1), ...enabled.slice(0, at + 1)] : enabled;
    const match = order.find(i => normalize(current.select.options[i].textContent.trim()).startsWith(query));
    if (match !== undefined) highlight(current, match);
  }
}

export function animateDialog(dialog) {
  if (!dialog || !motionAllowed()) return;
  gsap().fromTo(dialog.parentElement, { opacity: 0 }, { opacity: 1, duration: .15, ease: 'power1.out' });
  gsap().fromTo(dialog, { opacity: 0, y: 9, scale: .994 },
    { opacity: 1, y: 0, scale: 1, duration: .24, ease: 'power2.out', clearProps: 'transform,opacity' });
}

const CONFETTI_COLORS = ['#fcbf00', '#171717', '#00812d', '#e3000a', '#33b460', '#0a4fff'];

export function animateVote(targetId, withConfetti = true) {
  if (!motionAllowed()) return;
  const btn = [...document.querySelectorAll('.vote-button[data-action="vote"]')]
    .find(el => el.dataset.id === String(targetId));
  if (!btn) return;
  const thumb = btn.querySelector('.icon');
  const count = btn.querySelector('strong');
  gsap().fromTo(btn, { scale: .94 }, { scale: 1, duration: .38, ease: 'elastic.out(1.2, 0.5)', clearProps: 'transform' });
  if (thumb) {
    gsap().killTweensOf(thumb);
    gsap().timeline({ onComplete: () => gsap()?.set(thumb, { clearProps: 'transform' }) })
      .fromTo(thumb, { scale: .75, rotation: -18, y: 1 }, { scale: 1.38, rotation: -16, y: -4, duration: .16, ease: 'power2.out' })
      .to(thumb, { scale: 1.08, rotation: 8, y: -1, duration: .14, ease: 'power1.inOut' })
      .to(thumb, { scale: 1, rotation: 0, y: 0, duration: .22, ease: 'back.out(2)' });
  }
  if (count) {
    gsap().fromTo(count, { y: 5, opacity: .4 }, { y: 0, opacity: 1, duration: .26, ease: 'back.out(2)', clearProps: 'transform,opacity' });
  }
  if (!withConfetti) return;
  const anchor = (thumb || btn).getBoundingClientRect();
  const cx = anchor.left + anchor.width / 2;
  const cy = anchor.top + anchor.height / 2;
  const burst = document.createElement('div');
  burst.className = 'confetti-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.left = `${cx}px`;
  burst.style.top = `${cy}px`;
  document.body.append(burst);
  const total = 12;
  for (let i = 0; i < total; i++) {
    const piece = document.createElement('span');
    const shape = i % 3 === 0 ? 'is-dot' : i % 3 === 1 ? 'is-ribbon' : 'is-spark';
    piece.className = `confetti-piece ${shape}`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    burst.append(piece);
    const angle = (-Math.PI * 0.92) + (i / (total - 1)) * (Math.PI * 0.84) + (Math.random() - .5) * 0.18;
    const dist = 22 + (i % 3) * 10 + Math.random() * 8;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 6;
    const rot = (Math.random() - .5) * 220;
    gsap().timeline()
      .fromTo(piece,
        { x: 0, y: 0, scale: 0, rotation: 0, opacity: 1 },
        { x: dx * .75, y: dy, scale: 1, rotation: rot * .6, duration: .24, ease: 'power2.out' })
      .to(piece,
        { x: dx, y: dy + 16, scale: .4, rotation: rot, opacity: 0, duration: .34, ease: 'power1.in' });
  }
  setTimeout(() => burst.remove(), 650);
}

function releaseButton() {
  if (pressedButton?.isConnected) {
    if (motionAllowed()) gsap().to(pressedButton, { scale: 1, duration: .23, ease: 'back.out(1.15)', overwrite: true, clearProps: 'transform' });
    else gsap()?.set(pressedButton, { clearProps: 'transform' });
  }
  pressedButton = null;
}

export function initInteractions() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('click', event => {
    const trigger = event.target.closest('.dropdown-trigger');
    if (trigger) {
      const control = controlFor(trigger);
      if (current?.trigger === trigger) closeDropdown();
      else if (control) openDropdown(control);
      return;
    }
    const option = event.target.closest('.dropdown-option');
    if (option && current?.menu.contains(option)) commit(current, Number(option.dataset.index));
  }, true);
  document.addEventListener('pointerdown', event => {
    if (current && !current.menu.contains(event.target) && !current.trigger.contains(event.target)) closeDropdown();
    if (current?.menu.contains(event.target) && event.pointerType === 'mouse') event.preventDefault();
    const button = event.target.closest('.button, .icon-button, .vote-button, .profile-button, .header-cta, .filter-chip');
    if (button && !button.disabled && event.button === 0 && motionAllowed()) {
      pressedButton = button;
      gsap().to(button, { scale: .98, duration: .09, ease: 'power2.out', overwrite: true });
    }
  }, true);
  document.addEventListener('pointerup', releaseButton, true);
  document.addEventListener('pointercancel', releaseButton, true);
  document.addEventListener('pointermove', event => {
    const row = event.target.closest('.dropdown-option');
    if (event.pointerType === 'mouse' && row && current?.menu.contains(row) && row.getAttribute('aria-disabled') !== 'true') {
      highlight(current, Number(row.dataset.index), false);
    }
  }, { passive: true });
  document.addEventListener('focusin', event => {
    if (current && event.target !== current.trigger && !current.menu.contains(event.target)) closeDropdown();
  });
  const reposition = event => {
    if (!current || (event.target instanceof Node && current.menu.contains(event.target))) return;
    cancelAnimationFrame(repositionFrame);
    repositionFrame = requestAnimationFrame(() => { if (current) positionMenu(current); });
  };
  window.addEventListener('resize', reposition, { passive: true });
  document.addEventListener('scroll', reposition, { capture: true, passive: true });
  window.visualViewport?.addEventListener('resize', reposition, { passive: true });
  document.addEventListener('reset', event => {
    queueMicrotask(() => event.target.querySelectorAll('select').forEach(select => {
      const control = enhanced.get(select);if (control) updateTrigger(control);
    }));
  });
  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    releaseButton();
    for (const menu of closing) removeMenu(menu);
    const targets = document.querySelectorAll('.dropdown-menu, .dropdown-option, .modal, .modal-overlay');
    gsap()?.killTweensOf(targets);
    gsap()?.set(targets, { clearProps: 'transform,opacity,visibility' });
  });
  new MutationObserver(() => enhanceSelects()).observe(document.body, { childList: true, subtree: true });
  enhanceSelects();
}
