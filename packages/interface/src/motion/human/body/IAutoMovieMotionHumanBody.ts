import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMovieHumanoidSurfaces } from "../../../pose/IAutoMovieHumanoidSurfaces";
import type { IAutoMovieSkeletonTopology } from "../../../pose/IAutoMovieSkeletonTopology";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBodyMeasure } from "../../../skeleton/IAutoMovieBodyMeasure";
import type { IAutoMovieSkeleton } from "../../../skeleton/IAutoMovieSkeleton";

/**
 * A performer's body as motion laws read it: the canonical VRM rig and its
 * physical profile, with the measure, the anatomical surfaces, the rig's
 * topology and its rest joint positions derived once.
 *
 * Any canonical humanoid serves: a Human adapted by
 * `AutoMovieHumanCanonicalBody.adapt` (the polygon man), an imported VRM
 * character with a profile, or any other rig in the canonical T-pose frame
 * (+Y up, facing +Z, the left toward +X). Laws scale every distance from the
 * measure, so the same law fits any stature and proportion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation measure: The anthropometric measure, metres and kilograms. topology: The rig's topology, shared by every fit. rest: Rest joint positions, canonical metres.
 * @evidence contracts/development/design.md#principled-representation measure: The anthropometric measure, metres and kilograms. topology: The rig's topology, shared by every fit. rest: Rest joint positions, canonical metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jumpAirborne.ts (jumpAirborne.knee, body); actions/jumpLanding.ts (jumpLanding.of, body); actions/jumpTakeoff.ts (jumpTakeoff, body); actions/runStance.ts (runStance.plan, body); actions/stand.ts (stand.relaxed, body); actions/stand.ts (stand.abduction, body).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieSkeleton, IAutoMoviePhysicalProfile, IAutoMovieBodyMeasure, IAutoMovieHumanoidSurfaces.ISurfaces, IAutoMovieSkeletonTopology identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanBody {
  /** The canonical rig at its T-pose rest. */
  skeleton: IAutoMovieSkeleton;

  /** The physical profile on the rig's bones. */
  profile: IAutoMoviePhysicalProfile;

  /** The anthropometric measure, metres and kilograms. */
  measure: IAutoMovieBodyMeasure;

  /** Regions and sockets as bone-local frames. */
  surfaces: IAutoMovieHumanoidSurfaces.ISurfaces;

  /** The rig's topology, shared by every fit. */
  topology: IAutoMovieSkeletonTopology;

  /** Rest joint positions, canonical metres. */
  rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}
