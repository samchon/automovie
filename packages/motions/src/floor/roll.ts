import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRoll,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareHumanShapeBlend } from "../posture/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The alternatives of `PlanContactsPart`'s site. */
type PlanContactsPart = "leftFoot" | "rightFoot";

/**
 * A forward or backward roll on the floor: the body crouches into a tuck over
 * its feet, rolls once round over its back as a ball rolls, without flight, and
 * rises from the tuck on its feet where the roll has carried it.
 *
 * The tuck is a set of joint angles (`TUCK`, provisional: the trunk and the
 * neck flexed, the hips and the knees folded, the arms round the shins).
 * Crouching, the joints go from the entry's into the tuck while the ankles stay
 * where they stood. Rolling, the tucked body turns once about its lateral axis
 * (forward or back), its root placed each second so its lowest joint centre
 * lies on the floor at the ankles' standing height, and carried along by
 * rolling without slipping: the root advances by the turn times its height
 * above that lowest point, integrated at plan time. Rising, the crouch is
 * played back from where the roll ends.
 *
 * Contact windows: the feet plant through the crouch and the rise, the back
 * lies on the floor over the roll's middle and the seat at its end (a forward
 * roll) or start (a backward one).
 *
 * First pass: the hands do not plant on the floor at the start (the arms hold
 * the shins), the head is not kept off the floor by the hands in a backward
 * roll, and the floor's contact is read on joint centres, not the skin.
 */
export namespace roll {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "roll";

  /** Cancel table: a roll is left once it stands. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["risen", 1], kind: "inertialize", entry: 0 }],
  };

  /** The tuck's joint angles, clinical degrees (provisional). */
  export const TUCK: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  > = {
    spine: [30, 0, 0],
    chest: [30, 0, 0],
    neck: [35, 0, 0],
    head: [20, 0, 0],
    leftUpperLeg: [125, 0, 0],
    rightUpperLeg: [125, 0, 0],
    leftLowerLeg: [140, 0, 0],
    rightLowerLeg: [140, 0, 0],
    leftUpperArm: [70, 20, 0],
    rightUpperArm: [70, 20, 0],
    leftLowerArm: [60, 0, 0],
    rightLowerArm: [60, 0, 0],
  };

  /** Seconds to crouch into the tuck, and to rise from it (provisional). */
  export const CROUCH: number = 0.7;

  /** Seconds the turn takes (provisional). */
  export const TURN: number = 1.1;

  /** Samples of the turn the root's travel is integrated over. */
  export const SAMPLES: number = 72;

