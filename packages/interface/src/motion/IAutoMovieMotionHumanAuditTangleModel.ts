import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMoviePhysicalShape } from "../physics/IAutoMoviePhysicalShape";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";

/**
 * The per-body model the tangle audit (`IAutoMovieMotionHumanAuditTangle`)
 * reads a pose against: each collider segment's probes and bounding sphere,
 * which pairs of segments are one part or share a joint, the two reference
 * postures, and each ordered pair's reference depths. A body builds it once
 * when it is made (`IAutoMovieMotionHumanBody.tangle`).
 */
export namespace IAutoMovieMotionHumanAuditTangleModel {
  /** One collider segment's probes and bounding sphere in its own frame. */
  export interface IPart {
    /** The bone that carries the segment. */
    bone: AutoMovieHumanoidBone;

    /** The segment's shapes. */
    shapes: readonly IAutoMoviePhysicalShape[];

    /** The probes: the shapes' corners, then points along the bone. */
    probes: IAutoMovieVector3[];

    /**
     * How many of the probes, the first ones, are corners of the shapes; the
     * rest lie on the bone's axis.
     */
    surface: number;

    /** The bounding sphere's centre. */
    centre: IAutoMovieVector3;

    /** The bounding sphere's radius, metres. */
    radius: number;

    /**
     * How far from the segment's own origin any of its probes, or any point of
     * the bounding spheres of its shapes, lies, metres: a turn of the segment
     * by an angle moves none of them farther than this times the chord of the
     * angle, which bounds how fast a reading against it moves.
     */
    extent: number;

    /**
     * How far any of its probes lies outside its own shapes, metres: zero for
     * corners on a shape's surface and points of the bone inside a shape. A
     * link pair's certificate bounds every probe by its shapes' distance less
     * this.
     */
    offset: number;
  }

  /** What is derived once per body. */
  export interface IModel {
    /** The segments, in the order the colliders are placed. */
    parts: IPart[];

    /** Whether two segments are one part or share a joint. */
    related: boolean[][];

    /**
     * Whether each segment is of that side's arm: its upper arm, its forearm,
     * or its hand with the fingers.
     */
    arms: Record<AutoMovieHumanSide, boolean[]>;

    /** The segments placed in the rest T-pose. */
    rest: IAutoMovieMotionHumanColliders.IPlaced[];

    /** The segments placed in the quiet stance. */
    stance: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each ordered pair's reference depths, metres per probe of the first
     * segment, at index `i * parts.length + j` for segment `i`'s probes read in
     * segment `j`: the depth each probe may keep there before the audit reads
     * it as a tangle, `Infinity` for a corner of a pair whose colliders overlap
     * past the skin by their build.
     */
    baseline: readonly Float64Array[];
  }
}
