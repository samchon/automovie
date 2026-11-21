import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanShiftStandingWeight,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { prepareHumanFootHull } from "../posture/prepareHumanFootHull";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";

/** Maximum ankle drift from the displayed plant at a fit witness, metres. */
const PLANT_DISTANCE: number = 0.003;

/** Minimum absolute unit-quaternion dot product for 0.5 degrees of foot turn. */
const PLANT_TURN: number = Math.cos(Math.PI / 720);

/** Signed real sole clearance for the declared two-region support, metres. */
const FLOOR_CONTACT: number = 0.0002;

/**
 * An intentional lateral pelvis shift with both feet planted on the ground.
 * Time to shift, time to hold, and optional time to return are authored
 * independently. The respective transition events are shifted, release and
 * returned, with the last two present only on a return.
 *
 * A force-plate study of prolonged standing observed spontaneous lateral
 * shifts with both feet on the ground (https://stacks.cdc.gov/view/cdc/224979).
 * Center-of-pressure shifts (https://pubmed.ncbi.nlm.nih.gov/9924098/) reflect
 * force distribution. The law takes an authored pelvis distance and checks
 * the fitted body's static center-of-mass margin at entry, midway and at the
 * held displacement.
 * The default transfer time of 0.8 s is provisional. This law models
 * kinematic staging and leaves individual foot loads and dynamics unspecified.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the required support, author-controlled distance and events, and distinguishes published measurements from the authored motion.
 * @evidence contracts/development/design.md#principled-representation Moves the existing root channel while retaining the entry leg goals and both ground plants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The action law and its contract expose only amplitude and phase times.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps the entry foot goals and their refusal conditions. Both declared planes must have real heel and forefoot witnesses before the margin reads their hull.
 */
export const shiftStandingWeight: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanShiftStandingWeight> =
  {
    name: "shiftStandingWeight",
    interrupts: {
      any: [{ window: ["shifted", 1], kind: "inertialize", entry: 0 }],
    },
    yields: [
      "head",
      "leftHand",
      "rightHand",
      "leftArm",
      "rightArm",
      "trunkTurn",
    ],
    plan,
  };