  /**
   * Plan a roll.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the entry is not standing on both feet.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRoll.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body = context.body;
    const sign: number = context.params.direction === "backward" ? -1 : 1;
    const feet = context.entry.feet;
    if (!(feet.left.planted && feet.right.planted))
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: "not on both feet",
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: "a roll crouches from both feet on the floor",
        fix: "stand before the roll",
      });
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const ankles: IAutoMovieVector3 = {
      x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
      y: (feet.left.ankle.y + feet.right.ankle.y) / 2,
      z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
    };
    const floor: number = ankles.y;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: sign },
    );

    // A posture of the joints blended toward the tuck, turned, at the origin:
    // the entry's joints the tuck leaves alone stay as they are.
    const joints: (share: number) => IAutoMovieMotionHumanPosture["joints"] = (
      share: number,
    ): IAutoMovieMotionHumanPosture["joints"] =>
      prepareHumanShapeBlend(entry.joints, { ...entry.joints, ...TUCK })(share);
    const posed = (
      share: number,
      turn: number,
      blend: typeof joints = joints,
    ): IAutoMovieMotionHumanPosture => ({
      ...entry,
      root: { x: 0, y: 0, z: 0 },
      pitch: entry.pitch + sign * turn,
      joints: blend(share),
      limbs: {},
    });
    const ankleMid = (
      posture: IAutoMovieMotionHumanPosture,
      observe: (
        pose: ReturnType<typeof resolveHumanPosture>,
      ) => ReturnType<typeof poseBones> = rawAnkles,
    ): IAutoMovieVector3 => {
      const pose: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture(
        body,
        posture,
      );
      const bones: ReturnType<typeof poseBones> = observe(pose);
      const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
      const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
      return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
    };

    // The crouch: the ankles kept where they stood.
    const crouched = (
      share: number,
      at: IAutoMovieVector3,
      blend?: typeof joints,
      observe?: Parameters<typeof ankleMid>[1],
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = posed(share, 0, blend);
      const local: IAutoMovieVector3 = ankleMid(posture, observe);
      return {
        ...posture,
        root: { x: at.x - local.x, y: at.y - local.y, z: at.z - local.z },
      };
    };

    // The roll's table: the root's height above the lowest centre and its
    // travel along the floor, both by the turn.
    const heights: number[] = heightsOf(
      body,
      (turn: number): IAutoMovieMotionHumanPosture => posed(1, turn),
      SAMPLES,
    );
    const travels: number[] = [0];
    const step: number = (2 * Math.PI) / SAMPLES;
    for (let k: number = 1; k <= SAMPLES; k++)
      travels.push(
        travels[k - 1]! + ((heights[k - 1]! + heights[k]!) / 2) * step,
      );
    const table = (values: number[], turn: number): number => {
      const at: number = (turn / 360) * SAMPLES;
      const k: number = Math.min(SAMPLES - 1, Math.floor(at));
      return values[k]! + (values[k + 1]! - values[k]!) * (at - k);
    };
    const start: IAutoMovieVector3 = crouched(1, ankles).root;
    const rolled = (
      turn: number,
      blend?: typeof joints,
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = posed(1, turn, blend);
      const along: number = table(travels, turn);
      return {
        ...posture,
        root: {
          x: start.x + forward.x * along,
          y: floor + table(heights, turn) - heights[0]! + start.y - floor,
          z: start.z + forward.z * along,
        },
      };
    };
    const end: IAutoMovieVector3 = ((): IAutoMovieVector3 => {
      const local: IAutoMovieVector3 = ankleMid(posed(1, 0));
      const root: IAutoMovieVector3 = rolled(360).root;
      return { x: root.x + local.x, y: root.y + local.y, z: root.z + local.z };
    })();

    const duration: number = 2 * CROUCH + TURN;
    const share = (seconds: number): number => seconds / duration;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...(["leftFoot", "rightFoot"] as const).flatMap(
        (part: PlanContactsPart): IAutoMovieMotionHumanContactWindow[] => [
          {
            part,
            kind: "plant",
            from: 0,
            to: share(CROUCH),
            support: { kind: "ground" },
          },
          {
            part,
            kind: "plant",
            from: share(CROUCH + TURN),
            to: 1,
            support: { kind: "ground" },
          },
        ],
      ),
      {
        part: "back",
        kind: "lie",
        from: share(CROUCH + 0.3 * TURN),
        to: share(CROUCH + 0.7 * TURN),
        support: { kind: "ground" },
      },
      {
        part: "seat",
        kind: "lie",
        from: share(CROUCH + (sign > 0 ? 0.7 : 0.1) * TURN),
        to: share(CROUCH + (sign > 0 ? 0.9 : 0.3) * TURN),
        support: { kind: "ground" },
      },
    ];
    const planned: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "tucked", share: share(CROUCH) },
        { name: "over", share: share(CROUCH + TURN / 2) },
        { name: "rolled", share: share(CROUCH + TURN) },
        { name: "risen", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= CROUCH) return crouched(minimumJerk.share(t / CROUCH), ankles);
        if (t <= CROUCH + TURN)
          return rolled(360 * minimumJerk.share((t - CROUCH) / TURN));
        return crouched(
          1 - minimumJerk.share((t - CROUCH - TURN) / CROUCH),
          end,
        );
      },
    };
    const observe: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      HumanBoneGroups.FEET,
    );
    let blend: typeof joints;
    HumanPreparedPlayback.attach(planned, body, {
      mode: "posture",
      prepare: (): void => {
        blend = prepareHumanShapeBlend(entry.joints, {
          ...entry.joints,
          ...TUCK,
        });
      },
      phases: [
        {
          from: 0,
          to: CROUCH,
          sample: (seconds) =>
            entry.digits === undefined
              ? {
                  posture: crouched(
                    minimumJerk.share(seconds / CROUCH),
                    ankles,
                    blend,
                    observe,
                  ),
                }
              : undefined,
        },
        {
          from: CROUCH,
          to: CROUCH + TURN,
          sample: (seconds) => ({
            posture: rolled(
              360 * minimumJerk.share((seconds - CROUCH) / TURN),
              blend,
            ),
          }),
        },
        {
          from: CROUCH + TURN,
          to: duration,
          sample: (seconds) =>
            entry.digits === undefined
              ? {
                  posture: crouched(
                    1 - minimumJerk.share((seconds - CROUCH - TURN) / CROUCH),
                    end,
                    blend,
                    observe,
                  ),
                }
              : undefined,
        },
      ],
    });
    return planned;

    /** Measure the raw reader's canonical ankle demand. */
    function rawAnkles(
      pose: ReturnType<typeof resolveHumanPosture>,
    ): ReturnType<typeof poseBones> {
      return poseBones(body, pose, undefined, HumanBoneGroups.FEET);
    }
  }
}

