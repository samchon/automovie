import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanHoldInfant } from "../tasks/IAutoMovieMotionHumanHoldInfant";

/**
 * Caring for another person: first aid on a lying or seated partner and holding
 * an infant. The first-aid methods append shipped kneel and touch actions to
 * the carer's chain, so they are fitted, refused and checked as those actions
 * are.
 *
 * Compressions follow the American Heart Association 2020 adult guideline: 100
 * to 120 a minute, 30 compressions to 2 breaths, both palms on the partner's
 * lower sternum, one hand over the other, the arms straight. A pulse is felt
 * for 10 s, the check of AHA 2020 basic life support. The owning constants are
 * `AutoMovieMotionHumanCare.COMPRESSION_CYCLE` and `PULSE_HOLD`.
 *
 * The first-aid methods are helpers over a chain: each takes the chain first
 * and returns it with the actions appended, as the runtime namespace takes it.
 * `holdInfant` is an action law planned by the chain, so it takes the law's
 * parameters and an anchor.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanCare` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method takes and returns.
 */
export interface IAutoMovieMotionHumanCare<Chain> {
  /**
   * Holding an infant taken up before (`pickUp` at its `seat`), standing or
   * seated as the body entered: in the cradle hold, against the shoulder with
   * the other hand patting its back, or feeding it from a bottle in the other
   * hand, optionally rocking it.
   *
   * Registered law: `registered("holdInfant", params)`; not a chain method.
   *
   * @param params The `hold`, `prop`, `hand`, `hold`, `rock`, `pats` and
   *   `bottle` of `IAutoMovieMotionHumanHoldInfant.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  holdInfant(
    params: IAutoMovieMotionHumanHoldInfant.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Kneel on both knees beside the partner and stay down for the care that
   * follows, the right knee coming down at the floor point beside the partner,
   * so the knees end against the side of a lying partner rather than a reverse
   * lunge back from it.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `at` of `IAutoMovieMotionHumanCare.IKneelBeside`.
   * @returns The chain with the kneel appended.
   */
  kneelBeside(
    chain: Chain,
    params: IAutoMovieMotionHumanCare.IKneelBeside,
  ): Chain;

  /**
   * One cycle of chest compressions: both palms press the partner's sternum, 30
   * times with the arms straight.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `partner` of `IAutoMovieMotionHumanCare.ICompressions`.
   * @returns The chain with the compressions appended.
   */
  compressions(
    chain: Chain,
    params: IAutoMovieMotionHumanCare.ICompressions,
  ): Chain;

  /**
   * Feel the partner's pulse with the fingertips for 10 s.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `partner`, `site` and `side` of
   *   `IAutoMovieMotionHumanCare.IPulse`.
   * @returns The chain with the check appended.
   */
  pulse(chain: Chain, params: IAutoMovieMotionHumanCare.IPulse): Chain;

  /**
   * Press a wound with both palms and hold.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `partner`, `region` and `hold` of
   *   `IAutoMovieMotionHumanCare.IPressWound`.
   * @returns The chain with the pressure appended.
   */
  pressWound(
    chain: Chain,
    params: IAutoMovieMotionHumanCare.IPressWound,
  ): Chain;
}

/** The parameter types of the Care methods. */
export namespace IAutoMovieMotionHumanCare {
  /** Where a pulse is felt: the carotid at the neck or the radial at the wrist. */
  export type IPulseSite = "carotid" | "radial";

  /** The parameters of `kneelBeside`. */
  export interface IKneelBeside {
    /** The floor point beside the partner the right knee comes down on. */
    at: IAutoMovieMotionTarget;
  }

  /** The parameters of `compressions`. */
  export interface ICompressions {
    /** The partner's subject. */
    partner: string;
  }

  /** The parameters of `pulse`. */
  export interface IPulse {
    /** The partner's subject. */
    partner: string;

    /** The carotid or the radial pulse. */
    site: IPulseSite;

    /** The feeling hand; the right when absent. */
    side?: AutoMovieHumanSide;
  }

  /** The parameters of `pressWound`. */
  export interface IPressWound {
    /** The partner's subject. */
    partner: string;

    /** The wounded region. */
    region: AutoMovieHumanoidRegion;

    /** Seconds the pressure is held. */
    hold: number;
  }
}