/**
 * Plan the authored shift from a standing entry, checking both plants and
 * static balance at its endpoints and one interior witness.
 *
 * @param context Body, action parameters and entry state.
 * @returns The fixed-foot plan.
 * @throws {HumanRefusal} For invalid parameters, an unsupported entry or failure to fit the path witnesses.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanShiftStandingWeight>,
): IAutoMovieMotionHumanActionPlan {
  const {
    by,
    seconds = 0.8,
    hold = 0,
    returnSeconds,
  }: IAutoMovieMotionHumanShiftStandingWeight = context.params;
  HumanBound.above("by", Math.abs(by), 0, "m");
  HumanBound.above("seconds", seconds, 0, "s");
  HumanBound.least("hold", hold, 0, "s");
  if (returnSeconds !== undefined)
    HumanBound.above("returnSeconds", returnSeconds, 0, "s");
  const duration: number = seconds + hold + (returnSeconds ?? 0);
  HumanBound.above("duration", duration, 0, "s");

  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  const sides: readonly ["left", "right"] = ["left", "right"];
  const planes: IAutoMovieMotionHumanContactWindow.Support[] = sides.map(
    (side: "left" | "right"): IAutoMovieMotionHumanContactWindow.Support =>
      HumanSupportFrame.contact(
        context,
        side === "left" ? "leftFoot" : "rightFoot",
      ),
  );
  if (
    entry.base.kind !== "standing" ||
    !sides.every((side: "left" | "right"): boolean => {
      const leg: IAutoMovieHumanLimbGoal | undefined =
        entry.posture.limbs[side === "left" ? "leftLeg" : "rightLeg"];
      return (
        entry.feet[side].planted &&
        leg?.planted === true &&
        leg.on === undefined &&
        planes[side === "left" ? 0 : 1]!.kind === "ground"
      );
    })
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entry.base.kind,
      feasible: { kind: "alternatives", values: ["standing on both feet"] },
      reason:
        "a planted weight shift requires both feet to be planted on the ground",
      fix: "establish a standing pose on both feet before shifting",
    });

  const hulls: ReturnType<typeof prepareHumanFootHull>[] = sides.map(
    (side: "left" | "right"): ReturnType<typeof prepareHumanFootHull> =>
      prepareHumanFootHull(context.body, side),
  );
  let useActualSole: boolean | undefined;
  const shifted: IAutoMovieVector3 = { x: by, y: 0, z: 0 };
  // The entry pose is already solved. The return retraces the outward path.
  for (const share of [0, 0.5, 1]) {
    const posture: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanRoot.place(
        entry.posture,
        AutoMovieMotionHumanRoot.scale({ point: shifted, yaw: 0 }, share),
      );
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      share === 0 ? entry.pose : resolveHumanPosture(context.body, posture),
    );
    const base: IAutoMovieVector3[] | undefined =
      useActualSole === false ? undefined : actualBase(bones);
    useActualSole ??= base !== undefined;
    const margin: number = useActualSole
      ? base === undefined
        ? -Infinity
        : resolveAutoMovieCenterOfMass.margin(
            resolveAutoMovieCenterOfMass.place(context.body.massModel, bones),
            base,
          )
      : HumanBalance.margin(context.body, posture);
    if (
      margin >= 0 &&
      keepsPlant(bones.get("leftFoot")!, entry.feet.left) &&
      keepsPlant(bones.get("rightFoot")!, entry.feet.right)
    )
      continue;
    throw new HumanRefusal({
      kind: "parameter",
      axis: "by",
      value: by,
      reason:
        "the lateral shift exceeds the entry stance's planted reach or static support",
      fix: "reduce the lateral distance or establish a stance that admits it",
    });
  }

  const instants: IAutoMovieMotionClockInstant[] = [
    { name: "shifted", seconds },
  ];
  if (returnSeconds !== undefined)
    instants.push(
      { name: "release", seconds: seconds + hold },
      { name: "returned", seconds: duration },
    );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
    duration,
    instants,
  );
  return composeAutoMovieMotionHumanAction({
    clock,
    base: AutoMovieMotionHumanBase.still(
      duration,
      entry.posture,
      AutoMovieMotionHumanBase.plants().map(
        (
          plant: IAutoMovieMotionHumanContactWindow,
          index: number,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...plant,
          support: planes[index]!,
        }),
      ),
    ),
    primitives: [
      returnSeconds === undefined
        ? AutoMovieMotionHumanRoot.shift(clock, ["start", "shifted"], shifted)
        : AutoMovieMotionHumanRoot.excursion(
            clock,
            ["start", "shifted"],
            ["release", "returned"],
            { point: shifted, yaw: 0 },
          ),
    ],
  });

  /** Read real bearing vertices on each foot's inherited ground plane. */
  function actualBase(
    bones: ReturnType<typeof poseBones>,
  ): IAutoMovieVector3[] | undefined {
    const base: IAutoMovieVector3[] = [];
    for (const [i, points] of hulls.entries()) {
      const support: IAutoMovieMotionHumanContactWindow.Support = planes[i]!;
      if (!points || support.kind !== "ground") return undefined;
      const floor: number = support.height ?? 0;
      let heel: boolean = false;
      let forefoot: boolean = false;
      for (const vertex of points) {
        const carrier: IAutoMovieResolvedBone = bones.get(vertex.bone)!;
        const point: IAutoMovieVector3 = Vector3.add(
          carrier.worldPosition,
          Quaternion.rotateVector(carrier.worldRotation, vertex.local),
        );
        const gap: number = point.y - floor;
        if (gap < -FLOOR_CONTACT) return undefined;
        if (gap > FLOOR_CONTACT) continue;
        base.push(point);
        heel ||= vertex.region === "heel";
        forefoot ||= vertex.region === "forefoot";
      }
      if (!heel || !forefoot) return undefined;
    }
    return base;
  }
}

/** Whether the solved ankle and foot rotation stay within the plant tolerance. */
function keepsPlant(
  bone: IAutoMovieResolvedBone,
  entry: IAutoMovieMotionHumanEntryState.IFoot,
): boolean {
  const a: IAutoMovieQuaternion = bone.worldRotation;
  const b: IAutoMovieQuaternion = entry.rotation;
  return (
    Vector3.length(Vector3.subtract(bone.worldPosition, entry.ankle)) <=
      PLANT_DISTANCE &&
    Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w) >= PLANT_TURN
  );
}
