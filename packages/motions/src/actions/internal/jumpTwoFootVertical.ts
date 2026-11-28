import {
  AutoMovieEngineGravity,
  AutoMovieEngineKinematics,
  AutoMovieEngineMotionSampling,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionManner } from "../../compose/internal/motionManner";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { ballCourt } from "../../sport/internal/ballCourt";

const SIDES = ["left", "right"] as const;
const ARM_BONES = [
  "leftShoulder",
  "rightShoulder",
  "leftUpperArm",
  "rightUpperArm",
  "leftLowerArm",
  "rightLowerArm",
  "leftHand",
  "rightHand",
] as const satisfies readonly AutoMovieHumanoidBone[];

type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IVerticalContest>;
type Angles = IAutoMovieMotionHumanPosture["joints"];
type Posture = IAutoMovieMotionHumanPosture;

export const jumpTwoFootVertical: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanJump.IVerticalContest> =
  {
    name: "verticalContest",
    family: "jump",
    interrupts: {},
    plan(context) {
      const { body, entry, params } = context;
      const g = AutoMovieEngineGravity.STANDARD;
      if (!Number.isFinite(params.apex) || !(params.apex > 0))
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: "apex",
          value: params.apex,
          reason: "a vertical contest rises to a positive finite apex",
          fix: "give the centre-of-mass rise in metres",
        });

      if (
        !SIDES.every(
          (side) =>
            entry.feet[side].planted &&
            entry.supports.some(
              (each) =>
                each.part === `${side}Foot` &&
                each.support.kind === "ground" &&
                (each.support.height ?? 0) === 0,
            ),
        ) ||
        AutoMovieEngineVector3.length(entry.velocity.linear) > 0.02
      )
        throw supportRefusal(
          "both feet must support a nearly stationary body on the level floor",
          "enter from a settled, two-foot stand",
        );

      const hip = body.measure.hipHeight;
      const extension = 0.12 * hip;
      const raised = -0.008 * hip;
      const lowest = raised - extension;
      const tempo = motionManner(context, params.manner).tempo;
      const lower = 0.4 * tempo;
      const recover = 0.38 * tempo;
      const speed = Math.sqrt(2 * g * params.apex);
      // A quintic change of height has peak acceleration 10 / sqrt(3) times
      // the excursion divided by squared duration. Use the whole pelvis
      // excursion as a conservative bound before planning the lowering.
      if (!((6 * -lowest) / Math.min(lower, recover) ** 2 < g))
        throw supportRefusal(
          "the lowering and return need time to retain positive floor reaction",
          "use a slower manner for this two-foot contest",
        );

      const ground = makeGround(context);
      const leaving = ground.evaluate(raised, 1);
      const h = Math.min(1e-5, extension / 100);
      const response =
        (ground.evaluate(raised + h, 1).centre.y -
          ground.evaluate(raised - h, 1).centre.y) /
        (2 * h);
      const drive = (2 * extension * response) / speed;
      if (!Number.isFinite(drive) || !(drive > 0))
        throw supportRefusal(
          "the supported centre cannot continue upward from the drive endpoint",
          "enter with a flat, centred stance that can extend",
        );

      // Resolve the loaded bottom during placement too. The same fixed feet
      // remain the support constraints during the lowering and drive.
      ground.evaluate(lowest, 1);
      const takeoff = lower + drive;
      const flight = (2 * speed) / g;
      const touchdown = takeoff + flight;
      const absorbed = touchdown + drive;
      const duration = absorbed + recover;
      const share = (s: number): number => s / duration;
      const bearing = (
        side: AutoMovieHumanSide,
        from: number,
        to: number,
      ): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`,
        kind: "plant",
        from: share(from),
        to: share(to),
        support: { kind: "ground" },
        load: 0.5,
      });
      return {
        duration,
        events: [
          { name: "drive", share: share(lower) },
          { name: "takeoff", share: share(takeoff) },
          { name: "apex", share: share(takeoff + flight / 2) },
          { name: "touchdown", share: share(touchdown) },
          { name: "settled", share: share(absorbed) },
        ],
        contacts: [
          ...SIDES.map((side) => bearing(side, 0, takeoff)),
          ...SIDES.map((side) => bearing(side, touchdown, duration)),
        ],
        posture(seconds): Posture {
          if (seconds < lower) {
            const progress = AutoMovieEngineMotionSampling.minimumJerkShare(
              seconds / lower,
            );
            return ground.evaluate(lowest * progress, progress).posture;
          }
          if (seconds <= takeoff) {
            const progress = (seconds - lower) / drive;
            return ground.evaluate(lowest + extension * progress ** 2, 1)
              .posture;
          }
          if (seconds < touchdown) {
            const t = seconds - takeoff;
            return ground.posture(
              raised,
              1,
              leaving.offset,
              speed * t - (g * t * t) / 2,
            );
          }
          if (seconds < absorbed) {
            const remaining = (absorbed - seconds) / drive;
            return ground.evaluate(lowest + extension * remaining ** 2, 1)
              .posture;
          }
          const progress = AutoMovieEngineMotionSampling.minimumJerkShare(
            Math.min(1, (seconds - absorbed) / recover),
          );
          return ground.evaluate(lowest * (1 - progress), 1 - progress).posture;
        },
      };
    },
  };

/*
 * Fit both flat feet over one pelvis path. The current body supplies the
 * mass response and the stance supplies the same horizontal COM target for
 * compression, drive and absorption.
 */
function makeGround(context: Context) {
  const { body, entry } = context;
  const source = entry.posture;
  const base: Posture = { ...source, limbs: { ...source.limbs } };
  delete base.limbs.leftArm;
  delete base.limbs.rightArm;
  const frame = { origin: { x: 0, y: 0, z: 0 }, yaw: base.yaw };
  const forward = HumanFrame.point(frame, { x: 0, y: 0, z: 1 });
  const lateral = HumanFrame.point(frame, { x: 1, y: 0, z: 0 });
  const high = raisedArms(context);
  const ankles = entry.feet;
  const project = (point: IAutoMovieVector3): number =>
    AutoMovieEngineVector3.dot(point, forward);
  const centreSide =
    (AutoMovieEngineVector3.dot(ankles.left.ankle, lateral) +
      AutoMovieEngineVector3.dot(ankles.right.ankle, lateral)) /
    2;
  const heel = Math.min(
    ...SIDES.map((side) =>
      project(HumanFoot.point(body, side, "heel", ankles[side])),
    ),
  );
  const toe = Math.max(
    ...SIDES.map((side) =>
      project(HumanFoot.point(body, side, "mtp", ankles[side])),
    ),
  );

  function posture(
    height: number,
    raise: number,
    offset: number,
    air = 0,
  ): Posture {
    const joints: Angles = { ...base.joints };
    for (const name of ARM_BONES) {
      const previous = joints[name] ?? [0, 0, 0];
      const target = high[name] ?? previous;
      joints[name] = [
        previous[0] + (target[0] - previous[0]) * raise,
        previous[1] + (target[1] - previous[1]) * raise,
        previous[2] + (target[2] - previous[2]) * raise,
      ];
    }
    const root: IAutoMovieVector3 = {
      x: base.root.x + forward.x * offset,
      y: base.root.y + height + air,
      z: base.root.z + forward.z * offset,
    };
    const limbs: Posture["limbs"] = { ...base.limbs };
    for (const side of SIDES) {
      const foot = ankles[side];
      const point = { ...foot.ankle, y: foot.ankle.y + air };
      limbs[`${side}Leg`] = {
        point,
        rotation: foot.rotation,
        bend: AutoMovieEngineVector3.add(point, {
          x: forward.x * body.measure.hipHeight * 0.425,
          y: body.measure.hipHeight * 0.525,
          z: forward.z * body.measure.hipHeight * 0.425,
        }),
      };
    }
    return { ...base, root, joints, limbs };
  }

  const observe = (candidate: Posture) => {
    const bones = poseBones(body, resolveHumanPosture(body, candidate));
    return {
      centre: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
        body.massModel,
        bones,
      ),
      feet: [bones.get("leftFoot")!, bones.get("rightFoot")!],
    };
  };
  const neutral = observe(posture(0, 0, 0)).centre;
  const goal = project(neutral);
  if (
    !(goal > heel && goal < toe) ||
    Math.abs(AutoMovieEngineVector3.dot(neutral, lateral) - centreSide) > 1e-4
  )
    throw supportRefusal(
      "the standing centre falls outside the centred two-foot support region",
      "place a balanced stance with both feet on the floor",
    );

  function evaluate(height: number, raise: number) {
    let offset = 0;
    let previousOffset = 0;
    let previousMiss = 0;
    let candidate = posture(height, raise, offset);
    let read = observe(candidate);
    for (let step = 0; step < 10; ++step) {
      const miss = project(read.centre) - goal;
      if (Math.abs(miss) <= 1e-9) break;
      const slope =
        step === 0 ? 1 : (miss - previousMiss) / (offset - previousOffset);
      previousOffset = offset;
      previousMiss = miss;
      offset -= miss / slope;
      if (
        !Number.isFinite(offset) ||
        Math.abs(offset) > 0.13 * body.measure.hipHeight
      )
        throw supportRefusal(
          "the posture cannot keep the centre over the entered footprint",
          "use a flat stance with room for both knees to bend",
        );
      candidate = posture(height, raise, offset);
      read = observe(candidate);
    }
    const sideways =
      AutoMovieEngineVector3.dot(read.centre, lateral) - centreSide;
    if (
      Math.abs(project(read.centre) - goal) > 1e-8 ||
      Math.abs(sideways) > 1e-4 ||
      SIDES.some(
        (side, index) =>
          AutoMovieEngineVector3.distance(
            ankles[side].ankle,
            read.feet[index]!.worldPosition,
          ) > 1e-3,
      )
    )
      throw supportRefusal(
        "both fitted feet must hold their entered places under the centred body",
        "use a symmetric support stance with room for this bend",
      );
    return { posture: candidate, centre: read.centre, offset };
  }

  return { evaluate, posture };
}

/*
 * Reuse the stock court contest's fitted high hands in the entered body.
 * The flight carries this articulation with the body as one rigid shape.
 */
function raisedArms(context: Context): Angles {
  const guard = ballCourt(
    { ...context, params: { kind: "highHandContest" } },
    "highHandContest",
  );
  const peak = guard.events.find((event) => event.name === "stroke")!;
  const pose = resolveHumanPosture(
    context.body,
    guard.posture(peak.share * guard.duration),
  );
  const arms: Angles = {};
  for (const angle of pose.joints)
    if (ARM_BONES.some((bone) => angle.bone === bone))
      arms[angle.bone] = [
        angle.flexion ?? 0,
        angle.abduction ?? 0,
        angle.twist ?? 0,
      ];
  return arms;
}

function supportRefusal(
  reason: string,
  fix: string,
): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "base",
    axis: "base",
    value: null,
    reason,
    fix,
  });
}
