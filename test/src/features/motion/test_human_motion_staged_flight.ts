import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
  scanJointRom,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieScanJointRom,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditGround,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { performance } from "node:perf_hooks";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFrame } from "../internal/motionHumanFrame";
import { qunit } from "../internal/qunit";

/**
 * Default authored turns stage a film hint without starting physical flight.
 * One average Human stands 0.3 s, then jumps 1 m at yaw 37 with a 0.5 m apex,
 * two forward somersaults and one twist. The actual displayed articulation,
 * declared contacts and centre path remain authoritative.
 *
 * Scenarios:
 * 1. At 60 Hz including both flight endpoints, the root relative to the same
 *    raw articulation without its authored turn follows Rx(4*pi*u)Ry(2*pi*u).
 *    The explicit quaternion is (sin(2*pi*u)cos(pi*u),
 *    cos(2*pi*u)sin(pi*u),sin(2*pi*u)sin(pi*u),cos(2*pi*u)cos(pi*u)).
 *    Actual long-axis YZ winding accumulates4*pi, so an identity endpoint
 *    alone cannot pass. Unit/root angle error is at most 1e-6 rad.
 * 2. Actual displayed FK stays finite/unit and every sampled clinical joint
 *    passes the existing anatomical ROM scan. Rigid rotation about the
 *    composed centre preserves its unturned actual COM within the existing
 *    flight 5 mm bound; original plant slip/lift also retain 5 mm at 24 Hz.
 * 3. All eight native physical-work counters stay exactly zero through
 *    construction and playback. This asserts absence of physical flight
 *    work, without asserting angular-momentum or impulse conservation.
 *    Its owned mode getter first returns undefined (the staged default),
 *    and would return physical on a second read. One read plus the actual
 *    authored attitude and zero work verify construction uses that capture.
 * 4. One small stand-only input checks public memo identity: omitted and
 *    explicit undefined/staged modes share one resolution; physical has another.
 *    Tiny stand-only contexts add no second turned film or physical solve.
 *    Enumerable, non-enumerable and inherited physical inputs retain that
 *    physical identity. Invalid modes refuse even beside a cached staged
 *    state, including an invalid cyclic object before serialization; a
 *    stateful getter is observed once and its first mode governs.
 * 5. Diagnostic timers bracket only the existing body acquisition, turned
 *    construction and each existing pose/bone observation. First and new-time
 *    nearest-rank percentiles remain separate from independent verification,
 *    contact audits and mode checks. Timing never changes acceptance and is
 *    not compared as equivalent work to the physical representative.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual body, noncardinal placement, signed counts, independent quaternion/winding formulas, sampled ROM/contact/COM bounds, all eight physical counters, effective mode property/getter admission and diagnostic timing scopes across five scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs one real default turned performance with a native observer, reads actual roots/joints/FK and the same law's unturned raw articulation, then checks geometric contacts and public mode memo identity. Ignored counts, wrong rotation order/frame/time, nonfinite data, anatomical faults, moved COM, slipping/lifted plants, unexpected physical work or a staged/physical key collision fail.
 * @evidence contracts/development/testing.md#independent-expectations Quaternion multiplication gives the written Rx*Ry components; the long axis is independent of the rightmost Y twist and winds twice. A rigid rotation about a mass-weighted centre leaves that centre fixed. The existing ROM table/scan and5mm campaign bounds govern anatomy/contacts/COM. Zero physical-work events follow the explicit staged product policy. The first effective mode observation must govern key and state together; invalid literals require a parameter/flight refusal independently of cached states. Timings are observations with nearest-rank summaries and supply no acceptance bound.
 * @evidence contracts/development/testing.md#distinguishing-cases One nonzero heading, two full somersaults plus one twist, the whole flight including both boundaries, independent timewise attitude and unwrapped winding, zero-safe finite geometric bounds and all eight counters. Mode checks distinguish omitted/undefined/staged/physical, three property storage forms, null/unknown/cyclic invalid values and cold stateful getters. This does not certify unsampled motion or physical conservation; unchanged physical flight specifications explicitly opt into that separate mode.
 * @evidence contracts/development/testing.md#execution-ownership One portable named unit borrows one existing canonical body, owns one observed turned performance plus five tiny stand-only resolutions for mode identity and cold getter admission, and edits only its own input descriptors/prototypes and unturned posture copy. Invalid modes create no successful resolution. Public APIs provide every observation; no internal import, test-only law/export, renderer, compiler, process or foreign replacement is used.
 */
