import type { IAutoMovieMotionHumanEntryState } from "./IAutoMovieMotionHumanEntryState";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * What carries a body: the base axis of the grammar. A person stands,
 * sits on a seat, kneels, crouches, lies, leans on something or hangs from
 * it, and every act that leaves the root and the legs alone is performed on
 * the base it is entered on.
 *
 * An action that changes the base (sitting down, rising, kneeling, lying
 * down, mounting) declares the base it ends on in its plan
 * (`IAutoMovieMotionHumanActionPlan.base`). The performance passes it on as the next
 * action's entry (`IAutoMovieMotionHumanEntryState.base`) and keeps passing it through
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
export type IAutoMovieMotionHumanBase =
  | IAutoMovieMotionHumanBase.ISeated
  | IAutoMovieMotionHumanBase.IPlain;

/**
 * Companion types, the kinds as data and the passing-on rule of {@link HumanBase}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows. at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y.
 * @evidence contracts/development/design.md#principled-representation seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows. at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanBase.ts (HumanBase.after, return); handling/pickUpPosture.ts (pickUpPosture.leaned).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanEntryState.ISupport identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanBase {
  /**
   * A body seated on something.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows.
   * @evidence contracts/development/design.md#principled-representation seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/HumanBase.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBase.ISeat identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISeated {
    /** The discriminator. */
    kind: "seated";

    /**
     * The seat sat on, as the action that sat down declared it. Absent when
     * the body is seated by an action that declares no base, which only
     * its seat contact shows.
     */
    seat?: IAutoMovieMotionHumanBase.ISeat;
  }

  /**
   * A seat in the world, as the sitting actions take one: enough for the
   * action that leaves it to know its height, its heading and which way off
   * it is free.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y. depth: Depth back from the front edge, metres; deep enough for the thigh when absent.
   * @evidence contracts/development/design.md#principled-representation at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y. depth: Depth back from the front edge, metres; deep enough for the thigh when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/rise.ts (rise.plan); law/HumanBase.ts (HumanBase.MOUNTS); lexicon/HumanMountOff.ts (HumanMountOff.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
    mount?: (readonly ["left", "right", "either"])[number];

    /** Where each foot rests while seated, world metres; a foot with none is on the floor or hangs. */
    footrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;

    /** Where each hand rests on an armrest while seated, world metres, so getting up can push on it; none when absent. */
    armrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;
  }

  /**
   * A body on any other base.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: The discriminator.
   * @evidence contracts/development/design.md#principled-representation kind: The discriminator.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/HumanBase.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBase.Kind identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlain {
    /** The discriminator. */
    kind: Exclude<IAutoMovieMotionHumanBase.Kind, "seated">;
  }

  /**
   * One base kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One base kind.
   * @evidence contracts/development/design.md#principled-representation Closed choices "standing", "seated", "kneeling", "crouched", "lying", "leaning", "hanging", "airborne", "immersed" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: floor/floorEntry.ts (floorEntry.BASES); floor/floorEntry.ts (floorEntry.standing); floor/getUp.ts (getUp.plan); law/HumanBase.ts (HumanBase.KINDS); law/HumanBase.ts (HumanBase.after).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in floorEntry.BASES.
   */
  export type Kind = (readonly [
    "standing",
    "seated",
    "kneeling",
    "crouched",
    "lying",
    "leaning",
    "hanging",
    "airborne",
    "immersed",
  ])[number];

  /**
   * The base a body is on as it leaves an action at a share of it. Input props of HumanBase.after. The action's declared base, the base it was entered on, the supports open at the instant and the share of the action reached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation supports: Borrowed supports open at the sampled instant. share: Action progress; the declared final base takes precedence at share >= 1 - 1e-9.
   * @evidence contracts/development/design.md#principled-representation supports: Borrowed supports open at the sampled instant. share: Action progress; the declared final base takes precedence at share >= 1 - 1e-9.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanBase.ts (HumanBase.after, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBase, IAutoMovieMotionHumanEntryState.ISupport identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IAfterProps = {
    /** Action's declared ending base; undefined leaves support-derived classification in charge. */
    declared: IAutoMovieMotionHumanBase | undefined;
    /** Base held on entry, available when the current supports do not determine a replacement. */
    entered: IAutoMovieMotionHumanBase;
    /** Borrowed supports open at the sampled instant. */
    supports: readonly IAutoMovieMotionHumanEntryState.ISupport[];
    /** Action progress; the declared final base takes precedence at share >= 1 - 1e-9. */
    share: number;
  };
}
