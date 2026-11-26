import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";

/**
 * Inputs, presets and outcomes for grappling actions.
 */
export namespace IAutoMovieMotionHumanGrapple {
  /**
   * Staged entries and mat exchanges distinguished by their displayed movement.
   * The sumo bouts crouch at the shikiri lines, charge at the tachiai and end
   * with a push out of the ring (`oshiDashi`), a belt-grip force-out
   * (`yoriKiri`) or an overarm belt throw (`uwateNage`).
   */
  export type Kind =
    /** Judo shoulder throw, 3.5 s by default. */
    | "seoiNage"
    /** Judo hip throw, 3.8 s. */
    | "oGoshi"
    /** Judo major outer reap, 3.4 s. */
    | "oSotoGari"
    /** Judo forward foot sweep timed to the step, the quickest scene, 3 s. */
    | "deAshiHarai"
    /** Wrestling single-leg takedown, 3.8 s. */
    | "singleLeg"
    /** Wrestling double-leg takedown, 3.6 s. */
    | "doubleLeg"
    /** Greco-Roman upper-body throw, 3.8 s. */
    | "grecoRoman"
    /** Judo hold on the mat, 5 s. */
    | "judoHold"
    /** Wrestling fall to the back, 5 s. */
    | "wrestlingFall"
    /** Mat guard pass, the longest scene, 6 s. */
    | "guardPass"
    /** MMA reset after a mat exchange, 4.2 s. */
    | "mmaReset"
    /**
     * Sumo push out, 4.5 s: the crouch at the shikiri lines 0.7 m apart to 22 %
     * of the scene, the tachiai charge to 32 %, a drive of 2.1 m in 0.35 m
     * steps over the 4.55 m ring to 82 % (`grappleSumo.LINES`, `RING`, `DRIVE`,
     * `STEP`, `SHIKIRI`, `TACHIAI`, `FINISH`; the lengths are provisional). The
     * roots meet 0.3 stature apart, at arm's length.
     */
    | "oshiDashi"
    /**
     * Sumo belt-grip force-out, 5 s, timed and driven as `oshiDashi`; the roots
     * meet 0.22 stature apart, chest to chest.
     */
    | "yoriKiri"
    /**
     * Sumo overarm belt throw, 4 s, timed as `oshiDashi`; the roots meet 0.22
     * stature apart.
     */
    | "uwateNage";

  /** The two parts of a scene played on the same clock. */
  export type Role = "initiator" | "receiver";

  /** Whether the planned movement settles or is interrupted and released. */
  export type Outcome = "complete" | "denied";

  /** Settings common to both roles. */
  export interface IScene {
    /** Which authored scene to stage. */
    kind: Kind;

    /** Author's result, `complete` when absent. */
    outcome?: Outcome;

    /** Lead side of the staged scene, right when absent. */
    side?: AutoMovieHumanSide;

    /**
     * Total scene duration in seconds, positive and finite. Absent, each kind
     * takes its own length listed on `Kind` (`grappleStances.seconds`,
     * `grappleSumo.seconds`); every one is an authored staging length,
     * provisional: no study of a bout's phase times was read. The phases keep
     * their shares of it, so a longer scene is the same beats slower.
     */
    duration?: number;
  }

  /** One actor's action in a shared grappling scene. */
  export interface IParams extends IScene {
    /** The actor's part in the paired scene. */
    role: Role;

    /** The other actor's subject in the same performance. */
    partner: string;
  }

  /**
   * A clinch preset: the grip and the hold a named clinch fixes, such as judo's
   * grip (kumikata) for a throw. Spread into `clinch`'s parameters with the
   * partner; each value means what the clinch's member of the same name does.
   */
  export interface IClinchPreset {
    /** The grip, as `IAutoMovieMotionHumanClinch.IParams.grip`. */
    grip: IAutoMovieMotionHumanClinch.Grip;

    /** Seconds the grip is held, as `IAutoMovieMotionHumanClinch.IParams.hold`. */
    hold: number;
  }

  /**
   * The parameters a clinch row leaves to the composition: the clinch's
   * parameters without the grip and the hold its preset fixes.
   */
  export type IClinchRow = Omit<
    IAutoMovieMotionHumanClinch.IParams,
    keyof IClinchPreset
  >;
}
