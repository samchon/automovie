import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanLimbFitFrame,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { performance } from "node:perf_hooks";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFrame } from "../internal/motionHumanFrame";
import { motionHumanFlightDiagnostic } from "../internal/motionHumanFlightDiagnostic";
import { motionHumanTakeoffDiagnostic } from "../internal/motionHumanTakeoffDiagnostic";
import { qunit } from "../internal/qunit";

/**
 * One actual canonical Human flight exercises adaptive shooting, shape FK
 * and IK without the 36-cell airborne matrix. This is the unchanged average
 * man's untucked one-turn case from core_flight: stand 0.3 s, jump 1 m with
 * a 0.5 m apex and one forward somersault, seed flight, trained skill.
 * A refusal is a failure; an unturned jump cannot satisfy its winding.
 *
 * Actual displayed roots wind once relative to takeoff. Their long-axis YZ
 * projection must exceed sqrt(machine epsilon), atan2's numerical-conditioning
 * guard; a singular projection reports an observer failure. At landing each
 * independently extracted Yeadon angle stays inside the existing takeoff
 * angular tolerance plus the last microsecond's turn. Displayed momentum
 * conserves within the existing 1% and stays under the same impulse ceiling.
 *
 * Body construction, planning, the first bone query, new-time bone queries
 * and repeated-time queries are measured separately. Wall time and process
 * user/system CPU are diagnostic and never change physical acceptance.
 *
 * Scenarios:
 * 1. The unchanged one-somersault Human input must produce a real flight.
 * 2. Actual displayed frames wind once, land inside the original angular
 *    bound and retain the original momentum drift and impulse limits.
 * 3. Timers separate construction from observed and repeated-time poses;
 *    their measured values do not contribute to physical acceptance.
 * 4. After those readings and timers finish, the same twenty conservation
 *    observations log displayed momentum beside the same measured roots
 *    carrying unturned canonical joints. Checked fixture prerequisites,
 *    finite data and every joint difference locate shape versus root/history
 *    discrepancies without replacing the original one-percent assertion.
 * 5. After original construction fails, or after original measurements finish,
 *    a separately labeled stand-only public-context control observes the
 *    original jump parameters' raw and resolved takeoff boundary. It cannot
 *    change acceptance or stand in for the failed instance's actual context.
 * 6. Public per-body limb-memory snapshots and deltas bracket planning,
 *    original observations, repeated reads and the later diagnostic. Reads
 *    occur outside all timed sections; misses mean memory misses, not inner
 *    IK targets, primitive queries or projector calls. The final control is
 *    excluded from these original-performance counts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the unchanged fixture/physical bounds, observed frame, singularity precondition, timing phases and public memory snapshot/delta scopes with explicit limits on their meaning.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual public turned performance and reads canonical displayed bones/root and mass-model momentum; ignored rotation, invalid FK, drift, excessive impulse or refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations A requested turn winds 2 pi; projecting the actual long axis in the takeoff frame gives its angle. Undoing that somersault and tilt from the actual lateral axis yields twist. Conservation and the existing impulse ceiling provide momentum expectations without the solver's residual.
 * @evidence contracts/development/testing.md#distinguishing-cases One existing feasible layout case, a full cycle rather than its identity endpoint, distinct-time versus repeated reads, finite/unit poses and zero-safe relative momentum comparison. It makes no claim about every motion or crowd playback.
 * @evidence contracts/development/testing.md#execution-ownership One original turned performance plus one explicitly authorized stand-only diagnostic control use the same canonical polygon Human. The control runs after failure or completed original measurements; no law override, foreign patch, renderer, compiler or process is started.
 */