export function test_human_motion_staged_flight(): void {
  const findings: string[] = [];
  const bodyStarted: number = performance.now();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bodyMs: number = performance.now() - bodyStarted;
  const observation: ReturnType<typeof integrateAirborneRotation.observe> = integrateAirborneRotation.observe();
  const yaw: number = 37;
  const heading: number = yaw * Math.PI / 180;
  const input: IAutoMovieMotionHumanPerformance.IInput = {
    seed: "staged-flight-contract",
    performers: [{ subject: "a", body, at: { x: 3, y: 0, z: -2 }, yaw,
      proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a").stand({ seconds: 0.3 })
      .jump({ to: { x: 3 + Math.sin(heading), y: 0, z: -2 + Math.cos(heading) },
        apex: 0.5, rotation: { somersault: 2, twist: 1 } }, "leap").node,
  };
  let flightReads: number = 0;
  Object.defineProperty(input, "flight", { enumerable: true,
    get: (): IAutoMovieMotionHumanPerformance.IInput["flight"] => ++flightReads === 1 ? undefined : "physical" });
  const planningStarted: number = performance.now();
  let film: IAutoMovieMotionHumanPerformance;
  try {
    film = new HumanPerformance(input, observation);
  } catch (error) {
    console.log(JSON.stringify({ sample: "staged-human-flight", phase: "planning-failed", bodyMs,
      planningMs: performance.now() - planningStarted, physicalWork: observation.read(),
      error: error instanceof Error ? error.message : String(error) }));
    throw error;
  }
  const planningMs: number = performance.now() - planningStarted;
  if (flightReads !== 1) findings.push(`the observed staged constructor read its effective mode ${flightReads} times, expected once`);
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
  const event: (name: string) => number = (name: string): number => {
    const declared: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
      (value: IAutoMovieMotionEvent): boolean => value.name === name,
    );
    if (declared === undefined) throw new Error(`staged jump lacks ${name}`);
    return segment.start + declared.share * segment.plan.duration;
  };
  const from: number = event("takeoff");
  const to: number = event("touchdown");
  TestValidator.predicate("a staged jump retains finite ordered flight times",
    Number.isFinite(from) && Number.isFinite(to) && from < to && to <= film.duration);
  const count: number = Math.max(1, Math.ceil((to - from) * 60));
  let previous: number = 0;
  let winding: number = 0;
  let observable: boolean = true;
  const poseMs: number[] = [];
  const bonesMs: number[] = [];
  let independentChecksMs: number = 0;
  for (let index: number = 0; index <= count; index++) {
    const seconds: number = index === count ? to : from + (to - from) * index / count;
    const u: number = (seconds - from) / (to - from);
    const poseStarted: number = performance.now();
    const pose: IAutoMoviePose = film.pose("a", seconds);
    poseMs.push(performance.now() - poseStarted);
    const bonesStarted: number = performance.now();
    const bones: ReturnType<typeof film.bones> = film.bones("a", seconds);
    bonesMs.push(performance.now() - bonesStarted);
    const checksStarted: number = performance.now();
    try {
      motionHumanFrame(bones, `staged flight at${seconds}`);
    } catch (error) {
      findings.push(String(error));
    }
    for (const joint of pose.joints) {
      if ([joint.flexion, joint.abduction, joint.twist].some(
        (value: number | null | undefined): boolean => value !== undefined && value !== null && !Number.isFinite(value),
      )) findings.push(`staged flight at ${seconds}: ${joint.bone} has a nonfinite clinical coordinate`);
      const constraint: IAutoMovieJointConstraint | undefined = DEFAULT_HUMANOID_ROM[joint.bone];
      if (constraint !== undefined)
        scanJointRom(joint, constraint, (part: IAutoMovieScanJointRom.Part): void => {
          findings.push(`staged flight at${seconds}: ${joint.bone} ${part} exceeds anatomical ROM`);
        });
    }
    const raw: IAutoMovieMotionHumanPosture = { ...segment.plan.posture(seconds - segment.start) };
    delete raw.rotation;
    const unturned: IAutoMoviePose = resolveHumanPosture(body, raw);
    if (pose.root === null || unturned.root === null || !qunit(pose.root.rotation) || !qunit(unturned.root.rotation)) {
      findings.push(`staged flight at${seconds} lacks finite unit roots`);
      observable = false;
      independentChecksMs += performance.now() - checksStarted;
      continue;
    }
    const relative: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(Quaternion.inverse(unturned.root.rotation), pose.root.rotation),
    );
    const a: number = 2 * Math.PI * u;
    const b: number = Math.PI * u;
    const expected: IAutoMovieQuaternion = {
      x: Math.sin(a) * Math.cos(b), y: Math.cos(a) * Math.sin(b),
      z: Math.sin(a) * Math.sin(b), w: Math.cos(a) * Math.cos(b),
    };
    if (!(Quaternion.angle(relative, expected) <= 1e-6))
      findings.push(`staged flight at${seconds} does not follow its independently authored attitude`);
    const up: IAutoMovieVector3 = Quaternion.rotateVector(relative, { x: 0, y: 1, z: 0 });
    const radius: number = Math.hypot(up.y, up.z);
    if (!(Number.isFinite(radius) && radius > Math.sqrt(Number.EPSILON))) {
      findings.push(`staged flight at${seconds} has unobservable YZ winding`);
      observable = false;
    } else {
      const angle: number = Math.atan2(up.z, up.y);
      if (index > 0) winding += Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
      previous = angle;
    }
    const actualCentre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(body.massModel, bones);
    const unturnedCentre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(body.massModel, poseBones(body, unturned));
    if (!(Vector3.distance(actualCentre, unturnedCentre) <= 0.005))
      findings.push(`staged flight at${seconds} moves its composed centre by more than5mm`);
    independentChecksMs += performance.now() - checksStarted;
  }
  if (!observable || !(Math.abs(winding - 4 * Math.PI) <= 1e-6))
    findings.push(`staged flight winds${winding / (2 * Math.PI)} turns, expected2`);
  const contactStarted: number = performance.now();
  const slip: number = AutoMovieMotionHumanAuditGround.slip(film, "a", body).value;
  const lift: number = AutoMovieMotionHumanAuditGround.lift(film, "a", body).value;
  const contactAuditsMs: number = performance.now() - contactStarted;
  if (!(Number.isFinite(slip) && slip <= 0.005 && Number.isFinite(lift) && lift <= 0.005))
    findings.push(`staged jump plant slip/lift is${slip}/${lift}m, at most5mm each`);
  const modeStarted: number = performance.now();
  findings.push(...modeIdentity(body));
  const modeChecksMs: number = performance.now() - modeStarted;
  const physicalWork: ReturnType<typeof observation.read> = observation.read();
  const zeroWork: typeof physicalWork = {
    queries: 0, memoHits: 0, uniqueNumericNodes: 0, factorizations: 0, publicJacobi: 0,
    analyticAttempts: 0, analyticAccepted: 0, analyticFallbacks: 0,
  };
  if (Object.keys(physicalWork).length !== Object.keys(zeroWork).length)
    findings.push("staged physical-work observation does not expose the eight declared counters");
  for (const key of Object.keys(zeroWork) as (keyof typeof zeroWork)[])
    if (physicalWork[key] !== 0) findings.push(`staged authoring performed ${key}: ${physicalWork[key]}, expected zero`);
  console.log(JSON.stringify({ sample: "staged-human-flight", phase: "complete", bodyMs, planningMs,
    playback: { pose: timing(poseMs), bonesAfterPose: timing(bonesMs) },
    independentChecksMs, contactAuditsMs, modeChecksMs, physicalWork, findings: findings.length }));
  TestValidator.equals("default staged flight keeps authored geometry and winding", findings, []);
}

