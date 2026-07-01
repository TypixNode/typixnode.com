import { defineMiddleware } from 'astro:middleware';
import { resolveLang } from './lib/i18n';

// Resolve the UI language once per request so every page/component can render
// the correct language SERVER-SIDE (no first-paint English flash). The chosen
// language is exposed as `Astro.locals.lang`.
//
// Order of precedence: a valid `tnx-lang` cookie (the user's explicit choice)
// wins; otherwise we negotiate from the Accept-Language header; otherwise 'en'.
export const onRequest = defineMiddleware(async (context, next) => {
  const cookieLang = context.cookies.get('tnx-lang')?.value;
  const accept = context.request.headers.get('accept-language');
  context.locals.lang = resolveLang(cookieLang, accept);
  return next();
});
