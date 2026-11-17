import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { AutoMovieHumanoidSocket } from "../skeleton/AutoMovieHumanoidSocket";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Body contact frames produced from skeleton and physical-profile geometry and placed by resolveAutoMovieHumanoidSurfaces. Frames are mutable records; callers preserve unit directions and matching bone identity when reusing them. */
export namespace IAutoMovieHumanoidSurfaces {
  /**
 * A bone-local surface frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines rest-local point and unit directions plus optional socket heading and region extent.
 * @evidence contracts/development/design.md#principled-representation Bone identity selects the rest frame; point/radius are metres and directions dimensionless. Generated frames carry region radius only when it is a region extent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidSurfaces creates these frames from physical geometry; its place helper applies a resolved bone transform.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Existing humanoid bone identifiers and vector contracts carry the frame without a renderer handle.
 */
    export interface IFrame {
      /** The bone it rides. */
      bone: AutoMovieHumanoidBone;
  
      /** Point relative to the bone's joint, in its rest frame, metres. */
      point: IAutoMovieVector3;
  
      /** Outward unit normal in the bone's rest frame. */
      normal: IAutoMovieVector3;
  
      /** A socket's forward unit direction in the bone's rest frame. */
      forward?: IAutoMovieVector3;
  
      /** A region's extent, metres: the radius about its point that is still the region (`AutoMovieHumanoidSurfaceExtents`); absent for a socket and for a point beside a region (`offset`). */
      radius?: number;
    }

  /**
 * Every region and socket of one body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates all region frames from all socket frames for one body's geometry.
 * @evidence contracts/development/design.md#principled-representation Closed region/socket records require every supported key; entries use their own bone-local frames rather than one world snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The humanoid surface resolver fills both records for downstream contact and attachment targeting.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Region and socket vocabularies reuse canonical key unions instead of allowing arbitrary missing entries.
 */
    export interface ISurfaces {
      /** Regions by name. */
      regions: Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>;
  
      /** Sockets by name. */
      sockets: Record<AutoMovieHumanoidSocket, IAutoMovieHumanoidSurfaces.IFrame>;
    }

  /**
 * A point of a region's tangent plane, measured from the region's own point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines up/out offsets on the region tangent plane, including the near-vertical fallback.
 * @evidence contracts/development/design.md#principled-representation Offsets are metres; the basis comes from projected rest +Y or +Z and their cross product with outward direction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidSurfaces.offset uses these offsets to cast a new ray against the region's physical surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Two tangent coordinates avoid pretending an offset is a world position or preserving the original region radius.
 */
    export interface ITangent {
      /** Toward the head, metres: the rest frame's +Y made perpendicular to the region's direction, or +Z when that direction is within 26 degrees of vertical. */
      up: number;
  
      /** Across `up` and the region's direction, metres: toward the body's left for a region that faces forward. */
      out: number;
    }

  /**
 * A surface frame's world point and normal under a posed bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States world units and exact propagation of optional forward direction.
 * @evidence contracts/development/design.md#principled-representation The placed point is metres and directions are rotated local vectors; unit length depends on the input frame and bone quaternion premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidSurfaces.place allocates this result from a local frame and posed bone without retaining them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing forward direction remains absent instead of constructing an arbitrary orientation.
 */
  export type IPlaceResult = {
      /** Fresh world position in metres after applying the posed bone's translation and rotation. */
      point: IAutoMovieVector3;
      /** Outward world direction; unit when the local normal and posed bone quaternion satisfy their input contracts. */
      normal: IAutoMovieVector3;
      /** Rotated world forward direction, present exactly when the source frame supplied forward. */
      forward?: IAutoMovieVector3;
    };
}
