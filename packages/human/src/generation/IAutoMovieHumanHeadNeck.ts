import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import type { AutoMovieHumanHeadNeckCurves } from "./head/AutoMovieHumanHeadNeckCurves";

/** Retained neck placement and the active lower-head generating sources. */
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

  /** That back's forward run per millimetre of height, `dx/dy`. */
  backSlope: number;

  /** Base tape and resolved heights in calibration mm, scaled once by HeadLayout; absent on retired layout readers. */
  base?: IAutoMovieHumanHeadInputs["neckBase"] & {
    /** Original local-prior posterior X before registration, calibration mm. */
    priorCervicaleOrigin: number;
  };

  /** One explicit AP rigid registration from local harmonic prior to the common body frame, calibration mm. */
  registration?: {
    /** Prior posterior datum before mapping. */
    priorCervicaleX: number;

    /** Common generating C7 datum. */
    cervicaleX: number;

    /** Actual mapped posterior, preserving the affine map's numeric result. */
    mappedCervicaleX: number;

    /** Exact authored rigid-frame translation. */
    translationX: number;
  };

  /** Actual lower-head radius/origin and named-height course, authored before the final mass. */
  curves?: AutoMovieHumanHeadNeckCurves.IOutput;
}
