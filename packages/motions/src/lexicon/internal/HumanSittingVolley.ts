import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSittingVolley,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { seated } from "../../everyday/internal/seated";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { humanSittingVolleyPhases } from "./humanSittingVolleyPhases";

/*
 * Arm sides used in the forearm platform.
 */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/*
 * The shares at the authored palm plant, release and receive.
 */
const PLANT: number = humanSittingVolleyPhases.PLANT;
const RELEASE: number = humanSittingVolleyPhases.RELEASE;
const RECEIVE: number = humanSittingVolleyPhases.RECEIVE;

/*
 * Maximum free scoot, in thigh lengths, and maximum trunk inclination, in
 * degrees.
 */
const SHIFT: number = 0.5;
const LEAN: number = 50;

/*
 * Forward wrist clearance from the pressing shoulder's shadow, in hand lengths.
 */
const PRESS_AHEAD: number = 0.5;

/*
 * Same-side clearance from the pressing shoulder's shadow, in hand lengths.
 */
const PRESS_OUT: number = 0.1;

/*
 * World-space wrist fit tolerance in metres.
 */
const FIT: number = 0.01;

/*
 * Ground and seated rest frame used to carry the low-body and recovered arm
 * goals.
 */
const ORIGIN: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/*
 * Shift a court-supported seat by pressing on one stationary palm, then release
 * the palm and bring both forearms to a receive platform. The torso support
 * remains on the court during play, as in World ParaVolley Rule 9.4.1, without
 * using the optional defensive lift. See
 * https://worldparavolley.org/wp-content/uploads/2025/03/2025-2028-WPV-Official-Sitting-Volleyball-Rules-English-v1-2025-03-18.pdf
 * and the measured seated displacement and balance protocol at
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC5747199/ . Phase shares, incline and
 * single-shift bounds are provisional staging choices. The receiving location
 * is independent of any ball outcome.
 */
export const HumanSittingVolley: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSittingVolley.ISittingVolley> =
  {
    name: "sittingVolley",
    interrupts: {
      any: [{ window: { start: "receive", end: 1 }, kind: "inertialize", entry: 0 }],
    },
    yields: ["head"],
    plan: planHumanSittingVolley,
  };
/*
 * Shift a court-supported seat by pressing on one stationary palm, then release
 * the palm and bring both forearms to a receive platform. The torso support
 * remains on the court during play, as in World ParaVolley Rule 9.4.1, without
 * using the optional defensive lift. See
 * https://worldparavolley.org/wp-content/uploads/2025/03/2025-2028-WPV-Official-Sitting-Volleyball-Rules-English-v1-2025-03-18.pdf
 * and the measured seated displacement and balance protocol at
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC5747199/ . Phase shares, incline and
 * single-shift bounds are provisional staging choices. The receiving location
 * is independent of any ball outcome.
 */
