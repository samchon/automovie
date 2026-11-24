import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
} from "@automovie/interface";
import { HumanChain, HumanRefusal, HumanVerdicts } from "@automovie/motions";
import {
  AutoMovieMotionHumanRange,
  HumanPhysics,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionCrouchSignature } from "../../../features/internal/motionCrouchSignature";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { motionHumanSignature as M } from "../../../features/internal/motionHumanSignature";

/**
 * The three bend strategies have distinct motions of the knees, trunk and pelvis.
 * The paths through each strategy keep their contact, timing, skin and joint
 * constraints from lowering through return, including both acting sides.
 *
 * Scenarios:
 * 1. A stoop keeps knee flexion at most 30° and inclines the trunk at least 45°. The hips move back relative to the entrance posture.
 * 2. A squat bends the knees at least 90° with a more upright trunk. The semi-squat's flexion is between the two.
 * 3. Both feet still bear at the deepest point of each bend, and the law's unrequested balance stays outside the audit.
 * 4. Quiet stance on the same bodies inclines no more than 3° from vertical (Kendall et al. 2005).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each direction and threshold at the decisive event and the two support conditions.
 * @evidence contracts/development/testing.md#behavioral-verification Performs each strategy and reads displayed knees, hips, trunk and foot support. Tipping the stoop forward at the hips or giving all strategies the same knee angle fails.
 * @evidence contracts/development/testing.md#independent-expectations The provisional angle gates follow Burgess-Limerick's lifting-posture classification (2003, doi:10.1016/S0169-8141(02)00190-7). Posterior hip translation follows Kim and Yoo's independent observation (2018, doi:10.1589/jpts.30.534); the paper supports the direction without claiming an exact displacement for a different body or task.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares explicit strategies on one large body and checks the left semi-squat on both body sizes; the default selector is exercised separately.
 * @evidence contracts/development/testing.md#execution-ownership Each bend is constructed directly from the selected side and a target height relative to the ankle. Each admitted performance supplies its own quiet reference and physical verdict.
 */
export function test_motion_stance_bend_strategy(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  checkCrouch(complaints);
  const observe = (
    row: IAutoMovieMotionHumanBend.Strategy,
    name: motionHumanBody.Name,
    side: AutoMovieHumanSide = "right",
  ) => {
    const body = motionHumanBody(name),
      ankle = body.measure.ankleHeight;
    const height =
      row === "squat"
        ? 0
        : ankle + (row === "semiSquat" ? 0.2 : 0.6) * body.measure.shank;
    const chain = HumanChain.subject("a").bend({
      target: {
        kind: "point",
        frame: "world",
        at: {
          x: side === "left" ? 0.15 : -0.15,
          y: height,
          z: row === "squat" || row === "semiSquat" ? 0.3 : 0.45,
        },
      },
      hand: side,
      ...(row === "auto" ? {} : { strategy: row }),
    });
    const bend: M.IStaged = {
      body,
      yaw: 0,
      film: motionHumanLaw.perform("bend", [{ subject: "a", body }], chain),
    };
    const deepest = M.event(bend, "deepest");
    if (deepest === undefined) throw new Error(row + " lacks deepest event.");
    complaints.check(
      row + " starts upright",
      Math.abs(M.trunk(bend, 0)) <= M.STANCE,
    );
    complaints.check(
      row + " bears on both feet",
      M.bears(bend, deepest, "left") && M.bears(bend, deepest, "right"),
    );
    complaints.check(
      row + " leaves unrequested balance unjudged",
      !bend.film.segments("a").some((span) => HumanPhysics.judged(span)),
    );
    const verdict = HumanVerdicts.of(bend.film.performance);
    if (!verdict.clean)
      complaints.list.push(row + ": " + HumanVerdicts.describe(verdict));
    return {
      knee:
        (M.knee(bend, deepest, "left") + M.knee(bend, deepest, "right")) / 2,
      trunk: M.trunk(bend, deepest),
      retreat: M.joint(bend, 0, "hips").z - M.joint(bend, deepest, "hips").z,
    };
  };
  const measure = (
    row: IAutoMovieMotionHumanBend.Strategy,
    name: motionHumanBody.Name,
    side: AutoMovieHumanSide = "right",
  ) => {
    try {
      return observe(row, name, side);
    } catch (error) {
      complaints.check(
        name +
          " " +
          row +
          " " +
          side +
          ": " +
          (error instanceof Error ? error.message : String(error)),
        false,
      );
      return undefined;
    }
  };
  const stoop = measure("stoop", "m-large"),
    semi = measure("semiSquat", "m-large"),
    squat = measure("squat", "m-large");
  const automatic = measure("auto", "f-small");
  for (const name of ["f-small", "m-large"] as const)
    measure("semiSquat", name, "left");
  for (const posture of [stoop, automatic])
    if (posture)
      complaints.check(
        "stoop shifts hips back with limited knee bend",
        posture.knee <= STOOP_KNEE + STOOP_ANGLE_ROUNDOFF &&
          posture.trunk >= 45 &&
          posture.retreat > 0,
      );
  if (stoop && squat)
    complaints.check(
      "squat reaches a right angle with more upright trunk",
      squat.knee >= 90 && squat.trunk < stoop.trunk,
    );
  if (stoop && semi && squat)
    complaints.check(
      "partial squat lies between the two extremes",
      stoop.knee < semi.knee && semi.knee < squat.knee,
    );
  complaints.assert(
    "bend and crouch preserve their support and angular envelopes",
  );
}
/** Burgess-Limerick's maximum knee flexion classified as a stoop, degrees. */
const STOOP_KNEE: number = 30;

