import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { handGoals } from "./handGoals";

/**
 * Typing a text on a keyboard from the posture the performer is in (seated
 * at a desk, or standing at a counter), pressing each key with an index
 * fingertip.
 *
 * Each key press is a goal: the index fingertip of the hand on that key's
 * side comes down onto the key's centre by the key's travel and lifts again,
 * while the other hand's fingertip hovers over its home key. Only the index
 * fingertips are contact surfaces of the body, so this is two-finger typing;
 * touch typing with every finger waits on fingertip surfaces for the other
 * fingers. The keys lie on the standard 19.05 mm pitch with the usual row
 * stagger (ISO/IEC 9995; rows offset by a quarter and three quarters of a
 * key), a QWERTY layout, the space bar two rows below the home row pressed
 * by the right hand where it lies under that hand's home key, the bar being
 * wide enough to strike anywhere; a key the layout lacks is refused.
 *
 * Time between presses comes from typing skill: skilled typists strike
 * about every 0.15 to 0.2 s and novices far slower (Salthouse 1986, Psychol
 * Bull 99:303), so the interval runs from 0.5 s for a novice to 0.15 s for
 * an elite on the `speed` axis, with the cross-task timing variability of
 * `HumanSkill.jitter` (interval values provisional inside Salthouse's
 * range). Each press takes the first 40 % of its interval to reach the key,
 * moving from 15 mm above it, and the rest to lift; the key travels 4 mm
 * (inside the 1.5 to 6 mm of ergonomic keyboard standards). The keyboard
 * should sit near elbow height with the elbows near 90 degrees (ANSI/HFES
 * 100-2007): one whose home row lies more than 0.15 m from the elbows' height
 * or beyond the forearms' reach is refused. The body holds the posture it is
 * entered in. Events `press1` to `pressN`, one per key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the layout, the timing, the refusals and the provisional values.
 * @evidence contracts/development/design.md#principled-representation A law record: a keyboard frame, a text and a pure plan of fingertip goals over seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, cancel table, parameters and plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, hand and frame types.
 * @evidence contracts/development/implementation.md#principled-implementation Fingertip goals on key centres solved by the arm's inverse kinematics; timing from typing studies.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Lays out the keys, times the presses, then evaluates each posture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown keys and unfit desks are refused; provisional values are named.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the text's length to plan, one hand solve per posture.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold the instance's inputs only.
 */
export namespace typeText {
  /** The action's name. */
  export const name: HumanActionName = "typeText";

  /** Cancel table: typing may stop between presses. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /** Parameters. */
  export interface IParams {
    /** The keyboard: the middle of its home row, world metres, and the heading its user faces. */
    keyboard: { at: IAutoMovieVector3; yaw: number };

    /** The text, of keys the layout has (letters and spaces). */
    text: string;
  }

  /** Key pitch, metres (ISO/IEC 9995). */
  export const PITCH: number = 0.01905;

  /** Key travel, metres (provisional). */
  export const TRAVEL: number = 0.004;

  /** Hover height above a key between presses, metres (provisional). */
  export const HOVER: number = 0.015;

  /** The QWERTY letter rows from the top, each with its stagger in keys. */
  export const ROWS: readonly { keys: string; stagger: number }[] = [
    { keys: "qwertyuiop", stagger: -0.25 },
    { keys: "asdfghjkl", stagger: 0 },
    { keys: "zxcvbnm", stagger: 0.5 },
  ];

  /**
   * A key's centre in the keyboard's frame, metres: `x` toward the user's
   * left, `z` away from the user, the home row's middle at the origin.
   *
   * @param key A letter or a space.
   * @returns The centre and the hand that presses it.
   * @throws {Error} When the layout has no such key.
   */
  export function key(key: string): {
    at: IAutoMovieVector3;
    side: HumanHand.Side;
  } {
    const k: string = key.toLowerCase();
    if (k === " ")
      return { at: { x: -1.5 * PITCH, y: 0, z: -2 * PITCH }, side: "right" };
    for (let row: number = 0; row < ROWS.length; row++) {
      const col: number = ROWS[row]!.keys.indexOf(k);
      if (col < 0) continue;
      const x: number = -((col + ROWS[row]!.stagger - 4.5) * PITCH);
      return {
        at: { x, y: 0, z: (1 - row) * PITCH },
        side: x > 0 ? "left" : "right",
      };
    }
    throw new Error(
      `The keyboard has no key "${key}"; it types letters and spaces`,
    );
  }