/** Public memo identities test policy keys without another turned or physical flight. */
function modeIdentity(body: IAutoMovieMotionHumanBody): string[] {
  const findings: string[] = [];
  const input: IAutoMovieMotionHumanPerformance.IInput = {
    seed: "staged-flight-mode-key",
    performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0,
      proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a").stand({ seconds: 0.1, sway: 0 }).node,
  };
  const implicit: IAutoMovieMotionHumanPerformance = new HumanPerformance(input);
  const undefinedMode: IAutoMovieMotionHumanPerformance = new HumanPerformance({ ...input, flight: undefined });
  const explicit: IAutoMovieMotionHumanPerformance = new HumanPerformance({ ...input, flight: "staged" });
  const physical: IAutoMovieMotionHumanPerformance = new HumanPerformance({ ...input, flight: "physical" });
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  if (!(implicit.segments("a").length === 1 &&
    implicit.segments("a") === undefinedMode.segments("a") &&
    implicit.segments("a") === explicit.segments("a") &&
    implicit.segments("a") !== physical.segments("a")))
    findings.push("omitted, undefined and staged policy must share one resolution while physical owns another");
  for (const storage of ["enumerable", "non-enumerable", "inherited"] as const) {
    const selected: IAutoMovieMotionHumanPerformance = new HumanPerformance(policy(input, "physical", storage));
    if (selected.segments("a") !== physical.segments("a"))
      findings.push(`${storage} physical mode selected a different resolved policy`);
    for (const invalid of [null, "unknown", cyclic]) {
      let refused: boolean = false;
      try {
        new HumanPerformance(policy(input, invalid, storage));
      } catch (error) {
        refused = error instanceof HumanRefusal && error.kind === "parameter" && error.axis === "flight";
        if (!refused) findings.push(`${storage} invalid mode failed outside parameter/flight admission: ${String(error)}`);
      }
      if (!refused) findings.push(`${storage} invalid mode ${String(invalid)} reused or constructed an admitted state`);
    }
  }
  for (const storage of ["enumerable", "non-enumerable", "inherited"] as const) {
    let reads: number = 0;
    const seed: string = `staged-flight-cold-${storage}`;
    const supplied: IAutoMovieMotionHumanPerformance.IInput = { ...input, seed };
    const target: object = storage === "inherited" ? {} : supplied;
    if (storage === "inherited") Object.setPrototypeOf(supplied, target);
    Object.defineProperty(target, "flight", { enumerable: storage === "enumerable",
      get: (): "physical" | "staged" => ++reads === 1 ? "physical" : "staged" });
    const first: IAutoMovieMotionHumanPerformance = new HumanPerformance(supplied);
    const expected: IAutoMovieMotionHumanPerformance = new HumanPerformance({ ...input, seed, flight: "physical" });
    if (reads !== 1 || first.segments("a") !== expected.segments("a"))
      findings.push(`${storage} mode getter was read ${reads} times or its first physical value did not govern resolution`);
  }
  return findings;
}

/** Put only an owned test input's effective property in the requested storage form. */
function policy(input: IAutoMovieMotionHumanPerformance.IInput, value: unknown,
  storage: "enumerable" | "non-enumerable" | "inherited"): IAutoMovieMotionHumanPerformance.IInput {
  const supplied: IAutoMovieMotionHumanPerformance.IInput = { ...input };
  if (storage === "inherited") Object.setPrototypeOf(supplied, { flight: value });
  else Object.defineProperty(supplied, "flight", { value, enumerable: storage === "enumerable" });
  return supplied;
}

/** Summarize only existing observations; nearest ranks never interpolate a measurement. */
function timing(values: readonly number[]): { queries: number; firstMs: number; newTimeP50Ms: number; newTimeP95Ms: number; newTimeMaxMs: number } {
  const ordered: number[] = values.slice(1).sort((a: number, b: number): number => a - b);
  return { queries: values.length, firstMs: values[0]!,
    newTimeP50Ms: ordered[Math.ceil(ordered.length * 0.5) - 1]!,
    newTimeP95Ms: ordered[Math.ceil(ordered.length * 0.95) - 1]!, newTimeMaxMs: ordered[ordered.length - 1]! };
}
