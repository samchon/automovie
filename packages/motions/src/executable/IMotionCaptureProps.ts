import type { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IMotionCaptureOverlays } from "../capture/IMotionCaptureOverlays";

/**
 * One motion case as the draw page receives it: everything the page needs to draw the case, computed in Node where the case is built and judged, and handed over as JSON before the page loads.
 *
 * A case's performers are functions of time, which cannot cross into the page, so each is sampled at the case's own instants; the page draws only those instants, which the capture request names with `at`. Points are world metres of the canonical frame (+Y up), colours sRGB hex.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who writes and reads it, why poses are sampled, the frame and units.
 * @evidence contracts/development/design.md#principled-representation The case's drawable content as plain data: bodies with one pose per instant, in the order of `seconds`, and the case's overlays as they are.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Written by `planMotionCaptureProps`, read by `subjects` and `markMotionCaptureCase`; verdicts and metrics stay in Node, in the record's section.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses Human's canonical body and the interface's pose and vector; that every performer has one pose per second is kept by the writer.
 */
export interface IMotionCaptureProps extends IMotionCaptureOverlays {
  /** The case's name, which is the subject's name. */
  name: string;

  /** The instants the figures are posed at, seconds, in the case's order; `poses` align with them. */
  seconds: number[];

  /** The instants drawn, each named by the case's label, as `planMotionCaptureInstants` plans them. */
  instants: { seconds: number; label: string }[];

  /** Width and height in pixels of every still. */
  raster: { width: number; height: number };

  /** Solid figures. */
  performers: IMotionCaptureProps.IFigure[];

  /** Translucent figures. */
  ghosts: (IMotionCaptureProps.IFigure & {
    /** Opacity in (0, 1]. */
    opacity: number;
  })[];

  /** Static boxes the figures meet, such as a bag or a seat: centre and half extents, metres. */
  boxes: { centre: IAutoMovieVector3; half: IAutoMovieVector3; color: number }[];
}
export namespace IMotionCaptureProps {
  /**
   * One figure: its body, its colour and its pose at every instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
   * @evidence contracts/development/design.md#principled-representation A canonical body and its poses aligned with the case's seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the page to build and pose the figure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent colour is null, drawn in clay.
   */
  export interface IFigure {
    /** Stable id, the figure's object name. */
    id: string;

    /** The canonical body drawn. */
    body: AutoMovieHumanCanonicalBody.IBody;

    /** sRGB hex colour of every part, or null for clay. */
    color: number | null;

    /** The canonical pose at each of the case's seconds, in their order. */
    poses: IAutoMoviePose[];
  }
}
