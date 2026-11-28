import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePathFrame } from "../motion/IAutoMoviePathFrame";
import type { IAutoMovieInspectionDiagnostics } from "./IAutoMovieInspectionDiagnostics";

/**
 * One continuous segment of sampled world origins for an inspection path, as
 * AutoMovieRenderInspection.sampleTrails reads it.
 */
export interface IAutoMovieInspectionTrail {
  /** The object's inspection path. */
  path: string;

  /** The sampled film seconds, ascending. */
  times: number[];

  /** World position of the object's origin at each second, flat xyz in metres. */
  positions: number[];

  /**
   * Whether the sampled origins stay within one micrometre of the first.
   * Unsampled movement and rotation are outside this observation.
   */
  stationary: boolean;

  /** Placed motion evidence, when the subject supplies a motion trail source. */
  motion?: IAutoMovieInspectionTrail.IMotion;
}

/** Optional source evidence accompanying the same sampled positions. */
export namespace IAutoMovieInspectionTrail {
  /** The authoring and placed evidence for this segment. */
  export interface IMotion {
    /** The authored route, absent when the producer supplied no usable route. */
    readonly route?: IAuthoredRoute;

    /** The placed observations in the same order as the segment's positions. */
    readonly samples: readonly ISample[];
  }

  /** One producer-named polyline in world metres. */
  export interface IAuthoredRoute {
    /** Stable route identity within the played occurrence. */
    readonly id: string;

    /** Ordered authored positions in world metres. */
    readonly points: readonly IAutoMovieVector3[];

    /** Source-requested pace along the route, in metres per second. */
    readonly requestedSpeed: number;

    /** Source-resolved pace along the route, in metres per second. */
    readonly effectiveSpeed: number;
  }

  /** Sources and observed directions at one settled point on the trail. */
  export interface ISample {
    /** Exact film second and the played shot clock when there is one. */
    readonly time: IAutoMovieInspectionDiagnostics.ITime;

    /** Played sequence entry, null for a subject with only a film clock. */
    readonly entry: number | null;

    /** Source-owned path baseline at this sample, in world metres. */
    readonly baseline?: IAutoMoviePathFrame;

    /** Producer-owned gait phase in cycles, in the half-open range [0, 1). */
    readonly phase?: number;

    /** Unit world direction of the selected node's producer-declared forward. */
    readonly forward?: IAutoMovieVector3;

    /** Image location under this sample's own delivery camera. */
    readonly projection: Projection;

    /** Placed support observation, when the producer addressed a support. */
    readonly support?: Support;
  }

  /** A point with finite normalized device coordinates. */
  export interface IProjectedPoint {
    /**
     * Whether the placed point is inside the image, outside it or depth
     * clipped.
     */
    readonly status: "in-frame" | "outside" | "depth-clipped";

    /**
     * Coordinates in the sample's own delivery camera's normalized device
     * space.
     */
    readonly ndc: IAutoMovieVector3;
  }

  /** A point without usable image coordinates. */
  export interface IUnprojectedPoint {
    /** Behind the camera, or on a projection with no finite image point. */
    readonly status: "behind" | "unprojectable";
  }

  /** Projection status of a sampled world origin. */
  export type Projection = IProjectedPoint | IUnprojectedPoint;

  /** World socket examined in its displayed support's rigid local frame. */
  export interface IObservedSupport {
    /** The socket and support were both observed at this sample. */
    readonly status: "observed";

    /** Canonical inspection identity of the support. */
    readonly path: string;

    /** The observed socket in local metres of the support. */
    readonly local: IAutoMovieVector3;

    /** Signed normal offset from the declared local anchor, in metres. */
    readonly gap: number;

    /** Magnitude of the tangential offset from that anchor, in metres. */
    readonly slip: number;
  }

  /** A producer named a support but the placed sample could not be read. */
  export interface IUnavailableSupport {
    /** The selected support observation was unavailable. */
    readonly status: "unavailable";
  }

  /** Result of observing the producer's declared support socket. */
  export type Support = IObservedSupport | IUnavailableSupport;
}
