import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Layers that hold literal reader-facing text rather than a plan for it.
 *
 * A treatment fixes which exchange happens and leaves the words to the layers
 * below, so a question about the words themselves can only be asked here.
 */
export const REALIZED_LAYERS: ReadonlySet<AuthoredLayer> =
  new Set<AuthoredLayer>(["scripts", "screenplay"]);
