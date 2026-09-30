import { IPortraitFinalSurfaceHost } from "./IPortraitFinalSurfaceHost";

/**
 * One component's requested final positions; shared attachments use the same IDs.
 */
export type IPortraitFinalSurface = (
  host: IPortraitFinalSurfaceHost,
) => readonly {
  /** Existing shared vertex identity; final shaping never adds topology here. */
  vertex: number;

  /** Requested XYZ in the host's millimetre frame. */
  target: readonly number[];
}[];
