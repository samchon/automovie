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
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditGround,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

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
 * 4. One small stand-only input checks public memo identity: omitted and
 *    explicit undefined/staged modes share one resolution; physical has another.
 *    These two tiny contexts add no second turned film or physical solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual body, noncardinal placement, signed counts, independent quaternion/winding formulas, sampled ROM/contact/COM bounds, all eight physical counters and the two stand-only mode-key contexts across four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs one real default turned performance with a native observer, reads actual roots/joints/FK and the same law's unturned raw articulation, then checks geometric contacts and public mode memo identity. Ignored counts, wrong rotation order/frame/time, nonfinite data, anatomical faults, moved COM, slipping/lifted plants, unexpected physical work or a staged/physical key collision fail.
 * @evidence contracts/development/testing.md#independent-expectations Quaternion multiplication gives the written Rx*Ry components; the long axis is independent of the rightmost Y twist and winds twice. A rigid rotation about a mass-weighted centre leaves that centre fixed. The existing ROM table/scan and5mm campaign bounds govern anatomy/contacts/COM. Zero physical-work events follow the explicit staged product policy, while public resolution identity distinguishes normalized default/staged keys from physical mode.
 * @evidence contracts/development/testing.md#distinguishing-cases One nonzero heading, two full somersaults plus one twist, the whole flight including both boundaries, independent timewise attitude and unwrapped winding, zero-safe finite geometric bounds, all eight counters and omitted/staged/physical modes. This does not certify unsampled motion or physical conservation; unchanged physical flight specifications explicitly opt into that separate mode.
 * @evidence contracts/development/testing.md#execution-ownership One portable named unit borrows one existing canonical body, owns one observed turned performance and two stand-only memo resolutions, and edits only its own unturned posture copy. Public APIs provide every observation; no internal import, test-only law/export, renderer, compiler, process or foreign replacement is used.
 */
export function test_human_motion_staged_flight(): void {
  const findings: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const observation: ReturnType<typeof integrateAirborneRotation.observe> = integrateAirborneRotation.observe();
  const yaw: number = 37;
  const heading: number = yaw * Math.PI / 180;
  const input: HumanPerformance.IInput = {
    seed: "staged-flight-contract",
    performers: [{ subject: "a", body, at: { x: 3, y: 0, z: -2 }, yaw,
      proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a").stand({ seconds: 0.3 })
      .jump({ to: { x: 3 + Math.sin(heading), y: 0, z: -2 + Math.cos(heading) },
        apex: 0.5, rotation: { somersault: 2, twist: 1 } }, "leap").node,
  };
  const film: HumanPerformance = new HumanPerformance(input, observation);
  const segment: HumanSegment.ISegment = film.segments("a")[1]!;
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
  for (let index: number = 0; index <= count; index++) {
    const seconds: number = index === count ? to : from + (to - from) * index / count;
    const u: number = (seconds - from) / (to - from);
    const pose: IAutoMoviePose = film.pose("a", seconds);
    const bones: ReturnType<typeof film.bones> = film.bones("a", seconds);
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
        scanJointRom(joint, constraint, (part: scanJointRom.Part): void => {
          findings.push(`staged flight at${seconds}: ${joint.bone} ${part} exceeds anatomical ROM`);
        });
    }
    const raw: IHumanPosture = { ...segment.plan.posture(seconds - segment.start) };
    delete raw.rotation;
    const unturned: IAutoMoviePose = resolveHumanPosture(body, raw);
    if (pose.root === null || unturned.root === null || !qunit(pose.root.rotation) || !qunit(unturned.root.rotation)) {
      findings.push(`staged flight at${seconds} lacks finite unit roots`);
      observable = false;
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
  }
  if (!observable || !(Math.abs(winding - 4 * Math.PI) <= 1e-6))
    findings.push(`staged flight winds${winding / (2 * Math.PI)} turns, expected2`);
  const slip: number = AutoMovieMotionHumanAuditGround.slip(film, "a", body).value;
  const lift: number = AutoMovieMotionHumanAuditGround.lift(film, "a", body).value;
  if (!(Number.isFinite(slip) && slip <= 0.005 && Number.isFinite(lift) && lift <= 0.005))
    findings.push(`staged jump plant slip/lift is${slip}/${lift}m, at most5mm each`);
  TestValidator.equals("staged authoring performs no physical history or solve work", observation.read(), {
    queries: 0, memoHits: 0, uniqueNumericNodes: 0, factorizations: 0, publicJacobi: 0,
    analyticAttempts: 0, analyticAccepted: 0, analyticFallbacks: 0,
  });
  modeIdentity(body);
  TestValidator.equals("default staged flight keeps authored geometry and winding", findings, []);
}

/** Public memo identities test policy keys without another turned or physical flight. */
function modeIdentity(body: IHumanBody): void {
  const input: HumanPerformance.IInput = {
    seed: "staged-flight-mode-key",
    performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0,
      proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a").stand({ seconds: 0.1, sway: 0 }).node,
  };
  const implicit: HumanPerformance = new HumanPerformance(input);
  const undefinedMode: HumanPerformance = new HumanPerformance({ ...input, flight: undefined });
  const explicit: HumanPerformance = new HumanPerformance({ ...input, flight: "staged" });
  const physical: HumanPerformance = new HumanPerformance({ ...input, flight: "physical" });
  TestValidator.predicate("omitted, undefined and staged policy share one resolution while physical owns another",
    implicit.segments("a").length === 1 &&
    implicit.segments("a") === undefinedMode.segments("a") &&
    implicit.segments("a") === explicit.segments("a") &&
    implicit.segments("a") !== physical.segments("a"));
}
