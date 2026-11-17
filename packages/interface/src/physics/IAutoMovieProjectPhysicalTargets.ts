import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/** Projected world motor goals and the largest adjustments from their authored poses. */
export namespace IAutoMovieProjectPhysicalTargets {
  /**
   * World motor-goal poses projected onto the profile's fixed-pivot joint tree.
   *
   * Root placements are preserved; child anchors coincide and relative rotations obey the declared coordinates. Maximum changes use metres and radians. projectPhysicalTargets allocates a new target record with detached root poses and newly reconstructed child poses; authored inputs remain unchanged. The producer throws for missing joint targets or an unreachable parent tree. These are goal adjustments, not observed native poses or silent proof that the authored performance was preserved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World motor-goal poses projected onto the profile's fixed-pivot joint tree.
   * @evidence contracts/development/design.md#principled-representation Root placements are preserved; child anchors coincide and relative rotations obey the declared coordinates. Maximum changes use metres and radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface projectPhysicalTargets allocates a new target record with detached root poses and newly reconstructed child poses; authored inputs remain unchanged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer throws for missing joint targets or an unreachable parent tree. These are goal adjustments, not observed native poses or silent proof that the authored performance was preserved.
   */
  export type IResult = {
    
    /** New world bone-origin motor poses in metres/unit quaternions; roots retain their authored placements. */
    targets: Record<string, IAutoMoviePhysicalProfile.ITransform>;
    
    /** Largest world child-origin displacement from its authored position, metres; zero when no joint child moves. */
    maximumTranslation: number;
    
    /** Largest shortest-arc world child orientation change from its authored rotation, radians; zero when unchanged. */
    maximumRotation: number;
  };
}