  /**
   * Plan typing.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} On an unknown key, an empty text, or a keyboard too high, low or far for the body.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const { keyboard, text } = context.params;
    if (text.length === 0) throw new Error("Typing needs a text");
    const keys = [...text].map(typeText.key);
    const hold: IHumanPosture = context.entry.posture;
    const frame: HumanFrame.IFrame = { origin: keyboard.at, yaw: keyboard.yaw };
    const world = (local: IAutoMovieVector3, lift: number): IAutoMovieVector3 =>
      HumanFrame.point(frame, { ...local, y: lift });

    // Fit: the home row near elbow height and within the forearm's reach of the shoulders.
    const elbow: number = hold.root.y + m.shoulderHeight - m.upperArm;
    if (Math.abs(keyboard.at.y - elbow) > 0.15)
      throw new Error(
        `${context.subject}: the keyboard stands ${(keyboard.at.y - elbow).toFixed(3)} m from the elbows' height; place it within 0.15 m of ${elbow.toFixed(3)} m`,
      );
    const shoulder: IAutoMovieVector3 = HumanFrame.point(
      { origin: hold.root, yaw: hold.yaw },
      { x: 0, y: m.shoulderHeight, z: 0 },
    );
    if (
      Math.hypot(
        keyboard.at.x - shoulder.x,
        keyboard.at.y - shoulder.y,
        keyboard.at.z - shoulder.z,
      ) >
      0.95 * (m.upperArm + m.forearm + m.hand)
    )
      throw new Error(
        `${context.subject}: the keyboard is beyond the arms' reach`,
      );

    // Presses on the skill's interval with timing variability.
    const interval: number = HumanSkill.quantity(
      context.skill,
      "speed",
      0.5,
      0.15,
    );
    const times: number[] = [];
    let clock: number = 0.3;
    for (let i: number = 0; i < keys.length; i++) {
      times.push(clock);
      clock += HumanSkill.jitter(
        context.skill,
        context.random(`key${i}`),
        interval,
      );
    }
    const duration: number = clock;
    const home: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: typeText.key("f").at,
      right: typeText.key("j").at,
    };

    // Where each fingertip is at a second: on its current key, travelling
    // between keys in the hover plane, or pressing.
    const tipAt = (side: HumanHand.Side, t: number): IAutoMovieVector3 => {
      let from: IAutoMovieVector3 = home[side];
      let fromTime: number = 0;
      for (let i: number = 0; i < keys.length; i++) {
        if (keys[i]!.side !== side) continue;
        const press: number = times[i]!;
        const reach: number = 0.4 * interval;
        if (t < press - reach) break;
        if (t < press) {
          const u: number = minimumJerk(
            (t - Math.max(fromTime, press - reach)) /
              Math.max(1e-3, press - Math.max(fromTime, press - reach)),
          ).s;
          const at: IAutoMovieVector3 = {
            x: from.x + (keys[i]!.at.x - from.x) * u,
            y: 0,
            z: from.z + (keys[i]!.at.z - from.z) * u,
          };
          return world(at, HOVER - (HOVER + TRAVEL) * u * u);
        }
        const lift: number = minimumJerk((t - press) / (0.6 * interval)).s;
        from = keys[i]!.at;
        fromTime = press + 0.6 * interval;
        if (t < fromTime) return world(from, -TRAVEL + (HOVER + TRAVEL) * lift);
      }
      return world(from, HOVER);
    };

    const contacts: IHumanContactWindow[] = [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    return {
      duration,
      events: times.map((t: number, i: number) => ({
        name: `press${i + 1}`,
        share: t / duration,
      })),
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const fingers: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: keyboard.yaw },
          { x: 0, y: -0.5, z: 1 },
        );
        const joints: IHumanPosture["joints"] = {
          ...hold.joints,
          ...HumanHand.shape("left", "point"),
          ...HumanHand.shape("right", "point"),
        };
        return handGoals(
          body,
          { ...hold, joints },
          (["left", "right"] as const).map((side) => ({
            side,
            surface: "indexTip" as const,
            shape: "point" as const,
            point: tipAt(side, t),
            rotation: HumanHand.rotation(side, {
              fingers,
              palm: { x: 0, y: -1, z: 0 },
            }),
            bend: HumanHand.elbow(body, hold, side, 0.1),
          })),
        );
      },
    };
  }
}
