import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanMetamorphic } from "../internal/motionHumanMetamorphic";
import { motionHumanWalkSignature } from "../internal/motionHumanWalkSignature";

/**
 * The four extreme bodies walk with human stance, cadence and posture, and
 * the explicit paces preserve Alexander's Froude relation across them.
 *
 * Scenarios:
 * 1. Slow, normal, fast and default retain the independently cited trunk,
 *    cadence, foot support, centre of mass and gaze bounds of
 *    `motionHumanWalkSignature`. Lean and cadence rise with pace.
 * 2. Each explicit pace's reduced step frequency, contact duty and stride
 *    per hip height remain within 15% of their four-body means, as before.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two comparisons and their sourced expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Stages each walk once and shares its steady interval between the gait signature and dynamic similarity comparisons.
 * @evidence contracts/development/testing.md#independent-expectations Uses the walking literature's bounds and Alexander's pendulum time and scaled stride, computed from displayed joints and actual foot support.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains the four extreme bodies, three explicit paces, the default and the prior comparison bounds on each.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory spec owns the four bodies' walks; only their reduced scalars survive to the cross-body comparison.
 */
export function test_human_motion_signature_walk(): void {
  const findings: motionComplaints.IGatherer = motionComplaints();
  const byPace: Record<
    string,
    Record<string, motionHumanMetamorphic.ISimilarityReading>
  > = {};
  for (const name of motionHumanBody.EXTREMES)
    for (const [pace, reading] of Object.entries(
      motionHumanWalkSignature.read(name, findings),
    ))
      (byPace[pace] ??= {})[name] = reading;
  for (const [pace, readings] of Object.entries(byPace))
    findings.list.push(
      ...motionHumanMetamorphic.compareSimilarity("walk", pace, readings),
    );
  findings.assert(
    "walking has the human gait signature and dynamic similarity",
  );
}
