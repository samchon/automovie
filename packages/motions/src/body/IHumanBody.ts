import type {
  IAutoMovieSkeletonTopology,
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
 * topology and its rest joint positions derived once.
 *
 * Any canonical humanoid serves: a Human adapted by
 * `AutoMovieHumanCanonicalBody.adapt` (the polygon man), an imported VRM
 * character with a profile, or any other rig in the canonical T-pose frame
 * (+Y up, facing +Z, the left toward +X). Laws scale every distance from the
 * measure, so the same law fits any stature and proportion.
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

  /** Rest joint positions, canonical metres. */
  rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}
