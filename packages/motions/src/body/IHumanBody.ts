import type {
  IAutoMovieSkeletonTopology,
  clampPose,
  prepareChainConstants,
  prepareSkeletonPoseResolution,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMoviePhysicalProfile,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * Keep the source skeleton/profile unchanged while this body is in use;
 * recreate the body to adopt edits, including its immutable FK snapshot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical metre frame, producer, source stability and each derived member's purpose, including immutable FK preparation.
 * @evidence contracts/development/design.md#principled-representation One canonical performer couples a skeleton/profile to anthropometric measures, anatomical surfaces, rooted topology, rest joint positions, immutable clinical FK prerequisites and bone-local mass/inertia model; runtime producers admit the rig and physical inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Motion laws consume measures/surfaces, fitting consumes topology/rest points, poseBones consumes static FK, and jump/flight consumers share the mass model. The engine owns the existing skeleton, topology, prepared-rig and mass-model types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body shape, action, scene or fixed humanoid subset is embedded; any canonical rig/profile admitted by createHumanBody produces the same represented data.
 */
export interface IHumanBody {
  /** The canonical rig at its T-pose rest. */
  skeleton: IAutoMovieSkeleton;

  /** The physical profile on the rig's bones. */
  profile: IAutoMoviePhysicalProfile;

  /** The anthropometric measure, metres and kilograms. */
  measure: IAutoMovieBodyMeasure;

  /** Regions and sockets as bone-local frames. */
  surfaces: resolveAutoMovieHumanoidSurfaces.ISurfaces;

  /** The rig's topology, shared by every fit. */
  topology: IAutoMovieSkeletonTopology;

  /** Immutable canonical FK prerequisites, prepared once with this body's rig. */
  poseResolution: prepareSkeletonPoseResolution.IRig;

  /** Each limb's two-bone chain as the rig alone fixes it (`prepareChainConstants`), read once: a fit places the chain under a pose from these and the frame of the chain root's parent, and reads the rig through the record's fit readers (`rig`), built for this body's merged axes and the humanoid rest frames. A limb whose chain is not parent to child twice has none. */
  chains: Readonly<Partial<Record<"leftArm" | "rightArm" | "leftLeg" | "rightLeg", prepareChainConstants.IConstants>>>;

  /** The rig's range-of-motion projection of a whole pose (`clampPose.prepare`), built once on this body's rig: every joint of the given pose clamped in order into a new pose. Every consumer of the body's ordinary ROM reads this one; like the FK prerequisites it describes the rig the body was made from. */
  projection: ReturnType<typeof clampPose.prepare>;

  /** The joints whose range clamp gives a record it issued back bit for bit and that no writer of a resolved posture sets outside a clamp (`humanSettledJoints`), read once from the rig: a plain displayed pose keeps their records through its final clamp. */
  settled: ReadonlySet<AutoMovieHumanoidBone>;

  /** Bone-local mass/inertia model derived on its first read, once successfully, from the unchanged rig/profile. */
  massModel: resolveAutoMovieCenterOfMass.IModel;

  /** Rest joint positions, canonical metres. */
  rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}
