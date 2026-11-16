import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { typeText } from "../everyday/typeText";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { manipulate } from "./manipulate";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateReach } from "./manipulateReach";
import { manipulateShape } from "./manipulateShape";

/**
 * Prepare the keyed contacts once and evaluate only each hand's active press.
 * Wrist placement, digit shape, elbow hint and activation windows depend on
 * the immutable body, entry posture, contacts and skill interval of this plan.
 * Each posture still supplies fresh mutable joint, limb and digit records.
 *
 * @param body The performer whose measured digits place the wrist.
 * @param hold The posture held throughout the sequence.
 * @param presses Resolved contacts in authored order, with world points and seconds.
 * @param span The skill-derived press interval, seconds.
 * @param reach The share of the interval spent approaching each contact.
 * @returns The plan with its original press events and ground contacts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the prepared inputs, timebase, shared geometry and ownership of returned posture records.
 * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk wrist transport and digit descent retain the law's original equations; sorted activation windows store the greatest authored index reached so unordered times keep the original last-matching-contact rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns invariant placements and windows; evaluation selects one contact per participating hand and writes its goals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact, timing, depth or digit goal is removed or approximated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is O(N log N) time and O(N) space; each posture selects two active windows at most in O(log N), with constant geometry work instead of scanning and rebuilding all N contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each contact's wrist and shape, and each hand's rotation and bend, are shared only within the plan whose body, posture, presses and interval determine them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned plan owns O(N) prepared contacts and windows and releases them with the plan; no global cache or process is retained.
 */
export function manipulatePlan(
  body: IHumanBody,
  hold: IHumanPosture,
  presses: readonly manipulate.IPress[],
  span: number,
  reach: number,
): IHumanActionPlan {
  const duration: number = presses[presses.length - 1]!.time + reach * span;
  const hands: IHand[] = [];
  for (const side of ["left", "right"] as const) {
    const mine: manipulate.IPress[] = presses.filter(
      (press: manipulate.IPress): boolean => press.side === side,
    );
    if (mine.length === 0) continue;
    const rotation: IAutoMovieQuaternion = manipulateFacing(hold, presses, side);
    const reachAt: ReturnType<typeof manipulateReach.prepare> =
      manipulateReach.prepare(body, side, rotation);
    const shapes: Map<manipulate.Finger, IHumanPosture["joints"]> = new Map();
    const prepared: IPress[] = mine.map((press: manipulate.IPress): IPress => {
      let joints: IHumanPosture["joints"] | undefined = shapes.get(press.digit);
      if (joints === undefined) {
        joints = manipulateShape(side, press.digit);
        shapes.set(press.digit, joints);
      }
      return {
        press,
        joints,
        digit: `${side}${press.digit[0]!.toUpperCase()}${press.digit.slice(1)}` as IHumanPosture.Digit,
        wrist: reachAt(press.digit, press.site, press.normal, press.depth),
      };
    });
    const windows: IWindow[] = mine.map(
      (press: manipulate.IPress, index: number): IWindow => ({
        from: press.time - reach * span,
        index,
      }),
    ).filter((window: IWindow): boolean => !Number.isNaN(window.from));
    windows.sort((a: IWindow, b: IWindow): number => a.from - b.from);
    let latest: number = 0;
    for (const window of windows) {
      latest = Math.max(latest, window.index);
      window.index = latest;
    }
    hands.push({ side, rotation, prepared, windows,
      bend: AutoMovieMotionHumanBend.hang(body, hold, side, 0.1) });
  }
  const contacts: IHumanContactWindow[] = (["leftFoot", "rightFoot"] as const).map(
    (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
      part, kind: "plant", from: 0, to: 1, support: { kind: "ground" },
    }),
  );
  return {
    duration,
    events: presses.map((press: manipulate.IPress, index: number): IHumanActionPlan["events"][number] => ({
      name: `press${index + 1}`, share: press.time / duration,
    })),
    contacts,
    posture: (seconds: number): IHumanPosture => {
      const time: number = Math.min(duration, Math.max(0, seconds));
      const joints: IHumanPosture["joints"] = { ...hold.joints };
      const limbs: IHumanPosture["limbs"] = { ...hold.limbs };
      const digits: NonNullable<IHumanPosture["digits"]> = {};
      for (const hand of hands) {
        const index: number = active(hand.windows, time);
        const current: IPress = hand.prepared[index]!;
        const previous: IPress = hand.prepared[Math.max(0, index - 1)]!;
        const press: manipulate.IPress = current.press;
        Object.assign(joints, current.joints);
        const approach: number = minimumJerk.share(Math.min(1, Math.max(0,
          (time - (press.time - reach * span)) / (reach * span),
        )));
        limbs[`${hand.side}Arm`] = {
          point: Vector3.lerp(previous.wrist, current.wrist, approach),
          rotation: hand.rotation,
          bend: hand.bend,
        };
        const down: number = time < press.time ? approach * approach :
          1 - minimumJerk.share(Math.min(1,
            (time - press.time) / ((1 - reach) * span),
          ));
        const lift: number = typeText.HOVER - (typeText.HOVER + press.depth) * down;
        digits[current.digit] = {
          point: Vector3.add(press.site, Vector3.scale(press.normal, lift)),
          normal: press.normal,
          surface: "tip",
        };
      }
      return { ...hold, joints, limbs, digits };
    },
  };
}

/** One immutable contact's placement and hand shape. */
interface IPress {
  press: manipulate.IPress;
  wrist: IAutoMovieVector3;
  joints: IHumanPosture["joints"];
  digit: IHumanPosture.Digit;
}

/** A hand's contact windows and geometry, owned by its sequence plan. */
interface IHand {
  side: HumanHand.Side;
  rotation: IAutoMovieQuaternion;
  bend: IAutoMovieVector3;
  prepared: readonly IPress[];
  windows: readonly IWindow[];
}

/** The last authored contact active from this time onward, in seconds. */
interface IWindow {
  from: number;
  index: number;
}

/** Find the last begun approach; the first contact is the pre-approach default. */
function active(windows: readonly IWindow[], time: number): number {
  let low: number = 0;
  let high: number = windows.length;
  while (low < high) {
    const middle: number = (low + high) >>> 1;
    if (time >= windows[middle]!.from) low = middle + 1;
    else high = middle;
  }
  return low === 0 ? 0 : windows[low - 1]!.index;
}
