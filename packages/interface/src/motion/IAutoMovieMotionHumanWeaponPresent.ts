import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanWeaponTrack } from "./IAutoMovieMotionHumanWeaponTrack";

/**
 * Handling a firearm with the weapon as the effector: presenting it to an aim
 * or a ready position, the shot's recoil, and the draw and the return to a
 * holster.
 *
 * The firearm is a prop the hand holds (`AutoMovieMotionHumanObject.prop` of a handgun or a
 * long gun, taken by its `grip`); presenting and firing are the generalised
 * launcher laws of `HumanWeaponPresent` under the firearm's names, reading the
 * gun's `muzzle` and `sight` and aiming from the eye (a handgun) or the cheek
 * (a long gun) unless a row names another tip, edge or anchor.
 *
 * A shot is three actions in a chain: `draw` (a pick up of the holstered pistol
 * by its grip), `present` (the muzzle brought onto the line from the eye to the
 * target and held) and `fire` (the trigger's press, the muzzle's rise about the
 * hand and its return onto the line). `present` with a ready position lowers
 * the weapon, and `holster` puts it back.
 *
 * A handgun is held in both hands unless one is asked, the support hand wrapped
 * beside the shooting hand; a long gun (a prop that declares a `foreEnd`) takes
 * the support hand on its fore-end and is refused in one hand. A target more
 * than `TURN` degrees off the heading is refused: the performer turns first.
 *
 * Timing (all provisional, no recoil or presentation study was read): `present`
 * brings the weapon onto the line in 0.9 s at novice to 0.5 s at elite skill
 * (`HumanWeaponPresent.PRESENT`). `fire` is the trigger press 0.1 s, the
 * muzzle's rise 0.07 s and its return 0.25 s, 0.42 s in all
 * (`HumanWeaponPresent.SHOT`), the muzzle rising 14 degrees at novice to 7 at
 * elite (`HumanWeaponPresent.RISE`). The bore may miss the aim point by 1
 * degree (`HumanWeaponPresent.DISPERSION`). A target more than 60 degrees off
 * the heading is refused (`HumanWeaponPresent.TURN`).
 *
 * First pass: the target is read once at the action's start, the holster is a
 * prop where the scene stands it and does not ride the body, and no reload is
 * planned. The recoil's size and times are provisional: no recoil-recovery
 * study was read (listed as research to do).
 */
export namespace IAutoMovieMotionHumanWeaponPresent {
  /** What every presenting action takes. */
  export interface IWield {
    /** The held weapon's prop subject id; the bare hand when absent. */
    gun?: string;

    /** The shooting hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How many hands hold it; 2 when absent. */
    hands?: 1 | 2;

    /**
     * The weapon's working point affordance, put on the line; `muzzle` when
     * absent.
     */
    tip?: string;

    /**
     * The affordance the working line runs from toward `tip`; absent, the
     * point's declared direction supplies it.
     */
    from?: string;

    /**
     * The weapon's sighting affordance, square to its line; `sight` when
     * absent.
     */
    edge?: string;

    /**
     * Where the line of aim starts on the body; the eye for a handgun and the
     * cheek for a long gun when absent.
     */
    anchor?: IAutoMovieMotionHumanWeaponPresent.Anchor;

    /**
     * How it is performed: a tempo that stretches the clock; at its neutral the
     * clock is the law's own.
     */
    manner?: IAutoMovieMotionManner;

    /**
     * What a shot launches: the prop that flies (a ball the scene gives), its
     * speed out of the muzzle in m/s (the gun's muzzle velocity) and the lock's
     * time from the break to the launch in seconds (the gun's lock time; 0 when
     * absent). Nothing is launched when absent.
     */
    shot?: IWieldShot;
  }

  /** The shot object of {@link IWield}. */
  export type IWieldShot = {
    /** Scene subject id of the projectile launched from the weapon's muzzle. */
    prop: string;
    /**
     * Muzzle speed relative to the weapon, metres per second; support
     * velocity is added by the launch planner. Authored, never derived: take
     * the gun's own muzzle velocity.
     */
    speed: number;
    /**
     * Lock delay after trigger break, seconds; 0 when absent: the shot
     * launches at the trigger break. Give a flintlock's lock time here.
     */
    lock?: number;
  };

  /**
   * Where a line of aim starts: the eye, the cheek on a stock, the face a bow's
   * hand draws to, the arm a lance is couched under.
   */
  export type Anchor = "eye" | "cheek" | "face" | "arm";

  /**
   * How the weapon is carried: on the line of aim; at a ready position with the
   * muzzle down or up; or at a long arm's recover, the firelock upright with
   * its butt at the support side's breast (the 1764 Manual Exercise's position
   * from which it is cocked); or shouldered, the piece in one hand against the
   * shoulder, its butt on the hip (the manual's Position of a Soldier under
   * Arms).
   */
  export type Carriage =
    | "aim"
    | "lowReady"
    | "highReady"
    | "recover"
    | "shoulder";

  /** Parameters of presenting the weapon. */
  export interface IPresent
    extends
      IAutoMovieMotionHumanWeaponPresent.IWield,
      IAutoMovieMotionHumanWeaponTrack.IParams {
    /**
     * What it is aimed at; a place straight ahead at eye height when absent. A
     * ready position faces it without aiming.
     */
    target?: IAutoMovieMotionTarget;

    /** The carriage; `aim` when absent. */
    carriage?: IAutoMovieMotionHumanWeaponPresent.Carriage;

    /**
     * Whether the presenting arm reaches straight out along the line of aim to
     * its own reach, a bow arm extended to the target; otherwise the working
     * point is held the presentation's own share of the arm out. Not extended
     * when absent.
     */
    extended?: boolean;

    /**
     * Seconds the carriage is held once reached, at least 0, after the 0.5 to
     * 0.9 s the weapon takes to come to it; 1 s when absent.
     */
    hold?: number;
  }
}