/** Roundoff when recovering the exact limiting angle from two measured joint vectors. */
const STOOP_ANGLE_ROUNDOFF: number =
  // Six subtractions, three products, two additions, two norms,
  // their product and the quotient, rounded up to a binary operation bound.
  (2 ** Math.ceil(Math.log2(6 + 3 + 2 + 2 + 1 + 1)) * Number.EPSILON * 180) /
  // Convert the angular derivative of acos from radians to degrees.
  (Math.PI * Math.sin((STOOP_KNEE * Math.PI) / 180));

function checkCrouch(complaints: motionComplaints.IGatherer): void {
  const actor = HumanChain.subject("a");
  for (const [row, name, params] of [
    ["default", "f-small", { hold: 0.5 }],
    [
      "depth=partial,heels=up",
      "m-large",
      { hold: 0.5, depth: "partial", heels: "up" },
    ],
    ["depth=full", "m-large", { hold: 0.5, depth: "full" }],
  ] as const) {
    const body = motionHumanBody(name);
    const film = motionHumanLaw.perform(
      "sweep-1",
      [{ subject: "a", body }],
      actor.crouch(params),
    );
    motionCrouchSignature(complaints, { film, body, yaw: 0 }, row, name);
    complaints.check(
      row + " exits standing",
      film.performance.segments("a")[0]!.plan.base?.kind === "standing",
    );
    const verdict = HumanVerdicts.of(film.performance);
    if (!verdict.clean)
      complaints.list.push(row + ": " + HumanVerdicts.describe(verdict));
  }
  const maximum =
    AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion")! +
    Math.min(28, AutoMovieMotionHumanRange.limit("leftFoot", "flexion")!);
  let refusal: unknown;
  try {
    motionHumanLaw.perform(
      "flat-full",
      [{ subject: "a", body: motionHumanBody("f-small") }],
      actor.crouch({ depth: "full", heels: "flat", hold: 0.5 }),
    );
  } catch (error) {
    refusal = error;
  }
  complaints.check(
    "flat full crouch names the open hip and ankle limit",
    refusal instanceof HumanRefusal &&
      refusal.kind === "parameter" &&
      refusal.axis === "depth" &&
      refusal.value === "full" &&
      refusal.feasible?.kind === "range" &&
      refusal.feasible.unit === "degrees" &&
      refusal.feasible.open === "maximum" &&
      refusal.feasible.minimum === 0 &&
      refusal.feasible.maximum === maximum,
  );
}
