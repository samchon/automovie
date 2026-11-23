import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One capture of the motion harness: who is drawn, at which instants, with
 * which overlays, and which numeric verdicts the run reports.
 *
 * Every pose is a canonical pose of its performer's body, and every overlay
 * point is in world metres of the canonical frame (+Y up). A case is a plain
 * value built by a pure function of its options, so a capture reproduces
 * exactly from its name, options and source.
 */
export interface IMotionCaptureCase {
  /** Output folder name under `media/capture/`. */
  name: string;

  /** Instants drawn, in order, each with its cell caption. */
  times: IMotionCaptureCase.ITime[];

  /** Solid figures. */
  performers: IMotionCaptureCase.IPerformer[];

  /** Translucent figures, such as the uninterrupted source or a seed fan. */
  ghosts?: IMotionCaptureCase.IGhost[];

  /** Polylines in world metres. */
  trails?: { color: number; points: IAutoMovieVector3[] }[];

  /** Marked world points. */
  targets?: { at: IAutoMovieVector3; radius: number; color: number }[];

  /** Points coloured by drift, metres, against a limit, metres. */
  drift?: {
    samples: { at: IAutoMovieVector3; drift: number }[];
    limit: number;
  }[];

  /**
   * Static boxes, such as a bag, a seat or a step: centre and half extents,
   * metres.
   */
  boxes?: {
    centre: IAutoMovieVector3;
    half: IAutoMovieVector3;
    color: number;
  }[];

  /** Numeric checks the run reports; a failed one fails the process. */
  verdicts?: IMotionCaptureCase.IVerdict[];

  /** Extra per-case data written to the manifest. */
  metrics?: Record<string, unknown>;
}
/** Companion types of {@link IMotionCaptureCase}. */
export namespace IMotionCaptureCase {
  /** One drawn instant. */
  export interface ITime {
    /** Film seconds. */
    seconds: number;

    /** Cell caption. */
    label: string;
  }

  /** One solid figure. */
  export interface IPerformer {
    /** Stable id. */
    id: string;

    /** The canonical body drawn. */
    body: IAutoMovieHumanCanonicalBody.IBody;

    /** The canonical pose at a film second. */
    pose(seconds: number): IAutoMoviePose;

    /** SRGB hex colour of the body; clay when absent. */
    color?: number;
  }

  /** One translucent figure. */
  export interface IGhost extends IPerformer {
    /** Opacity in (0, 1]. */
    opacity: number;
  }

  /** One reported check. */
  export interface IVerdict {
    /** Check name. */
    name: string;

    /** Whether it passed. */
    passed: boolean;

    /** Measured values behind it. */
    detail: string;
  }
}
