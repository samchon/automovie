import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieContextOccluder } from "./IAutoMovieContextOccluder";
import { IAutoMovieEnvironmentInstant } from "./IAutoMovieEnvironmentInstant";
import { IAutoMovieReferenceGround } from "./IAutoMovieReferenceGround";

/**
 * The read-only world a building is analysed against.
 *
 * Sun, sky, season, orientation, reference ground and neighbouring occluder masses are conditions the building reads, never things it owns, which is why this record is separate from {@link IAutoMovieBuiltEnvironment}: analysis may use a neighbour's mass for shading without lowering it into the building's scene or quantities. Production build review passes compiled element, space and boundary ids to context validation, which refuses colliding context, instant or occluder ids; standalone library/solver admission does not supply that reserved population.
 *
 * A production declares its own instants, illuminance and outdoor air; this package ships the contract and the engine ships the solvers, never a catalogue of climates or places.
 *
 * @evidence contracts/common.md#principled-implementation Context validation checks metre units, finite direction components with length above 1e-12, unique strictly time-ordered instants, beam/horizon consistency, occluder planes and collisions with caller-supplied reserved building ids. Production supplies element, space and boundary ids; direct solver validation reserves none. Declared nested containers are premises, although missing resident instant/occluder records are refused by index.
 * @evidence contracts/common.md#clear-and-simple-design One flat record holding only the read-only site inputs, kept apart from the building record so no building query can reach an occluder; solvers look up an instant by id through `autoMovieEnvironmentInstant`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Instant order is validated rather than sorted; north is included in daylight identity but rotates no sun or geometry. A finite-component vector whose measured norm overflows can pass direction admission while skipping the horizon gate, so extreme accepted inputs do not establish beam/horizon consistency.
 * @evidence contracts/common.md#meaningful-documentation States the ownership separation and how the build enforces it, that no climate data ships, the units, the north direction's current non-use, the instant ordering contract and its reason, and the occluders' read-only role.
 */
export interface IAutoMovieEnvironmentContext {
  /** Schema version. */
  version: 1;

  /**
   * Non-blank stable context identity within the production, never equal to a building-owned id.
   */
  id: string;

  /** All authored dimensions are measured in metres. */
  units: "meter";

  /**
   * World direction the site calls north; finite and non-zero, need not be normalized. No solver reads it yet: it is validated and digested into daylight settings only.
   */
  north: IAutoMovieVector3;

  /** Datum plane every sky ray is measured against. */
  ground: IAutoMovieReferenceGround;

  /**
   * Declared environmental instants with unique ids, strictly increasing in {@link IAutoMovieEnvironmentInstant.time}.
   *
   * An instant is one moment the production wants answered, not a sampled year: a solstice noon, an overcast winter morning, a night with the lights on. Ordering is a contract because two runs of the same design must produce the same artifacts in the same order.
   */
  instants: IAutoMovieEnvironmentInstant[];

  /** Neighbouring masses that block light; read-only, never owned geometry. */
  occluders: IAutoMovieContextOccluder[];
}
