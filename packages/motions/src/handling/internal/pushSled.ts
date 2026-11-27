import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionLaw,
} from "@automovie/interface";

import { pushSledPlan } from "./pushSledPlan";

/**
 * A pushed load's handles held in both hands through a walk: a sled push. The
 * trunk leans into the load while the body stands, the hands go to the handles
 * where the load stands, close on them, and from then on are carried with the
 * chest along the floor at the handles' own height. The body then walks to
 * `to`, slowly with no arm swing, while the arms take the walk's rise and fall
 * and the gripped load stays on the floor.
 *
 * The lean is the trunk's incline from the vertical, a hinge at the hips shared
 * by the pelvis and the spine (at least `lean`, if asked), coming in over
 * `SETTLE` seconds with the arms; lower handles are pushed with the trunk
 * nearer the horizontal, as far as measured pushers incline at the handles'
 * height (`pushSledStance`), and from bent knees, the body sinking as far as
 * keeps each wrist within the arm's reach as the walk rises; the hands reach
 * the handles in that time and grip them from its end, each fist's grip socket
 * on its handle as a grasp lays it (`HumanHand.reach`: the palm into the bar
 * along the handle's `-Y`, the thumb's side along its `+X`), turned about the
 * handle as far as its symmetry makes the same grasp and slid along its grip
 * band to whichever grasp the arm, its wrist within range, keeps nearest the
 * handle through the push (the shared chooser, `HumanFreedomChoice`), so the
 * handle is in the fist. Each hand's place is then kept in the chest's frame
 * for the rest of the push, its turn kept with it; a turn the arm cannot meet
 * gives way about the grip socket.
 *
 * The same hold serves the other ways a load is moved by its handles
 * (`pushPull`): an incline asked outright, leaning back for a pull; a walk
 * facing the load, so the body walks backward and draws it along; a stand in
 * place (`seconds`) instead of the walk; and a load that does not move, whose
 * handles the hands press (a `bear` contact bearing none of the body's weight)
 * instead of gripping, so it stays where it stands.
 *
 * First pass: the load slides with the grip and is not dragged by a friction;
 * the push's force and the slowing it brings to the walk are not modelled.
 */
export namespace pushSled {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "pushSled";

  /** Cancel table: the push may be left at any time. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** Seconds to lean in and take the handles (provisional). */
  export const SETTLE: number = 0.6;

  /**
   * The instants of the push after the grip a grasp is judged at, shares of the
   * push (search resolution: a quarter of it apart).
   */
  export const SAMPLES: readonly number[] = [0.25, 0.5, 0.75, 1];

  /**
   * The refinement step of a hand's turn about a round handle, and the spacing
   * of the turns tried first round it, degrees (search resolution: an eighth of
   * a turn, halving to under 6).
   */
  export const TURN: number = 45;

  /** {@link pushSledPlan}, read through this namespace. */
  export const plan: typeof pushSledPlan = pushSledPlan;
}