function planHumanSittingVolley(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSittingVolley.ISittingVolley>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const { hand, lateral, duration: seconds, target }: typeof params = params;
  HumanBound.above("duration", seconds, 0, "s");
  HumanBound.within(
    "lateral",
    lateral,
    -SHIFT * body.measure.thigh,
    SHIFT * body.measure.thigh,
    "m",
  );
  for (const coordinate of [target.x, target.y, target.z])
    HumanBound.above("target", coordinate, -Number.MAX_VALUE, "m");

  const low: IAutoMovieMotionHumanPosture = entry.posture;
  if (
    entry.base.kind !== "seated" ||
    entry.base.seat !== undefined ||
    !entry.supports.some(
      (support): boolean =>
        support.part === "seat" &&
        support.kind === "seat" &&
        support.support.kind === "ground",
    )
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: "base",
      value: entry.base.kind,
      feasible: { kind: "alternatives", values: ["seated"] },
      reason:
        "the sitting-volleyball shift starts with the pelvis supported by the court",
      fix: "establish a floor sitting posture first",
    });

  // The floor pose owns the ground contact. The seat socket is an
  // anatomical anchor rather than the lowest point of the seated mesh.
  const seatPoint: IAutoMovieVector3 = seated.socket(body, low);
  const heading: IAutoMovieQuaternion = HumanFrame.turn(low.yaw);
  const left: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
    x: 1,
    y: 0,
    z: 0,
  });
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
    x: 0,
    y: 0,
    z: 1,
  });
  const travel: IAutoMovieVector3 = Vector3.scale(left, lateral);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    entry.pose,
  );
  const palmFrame: ReturnType<typeof HumanHandTarget.prepareFrame> =
    HumanHandTarget.prepareFrame(
      body,
      hand,
      { x: 0, y: 1, z: 0 },
      { surface: "palm", shape: "flat", forward },
    );
  const handOffset: IAutoMovieVector3 = HumanHand.offset(
    body,
    hand,
    "palm",
    "flat",
  ).point;
  const flat: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
    hand,
    "flat",
  );
  const forearm: number = Vector3.length(
    Vector3.subtract(
      body.rest.get("leftHand")!,
      body.rest.get("leftLowerArm")!,
    ),
  );

  /*
   * Place the inclined torso and carry the floor-seated leg pose.
   */
  const torso = (
    moved: IAutoMovieVector3,
    reaching: number,
    platform: number,
  ): IAutoMovieMotionHumanPosture => {
    const bodyPose: IAutoMovieMotionHumanPosture = carryHumanPosture(
      low,
      ORIGIN,
      {
        ...ORIGIN,
        position: moved,
      },
    );
    const incline: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      bodyPose.joints,
      LEAN * (reaching + 0.4 * platform),
    );
    const tilted: IAutoMovieMotionHumanPosture = {
      ...bodyPose,
      pitch: low.pitch + incline.pitch,
      joints: incline.joints,
    };
    return {
      ...tilted,
      root: seated.root(body, Vector3.add(seatPoint, moved), tilted),
    };
  };

  // Read the pressing shoulder after the body inclines, at the middle
  // of its lateral travel. Set the wrist a little outboard to keep the
  // pressing arm clear of the torso as the weight moves past the palm.
  // The floor point also accounts for the actual palm-to-wrist offset.
  const pressing: IAutoMovieMotionHumanPosture = torso(
    Vector3.scale(travel, 0.5),
    1,
    0,
  );
  const shoulder: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, pressing),
  ).get(`${hand}UpperArm`)!.worldPosition;
  const wristAtOrigin: IAutoMovieVector3 = palmFrame(pressing).place(
    ORIGIN.position,
  ).point;
  const floorPoint: IAutoMovieVector3 = {
    ...Vector3.subtract(
      Vector3.add(
        shoulder,
        Vector3.add(
          Vector3.scale(forward, PRESS_AHEAD * body.measure.hand),
          Vector3.scale(
            left,
            (hand === "left" ? 1 : -1) * PRESS_OUT * body.measure.hand,
          ),
        ),
      ),
      wristAtOrigin,
    ),
    y: 0,
  };

  /*
   * Keep the seat socket on its original floor height while the trunk inclines.
   */
  const posture = (at: number): IAutoMovieMotionHumanPosture => {
    const share: number = Math.min(1, Math.max(0, at / seconds));
    if (share === 0) return low;
    const { moving, reaching, platform }: humanSittingVolleyPhases.IPhases =
      humanSittingVolleyPhases(share);
    const moved: IAutoMovieVector3 = Vector3.scale(travel, moving);
    const tilted: IAutoMovieMotionHumanPosture = torso(
      moved,
      reaching,
      platform,
    );
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...tilted.joints,
    };
    for (const bone of Object.keys(flat) as AutoMovieHumanoidBone[]) {
      const start: readonly [number, number, number] = joints[bone] ?? [
        0, 0, 0,
      ];
      const finish: readonly [number, number, number] = flat[bone]!;
      joints[bone] = [
        start[0] + (finish[0] - start[0]) * reaching,
        start[1] + (finish[1] - start[1]) * reaching,
        start[2] + (finish[2] - start[2]) * reaching,
      ];
    }
    const supported: IAutoMovieMotionHumanPosture = {
      ...tilted,
      joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...supported.limbs,
    };
    for (const side of SIDES) {
      const resting: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const restingPoint: IAutoMovieVector3 = Vector3.add(
        resting.worldPosition,
        moved,
      );
      const bend = AutoMovieMotionHumanBend.hang(body, supported, side, 0.2);
      if (side === hand && reaching > 0 && share <= RELEASE) {
        const wrist: ReturnType<ReturnType<typeof palmFrame>["place"]> =
          palmFrame(supported).place(floorPoint);
        const held: IAutoMovieHumanLimbGoal =
          AutoMovieMotionHumanArmTarget.fromWrist(wrist, bend, handOffset);
        const point: IAutoMovieVector3 = Vector3.lerp(
          restingPoint,
          held.point,
          reaching,
        );
        const rotation: IAutoMovieQuaternion = Quaternion.slerp(
          resting.worldRotation,
          wrist.rotation,
          reaching,
        );
        limbs[`${side}Arm`] = {
          ...held,
          point,
          rotation,
          bend: AutoMovieMotionHumanBend.solve({
            body,
            posture: supported,
            side,
            point,
            rotation,
            fallback: "hang",
          }),
          elbow: "placed",
          planted: share >= PLANT,
        };
        continue;
      }

      // Keep the wrists close and slightly beyond the platform, so the forearms meet before the hands.
      const split: number = side === "left" ? 1 : -1;
      const beyond: IAutoMovieVector3 = Vector3.add(
        target,
        Vector3.add(
          Vector3.scale(forward, 0.38 * forearm),
          Vector3.scale(left, split * 0.26 * body.measure.hand),
        ),
      );
      const platformRotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: forward,
        palm: Vector3.scale(left, -split),
      });
      const returningHand: boolean =
        side === hand && share > RELEASE && share < RECEIVE;
      const released:
        | ReturnType<ReturnType<typeof palmFrame>["place"]>
        | undefined = returningHand
        ? palmFrame(supported).place(floorPoint)
        : undefined;
      const point: IAutoMovieVector3 = Vector3.lerp(
        released?.point ?? restingPoint,
        beyond,
        platform,
      );
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        released?.rotation ?? resting.worldRotation,
        platformRotation,
        platform,
      );
      // Start release on the planted arm's bend solution, then yield to
      // the receive bend. Crossing the event cannot change the hint
      // while the hand is still at the floor target.
      const elbow: IAutoMovieVector3 =
        released === undefined
          ? bend
          : Vector3.lerp(
              AutoMovieMotionHumanBend.solve({
                body,
                posture: supported,
                side,
                point,
                rotation,
                fallback: "hang",
              }),
              bend,
              platform,
            );
      limbs[`${side}Arm`] = {
        point,
        rotation,
        bend: elbow,
        ...(released === undefined
          ? {}
          : { contact: handOffset, elbow: "placed" as const }),
        planted: false,
      };
    }
    return { ...supported, limbs };
  };

  // Measure the distinct wrist failures together so a floor placement
  // refusal cannot hide a second problem with the receive target.
  const misses: IPlanHumanSittingVolleyMissesItem[] = [];
  for (const [phase, when, sides] of [
    ["palm plant", PLANT, [hand]],
    ["palm push", (PLANT + RELEASE) / 2, [hand]],
    ["palm release", RELEASE, [hand]],
    ["forearm receive", RECEIVE, SIDES],
  ] as const) {
    const sample: IAutoMovieMotionHumanPosture = posture(when * seconds);
    const displayed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, resolveHumanPosture(body, sample));
    for (const side of sides) {
      const handBone: IAutoMovieResolvedBone = displayed.get(`${side}Hand`)!;
      const goal: IAutoMovieHumanLimbGoal = sample.limbs[`${side}Arm`]!;
      const gap: number = Vector3.distance(handBone.worldPosition, goal.point);
      if (!(gap <= FIT)) misses.push({ phase, side, gap });
    }
  }
  if (misses.length > 0)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: misses.some((miss): boolean => miss.phase !== "forearm receive")
        ? "lateral"
        : "target",
      value: Math.max(...misses.map((miss): number => miss.gap)),
      feasible: { kind: "range", minimum: 0, maximum: FIT, unit: "m" },
      reason: `the seated wrists miss their targets (${misses
        .map(
          (miss): string =>
            `${miss.side} ${miss.phase} ${(miss.gap * 1000).toFixed(1)} mm`,
        )
        .join(", ")})`,
      fix: "reduce the floor travel, use the nearer hand, or place the receive closer to the body",
    });

  return {
    duration: seconds,
    base: entry.base,
    events: [
      { name: "palmPlant", share: PLANT },
      { name: "palmRelease", share: RELEASE },
      { name: "receive", share: RECEIVE },
    ],
    contact: RECEIVE * seconds,
    contacts: [
      {
        part: "seat",
        kind: "seat",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: `${hand}Hand`,
        kind: "plant",
        from: PLANT,
        to: RELEASE,
        support: { kind: "ground" },
      },
    ],
    posture,
  };
}

/*
 * The record of `IPlanHumanSittingVolleyMissesItem`'s site.
 */
type IPlanHumanSittingVolleyMissesItem = {
  phase: string;
  side: AutoMovieHumanSide;
  gap: number;
};
