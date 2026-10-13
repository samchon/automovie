import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieContextOccluder } from "./IAutoMovieContextOccluder";
import { IAutoMovieEnvironmentInstant } from "./IAutoMovieEnvironmentInstant";
import { IAutoMovieReferenceGround } from "./IAutoMovieReferenceGround";

/**
 * The read-only world a building is analysed against.
 *
 * Sun, sky, season, orientation, reference ground and neighbouring occluder
 * masses are conditions the building reads; they are never things it owns. That
 * separation is the whole reason this record exists apart from
 * {@link IAutoMovieBuiltEnvironment}: an analysis may read a neighbour's mass to
 * decide that a window is in shadow, but no lowering, no scene graph and no
 * quantity take-off may ever emit that mass as part of the work. The engine
 * enforces it by refusing a context whose ids collide with building-owned ids,
 * so "the neighbour is now our tower" cannot happen by a copy-paste.
 *
 * Nothing here is a shipped library. A production declares its own instants,
 * its own illuminance, its own outdoor air; this package ships the contract
 * they are declared in and the solvers that read them, never a catalogue of
 * climates or places.
 *
 * @author Samchon
 */
export interface IAutoMovieEnvironmentContext {
  /** Schema version. */
  version: 1;

  /** Stable context identity within the production. */
  id: string;

  /** All authored dimensions are measured in metres. */
  units: "meter";

  /** World direction the site calls north; non-zero, need not be normalized. */
  north: IAutoMovieVector3;

  /** Datum plane every sky ray is measured against. */
  ground: IAutoMovieReferenceGround;

  /**
   * Declared environmental instants, strictly increasing in
   * {@link IAutoMovieEnvironmentInstant.time}.
   *
   * An instant is one moment the production wants answered, not a sampled year:
   * a solstice noon, an overcast winter morning, a night with the lights on.
   * Ordering is a contract rather than a convenience, because two runs of the
   * same design must produce the same artifacts in the same order.
   */
  instants: IAutoMovieEnvironmentInstant[];

  /** Neighbouring masses that block light; read-only, never owned geometry. */
  occluders: IAutoMovieContextOccluder[];
}
