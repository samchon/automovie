import {
  AutoMovieGravity,
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
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFlightDiagnostic } from "../internal/motionHumanFlightDiagnostic";
import { motionHumanFrame } from "../internal/motionHumanFrame";
import { qunit } from "../internal/qunit";

/**
 * One actual canonical Human flight exercises adaptive shooting, shape FK
 * and IK without the 36-cell airborne matrix. This is the unchanged average
 * man's untucked one-turn case from core_flight: stand 0.3 s, jump 1 m with
 * a 0.5 m apex and one forward somersault, seed flight, trained skill.
 * A refusal is a failure; an unturned jump cannot satisfy its winding.
 * Explicit physical mode retains this original conservation/impulse sample
 * after staged authored rotation became the film-hint default.
 *
 * Actual displayed roots wind once relative to takeoff. Their long-axis YZ
 * projection must exceed sqrt(machine epsilon), atan2's numerical-conditioning
 * guard; a singular projection reports an observer failure. At landing each
 * independently extracted Yeadon angle stays inside the existing takeoff
 * angular tolerance plus the last microsecond's turn. Displayed momentum
 * conserves within the existing 1% and stays under the same impulse ceiling.
 *
 * Scenarios:
 * 1. The unchanged one-somersault Human input must produce a real flight.
 * 2. Actual displayed frames wind once, land inside the original angular
 *    bound and retain the original momentum drift and impulse limits.
 * 3. The nineteen distinct interior twentieths of flight, with the measured roots
 *    carrying unturned canonical joints, locate a shape versus root/history
 *    discrepancy (`motionHumanFlightDiagnostic`) without replacing the
 *    one-percent assertion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the unchanged fixture/physical bounds, observed frame, singularity precondition and the diagnostic's scope.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual public turned performance and reads canonical displayed bones/root and mass-model momentum; ignored rotation, invalid FK, drift, excessive impulse or refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations A requested turn winds 2 pi; projecting the actual long axis in the takeoff frame gives its angle. Undoing that somersault and tilt from the actual lateral axis yields twist. Conservation and the existing impulse ceiling provide momentum expectations without the solver's residual.
 * @evidence contracts/development/testing.md#distinguishing-cases One existing feasible layout case, a full cycle rather than its identity endpoint, finite/unit poses and zero-safe relative momentum comparison. It makes no claim about every motion or crowd playback.
 * @evidence contracts/development/testing.md#execution-ownership One turned performance on the canonical polygon Human; no law override, foreign patch, renderer, compiler or process is started.
 */
export function test_human_motion_core_flight_sample(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = { ...motionHumanBody("m-average") };
  const input: IAutoMovieMotionHumanPerformance.IInput = {
    seed: "flight",
    flight: "physical",
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
        { to: { x: 0, y: 0, z: 1 }, apex: 0.5, rotation: { somersault: 1 } },
        "leap",
      ).node,
  };
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance(input);
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
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
  const root: (seconds: number) => IAutoMovieQuaternion = (
    seconds: number,
  ): IAutoMovieQuaternion => film.pose("a", seconds).root!.rotation;
  const takeoff: IAutoMovieQuaternion = root(from);
  TestValidator.predicate("finite takeoff root", qunit(takeoff));
  const frame: IAutoMovieQuaternion = Quaternion.inverse(takeoff);
  const end: number = to - 1e-6;
  const samples: number = Math.max(1, Math.ceil((end - from) * 60));
  let previous: number = 0;
  let winding: number = 0;
  let endTilt: number = 0;
  let endTwist: number = 0;
  let observable: boolean = true;
  for (let k: number = 0; k <= samples; k++) {
    const seconds: number =
      k === samples ? end : from + ((end - from) * k) / samples;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("a", seconds);
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
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const delta: number = integrateAirborneRotation.DELTA;
  const observations: motionHumanFlightDiagnostic.IObservation[] = [];
  const divisions: number = 20;
  for (let k: number = 1; k < divisions; k++) {
    const seconds: number = from + ((to - from) * k) / divisions;
    const displayed: IAutoMovieVector3 = resolveAutoMovieMomentum(
      model,
      film.bones("a", seconds - delta),
      film.bones("a", seconds + delta),
      2 * delta,
    ).angular;
    observations.push({
      role: k === 1 ? "reference" : `${k}/${divisions}`,
      seconds,
      displayed,
      before: structuredClone(film.pose("a", seconds - delta)),
      after: structuredClone(film.pose("a", seconds + delta)),
    });
  }
  const reference: IAutoMovieVector3 = observations[0]!.displayed;
  const magnitude: number = Vector3.length(reference);
  for (const observation of observations) {
    const difference: number = Vector3.length(
      Vector3.subtract(observation.displayed, reference),
    );
    if (
      !(
        Number.isFinite(magnitude) &&
        Number.isFinite(difference) &&
        difference <= 0.01 * magnitude
      )
    )
      complaints.push(
        `displayed momentum changes ${difference} from ${magnitude} at ${observation.role}`,
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
  const held: number = Vector3.length(observations[divisions / 2 - 1]!.displayed);
  if (!(Number.isFinite(held) && Number.isFinite(ceiling) && held <= ceiling))
    complaints.push(`momentum ${held} exceeds impulse ceiling ${ceiling}`);
  complaints.push(
    ...motionHumanFlightDiagnostic({
      body,
      film,
      input,
      segment,
      model,
      from,
      to,
      delta,
      observations,
    }).problems,
  );
  TestValidator.equals("one actual turned Human flight", complaints, []);
}
