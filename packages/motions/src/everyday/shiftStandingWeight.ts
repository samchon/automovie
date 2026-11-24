import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanShiftStandingWeight,
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
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { shiftStandingWeightSteps } from "./shiftStandingWeightSteps";


/**
 * An intentional lateral pelvis shift with both feet planted on the ground.
 * Time to shift, time to hold, and optional time to return are authored
 * independently. The respective transition events are shifted, release and
 * returned, with the last two present only on a return.
 *
 * A force-plate study of prolonged standing observed spontaneous lateral shifts
 * with both feet on the ground (https://stacks.cdc.gov/view/cdc/224979).
 * Center-of-pressure shifts (https://pubmed.ncbi.nlm.nih.gov/9924098/) reflect
 * force distribution. The law takes an authored pelvis distance and checks the
 * fitted body's static center-of-mass margin at entry, midway and at the held
 * displacement. The default transfer time of 0.8 s is provisional. This law
 * models kinematic staging and leaves individual foot loads and dynamics
 * unspecified.
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
 * @throws {HumanRefusal} For invalid parameters, an unsupported entry or
 *   failure to fit the path witnesses.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanShiftStandingWeight>,
): IAutoMovieMotionHumanActionPlan {
  const {
    by,
    duration: seconds = 0.8,
    hold = 0,
    returnSeconds,
  }: IAutoMovieMotionHumanShiftStandingWeight = context.params;
  HumanBound.above("by", Math.abs(by), 0, "m");
  HumanBound.above("duration", seconds, 0, "s");
  HumanBound.least("hold", hold, 0, "s");
  if (returnSeconds !== undefined)
    HumanBound.above("returnSeconds", returnSeconds, 0, "s");
  const duration: number = seconds + hold + (returnSeconds ?? 0);
  HumanBound.above("duration", duration, 0, "s");

  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  if (
    entry.base.kind !== "standing" ||
    !(["left", "right"] as const).every((side: AutoMovieHumanSide): boolean => {
      const leg: IAutoMovieHumanLimbGoal | undefined =
        entry.posture.limbs[side === "left" ? "leftLeg" : "rightLeg"];
      return (
        entry.feet[side].planted &&
        leg?.planted === true &&
        leg.on === undefined &&
        HumanSupportFrame.contact(
          context,
          side === "left" ? "leftFoot" : "rightFoot",
        ).kind === "ground"
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
    if (
      HumanBalance.margin(context.body, posture) >= 0 &&
      shiftStandingWeightSteps.plants(bones.get("leftFoot")!, entry.feet.left) &&
      shiftStandingWeightSteps.plants(bones.get("rightFoot")!, entry.feet.right)
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

  const instants: IAutoMovieMotionClockInstant[] =
    shiftStandingWeightSteps.instants(seconds, hold, returnSeconds);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, instants);
  return composeAutoMovieMotionHumanAction({
    clock,
    base: AutoMovieMotionHumanBase.still(
      duration,
      entry.posture,
      AutoMovieMotionHumanBase.plants(),
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
}
