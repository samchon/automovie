import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadNeckCurves } from "./head/IAutoMovieHumanHeadNeckCurves";

/** Retained neck placement and the active lower-head generating sources.
 */
export interface IAutoMovieHumanHeadNeck {
  /** Section mean height, distinct from the adopted posterior C7 point, calibration mm. */
  level: number;

  /** Centre ahead of the origin. */
  x: number;

  /** Circle-equivalent scale G/(2*pi); this alone does not close a noncircular head-mass section's actual tape. */
  radius: number;

  /** The ring's back on the midline, forward place. */
  back: number;

  /** Actual height of that posterior point, distinct from the section mean, calibration mm. */
  backLevel: number;

  /** The adopted normal band's axis slope, `dx/dy`. */
  backSlope: number;

  /** Base tape and resolved heights in calibration mm, scaled once by HeadLayout; absent on retired layout readers. */
  base?: IAutoMovieHumanHeadInputs["neckBase"] & {
    /** Local posterior X before registration, calibration mm. */
    priorCervicaleOrigin: number;
  };

  /** Rigid AP registration from the local section frame to the common body frame, calibration mm. */
  registration?: {
    /** Local posterior datum before mapping. */
    priorCervicaleX: number;

    /** Common generating C7 datum. */
    cervicaleX: number;

    /** Actual mapped posterior, preserving the affine map's numeric result. */
    mappedCervicaleX: number;

    /** Exact authored rigid-frame translation. */
    translationX: number;
  };

  /** Actual lower-head radius/origin and named-height course, authored before the final mass. */
  curves?: IAutoMovieHumanHeadNeckCurves.IOutput;
}
