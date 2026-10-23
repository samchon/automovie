import type { AuthoredLayer } from "../AuthoredLayer";

/** Every authored layer, in pipeline order. */
export const AUTHORED_LAYERS: readonly AuthoredLayer[] = [
  "settings",
  "treatments",
  "scripts",
  "screenplay",
];
