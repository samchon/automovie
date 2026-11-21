import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanWater } from "../perform/IAutoMovieMotionHumanWater";

/**
 * A rider sliding off a swimming horse to its upstream side and floating
 * beside it: one hand keeps hold of the horse (its mane, or a saddle part),
 * the body trails prone at the surface with the head clear of the water and
 * the legs flutter-kick, carried along by the horse.
 *
 * The horse prop owns where it and the held part are at every film second;
 * the action places the floating body beside the held part and refuses a
 * blocked upstream side, a held part out of reach from the surface and a
 * sample whose displayed hand misses it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the horse, the upstream side, the held part, the water, the blocked sides, the film-second duration and the slide-off interval.
 * @evidence contracts/development/design.md#principled-representation One named contact on one prop for the near hand over the whole action; the side is the horse's, the water the shared water record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The horse prop owns its course and the held part's frame; this record names only what the floating rider does.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body position or horse course is supplied here; the float is placed from the held part and the water.
 */
export interface IAutoMovieMotionHumanFloatBeside {
  /** The horse prop's subject id in the performance. */
  on: string;

  /** The horse's side the rider slides off to and floats on, its upstream side: the current then presses the rider against the horse rather than under it. */
  side: AutoMovieHumanSide;

  /** The horse's affordance id the near hand keeps hold of, a round bar such as the mane; `mane` when absent. The entry already holds it with the hand nearer the horse. */
  hold?: string;

  /** The water floated in: its surface height, world metres, and its density. */
  water: IAutoMovieMotionHumanWater;

  /** The horse's sides whose water is blocked (a bank, a snag, another horse); none when absent. Floating on a blocked side is refused. */
  blocked?: AutoMovieHumanSide[];

  /** Seconds the action lasts, the slide-off included, more than `transition`. */
  seconds: number;

  /** Seconds the slide off the saddle into the float takes, positive. */
  transition: number;
}
