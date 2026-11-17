import { Quaternion, solveAirborneTakeoff } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanAirborneShape,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanLayer,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionCoveringArray } from "../internal/motionCoveringArray";
import { motionHumanBody } from "../internal/motionHumanBody";
import { qunit } from "../internal/qunit";

/**
 * Publicly composed flight shapes must realize a requested winding whenever
 * their actual turn is admitted, rather than merely share upright endpoints.
 * The count/shape/way/body design uses the campaign's existing strength-three
 * covering owner instead of repeating the four-factor Cartesian product.
 *
 * Scenarios:
 * 1. Every triple of somersault {1,2}, shape {tuck,pike,layout}, way
 *    {forward,backward,left} and body {average man,small woman} appears.
 *    Each actual performance stands 0.3 s and jumps 1 m with a 0.6 m apex.
 *    A refusal remains allowed only as a typed turns-axis HumanRefusal;
 *    this conditional matrix does not declare each cell feasible.
 * 2. Every admitted root winds the requested signed count in its takeoff
 *    frame at 60 Hz, within the original 0.02-revolution landing bound.
 *    Forward winds positively in YZ, backward negatively, and a left salto
 *    positively in YX. Finite unit rotations and observable projections
 *    are required. A zero turn or wrong whole-turn count cannot hide behind
 *    an upright endpoint. Endpoint tilt/twist keep the same bound as before.
 *
 * Mandatory feasible flights are owned once by core_flight_sample and
 * core_flight, including two bodies and tuck versus untucked composition.
 * Thus rejecting all physical flight cannot pass the suite. Cheap full
 * request-count/direction and six-shape ownership/inertia checks are owned
 * by jump_turning and airborne_shape; this matrix adds their integration.
 * Covering triples do not exhaust all four-factor interactions, and sampled
 * winding does not certify continuous behavior between observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the existing flight fixture, exact triple-covering scope, conditional refusal policy, mandatory baseline owners, signed winding observation and its numerical/coverage limits.
 * @evidence contracts/development/testing.md#behavioral-verification Builds real public shaped performances and reads actual displayed roots through a flight. Ignored/reversed/wrong-count turns, nonfinite/unit-invalid roots, unobservable projected winding, off-upright landings and failures outside typed turns refusal are findings.
 * @evidence contracts/development/testing.md#independent-expectations A requested count requires signed 2*pi*count accumulated long-axis winding; explicit takeoff-relative YZ/YX projections set direction independently of the shooting residual. The original 0.02 revolution bounds both winding and upright endpoint error. sqrt(machine epsilon) guards atan2 conditioning on a unit direction, not physical admissibility.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains every three-factor interaction across two counts, three shapes, three ways and two actual Human proportions. Full count/way declarations and all shape ownership checks have separate cheap units; core_flight/sample require successful canonical flights, unchanged 1% momentum/contact/ROM/continuity contracts remain with their existing tests. Four-factor-only faults are outside this covering design.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable synchronous CPU entry owns one actual HumanPerformance per covering row and reuses it for endpoint and winding observations. Canonical fixtures and the existing covering constructor are shared; no renderer, process, global replacement or synthetic human rig is introduced.
 */
