import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { HumanBodyFit } from "../../posture/internal/HumanBodyFit";
import { HumanBodyFitMerit } from "../../posture/internal/HumanBodyFitMerit";
import { HumanFitVariables } from "../../posture/internal/HumanFitVariables";

type Contact = IAutoMovieMotionHumanSupport.IContact;
type Target = IAutoMovieMotionHumanBodyFitTypes.ITarget;
type Variable = IAutoMovieMotionHumanJacobian.IVariable;
type Candidate = IAutoMovieMotionHumanPosture | undefined;

/**
 * Construct a diagonal support tripod before closing the remaining hand. The
 * intermediate poses only initialize the static solver. The original posed
 * body's complete floor, contact and collision rows admit the returned key.
 */
export function prepareRaisedKneeSupport(
  body: IAutoMovieMotionHumanBody,
  preferred: IAutoMovieMotionHumanPosture,
  from: IAutoMovieMotionHumanPosture,
  contacts: readonly Contact[],
  holding: readonly Target[],
  bearing: readonly RegExp[],
  merit: HumanBodyFitMerit.IMerit,
): Candidate {
  const knee: Contact | undefined = contacts.find((c: Contact): boolean =>
    c.part.endsWith("Knee"),
  );
  if (knee === undefined || contacts.length !== 4) return undefined;
  const side: AutoMovieHumanSide = knee.part === "leftKnee" ? "left" : "right";
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const chain: readonly IAutoMovieMotionHumanSupport.Part[] = [
    knee.part,
    `${other}Foot`,
    `${other}Hand`,
    `${side}Hand`,
  ];
  if (
    !chain.every((part: Contact["part"]): boolean =>
      contacts.some((c: Contact): boolean => c.part === part),
    )
  )
    return undefined;
  const kneeTarget: Target = holding[contacts.indexOf(knee)]!;
  if (
    kneeTarget.goal.y <= 0 ||
    holding.some(
      (target: Target): boolean =>
        target.on !== undefined || target.bound !== undefined,
    )
  )
    return undefined;
  const base: Target[] = holding.filter(
    (t: Target): boolean => !t.bone.endsWith("Hand"),
  );
  const hand: Target =
    holding[
      contacts.findIndex((c: Contact): boolean => c.part === `${other}Hand`)
    ]!;
  const lower: Variable[] = HumanFitVariables.BODY.filter(
    (v: Variable): boolean =>
      v.kind !== "angle" || /Leg|Foot|Toes/.test(v.bone),
  );
  const tripod: Variable[] = HumanFitVariables.BODY.filter(
    (v: Variable): boolean =>
      v.kind !== "angle" ||
      (v.bone !== "head" &&
        v.bone !== "neck" &&
        !(v.bone.startsWith(side) && /Arm|Hand/.test(v.bone))),
  );
  const legs: IAutoMovieMotionHumanPosture = HumanBodyFit.fit({
    body,
    posture: preferred,
    start: from,
    variables: lower,
    targets: base,
    bearing,
  }).posture;
  const diagonal: IAutoMovieMotionHumanPosture = HumanBodyFit.fit({
    body,
    posture: legs,
    start: legs,
    variables: tripod,
    targets: [...base, hand],
    bearing,
  }).posture;
  const complete: IAutoMovieMotionHumanPosture = HumanBodyFit.fit({
    body,
    posture: preferred,
    start: diagonal,
    targets: holding,
    bearing,
  }).posture;
  return supportHeight(complete, holding, merit);
}

/**
 * Every world-height row changes by the same signed rigid translation. A common
 * vertical placement preserves angles, self-distances and the identity of the
 * lowest support on each part. Check the complete translated pose.
 */
function supportHeight(
  pose: IAutoMovieMotionHumanPosture,
  targets: readonly Target[],
  merit: HumanBodyFitMerit.IMerit,
): Candidate {
  const reading: HumanBodyFitMerit.IEvaluation = merit.evaluate(
    HumanFitVariables.vector(HumanFitVariables.BODY, pose),
  );
  if (merit.holds(reading.misses)) return pose;
  const tolerance: number = HumanBodyFitMerit.TOLERANCE;
  let low: number = -Infinity;
  let high: number = Infinity;
  for (const h of reading.r.heights) low = Math.max(low, -tolerance - h);
  for (const i of reading.touching)
    high = Math.min(high, tolerance - reading.r.heights[i]!);
  for (const [i, target] of targets.entries()) {
    if (target.axes !== undefined && !target.axes.includes("y")) continue;
    const dy: number = target.goal.y - reading.r.points[i]!.y;
    low = Math.max(low, dy - tolerance);
    high = Math.min(high, dy + tolerance);
  }
  if (low > high || (low <= 0 && high >= 0)) return undefined;
  const y: number = pose.root.y + (low + high) / 2;
  const moved: IAutoMovieMotionHumanPosture = {
    ...pose,
    root: { ...pose.root, y },
  };
  return merit.holds(
    merit.evaluate(HumanFitVariables.vector(HumanFitVariables.BODY, moved))
      .misses,
  )
    ? moved
    : undefined;
}
