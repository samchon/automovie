import type { IAutoMovieMotionHumanLanceCouch } from "../lexicon/IAutoMovieMotionHumanLanceCouch";
import type { IAutoMovieMotionHumanSabre } from "../lexicon/IAutoMovieMotionHumanSabre";
import type { IAutoMovieMotionHumanSword } from "../lexicon/IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "../lexicon/IAutoMovieMotionHumanSwordGuard";
import type { IAutoMovieMotionHumanSwordParry } from "../lexicon/IAutoMovieMotionHumanSwordParry";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Fighting with a blade: the sword guard, the cut, thrust, parry and taken
 * laws, the sabre and the couched lance.
 *
 * Every attack keeps the blade timing of `IAutoMovieMotionHumanSword`: a thrust
 * reaches contact on a point speed of 2.6 m/s at novice to 3.2 m/s at elite and
 * a cut on an edge speed of 6 to 10 m/s, a path of 0.8 m taking 0.47 s at elite
 * for a thrust. A bind holds the parry for a second (provisional); a footwork
 * step takes one stance step, 0.35 s at the reference hip. The composition
 * gives the held blade (`blade`, a sword prop the hand picked up) and the
 * target; with neither, the law is a solo drill of the bare hand.
 *
 * The presets are the constants of `AutoMovieMotionHumanBlade` that the film
 * rows of `HumanBlade` and `HumanWeaponMelee` read: the footwork steps
 * (`ADVANCE`, `RETREAT`, `TRAVERSE`, `VOID_STEP`), the parry holds (`BEAT`,
 * `BIND`), the feint (`FEINT`), the club blows (`CLUB_SWING`, `CLUB_STRIKE`)
 * and the reload (`RELOAD`).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanBlade` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanBlade<Chain> {
  /**
   * The guards of blade work: the blade taken from where the hand holds it to a
   * named guard and kept there.
   *
   * Registered law: `registered("swordGuard", params)`; not a chain method.
   *
   * @param params The `guard` and `duration` of
   *   `IAutoMovieMotionHumanSwordGuard.IParams`, with those of
   *   `IAutoMovieMotionHumanSword.IWield`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  swordGuard(
    params: IAutoMovieMotionHumanSwordGuard.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A cut of the blade from a named line, the edge brought through the target.
   *
   * Registered law: `registered("cut", params)`; not a chain method.
   *
   * @param params The `from` line and the members of
   *   `IAutoMovieMotionHumanSword.ICut`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  cut(params: IAutoMovieMotionHumanSword.ICut, anchor?: string): Chain;

  /**
   * A thrust of the blade point at the target, with the advance the target
   * needs.
   *
   * Registered law: `registered("thrust", params)`; not a chain method.
   *
   * @param params The `advance` and the members of
   *   `IAutoMovieMotionHumanSword.IAttack`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  thrust(params: IAutoMovieMotionHumanSword.IAttack, anchor?: string): Chain;

  /**
   * A parry that stops the opponent's attack on the blade, optionally held as a
   * bind.
   *
   * Registered law: `registered("parry", params)`; not a chain method.
   *
   * @param params The `hold` and the members of
   *   `IAutoMovieMotionHumanSwordParry.IParry`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  parry(params: IAutoMovieMotionHumanSwordParry.IParry, anchor?: string): Chain;

  /**
   * The attacker's blade carried aside on the defender's bind after a parried
   * attack.
   *
   * Registered law: `registered("taken", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanSwordParry.ITaken`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  taken(params: IAutoMovieMotionHumanSwordParry.ITaken, anchor?: string): Chain;

  /**
   * A mounted sabre carried on a slope or engaged with a target.
   *
   * Registered law: `registered("sabre", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanSabre`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  sabre(params: IAutoMovieMotionHumanSabre, anchor?: string): Chain;

  /**
   * A lance lowered to the couched position at a target.
   *
   * Registered law: `registered("lanceCouch", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanLanceCouch`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lanceCouch(params: IAutoMovieMotionHumanLanceCouch, anchor?: string): Chain;
}

/** The parameter and preset types of the family's methods. */
export namespace IAutoMovieMotionHumanBlade {
  /**
   * The direction and step count a footwork preset fixes (`ADVANCE`, `RETREAT`,
   * `TRAVERSE`, `VOID_STEP`).
   */
  export type IFootworkPreset = Pick<
    IAutoMovieMotionHumanStep.IParams,
    "direction" | "steps"
  >;

  /** The hold, in seconds, a parry preset fixes (`BEAT`, `BIND`). */
  export type IHoldPreset = Pick<
    IAutoMovieMotionHumanSwordParry.IParry,
    "hold"
  >;

  /**
   * The share of the cut a feint preset delivers before it is withdrawn
   * (`FEINT`).
   */
  export type IFeintPreset = Pick<IAutoMovieMotionHumanSword.ICut, "feint">;

  /**
   * The line and striking tip a club blow preset fixes (`CLUB_SWING`,
   * `CLUB_STRIKE`).
   */
  export type IClubPreset = Pick<
    IAutoMovieMotionHumanSword.ICut,
    "from" | "tip"
  >;

  /**
   * The touch the reload preset fixes: the support hand's palm pressed once
   * (`RELOAD`).
   */
  export type IReloadPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hand"
  >;
}
