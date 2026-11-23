import { AutoMovieGravity, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Seconds the landing takes to absorb into the stand (provisional). */
const ABSORB: number = 0.4;

/** How deep the hips dip in the absorb, a share of the hip height (provisional: a soft landing's knee bend). */
const DIP: number = 0.18;

/**
 * Append a hang's release and drop to a plan that ends hanging: the body
 * keeps the hanging shape and falls freely until its lowest toe meets the
 * ground (`t = sqrt(2 h / g)`), then absorbs into the stand over `ABSORB`
 * with the hips dipping `DIP` and the stand's root on the toes' midpoint,
 * so the feet land under the stand they end in.
 *
 * @param context The action's context.
 * @param plan The plan ending in the hang.
 * @param ground The ground's height, world metres.
 * @returns The plan with the drop and landing appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fall, the touchdown, the absorb and how the feet stay put.
 * @evidence contracts/development/implementation.md#principled-implementation The free fall is closed form from the hang's displayed toes; the absorb eases from the touchdown posture to the stand on the landed feet.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the hang, time the fall, then one posture writer over the three phases with the events and contacts rescaled.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The landing is the stand's own posture; the absorb's constants are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two resolves at plan time; constant work per sample past the hang.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the hang's posture and the landing's constants.
 */
export function treeClimbDrop(
  context: IAutoMovieMotionHumanActionContext,
  plan: IAutoMovieMotionHumanActionPlan,
  ground: number,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const hang: IAutoMovieMotionHumanPosture = plan.posture(plan.duration);
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture.seeded(body, hang).pose,
  );
  const left: IAutoMovieVector3 = bones.get("leftToes")!.worldPosition;
  const right: IAutoMovieVector3 = bones.get("rightToes")!.worldPosition;
  const height: number = Math.max(0, Math.min(left.y, right.y) - ground);
  const g: number = AutoMovieGravity.STANDARD;
  const fall: number = Math.sqrt((2 * height) / g);
  const release: number = plan.duration;
  const touchdown: number = release + fall;
  const duration: number = touchdown + ABSORB;
  const landed: IAutoMovieMotionHumanPosture = {
    ...hang,
    root: { ...hang.root, y: hang.root.y - height },
  };
  const feet: IAutoMovieVector3 = {
    ...Vector3.lerp(left, right, 0.5),
    y: ground,
  };
  const end: IAutoMovieMotionHumanPosture = {
    ...stand.posture(body, feet, hang.yaw),
    limbs: {},
  };
  const scale = (share: number): number => (share * release) / duration;

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t <= release) return plan.posture(t);
    if (t <= touchdown) {
      const s: number = t - release;
      return {
        ...hang,
        root: { ...hang.root, y: hang.root.y - 0.5 * g * s * s },
      };
    }
    const w: number = minimumJerk.share((t - touchdown) / ABSORB);
    const dip: number = DIP * body.measure.hipHeight * Math.sin(Math.PI * w);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...end.joints };
    for (const bone of Object.keys(
      end.joints,
    ) as (keyof IAutoMovieMotionHumanPosture["joints"])[]) {
      const a: readonly [number, number, number] = landed.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = end.joints[bone]!;
      joints[bone] = [
        a[0] + (b[0] - a[0]) * w,
        a[1] + (b[1] - a[1]) * w,
        a[2] + (b[2] - a[2]) * w,
      ];
    }
    const root: IAutoMovieVector3 = Vector3.lerp(landed.root, end.root, w);
    return {
      ...end,
      root: { ...root, y: root.y - dip },
      pitch: landed.pitch + (end.pitch - landed.pitch) * w,
      roll: landed.roll + (end.roll - landed.roll) * w,
      joints,
    };
  };
  return {
    duration,
    events: [
      ...plan.events.map(
        (event: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
          ...event,
          share: scale(event.share),
        }),
      ),
      { name: "release", share: release / duration },
      { name: "touchdown", share: touchdown / duration },
    ],
    contacts: [
      ...plan.contacts.map(
        (
          window: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...window,
          from: scale(window.from),
          to: scale(window.to),
        }),
      ),
      {
        part: "leftFoot",
        kind: "plant",
        support: { kind: "ground" },
        from: touchdown / duration,
        to: 1,
      },
      {
        part: "rightFoot",
        kind: "plant",
        support: { kind: "ground" },
        from: touchdown / duration,
        to: 1,
      },
    ],
    base: { kind: "standing" },
    posture,
    yields: plan.yields ?? [],
  };
}
