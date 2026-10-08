import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEVOTEE_SLOTS, PAGE_META } from './slots-data.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(DIR, 'wanshang.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderSlotBar() {
  return DEVOTEE_SLOTS.map((slot, idx) => {
    const active = idx === 0 ? ' active' : '';
    return [
      `<button type="button" disabled class="slot-item${active}" id="slot-btn-${idx}" aria-label="第 ${slot.num} 席 ${escapeHtml(slot.title)}" data-ssr-slot="${idx}">`,
      `<span class="slot-text">${escapeHtml(slot.title.replaceAll(' ', ''))}</span>`,
      '</button>'
    ].join('');
  }).join('');
}

function renderExtraHead() {
  const title = escapeHtml(PAGE_META.title);
  const description = escapeHtml(PAGE_META.description);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: PAGE_META.title,
    description: PAGE_META.description,
    about: DEVOTEE_SLOTS.map((slot) => ({
      '@type': 'CreativeWork',
      name: `第 ${slot.num} 席 ${slot.title}`,
      text: [slot.verse, slot.sub].filter(Boolean).join('\n')
    }))
  });

  return [
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    '<meta property="og:type" content="website">',
    `<script type="application/ld+json">${jsonLd}</script>`
  ].join('\n  ');
}

function renderNoscript() {
  const items = DEVOTEE_SLOTS.map((slot) => {
    const body = [slot.verse, slot.sub].filter(Boolean).join('\n');
    const link = slot.href
      ? `<p><a href="${escapeHtml(slot.href)}" rel="noopener noreferrer">点击跳转</a></p>`
      : '';
    return `<article><h2>第 ${slot.num} 席 · ${escapeHtml(slot.title)}</h2><pre>${escapeHtml(body)}</pre>${link}</article>`;
  }).join('');

  return `<noscript><section aria-label="席位文字">${items}</section></noscript>`;
}

function renderStateScript() {
  const payload = JSON.stringify({
    slots: DEVOTEE_SLOTS,
    meta: PAGE_META,
    renderedAt: new Date().toISOString()
  });
  return `<script>window.__WANSHANG_SSR__=${payload.replaceAll('<', '\\u003c')};</script>`;
}

export async function renderPage() {
  const template = await readFile(TEMPLATE_PATH, 'utf8');
  const title = escapeHtml(PAGE_META.title);
  const description = escapeHtml(PAGE_META.description);
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${description}">`
    )
    .replace('<!--SSR_HEAD-->', renderExtraHead())
    .replace(
      /<div class="brand-title">[\s\S]*?<\/div>/,
      `<div class="brand-title">${escapeHtml(PAGE_META.brand)}</div>`
    )
    .replace('<!--SSR_SLOT_BAR-->', renderSlotBar())
    .replace('<!--SSR_NOSCRIPT-->', renderNoscript())
    .replace('<!--SSR_STATE-->', renderStateScript());
}
