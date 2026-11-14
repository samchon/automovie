import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";

/**
 * Where a firearm is held at a ready position (`HumanWeaponFirearm.present`):
 * a region the doctrine describes, not one pose, and the arm holds the
 * weapon where in it it can.
 *
 * The region's freedoms are the muzzle's elevation, the weapon's roll about
 * its bore, and the hand's place ahead of and above the chest. The pose the
 * carriage has always stated is tried first, then its rolls, and the arm's
 * fit chooses and refines inside the bounds (`StrikingRoll.chosen`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a ready position is, its freedoms and how the pose is chosen.
 * @evidence contracts/development/design.md#principled-representation A ready position as a region of bounded freedoms, read by the shared chooser.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The region's record, the two regions and the pose the presentation reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body is named: places are shares of the arm from the chest, and the high ready's height is the body's own shoulder.
 */
export namespace HumanFirearmReady {
  /** A ready position's region: the muzzle's elevation, the weapon's roll about its bore and the hand's place by the chest, each bounded. */
  export interface IReady {
    /** The muzzle's elevation above level, degrees: the least, the greatest and the nominal. */
    elevation: readonly [number, number, number];

    /** The bore's run at the nominal elevation, ahead and up, the shares the carriage has always stated. */
    run: readonly [number, number];

    /** How far the weapon may roll about its bore either way, degrees. */
    roll: number;

    /** The hand's place ahead of the chest, shares of the arm: the least, the greatest and the nominal. */
    ahead: readonly [number, number, number];

    /** The hand's height above the chest, shares of the arm: the least, the greatest (null: the shoulder's height) and the nominal. */
    rise: readonly [number, number | null, number];
  }

  /**
   * The ready positions' regions, from doctrine where it gives a number.
   *
   * Low ready: the muzzle 30 to 45 degrees below level (US Army TC 3-22.9,
   * 2016, para 6-19, the rifle's low ready; the handgun's at about 45: LAPD
   * Handgun Instructor Training School 2022, p. 19; UN FPU Firearms Basic
   * 2015, p. 46), the arms extended about 45 degrees down from the body
   * (USMC MCRP 3-01B, sect. 3015a), the hands at belt to lower-abdomen
   * height (UN 2015, p. 46, photograph).
   * High ready, the muzzle up: at least 45 degrees above level (TC 3-22.9,
   * para 6-23), the hand up to about shoulder level with the elbow bent
   * (MCRP 3-01B, sect. 3016b).
   * No source gives the hand's distance ahead of the chest, the high ready's
   * greatest elevation or a roll about the bore: those bounds are
   * provisional (0.3 to 0.5 of the arm ahead up high, 0.4 to 0.75 down low,
   * at most 75 degrees up, 30 degrees of roll either way).
   */
  export const READY: Readonly<Record<"lowReady" | "highReady", IReady>> = {
    lowReady: {
      elevation: [-45, -30, -45],
      run: [0.7, -0.7],
      roll: 30,
      ahead: [0.4, 0.75, 0.4],
      rise: [-0.5, -0.2, -0.3],
    },
    highReady: {
      elevation: [45, 75, (Math.atan2(0.85, 0.5) * 180) / Math.PI],
      run: [0.5, 0.85],
      roll: 30,
      ahead: [0.3, 0.5, 0.4],
      rise: [0, null, 0],
    },
  };

  /** The rolls about the bore tried after none, degrees, inside `IReady.roll` (search resolution). */
  export const ROLLS: readonly number[] = [15, -15, 30, -30];

  /** What a ready pose is placed by. */
  export interface IProps {
    /** The held weapon. */
    tool: StrikingHeld.ITool;

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
    posture: IHumanPosture;
  }

  /**
   * The hand frame of a ready position.
   *
   * @param context The action's context.
   * @param props The weapon, the arm, the chest, the shoulder, the line and the carriage.
   * @returns The chosen hand frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The bore runs at its elevation along the line, the sights face back up high and ahead down low turned by the roll, and the hand sits ahead of and above the chest; the arm's fit chooses inside the region (`StrikingRoll.chosen`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The frame of the freedoms, the tried values, one choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The nominal values give the carriage's former pose exactly, so a pose the arm already held is kept; the presentation still judges the result (`StrikingRoll.reachable`).
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The chooser's fits, at most its budget.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pose(
    context: Pick<IHumanActionContext, "body">,
    props: IProps,
  ): StrikingHeld.IHandFrame {
    const { tool, arm, chest, line, low, posture } = props;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const region: IReady = READY[low ? "lowReady" : "highReady"];
    const sights: IAutoMovieVector3 = low ? line : Vector3.scale(line, -1);
    const frame = (values: readonly number[]): StrikingHeld.IHandFrame => {
      const [elevation, roll, ahead, rise] = values as readonly [
        number,
        number,
        number,
        number,
      ];
      const e: number = (elevation * Math.PI) / 180;
      // The nominal elevation is the region's own run of the bore.
      const bore: IAutoMovieVector3 =
        elevation === region.elevation[2]
          ? Vector3.add(
              Vector3.scale(line, region.run[0]),
              Vector3.scale(up, region.run[1]),
            )
          : Vector3.add(
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
      steps: [5, 15, 0.05, 0.05],
      bounds: [
        [region.elevation[0], region.elevation[1]],
        [-region.roll, region.roll],
        [region.ahead[0], region.ahead[1]],
        [region.rise[0], region.rise[1] ?? (props.shoulder.y - chest.y) / arm],
      ],
      back: tool.length,
      posture,
    });
  }
}
