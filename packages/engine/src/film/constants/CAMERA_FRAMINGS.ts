import { IAutoMovieCameraAction } from "@automovie/interface";

import { FRAMING_HEIGHT_FRACTION } from "./FRAMING_HEIGHT_FRACTION";

/**
 * Every member of the closed camera framing union, for gating values that
 * arrive from authored JSON at runtime.
 *
 * Taken from the keys of {@link FRAMING_HEIGHT_FRACTION}, whose record type
 * requires exactly one entry per framing, so a framing added to the interface
 * union fails compilation there instead of being refused here.
 */
export const CAMERA_FRAMINGS: ReadonlySet<IAutoMovieCameraAction["framing"]> =
  new Set(
    Object.keys(FRAMING_HEIGHT_FRACTION) as IAutoMovieCameraAction["framing"][],
  );