export function test_human_motion_core_flight_sample(): void {
  const complaints: string[] = [];
  const bodyCpuStart: NodeJS.CpuUsage = process.cpuUsage();
  const bodyStart: number = performance.now();
  const body: IHumanBody = { ...motionHumanBody("m-average") };
  const bodyMs: number = performance.now() - bodyStart;
  const bodyCpuUs: NodeJS.CpuUsage = process.cpuUsage(bodyCpuStart);
  const memoryStart: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
  console.log(
    JSON.stringify({
      sample: "canonical-human-flight",
      phase: "planning-start",
      bodyMs,
      bodyCpuUs,
      limbFitMemory: { snapshot: memoryStart },
    }),
  );
  const planningCpuStart: NodeJS.CpuUsage = process.cpuUsage();
  const planningStart: number = performance.now();
  const params: Parameters<typeof motionHumanTakeoffDiagnostic>[2] = {
    to: { x: 0, y: 0, z: 1 }, apex: 0.5, rotation: { somersault: 1 },
  };
  const input: HumanPerformance.IInput = {
    seed: "flight",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .jump(
        params,
        "leap",
      ).node,
  };
  /** Observe only after the original operation stops, preserving its error. */
  const boundary: () => void = (): void => {
    try {
      motionHumanTakeoffDiagnostic(body, input, params);
    } catch (error) {
      console.log(JSON.stringify({ sample: "jump-takeoff-control-error", error: error instanceof Error ? error.message : String(error) }));
    }
  };
  let film: HumanPerformance;
  try {
    film = new HumanPerformance(input);
  } catch (error) {
    console.log(JSON.stringify({
      sample: "canonical-human-flight", phase: "planning-failed",
      planningMs: performance.now() - planningStart,
      planningCpuUs: process.cpuUsage(planningCpuStart),
      limbFitMemory: memorySince(body, memoryStart),
      error: error instanceof Error ? error.message : String(error),
    }));
    boundary();
    throw error;
  }
  const planningMs: number = performance.now() - planningStart;
  const planningCpuUs: NodeJS.CpuUsage = process.cpuUsage(planningCpuStart);
  const planningMemory: ReturnType<typeof memorySince> = memorySince(body, memoryStart);
  console.log(
    JSON.stringify({
      sample: "canonical-human-flight",
      phase: "planned",
      planningMs,
      planningCpuUs,
      limbFitMemory: planningMemory,
    }),
  );
  const segment: HumanSegment.ISegment = film.segments("a")[1]!;
  const event: (name: string) => number = (name: string): number => {
    const share: number | undefined = segment.plan.events.find(
      (item: IAutoMovieMotionEvent): boolean => item.name === name,
    )?.share;
    if (share === undefined || !Number.isFinite(share))
      throw new Error(`flight sample lacks finite ${name}`);
    return segment.start + share * segment.plan.duration;
  };
  const from: number = event("takeoff");
  const to: number = event("touchdown");
  TestValidator.predicate(
    "a finite flight interval contains the landing observation",
    Number.isFinite(from) && Number.isFinite(to) && to - from > 2e-6,
  );
  const observationMemoryStart: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
  const observationCpuStart: NodeJS.CpuUsage = process.cpuUsage();
  const observationStart: number = performance.now();
  const firstCpuStart: NodeJS.CpuUsage = process.cpuUsage();
  const firstStart: number = performance.now();
  const firstBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    film.bones("a", from);
  const firstQueryMs: number = performance.now() - firstStart;
  const firstQueryCpuUs: NodeJS.CpuUsage = process.cpuUsage(firstCpuStart);
  const root: (seconds: number) => IAutoMovieQuaternion = (
    seconds: number,
  ): IAutoMovieQuaternion => film.pose("a", seconds).root!.rotation;
  const takeoff: IAutoMovieQuaternion = root(from);
  TestValidator.predicate("finite takeoff root", qunit(takeoff));
  const frame: IAutoMovieQuaternion = Quaternion.inverse(takeoff);
  const end: number = to - 1e-6;
  const samples: number = Math.max(1, Math.ceil((end - from) * 60));
  const times: number[] = [];
  const queries: number[] = [];
  let previous: number = 0;
  let winding: number = 0;
  let endTilt: number = 0;
  let endTwist: number = 0;
  let observable: boolean = true;
  for (let k: number = 0; k <= samples; k++) {
    const seconds: number =
      k === samples ? end : from + ((end - from) * k) / samples;
    times.push(seconds);
    const started: number = performance.now();
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      k === 0 ? firstBones : film.bones("a", seconds);
    if (k > 0) queries.push(performance.now() - started);
    motionHumanFrame(bones, `flight sample at ${seconds} s`);
    const shown: IAutoMovieQuaternion = root(seconds);
    if (!qunit(shown)) {
      complaints.push(`nonunit displayed root at ${seconds}`);
      observable = false;
      continue;
    }
    const relative: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(frame, shown),
    );
    const up: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
      x: 0,
      y: 1,
      z: 0,
    });
    const radius: number = Math.hypot(up.y, up.z);
    if (!(Number.isFinite(radius) && radius > Math.sqrt(Number.EPSILON))) {
      complaints.push(
        `unobservable winding at ${seconds}: YZ radius ${radius}`,
      );
      observable = false;
      continue;
    }
    const angle: number = Math.atan2(up.z, up.y);
    if (k > 0)
      winding += Math.atan2(
        Math.sin(angle - previous),
        Math.cos(angle - previous),
      );
    previous = angle;
    if (k === samples) {
      endTilt = Math.atan2(-up.x, radius);
      const lateral: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
        x: 1,
        y: 0,
        z: 0,
      });
      const remove: IAutoMovieQuaternion = Quaternion.inverse(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(
            { x: 1, y: 0, z: 0 },
            (angle * 180) / Math.PI,
          ),
          Quaternion.fromAxisAngle(
            { x: 0, y: 0, z: 1 },
            (endTilt * 180) / Math.PI,
          ),
        ),
      );
      const remaining: IAutoMovieVector3 = Quaternion.rotateVector(
        remove,
        lateral,
      );
      endTwist = Math.atan2(-remaining.z, remaining.x);
    }
  }
  const last: number = Quaternion.angle(root(to - 2e-6), root(end));
  const bound: number = solveAirborneTakeoff.TOLERANCE + last;
  if (
    !(
      observable &&
      Number.isFinite(bound) &&
      Math.abs(winding - 2 * Math.PI) <= bound &&
      Math.abs(previous) <= bound &&
      Math.abs(endTilt) <= bound &&
      Math.abs(endTwist) <= bound
    )
  )
    complaints.push(
      `actual flight: winding ${winding / (2 * Math.PI)}, landing ${previous}/${endTilt}/${endTwist} rad, bound ${bound}`,
    );
  const model: resolveAutoMovieCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const delta: number = integrateAirborneRotation.DELTA;
  const observations: motionHumanFlightDiagnostic.IObservation[] = [];
  let captureMs: number = 0;
  const momentum: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 => {
    const angular: IAutoMovieVector3 = resolveAutoMovieMomentum(
      model,
      film.bones("a", seconds - delta),
      film.bones("a", seconds + delta),
      2 * delta,
    ).angular;
    if (observations.length < 20) {
      const captureStart: number = performance.now();
      observations.push({
        role: observations.length === 0 ? "reference" : `${observations.length}/20`,
        seconds, displayed: { ...angular },
        before: structuredClone(film.pose("a", seconds - delta)),
        after: structuredClone(film.pose("a", seconds + delta)),
      });
      captureMs += performance.now() - captureStart;
    }
    return angular;
  };
  const reference: IAutoMovieVector3 = momentum(from + 0.05 * (to - from));
  const magnitude: number = Vector3.length(reference);
  let maximumDrift: number = 0;
  for (let k: number = 1; k < 20; k++) {
    const difference: number = Vector3.length(
      Vector3.subtract(momentum(from + ((to - from) * k) / 20), reference),
    );
    maximumDrift = Math.max(maximumDrift, difference);
    if (
      !(
        Number.isFinite(magnitude) &&
        Number.isFinite(difference) &&
        difference <= 0.01 * magnitude
      )
    )
      complaints.push(
        `displayed momentum changes ${difference} from ${magnitude} at ${k}/20`,
      );
  }
  const one: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    film.bones("a", from + delta),
  );
  const two: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    film.bones("a", from + 2 * delta),
  );
  const speed: number = Vector3.length({
    x: (two.x - one.x) / delta,
    y: (two.y - one.y) / delta + 1.5 * AutoMovieGravity.STANDARD * delta,
    z: (two.z - one.z) / delta,
  });
  const ceiling: number =
    model.mass *
    speed *
    resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight);
  const held: number = Vector3.length(momentum((from + to) / 2));
  if (!(Number.isFinite(held) && Number.isFinite(ceiling) && held <= ceiling))
    complaints.push(`momentum ${held} exceeds impulse ceiling ${ceiling}`);
  const observationMs: number = performance.now() - observationStart;
  const observationCpuUs: NodeJS.CpuUsage =
    process.cpuUsage(observationCpuStart);
  const observationMemory: ReturnType<typeof memorySince> = memorySince(body, observationMemoryStart);
  const repeatedCpuStart: NodeJS.CpuUsage = process.cpuUsage();
  const repeatedStart: number = performance.now();
  for (const seconds of times) film.bones("a", seconds);
  const repeatedMs: number = performance.now() - repeatedStart;
  const repeatedCpuUs: NodeJS.CpuUsage = process.cpuUsage(repeatedCpuStart);
  const repeatedMemory: ReturnType<typeof memorySince> = memorySince(body, observationMemory.snapshot);
  const diagnosticStart: number = performance.now();
  const diagnosticCpuStart: NodeJS.CpuUsage = process.cpuUsage();
  const diagnostic: ReturnType<typeof motionHumanFlightDiagnostic> = motionHumanFlightDiagnostic({ body, film, input, segment, model, from, to, delta, observations });
  const diagnosticMs: number = performance.now() - diagnosticStart;
  const diagnosticCpuUs: NodeJS.CpuUsage = process.cpuUsage(diagnosticCpuStart);
  const diagnosticMemory: ReturnType<typeof memorySince> = memorySince(body, repeatedMemory.snapshot);
  complaints.push(...diagnostic.problems);
  console.log(
    JSON.stringify({
      sample: "canonical-human-flight",
      bodyMs,
      bodyCpuUs,
      planningMs,
      planningCpuUs,
      firstQueryMs,
      firstQueryCpuUs,
      newTimeQueries: queries.length,
      newTimeTotalMs: queries.reduce(
        (sum: number, value: number): number => sum + value,
        0,
      ),
      newTimeMaximumMs: Math.max(...queries),
      observationMs,
      observationCpuUs,
      repeatedMs,
      repeatedCpuUs,
      captureMs,
      diagnosticMs,
      diagnosticCpuUs,
      limbFitMemory: {
        beforePlanning: memoryStart, planning: planningMemory,
        beforeObservation: observationMemoryStart, observation: observationMemory,
        repeated: repeatedMemory, diagnostic: diagnosticMemory,
      },
      from,
      to,
      delta,
      diagnostic,
      windingTurns: winding / (2 * Math.PI),
      magnitude,
      maximumDrift,
      held,
      ceiling,
    }),
  );
  boundary();
  TestValidator.equals("one actual turned Human flight", complaints, []);
}

/** Copy actual public counters once after a stopped timing window, without counting inner work. */
function memorySince(body: IHumanBody, before: HumanLimbFitFrame.IStatistics): {
  snapshot: HumanLimbFitFrame.IStatistics;
  delta: HumanLimbFitFrame.IStatistics;
} {
  const snapshot: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
  return { snapshot, delta: { hits: snapshot.hits - before.hits, misses: snapshot.misses - before.misses } };
}