export function test_human_motion_airborne_signature(): void {
  const findings: string[] = [];
  const rows: Record<string, string>[] = motionCoveringArray({
    somersault: ["1", "2"],
    shape: ["tuck", "pike", "layout"],
    way: ["forward", "backward", "left"],
    body: ["m-average", "f-small"],
  }, 3);
  if (rows.length === 0) findings.push("the covering design produced no physical cases");
  for (const row of rows) {
    const name: motionHumanBody.Name = row.body as motionHumanBody.Name;
    const body: IHumanBody = motionHumanBody(name);
    const somersault: number = Number(row.somersault);
    const shape: HumanAirborneShape.Shape = row.shape as HumanAirborneShape.Shape;
    const way: "forward" | "backward" | "left" = row.way as "forward" | "backward" | "left";
    const label: string = `${name} ${somersault} ${shape} ${way}`;
    const layer: IHumanLayer.IScheduled = {
      layer: HumanAirborneShape.layer(shape),
      from: { of: "leap", event: "takeoff" },
      to: { of: "leap", event: "touchdown" },
      fade: 0.05,
    };
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "airborne",
        performers: [{
          subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0,
          proficiency: { level: "trained" },
        }],
        composition: HumanChain.subject("a").stand({ seconds: 0.3 })
          .jump({ to: { x: 0, y: 0, z: 1 }, apex: 0.6, rotation: { somersault, way } }, "leap").node,
        layers: { a: [layer] },
      });
    } catch (error) {
      if (!(error instanceof HumanRefusal && error.axis === "turns"))
        findings.push(`${label}: failed outside the allowed turns refusal: ${String(error)}`);
      continue;
    }
    const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
    const at: (event: string) => number = (event: string): number => segment.start +
      segment.plan.events.find((value: IAutoMovieMotionEvent): boolean => value.name === event)!.share * segment.plan.duration;
    const takeoff: number = at("takeoff");
    const touchdown: number = at("touchdown");
    if (!(Number.isFinite(takeoff) && Number.isFinite(touchdown) && takeoff < touchdown)) {
      findings.push(`${label}: no finite positive flight interval`);
      continue;
    }
    const first: IAutoMoviePose = performance.pose("a", takeoff);
    const end: number = touchdown - 1e-6;
    const last: IAutoMoviePose = performance.pose("a", end);
    if (first.root === null || last.root === null || !qunit(first.root.rotation) || !qunit(last.root.rotation)) {
      findings.push(`${label}: flight endpoints lack finite unit root rotations`);
      continue;
    }
    const off: solveAirborneTakeoff.IAngles = solveAirborneTakeoff.angles(first.root.rotation, last.root.rotation);
    const error: number = Math.max(Math.abs(off.somersault), Math.abs(off.tilt), Math.abs(off.twist)) / (2 * Math.PI);
    if (!(Number.isFinite(error) && error <= 0.02))
      findings.push(`${label}: lands ${error} revolution off upright`);

    const inverse: IAutoMovieQuaternion = Quaternion.inverse(first.root.rotation);
    const samples: number = Math.max(1, Math.ceil((end - takeoff) * 60));
    let previous: number = 0;
    let winding: number = 0;
    let observable: boolean = true;
    for (let index: number = 0; index <= samples; index++) {
      const seconds: number = index === samples ? end : takeoff + (end - takeoff) * index / samples;
      const pose: IAutoMoviePose = performance.pose("a", seconds);
      if (pose.root === null || !qunit(pose.root.rotation)) {
        findings.push(`${label}: nonfinite or nonunit displayed root at ${seconds} s`);
        observable = false;
        break;
      }
      const relative: IAutoMovieQuaternion = Quaternion.normalize(Quaternion.multiply(inverse, pose.root.rotation));
      const direction: IAutoMovieVector3 = Quaternion.rotateVector(relative, { x: 0, y: 1, z: 0 });
      const forward: number = way === "left" ? direction.x : direction.z;
      const radius: number = Math.hypot(direction.y, forward);
      if (!(Number.isFinite(radius) && radius > Math.sqrt(Number.EPSILON))) {
        findings.push(`${label}: long-axis winding is unobservable at ${seconds} s, radius ${radius}`);
        observable = false;
        break;
      }
      const angle: number = Math.atan2(forward, direction.y);
      if (index > 0) winding += Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
      previous = angle;
    }
    const expected: number = 2 * Math.PI * somersault * (way === "backward" ? -1 : 1);
    if (observable && !(Number.isFinite(winding) && Math.abs(winding - expected) <= 0.02 * 2 * Math.PI))
      findings.push(`${label}: displayed winding is ${winding / (2 * Math.PI)} turns, expected ${expected / (2 * Math.PI)}`);
  }
  TestValidator.equals("airborne composition signature", findings, []);
}
