import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { AutoMovieHumanoidSocket } from "../skeleton/AutoMovieHumanoidSocket";

/**
 * Body contact frames produced from skeleton and physical-profile geometry and
 * placed by AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaces. Frames are mutable records;
 * callers preserve unit directions and matching bone identity when reusing
 * them.
 */
export namespace IAutoMovieHumanoidSurfaces {
  /** A bone-local surface frame. */
  export interface IFrame {
    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Point relative to the bone's joint, in its rest frame, metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal in the bone's rest frame. */
    normal: IAutoMovieVector3;

    /** A socket's forward unit direction in the bone's rest frame. */
    forward?: IAutoMovieVector3;

    /**
     * A region's extent, metres: the radius about its point that is still the
     * region (`AutoMovieHumanoidSurfaceExtents`); absent for a socket and for a
     * point beside a region (`offset`).
     */
    radius?: number;
  }

  /** Every region and socket of one body. */
  export interface ISurfaces {
    /** Regions by name. */
    regions: Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>;

    /** Sockets by name. */
    sockets: Record<AutoMovieHumanoidSocket, IAutoMovieHumanoidSurfaces.IFrame>;
  }

  /** A point of a region's tangent plane, measured from the region's own point. */
  export interface ITangent {
    /**
     * Toward the head, metres: the rest frame's +Y made perpendicular to the
     * region's direction, or +Z when that direction is within 26 degrees of
     * vertical.
     */
    up: number;

    /**
     * Across `up` and the region's direction, metres: toward the body's left
     * for a region that faces forward.
     */
    out: number;
  }

  /** A surface frame's world point and normal under a posed bone. */
  export type IPlaceResult = {
    /**
     * Fresh world position in metres after applying the posed bone's
     * translation and rotation.
     */
    point: IAutoMovieVector3;
    /**
     * Outward world direction; unit when the local normal and posed bone
     * quaternion satisfy their input contracts.
     */
    normal: IAutoMovieVector3;
    /**
     * Rotated world forward direction, present exactly when the source frame
     * supplied forward.
     */
    forward?: IAutoMovieVector3;
  };
}
