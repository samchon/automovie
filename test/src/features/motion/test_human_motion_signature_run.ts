import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanMetamorphic } from "../internal/motionHumanMetamorphic";
import { motionHumanRunSignature } from "../internal/motionHumanRunSignature";

/**
 * The four extreme bodies run with human stance, cadence and posture, and
 * the explicit paces preserve Alexander's Froude relation across them.
 *
 * Scenarios:
 * 1. Jog, run, sprint and default retain the independently cited trunk,
 *    cadence, foot support, centre of mass and stance-knee bounds of
 *    `motionHumanRunSignature`. Trunk lean grows from jog to sprint.
 * 2. Each explicit pace's reduced step frequency, contact duty and stride
 *    per hip height remain within 15% of their four-body means, as before.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two comparisons and their sourced expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Stages each run once and shares its steady interval between the gait signature and dynamic similarity comparisons.
 * @evidence contracts/development/testing.md#independent-expectations Uses the running literature's bounds and Alexander's pendulum time and scaled stride, computed from displayed joints and actual foot support.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains the four extreme bodies, three explicit paces, the default and the prior comparison bounds on each.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory spec owns the four bodies' runs; only their reduced scalars survive to the cross-body comparison.
 */
export function test_human_motion_signature_run(): void {
  const findings: motionComplaints.IGatherer = motionComplaints();
  const byPace: Record<
    string,
    Record<string, motionHumanMetamorphic.ISimilarityReading>
  > = {};
  for (const name of motionHumanBody.EXTREMES)
    for (const [pace, reading] of Object.entries(
      motionHumanRunSignature.read(name, findings),
    ))
      (byPace[pace] ??= {})[name] = reading;
  for (const [pace, readings] of Object.entries(byPace))
    findings.list.push(
      ...motionHumanMetamorphic.compareSimilarity("run", pace, readings),
    );
  findings.assert(
    "running has the human gait signature and dynamic similarity",
  );
}
