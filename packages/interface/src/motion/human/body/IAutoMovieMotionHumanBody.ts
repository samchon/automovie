import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMovieHumanoidSurfaces } from "../../../pose/IAutoMovieHumanoidSurfaces";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieResolveCenterOfMass } from "../../../pose/IAutoMovieResolveCenterOfMass";
import type { IAutoMovieSkeletonPoseResolution } from "../../../pose/IAutoMovieSkeletonPoseResolution";
import type { IAutoMovieSkeletonTopology } from "../../../pose/IAutoMovieSkeletonTopology";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBodyMeasure } from "../../../skeleton/IAutoMovieBodyMeasure";
import type { IAutoMovieSkeleton } from "../../../skeleton/IAutoMovieSkeleton";
import type { IAutoMoviePrepareChainConstants } from "../../IAutoMoviePrepareChainConstants";

/**
 * A performer's body as motion laws read it: the canonical VRM rig and its
 * physical profile, with the measure, the anatomical surfaces, the rig's
 * topology, rest joint positions, immutable FK prerequisites and bone-local
 * mass model derived once on its first actual read.
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

  /** Immutable canonical FK prerequisites, prepared once with this body's rig. */
  poseResolution: IAutoMovieSkeletonPoseResolution.IRig;

  /** Each limb's two-bone chain as the rig alone fixes it (`prepareChainConstants`), read once: a fit places the chain under a pose from these and the frame of the chain root's parent, and reads the rig through the record's fit readers (`rig`), built for this body's merged axes and the humanoid rest frames. A limb whose chain is not parent to child twice has none. */
  chains: Readonly<Partial<Record<"leftArm" | "rightArm" | "leftLeg" | "rightLeg", IAutoMoviePrepareChainConstants.IConstants>>>;

  /** The rig's range-of-motion projection of a whole pose (`clampPose.prepare`), built once on this body's rig: every joint of the given pose clamped in order into a new pose. Every consumer of the body's ordinary ROM reads this one; like the FK prerequisites it describes the rig the body was made from. */
  projection: (pose: IAutoMoviePose) => IAutoMoviePose;

  /** Bone-local mass/inertia model derived on its first read, once successfully, from the unchanged rig/profile. */
  massModel: IAutoMovieResolveCenterOfMass.IModel;

  /** Rest joint positions, canonical metres. */
  rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}
