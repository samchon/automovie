import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieContextOccluder } from "./IAutoMovieContextOccluder";
import type { IAutoMovieEnvironmentInstant } from "./IAutoMovieEnvironmentInstant";
import type { IAutoMovieReferenceGround } from "./IAutoMovieReferenceGround";

/**
 * The read-only world a building is analysed against.
 *
 * Sun, sky, season, orientation, reference ground and neighbouring occluder
 * masses are conditions the building reads, never things it owns, which is why
 * this record is separate from {@link IAutoMovieBuiltEnvironment}: analysis may
 * use a neighbour's mass for shading without lowering it into the building's
 * scene or quantities. Production build review passes compiled element, space
 * and boundary ids to context validation, which refuses colliding context,
 * instant or occluder ids; standalone library/solver admission does not supply
 * that reserved population.
 *
 * A production declares its own instants, illuminance and outdoor air; this
 * package ships the contract and the engine ships the solvers, never a
 * catalogue of climates or places.
 */
export interface IAutoMovieEnvironmentContext {
  /** Schema version. */
  version: 1;

  /**
   * Non-blank stable context identity within the production, never equal to a
   * building-owned id.
   */
  id: string;

  /** All authored dimensions are measured in metres. */
  units: "meter";

  /**
   * World direction the site calls north; finite and non-zero, need not be
   * normalized. `sunDirection` projects it onto the ground plane to
   * orient a sun position from `solveSunPosition`, and refuses a north
   * parallel to the ground's up; the daylight study only digests it into its
   * settings.
   */
  north: IAutoMovieVector3;

  /** Datum plane every sky ray is measured against. */
  ground: IAutoMovieReferenceGround;

  /**
   * Declared environmental instants with unique ids, strictly increasing in
   * {@link IAutoMovieEnvironmentInstant.time}.
   *
   * An instant is one moment the production wants answered, not a sampled year:
   * a solstice noon, an overcast winter morning, a night with the lights on.
   * Ordering is a contract because two runs of the same design must produce the
   * same artifacts in the same order.
   */
  instants: IAutoMovieEnvironmentInstant[];

  /** Neighbouring masses that block light; read-only, never owned geometry. */
  occluders: IAutoMovieContextOccluder[];
}
