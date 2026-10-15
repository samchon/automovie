import type { createViewerPayload } from "./createViewerPayload";

/** Existing source-backed browser observation controls, without a new authoring surface. */
export interface IFutureHouseViewer {
  /** Name of the GPU renderer, or null when the browser does not expose it. */
  renderer(): string | null;
  /** Source basis of the loaded payload, or null before it loads. */
  basis(): string | null;
  /** Whether the viewer is running with a house in the scene. */
  valid(): boolean;
  /** Every observation station of the loaded payload; empty before it loads. */
  observations(): ReturnType<typeof createViewerPayload>["stations"];
  /** Canopy audit of the loaded payload, or null before it loads. */
  audit(): ReturnType<typeof createViewerPayload>["audit"] | null;
  /** Switch to inspection and show station `id` of `space`. */
  select(space: string, id: string): void;
  /**
   * RGBA bytes of a rectangle of the current frame, bottom-left origin; throws when no frame is
   * drawn.
   */
  readPixels(x: number, y: number, width: number, height: number): number[];
}
