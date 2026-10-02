/** A rendered frame, or the reason the viewer refused it. */
export type HumanViewerRender =
  | { ok: true; bytes: Buffer; renderer: string }
  | { ok: false; error: string };
