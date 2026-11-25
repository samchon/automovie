import type {
  IAutoMovieBodyMeasure,
  IAutoMovieHumanoidSurfaces,
  IAutoMoviePhysicalProfile,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/**
 * One stored person of the ANSUR 1988 boundary population: the canonical rig,
 * its physical profile and the values the engine derives from those two alone,
 * recorded once from the public Human and engine APIs so a unit test reads them
 * instead of preparing a figure (`recordTestFixtures`).
 *
 * Every member is plain JSON data: a test reads what it needs and passes it to
 * the function under test. A value that holds closures or maps (the motions
 * package's whole body) is not stored; `humanFixtureBody` builds it from the
 * stored rig and profile when a function needs it.
 */
export interface IHumanFixture {
  /** The person's name in `MOTION_HUMAN_PEOPLE`, such as `m-average`. */
  name: string;

  /** The surveyed body mass, kilograms. */
  mass: number;

  /**
   * The canonical rig at its T-pose rest (+Y up, facing +Z, the left toward
   * +X), metres: `AutoMovieHumanCanonicalBody.prepare(...).skeleton`.
   */
  skeleton: IAutoMovieSkeleton;

  /**
   * The physical profile on the rig's bones, kilograms and metres:
   * `AutoMovieHumanCanonicalBody.prepare(...).profile`.
   */
  profile: IAutoMoviePhysicalProfile;

  /**
   * The anthropometric measure of the rig and profile, metres and kilograms:
   * `measureAutoMovieHumanoidBody.withSurfaces(skeleton, profile).measure`.
   */
  measure: IAutoMovieBodyMeasure;

  /**
   * The anatomical regions and sockets as bone-local frames:
   * `measureAutoMovieHumanoidBody.withSurfaces(skeleton, profile).surfaces`.
   */
  surfaces: IAutoMovieHumanoidSurfaces.ISurfaces;
}
