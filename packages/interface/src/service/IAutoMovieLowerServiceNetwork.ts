import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * Service graph, served building and polygon resolution for generated run geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Service graph, served building and polygon resolution for generated run geometry. World-metre routes and radii are swept into meshes; sides defaults to eight and must be an integer at least three, with admission performed before allocation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolution has no upper cap, so allocation is caller-controlled; geometry describes circular run envelopes and does not add fittings or discipline-performance simulation.
 * @evidence contracts/development/design.md#principled-representation World-metre routes and radii are swept into meshes; sides defaults to eight and must be an integer at least three, with admission performed before allocation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface lowerServiceNetwork validates both network and wet-zone declarations, then creates caller-owned model and staged-piece arrays using the existing subject-contribution contract.
 */
export namespace IAutoMovieLowerServiceNetwork {
  /**
   * Service graph, served building and polygon resolution for generated run geometry.
   *
   * A run is authored as a centre line and a radius, which is the description a
   * clash and a sleeve are measured against; drawing it is the deterministic
   * derivation of that description and nothing more. Sweeping a regular polygon
   * section along the authored line with `meshAutoMovieSweep`, one smooth-shaded
   * ring per route point and both ends capped, is therefore the whole of it: no fitting library, no
   * elbow catalogue, no per-discipline appearance. A production that wants a
   * modelled valve body authors that prop and places it on the node, exactly as
   * it would author any other asset.
   *
   * The geometry is baked in world coordinates, matching how a connector's route
   * and a support surface are already authored, so the staged piece carries no
   * rotation and no scale of its own and a run cannot drift from the line the
   * validator measured.
   *
   * Refuses to draw an invalid network. Lowering a graph with a dangling port or
   * a clash would put a picture of a working installation in front of the reason
   * it does not work, which is the one thing this record exists to prevent.
   * No current production consumer calls this lowering; service render tests
   * exercise the emitted contribution. Sides are unbounded apart from integer
   * admission, so caller-selected resolution controls allocation size.
   *
   * @evidence contracts/development/design.md#principled-representation World-metre routes and radii are swept into meshes; sides defaults to eight and must be an integer at least three, with admission performed before allocation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface lowerServiceNetwork validates both network and wet-zone declarations, then creates caller-owned model and staged-piece arrays using the existing subject-contribution contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolution has no upper cap, so allocation is caller-controlled; geometry describes circular run envelopes and does not add fittings or discipline-performance simulation.
   * @evidence contracts/development/common.md#meaningful-documentation Service graph, served building and polygon resolution for generated run geometry. World-metre routes and radii are swept into meshes; sides defaults to eight and must be an integer at least three, with admission performed before allocation.
   */
  export type IProps = {
    /** Borrowed service graph validated with validateServiceNetwork and validateWetZones before any run geometry is emitted. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed served building used by both validation gates; its id must match network.environment. */
    environment: IAutoMovieBuiltEnvironment;

    /** Regular polygon vertex count per swept ring; undefined defaults to 8, integers below 3 and non-integers throw, and no upper allocation cap is imposed. */
    sides?: number | undefined;
  };
}
