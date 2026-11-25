import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanStrikingRoll,
  IAutoMovieVector3,
} from "@automovie/interface";

import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";

/** The alternatives of `READYEntryItem`'s site. */
type READYEntryItem = "lowReady" | "highReady";

/**
 * Where a firearm is held at a ready position (`HumanWeaponFirearm.present`): a
 * region the doctrine describes, not one pose, and the arm holds the weapon
 * where in it it can.
 *
 * The region's freedoms are the muzzle's elevation, the weapon's roll about its
 * bore, and the hand's place ahead of and above the chest. The nominal pose is
 * tried first, then its rolls, and the arm's fit chooses and refines inside the
 * bounds (`StrikingRoll.chosen`).
 */
export namespace HumanFirearmReady {
  /**
   * A ready position's region: the muzzle's elevation, the weapon's roll about
   * its bore and the hand's place by the chest, each bounded.
   */
  export interface IReady {
    /**
     * The muzzle's elevation above level, degrees: the least, the greatest and
     * the nominal.
     */
    elevation: readonly [number, number, number];

    /** How far the weapon may roll about its bore either way, degrees. */
    roll: number;

    /**
     * The hand's place ahead of the chest, shares of the arm: the least, the
     * greatest and the nominal.
     */
    ahead: readonly [number, number, number];

    /**
     * The hand's height above the chest, shares of the arm: the least, the
     * greatest (null: the shoulder's height) and the nominal.
     */
    rise: readonly [number, number | null, number];
  }

  /**
   * The ready positions' regions, from doctrine where it gives a number.
   *
   * Low ready: the muzzle 30 to 45 degrees below level (US Army TC 3-22.9,
   * 2016, para 6-19, the rifle's low ready; the handgun's at about 45: LAPD
   * Handgun Instructor Training School 2022, p. 19; UN FPU Firearms Basic 2015,
   * p. 46), the arms extended about 45 degrees down from the body (USMC MCRP
   * 3-01B, sect. 3015a), the hands at belt to lower-abdomen height (UN 2015, p.
   * 46, photograph). High ready, the muzzle up: at least 45 degrees above level
   * (TC 3-22.9, para 6-23), the hand up to about shoulder level with the elbow
   * bent (MCRP 3-01B, sect. 3016b). No source gives the hand's distance ahead
   * of the chest, the high ready's greatest elevation or a roll about the bore:
   * those bounds are provisional (0.3 to 0.5 of the arm ahead up high, 0.4 to
   * 0.75 down low, at most 75 degrees up, 30 degrees of roll either way).
   */
  export const READY: Readonly<Record<READYEntryItem, IReady>> = {
    lowReady: {
      elevation: [-45, -30, -45],
      roll: 30,
      ahead: [0.4, 0.75, 0.4],
      rise: [-0.5, -0.2, -0.3],
    },
    highReady: {
      elevation: [45, 75, (Math.atan2(0.85, 0.5) * 180) / Math.PI],
      roll: 30,
      ahead: [0.3, 0.5, 0.4],
      rise: [0, null, 0],
    },
  };

  /**
   * The rolls about the bore tried after none, degrees, inside `IReady.roll`
   * (search resolution).
   */
  export const ROLLS: readonly number[] = [15, -15, 30, -30];

  /** What a ready pose is placed by. */
  export interface IProps {
    /** The held weapon. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The arm's length, metres. */
    arm: number;

    /** The chest joint, world metres. */
    chest: IAutoMovieVector3;

    /** The holding arm's shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** The level unit direction toward the target. */
    line: IAutoMovieVector3;

    /** Whether the carriage is the low ready; the high ready when false. */
    low: boolean;

    /** The body as it stands at the decisive instant. */
    posture: IAutoMovieMotionHumanStrikingRoll.IChoice["posture"];
  }

  /**
   * The hand frame of a ready position.
   *
   * @param context The action's context.
   * @param props The weapon, the arm, the chest, the shoulder, the line and the
   *   carriage.
   * @returns The chosen hand frame.
   */
  export function pose(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    props: IProps,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const { tool, arm, chest, line, low, posture } = props;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const region: IReady = READY[low ? "lowReady" : "highReady"];
    const sights: IAutoMovieVector3 = low ? line : Vector3.scale(line, -1);
    const frame = (
      values: readonly number[],
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
      const [elevation, roll, ahead, rise] = values as readonly [
        number,
        number,
        number,
        number,
      ];
      // The bore along the level line raised by the elevation.
      const e: number = (elevation * Math.PI) / 180;
      const bore: IAutoMovieVector3 = Vector3.add(
        Vector3.scale(line, Math.cos(e)),
        Vector3.scale(up, Math.sin(e)),
      );
      return StrikingHeld.hand(
        tool,
        tool.length,
        Vector3.add(
          chest,
          Vector3.add(
            Vector3.scale(line, ahead * arm),
            Vector3.scale(up, rise * arm),
          ),
        ),
        bore,
        roll === 0
          ? sights
          : Quaternion.rotateVector(
              Quaternion.fromAxisAngle(Vector3.normalize(bore), roll),
              sights,
            ),
      );
    };
    const nominal: number[] = [
      region.elevation[2],
      0,
      region.ahead[2],
      region.rise[2],
    ];
    return StrikingRoll.chosen(context, tool, {
      frame,
      tried: [
        nominal,
        ...ROLLS.map((roll: number): number[] => [
          nominal[0]!,
          roll,
          nominal[2]!,
          nominal[3]!,
        ]),
      ],
      freedoms: [
        {
          kind: "bounded",
          step: 5,
          least: region.elevation[0],
          greatest: region.elevation[1],
        },
        {
          kind: "bounded",
          step: 15,
          least: -region.roll,
          greatest: region.roll,
        },
        {
          kind: "bounded",
          step: 0.05,
          least: region.ahead[0],
          greatest: region.ahead[1],
        },
        {
          kind: "bounded",
          step: 0.05,
          least: region.rise[0],
          greatest: region.rise[1] ?? (props.shoulder.y - chest.y) / arm,
        },
      ],
      back: tool.length,
      posture,
    });
  }
}
