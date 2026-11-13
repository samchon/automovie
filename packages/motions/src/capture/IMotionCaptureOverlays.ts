import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What a motion case draws over its figures, as the case measured it: paths a point travelled, points it aimed at, and contact samples with how far each slid against a limit. Points are world metres of the canonical frame (+Y up), colours sRGB hex.
 *
 * `markMotionCaptureCase` turns them into inspection marks; the capture harness's cases fill them.
 *
 * @evidence contracts/development/design.md#principled-representation Each overlay is the plain data its producer measured: a polyline, a point with the radius it was aimed within, and samples with a drift and a limit in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three members the mapping reads; figures, boxes and verdicts stay with the harness.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's vector; a drift is compared with its own set's limit, so no global limit exists.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds, its frame, units and who reads it.
 */
export interface IMotionCaptureOverlays {
  /** Polylines in world metres, each in its colour. */
  trails: { color: number; points: IAutoMovieVector3[] }[];

  /** Marked world points, each with the radius in metres it was aimed within and its colour. */
  targets: { at: IAutoMovieVector3; radius: number; color: number }[];

  /** Sets of points with a drift in metres against the set's limit in metres. */
  drift: { samples: { at: IAutoMovieVector3; drift: number }[]; limit: number }[];
}
