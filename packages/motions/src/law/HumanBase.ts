import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanEntryState } from "./IHumanEntryState";

/**
 * What carries a body: the base axis of the grammar. A person stands,
 * sits on a seat, kneels, crouches, lies, leans on something or hangs from
 * it, and every act that leaves the root and the legs alone is performed on
 * the base it is entered on.
 *
 * An action that changes the base (sitting down, rising, kneeling, lying
 * down, mounting) declares the base it ends on in its plan
 * (`IHumanActionPlan.base`). The performance passes it on as the next
 * action's entry (`IHumanEntryState.base`) and keeps passing it through
 * every action that declares none, so a drink taken seated, and the rise
 * after it, still read the seat that was sat on.
 *
 * A seat that moves (a saddle, a vehicle's seat) is a seated base whose
 * support is the moving prop; the seat record is then where the seat was
 * when it was sat on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a base is, who declares it, how it reaches the next action and what a moving seat is.
 * @evidence contracts/development/design.md#principled-representation The base kinds are BML 1.0's posture stances with the supports #3337 adds; only a seated base carries a seat, so a seat on a standing body cannot be written.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The union, its kinds as data, the seat record and the one rule that passes a base on; read by the entry state, by `rise` after a ride and by the base primitives.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The seat record is declared here and the sitting actions' own seat type satisfies it, so no law file is imported by the entry state.
 */
export type HumanBase = HumanBase.ISeated | HumanBase.IPlain;
/** Companion types, the kinds as data and the passing-on rule of {@link HumanBase}. */
export namespace HumanBase {
  /**
   * The base kinds, as data: the list a page, a test generator and a
   * refusal's alternatives read, from which {@link Kind} is derived.
   */
  export const KINDS = [
    "standing",
    "seated",
    "kneeling",
    "crouched",
    "lying",
    "leaning",
    "hanging",
  ] as const;

  /** One base kind. */
  export type Kind = (typeof KINDS)[number];

  /** A body seated on something. */
  export interface ISeated {
    /** The discriminator. */
    kind: "seated";

    /**
     * The seat sat on, as the action that sat down declared it. Absent when
     * the body is seated by an action that declares no base, which only
     * its seat contact shows.
     */
    seat?: ISeat;
  }

  /** A body on any other base. */
  export interface IPlain {
    /** The discriminator. */
    kind: Exclude<Kind, "seated">;
  }

  /**
   * A seat in the world, as the sitting actions take one: enough for the
   * action that leaves it to know its height, its heading and which way off
   * it is free.
   */
  export interface ISeat {
    /** The middle of the sitting surface's front edge, world metres; its height is the seat height. */
    at: IAutoMovieVector3;

    /** The heading a sitter faces, degrees about +Y. */
    yaw: number;

    /** Depth back from the front edge, metres; deep enough for the thigh when absent. */
    depth?: number;

    /** Backrest height above the surface, metres; backless when absent. */
    back?: number;

    /** Whether the seat is sat astride, a leg on either side, as a saddle is; both legs ahead when absent. */
    astride?: boolean;

    /** The side a seat sat astride is got onto and off from, as a horse is mounted from its left; either side when absent or `either`. */
    mount?: "left" | "right" | "either";

    /** Where each foot rests while seated, world metres; a foot with none is on the floor or hangs. */
    footrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;

    /** Where each hand rests on an armrest while seated, world metres, so getting up can push on it; none when absent. */
    armrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;
  }

  /**
   * The base a body is on as it leaves an action at a share of it.
   *
   * @param props The action's declared base, the base it was entered on, the supports open at the instant and the share of the action reached.
   * @returns The base the next action is entered on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation An action that ran to its end left the body on the base it declares. Cut earlier, or declaring none, the open supports say what bears the body (a seat contact is seated, a lying contact is lying, otherwise the feet): the declared base where it agrees with them, else the entered base where that agrees, else the kind the supports show alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading of the supports and three ordered choices.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kneeling, crouched, leaning and hanging show no contact of their own in a plan's windows, so a cut inside the action that reaches one of them is read as the base it was entered on until its end; stated here as the remaining gap.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the supports, which are a handful.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function after(props: {
    declared: HumanBase | undefined;
    entered: HumanBase;
    supports: readonly IHumanEntryState.ISupport[];
    share: number;
  }): HumanBase {
    if (props.declared !== undefined && props.share >= 1 - 1e-9)
      return props.declared;
    const shown: Kind = props.supports.some(
      (s: IHumanEntryState.ISupport): boolean => s.kind === "seat",
    )
      ? "seated"
      : props.supports.some(
            (s: IHumanEntryState.ISupport): boolean => s.kind === "lie",
          )
        ? "lying"
        : "standing";
    if (props.declared?.kind === shown) return props.declared;

    // A base no contact shows (kneeling, crouched, leaning, hanging) is kept
    // by an action that declares none while the feet still bear.
    if (
      props.entered.kind === shown ||
      (props.declared === undefined &&
        shown === "standing" &&
        props.entered.kind !== "seated" &&
        props.entered.kind !== "lying")
    )
      return props.entered;
    return { kind: shown };
  }
}
