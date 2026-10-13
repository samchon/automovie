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
 * quantity take-off may ever emit that mass as part of the work. The production
 * build enforces it by handing every compiled building's element, space and
 * boundary ids to the context validator, which refuses a context, instant or
 * occluder id that collides with one, so "the neighbour is now our tower"
 * cannot happen by a copy-paste.
 *
 * Nothing here is a shipped library. A production declares its own instants,
 * its own illuminance, its own outdoor air; this package ships the contract
 * they are declared in and the solvers that read them, never a catalogue of
 * climates or places.
 *
 * @evidence contracts/common.md#principled-implementation Conditions are declared values checked by `validateAutoMovieEnvironmentContext`: metre units, non-zero finite north and ground-up directions, strictly increasing finite instant times, unique instant and occluder ids, and no id equal to a reserved building id.
 * @evidence contracts/common.md#clear-and-simple-design Site conditions live in their own record beside the built environment so no lowering or take-off path can reach them, and occluders reuse the half-space plane type instead of a second solid format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-order instants are refused rather than sorted; `north` is validated and folded into the daylight settings digest, but no solver reads it, so it is a declared field without a consumer today.
 * @evidence contracts/common.md#meaningful-documentation States read-only ownership and which ids the build reserves against it, metre units, instant ordering and its reason, that north is currently unread, and that the package ships no climate or place data.
 * @author Samchon
 */
export interface IAutoMovieEnvironmentContext {
  /** Schema version. */
  version: 1;

  /** Stable context identity within the production. */
  id: string;

  /** All authored dimensions are measured in metres. */
  units: "meter";

  /**
   * World direction the site calls north; non-zero, need not be normalized.
   * No solver reads it yet: it is validated and digested into daylight
   * settings only.
   */
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
