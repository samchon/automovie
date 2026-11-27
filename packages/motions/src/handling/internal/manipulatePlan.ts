import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { typeText } from "../../everyday/internal/typeText";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateReach } from "./manipulateReach";
import { manipulateShape } from "./manipulateShape";

/*
 * Prepare the keyed contacts once and evaluate only each hand's active press.
 * Wrist placement, digit shape, elbow hint and activation windows depend on the
 * immutable body, entry posture, contacts and skill interval of this plan. Each
 * posture still supplies fresh mutable joint, limb and digit records.
 * Parameter body: The performer whose measured digits place the wrist.
 * Parameter hold: The posture held throughout the sequence.
 * Parameter presses: Resolved contacts in authored order, with world points and
 * seconds.
 * Parameter span: The skill-derived press interval, seconds.
 * Parameter reach: The share of the interval spent approaching each contact.
 * Returns: The plan with its original press events and ground contacts.
 */
export function manipulatePlan(
  body: IAutoMovieMotionHumanBody,
  hold: IAutoMovieMotionHumanPosture,
  presses: readonly IAutoMovieMotionHumanManipulate.IPress[],
  span: number,
  reach: number,
): IAutoMovieMotionHumanActionPlan {
  // The act lasts to the latest press's lift, which with authored times need
  // not be the last one named.
  const duration: number =
    Math.max(
      ...presses.map(
        (press: IAutoMovieMotionHumanManipulate.IPress): number => press.time,
      ),
    ) +
    reach * span;
  const hands: IHand[] = [];
  for (const side of ["left", "right"] as const) {
    const mine: IAutoMovieMotionHumanManipulate.IPress[] = presses.filter(
      (press: IAutoMovieMotionHumanManipulate.IPress): boolean =>
        press.side === side,
    );
    if (mine.length === 0) continue;
    const rotation: IAutoMovieQuaternion = manipulateFacing(
      hold,
      presses,
      side,
    );
    const reachAt: ReturnType<typeof manipulateReach.prepare> =
      manipulateReach.prepare(
        body,
        side,
        rotation,
        mine.map(
          (press): IAutoMovieMotionHumanManipulate.Finger => press.digit,
        ),
      );
    const handBone: AutoMovieHumanoidBone = `${side}Hand`;
    const bones: ReadonlySet<AutoMovieHumanoidBone> = new Set([handBone]);
    const handFrame: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      bones,
    );
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      hold,
      side,
      0.1,
    );
    const prepared: IPress[] = mine.map(
      (press: IAutoMovieMotionHumanManipulate.IPress): IPress => {
        const wrist: IAutoMovieVector3 = reachAt(
          press.digit,
          press.site,
          press.normal,
          press.depth,
        );
        const contact: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(rotation),
          Vector3.subtract(
            Vector3.addScaled(press.site, press.normal, -press.depth),
            wrist,
          ),
        );
        const goal: IAutoMovieHumanLimbGoal = {
          point: wrist,
          rotation,
          bend,
          elbow: "strain",
          contact,
        };
        const posed: IAutoMovieMotionHumanPosture = {
          ...hold,
          limbs: { ...hold.limbs, [`${side}Arm`]: goal },
        };
        const achieved: IAutoMovieResolvedBone = handFrame(
          resolveHumanPosture.seeded(
            body,
            posed,
            undefined,
            {},
            undefined,
            bones,
          ).pose,
        ).get(handBone)!;
        const shape: ReturnType<typeof manipulateShape> = manipulateShape(
          body,
          side,
          press.digit,
          achieved.worldPosition,
          achieved.worldRotation,
          press.site,
          press.normal,
        );
        return {
          press,
          ...shape,
          digit:
            `${side}${press.digit[0]!.toUpperCase()}${press.digit.slice(1)}` as AutoMovieHumanDigit,
          wrist,
          contact,
        };
      },
    );
    const windows: IWindow[] = mine
      .map(
        (
          press: IAutoMovieMotionHumanManipulate.IPress,
          index: number,
        ): IWindow => ({
          from: press.time - reach * span,
          index,
        }),
      );
    windows.sort((a: IWindow, b: IWindow): number => a.from - b.from);
    let latest: number = 0;
    for (const window of windows) {
      latest = Math.max(latest, window.index);
      window.index = latest;
    }
    hands.push({ side, rotation, prepared, windows, bend });
  }
  const contacts: IAutoMovieMotionHumanContactWindow[] = (
    ["leftFoot", "rightFoot"] as const
  ).map(
    (part: ManipulatePlanContactsPart): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    }),
  );
  return {
    duration,
    events: presses.map(
      (
        press: IAutoMovieMotionHumanManipulate.IPress,
        index: number,
      ): IAutoMovieMotionHumanActionPlan["events"][number] => ({
        name: `press${index + 1}`,
        share: press.time / duration,
      }),
    ),
    contacts,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const time: number = Math.min(duration, Math.max(0, seconds));
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...hold.joints };
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...hold.limbs };
      const digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]> = {};
      for (const hand of hands) {
        const index: number = active(hand.windows, time);
        const current: IPress = hand.prepared[index]!;
        const previous: IPress = hand.prepared[Math.max(0, index - 1)]!;
        const press: IAutoMovieMotionHumanManipulate.IPress = current.press;
        Object.assign(joints, current.joints);
        Object.assign(digits, current.avoid);
        const approach: number = AutoMovieEngineMotionSampling.minimumJerkShare(
          Math.min(
            1,
            Math.max(0, (time - (press.time - reach * span)) / (reach * span)),
          ),
        );
        limbs[`${hand.side}Arm`] = {
          point: Vector3.lerp(previous.wrist, current.wrist, approach),
          rotation: hand.rotation,
          bend: hand.bend,
          elbow: "strain",
          contact: current.contact,
        };
        const down: number =
          time < press.time
            ? approach * approach
            : 1 -
              AutoMovieEngineMotionSampling.minimumJerkShare(
                Math.min(1, (time - press.time) / ((1 - reach) * span)),
              );
        const lift: number =
          typeText.HOVER - (typeText.HOVER + press.depth) * down;
        digits[current.digit] = {
          point: Vector3.add(press.site, Vector3.scale(press.normal, lift)),
          normal: press.normal,
          surface: "tip",
          contact: lift <= 0,
        };
      }
      return { ...hold, joints, limbs, digits };
    },
  };
}

/*
 * The alternatives of `ManipulatePlanContactsPart`'s site.
 */
type ManipulatePlanContactsPart = "leftFoot" | "rightFoot";

/*
 * One immutable contact's placement and hand shape.
 */
interface IPress {
  press: IAutoMovieMotionHumanManipulate.IPress;
  wrist: IAutoMovieVector3;
  /*
   * Wrist-local pressed tip used to preserve contact when wrist rotation is
   * limited.
   */
  contact: IAutoMovieVector3;
  joints: IAutoMovieMotionHumanPosture["joints"];
  avoid: NonNullable<IAutoMovieMotionHumanPosture["digits"]>;
  digit: AutoMovieHumanDigit;
}

/*
 * A hand's contact windows and geometry, owned by its sequence plan.
 */
interface IHand {
  side: AutoMovieHumanSide;
  rotation: IAutoMovieQuaternion;
  bend: IAutoMovieVector3;
  prepared: readonly IPress[];
  windows: readonly IWindow[];
}

/*
 * The last authored contact active from this time onward, in seconds.
 */
interface IWindow {
  from: number;
  index: number;
}

/*
 * Find the last begun approach; the first contact is the pre-approach default.
 */
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
