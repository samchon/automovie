/**
 * The path GitHub Pages serves the site under, the repository's name, with
 * no trailing slash. `next.config.ts` makes it Next's `basePath`, which
 * `Link` and the router prefix by themselves; a plain anchor that asks for
 * a full navigation, and a fetch of a file under `public/`, prefix it
 * themselves from here.
 */
export const SITE_BASE: string = "/automovie";
