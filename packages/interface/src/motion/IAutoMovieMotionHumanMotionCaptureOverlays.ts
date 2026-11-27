import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * What a motion case draws over its figures, as the case measured it: paths a
 * point travelled, points it aimed at, and contact samples with how far each
 * slid against a limit. Points are world metres of the canonical frame (+Y up),
 * colours sRGB hex.
 *
 * `markMotionCaptureCase` turns them into inspection marks; the capture
 * harness's cases fill them.
 */
export interface IAutoMovieMotionHumanMotionCaptureOverlays {
  /** Polylines in world metres, each in its colour. */
  trails: {
    /** Packed sRGB colour used to draw this diagnostic overlay. */
    color: number;
    /** Ordered world-space trail samples in metres. */
    points: IAutoMovieVector3[];
  }[];

  /**
   * Marked world points, each with the radius in metres it was aimed within and
   * its colour.
   */
  targets: {
    /** World-space sample or marker centre, metres. */
    at: IAutoMovieVector3;
    /** Marker radius in metres. */
    radius: number;
    /** Packed sRGB colour used to draw this diagnostic overlay. */
    color: number;
  }[];

  /** Sets of points with a drift in metres against the set's limit in metres. */
  drift: {
    /** Ordered support-drift samples; empty means no drift points to draw. */
    samples: {
      /** World-space sample or marker centre, metres. */
      at: IAutoMovieVector3;
      /** Measured support displacement from its reference point, metres. */
      drift: number;
    }[];
    /** Support-drift acceptance threshold, metres. */
    limit: number;
  }[];
}
