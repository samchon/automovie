import type { IAutoMovieHumanFaceSourceClosurePlan } from "./IAutoMovieHumanFaceSourceClosurePlan";

/**
 * The lip-closure companion of a face basis's oral contact.
 *
 * `channel` is the channel whose rows were decomposed as a delta at
 * `reference` weight one, a lip closure over an open jaw. Legacy replay scales
 * that native companion by the authored aperture ratio. A prepared
 * `sourceSpan` instead reads fixed native closure-zero/one states, replays
 * their source points, forms the registered closed endpoint and applies the
 * requested weight once before rigid contact.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactClosure {
  /** Native companion closure channel. */
  channel: string;

  /** Channel whose weight-one state the companion's delta was decomposed at. */
  reference: string;

  /** Fixed native-zero/one endpoints feed one requested source-span blend before rigid contact. */
  sourceSpan?: IAutoMovieHumanFaceSourceClosurePlan;
}