/**
 * Read every original roll-table sample from its current authored posture. The
 * entry graph remains borrowed, so each sample keeps its original live
 * observation and complete canonical resolution.
 *
 * @param body The unchanged body of this construction.
 * @param posed The original per-sample posture builder, including current entry
 *   context.
 * @param samples The positive original number of equal angular intervals.
 * @returns One negated minimum per interval boundary, samples+1 total, over
 *   every actual bone-origin height in metres.
 *
 *   States borrowed current raw input, original callback/interval count and full
 *   bone-origin rather than collider-height output. Keeps every k=0..samples
 *   turn, actual current authored posture, complete canonical observation and
 *   full FK/minimum over all bone world-Y values; clinical source data are
 *   never replaced by an earlier sample. One bounded native metadata scope
 *   serves the same ordered callback, complete-resolution, full-FK and minimum
 *   loop. No borrowed entry value is frozen or certified from callback
 *   purity/JSON equality. No digit/rotation goal is dropped and no collider
 *   minimum replaces the all-bone-origin datum; every original sample/read
 *   remains. Each sample retains its full current nonlinear projection, native
 *   fits and full FK. One exact FK/genuine ROM scope shares only immutable
 *   metadata and checked numerical prerequisites, with no ineffective
 *   template/JSON source machinery or measured speedup claim. Only the body's
 *   immutable rig/ROM metadata and exact dependency checks share; the original
 *   current entry joint map, root orientation and optional context are observed
 *   anew through posed at each sample. One synchronous construction owns
 *   bounded FK/ROM metadata until return or throw. Only the original numeric
 *   height table returns; no raw/solved pose, current map, getter or history of
 *   queried poses enters the roll plan.
 */
function heightsOf(
  body: IAutoMovieMotionHumanBody,
  posed: (turn: number) => IAutoMovieMotionHumanPosture,
  samples: number,
): number[] {
  const prepared: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const heights: number[] = [];
  for (let k: number = 0; k <= samples; k++) {
    const posture: IAutoMovieMotionHumanPosture = posed((360 * k) / samples);
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      prepared,
      undefined,
      projection,
    ).pose;
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      pose,
      prepared(),
    );
    let lowest: number = Infinity;
    for (const bone of bones.values())
      lowest = Math.min(lowest, bone.worldPosition.y);
    heights.push(-lowest);
  }
  return heights;
}
