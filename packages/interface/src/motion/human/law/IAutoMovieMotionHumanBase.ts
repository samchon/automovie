import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanEntryState } from "./IAutoMovieMotionHumanEntryState";

/**
 * What carries a body: the base axis of the grammar. A person stands, sits on a
 * seat, kneels, crouches, lies, leans on something or hangs from it, and every
 * act that leaves the root and the legs alone is performed on the base it is
 * entered on.
 *
 * An action that changes the base (sitting down, rising, kneeling, lying down,
 * mounting) declares the base it ends on in its plan
 * (`IAutoMovieMotionHumanActionPlan.base`). The performance passes it on as the
 * next action's entry (`IAutoMovieMotionHumanEntryState.base`) and keeps
 * passing it through every action that declares none, so a drink taken seated,
 * and the rise after it, still read the seat that was sat on.
 *
 * A seat that moves (a saddle, a vehicle's seat) is a seated base whose support
 * is the moving prop; the seat record is then where the seat was when it was
 * sat on.
 */
export type IAutoMovieMotionHumanBase =
  | IAutoMovieMotionHumanBase.ISeated
  | IAutoMovieMotionHumanBase.IPlain;

/**
 * Companion types, the kinds as data and the passing-on rule of
 * {@link HumanBase}.
 */
export namespace IAutoMovieMotionHumanBase {
  /** A body seated on something. */
  export interface ISeated {
    /** The discriminator. */
    kind: "seated";

    /**
     * The seat sat on, as the action that sat down declared it. Absent when the
     * body is seated by an action that declares no base, which only its seat
     * contact shows.
     */
    seat?: IAutoMovieMotionHumanBase.ISeat;
  }

  /**
   * A seat in the world, as the sitting actions take one: enough for the action
   * that leaves it to know its height, its heading and which way off it is
   * free.
   */
  export interface ISeat {
    /**
     * The middle of the sitting surface's front edge, world metres; its height
     * is the seat height.
     */
    at: IAutoMovieVector3;

    /** The heading a sitter faces, degrees about +Y. */
    yaw: number;

    /**
     * Depth back from the front edge, metres; deep enough for the thigh when
     * absent.
     */
    depth?: number;

    /**
     * Whether the seated task uses the seat as a fixed working support, as on a
     * rowing thwart.
     */
    workingSeat?: boolean;

    /** Backrest height above the surface, metres; backless when absent. */
    back?: number;

    /**
     * Whether the seat is sat astride, a leg on either side, as a saddle is;
     * both legs ahead when absent.
     */
    astride?: boolean;

    /**
     * The side a seat sat astride is got onto and off from, as a horse is
     * mounted from its left; either side when absent or `either`.
     */
    mount?: (readonly ["left", "right", "either"])[number];

    /**
     * Where each foot rests while seated, world metres; a foot with none is on
     * the floor or hangs.
     */
    footrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;

    /**
     * Where each hand rests on an armrest while seated, world metres, so
     * getting up can push on it; none when absent.
     */
    armrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;
  }

  /** A body on any other base. */
  export interface IPlain {
    /** The discriminator. */
    kind: Exclude<IAutoMovieMotionHumanBase.Kind, "seated">;
  }

  /** One base kind. */
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
   * The base a body is on as it leaves an action at a share of it. Input props
   * of HumanBase.after. The action's declared base, the base it was entered on,
   * the supports open at the instant and the share of the action reached.
   */
  export type IAfterProps = {
    /**
     * Action's declared ending base; undefined leaves support-derived
     * classification in charge.
     */
    declared: IAutoMovieMotionHumanBase | undefined;
    /**
     * Base held on entry, available when the current supports do not determine
     * a replacement.
     */
    entered: IAutoMovieMotionHumanBase;
    /** Borrowed supports open at the sampled instant. */
    supports: readonly IAutoMovieMotionHumanEntryState.ISupport[];
    /**
     * Action progress; the declared final base takes precedence at share >= 1 -
     * 1e-9.
     */
    share: number;
  };
}
