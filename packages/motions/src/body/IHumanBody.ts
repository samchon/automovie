import type {
  IAutoMovieSkeletonTopology,
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

  /** Bone-local mass/inertia model derived on its first read, once successfully, from the unchanged rig/profile. */
  massModel: resolveAutoMovieCenterOfMass.IModel;

  /** Rest joint positions, canonical metres. */
  rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}
