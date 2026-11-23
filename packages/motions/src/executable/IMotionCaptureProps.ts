import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionHumanMotionCaptureOverlays,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One motion case as the draw page receives it: everything the page needs to
 * draw the case, computed in Node where the case is built and judged, and
 * handed over as JSON before the page loads.
 *
 * A case's performers are functions of time, which cannot cross into the page,
 * so each is sampled at the case's own instants; the page draws only those
 * instants, which the capture request names with `at`. Points are world metres
 * of the canonical frame (+Y up), colours sRGB hex.
 */
export interface IMotionCaptureProps extends IAutoMovieMotionHumanMotionCaptureOverlays {
  /** The case's name, which is the subject's name. */
  name: string;

  /** Frames per second of the case's grid. */
  fps: number;

  /**
   * Running time in seconds, a whole number of grid frames past the last
   * instant.
   */
  durationSeconds: number;

  /**
   * The seconds the figures are posed at: the case's instants in its order,
   * then the grid's other frames; `poses` align with them.
   */
  seconds: number[];

  /**
   * The instants drawn, each named by the case's label, as
   * `planMotionCaptureInstants` plans them.
   */
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

  /**
   * Static boxes the figures meet, such as a bag or a seat: centre and half
   * extents, metres.
   */
  boxes: {
    centre: IAutoMovieVector3;
    half: IAutoMovieVector3;
    color: number;
  }[];
}
export namespace IMotionCaptureProps {
  /** One figure: its body, its colour and its pose at every instant. */
  export interface IFigure {
    /** Stable id, the figure's object name. */
    id: string;

    /** The canonical body drawn. */
    body: IAutoMovieHumanCanonicalBody.IBody;

    /** SRGB hex colour of every part, or null for clay. */
    color: number | null;

    /** The canonical pose at each of the case's seconds, in their order. */
    poses: IAutoMoviePose[];
  }
}
