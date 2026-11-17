import type { IAutoMovieMotionHumanProp, IAutoMovieMotionHumanPropOutcome, IAutoMovieProjectile, IAutoMovieProjectileFirstContact } from "@automovie/interface";
import { projectileAt, projectileFirstContact } from "@automovie/engine";
import { HumanPropOutcome, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** The actual continuation seam, including its explicitly injected sweep. */
type Input = Parameters<typeof HumanPropOutcome.legs>[0];

/**
 * A continued flight refuses a stuck clock instead of repeating one contact forever.
 *
 * Scenarios:
 * 1. Nonfinite/negative horizons and first-contact times refuse before any
 *    sweep or settlement; a zero horizon and a first hit at the horizon
 *    return no continuation. An initial contact at zero is valid.
 * 2. A later zero, negative, nonfinite or non-advancing rounded contact time
 *    refuses before settlement or another sweep. Finite addition overflow
 *    also refuses instead of becoming an infinite-ended recorded contact.
 * 3. The real engine floor search started on a departing floor contact
 *    returns hit0; that actual callback result is refused explicitly rather
 *    than producing zero-duration bounce legs.
 * 4. An analytic initial contact at 0.25 s and a later relative contact at
 *    0.5 s produce leg clocks 0.25→0.75 and 0.75→Infinity. Sampling each leg
 *    at its midpoint reaches y=0 with respective velocities +1 and -1 m/s,
 *    without a frame grid, guessed epsilon or bounce limit.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real continuation loop with in-memory sweep callbacks and the real engine floor sweep, asserting located HumanRefusal and callback counts or the returned leg clocks. A repeated-clock loop, premature settlement, ignored overflow or shifted valid time fails.
 * @evidence contracts/development/testing.md#independent-expectations Continuation times add the previous absolute launch to the next relative hit; 0.25+0.5=0.75 s exactly in binary. Unit speed carries the first rebound from y=-0.25 to y=0 at t=0.5 and the next from y=0.25 to y=0 at t=1. Zero is a valid first instant but cannot advance a later instant. MAX_VALUE/2+MAX_VALUE overflows, and MIN_VALUE added to 0.25 rounds back to 0.25. The authored unit restitution and zero gravity keep the fixture outside radius-based settlement.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts initial zero with repeated zero, finite horizons with NaN/infinity/negative values, valid future contacts with negative/nonfinite/rounded/overflowing clocks, a real departing-floor query and a valid two-leg chain. Existing projectile tests own trajectory and geometric impact accuracy; this entry owns continuation clock admission and explicitly exposes the floor departure limitation.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous portable entry calls explicit in-memory callbacks and engine geometry without constructing a Human or starting a host. Invalid callbacks throw their own bounded test marker on a second call, so a missing production guard fails without hanging the test runner.
 * @evidence contracts/development/common.md#meaningful-documentation Lists four scenarios, independent clock arithmetic, the actual floor-search limitation and the distinction between a first contact at zero and a later nonprogressing contact.
 */
export function test_human_prop_outcome_clock(): void {
  const findings: string[] = [];
  const projectile: IAutoMovieProjectile = {
    origin: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: -1, z: 0 },
    gravity: { x: 0, y: 0, z: 0 },
  };
  const prop: IAutoMovieMotionHumanProp = {
    subject: "clock sphere",
    frame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    body: { mass: 1, centerOfMass: null, friction: 0, restitution: 1 },
    shapes: [
      {
        id: "sphere",
        kind: "sphere",
        radius: 0.1,
        material: "authored fixture",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
      },
    ],
  };

  /** Authored contact clocks isolate protocol admission from geometric estimation. */
  const meeting: (
    time: number,
    height?: number,
    normal?: number,
  ) => IAutoMovieMotionHumanPropOutcome.IMeeting = (
    time: number,
    height: number = -time,
    normal: number = 1,
  ): IAutoMovieMotionHumanPropOutcome.IMeeting => ({
    hit: {
      time,
      point: { x: 0, y: height, z: 0 },
      normal: { x: 0, y: normal, z: 0 },
    },
    collider: "analytic plane",
    struck: { kind: "ground" },
  });
  let sweeps: number = 0;
  let settlements: number = 0;

  /** Settlement is a real returned contact record, never a foreign-method replacement. */
  const settle: Input["settle"] = (
    met: IAutoMovieMotionHumanPropOutcome.IMeeting,
    p: IAutoMovieProjectile,
  ): ReturnType<Input["settle"]> => {
    settlements++;
    return {
      struck: met.struck,
      point: met.hit.point,
      normal: met.hit.normal!,
      velocity: projectileAt(p, met.hit.time).velocity,
      offset: prop.frame,
      outcome: "bounce",
    };
  };

  /** Every case uses the maintained callback boundary and one analytic body. */
  const input: (first: number, horizon: number, next?: number) => Input = (
    first: number,
    horizon: number,
    next?: number,
  ): Input => ({
    prop,
    projectile,
    meeting: meeting(first),
    horizon,
    settle,
    meet: (): IAutoMovieMotionHumanPropOutcome.IMeeting | null => {
      sweeps++;
      if (sweeps > 1 && next !== undefined)
        throw new Error("invalid callback repeated without clock refusal");
      return next === undefined ? null : meeting(next);
    },
  });

  /** A time refusal must happen before a contact is settled or queried again. */
  const refused: (
    label: string,
    axis: string,
    props: Input,
    calls: number,
  ) => void = (
    label: string,
    axis: string,
    props: Input,
    calls: number,
  ): void => {
    sweeps = 0;
    settlements = 0;
    try {
      HumanPropOutcome.legs(props);
      findings.push(`${label}: invalid clock was admitted`);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || error.axis !== axis)
        findings.push(`${label}: wrong refusal ${String(error)}`);
    }
    if (sweeps !== calls || settlements !== 0)
      findings.push(
        `${label}: reached ${sweeps} sweeps and ${settlements} settlements before refusal`,
      );
  };
  for (const value of [NaN, Infinity, -Infinity, -1]) {
    refused(`horizon ${value}`, "horizon", input(0, value), 0);
    refused(`first ${value}`, "contact.time", input(value, 2), 0);
  }
  for (const [first, horizon] of [
    [0, 0],
    [2, 2],
  ] as const) {
    sweeps = 0;
    settlements = 0;
    if (
      HumanPropOutcome.legs(input(first, horizon)).length !== 0 ||
      sweeps !== 0 ||
      settlements !== 0
    )
      findings.push(
        "a contact at the horizon requested an invisible continuation",
      );
  }
  for (const next of [0, -1, NaN, Infinity, -Infinity, Number.MIN_VALUE])
    refused(`next ${next}`, "contact.time", input(0.25, 2, next), 1);
  refused(
    "absolute addition overflow",
    "contact.time",
    input(Number.MAX_VALUE / 2, Number.MAX_VALUE, Number.MAX_VALUE),
    1,
  );

  sweeps = 0;
  settlements = 0;
  const floor: Input = input(0, 2);
  const ground: IAutoMovieProjectileFirstContact.ICollider = projectileFirstContact.plane(
    "floor",
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  );
  const initial: ReturnType<typeof projectileFirstContact> =
    projectileFirstContact(
      projectile,
      [ground],
      { from: 0, to: 2 },
      { radius: 0, thickness: 1 },
    );
  if (
    initial === null ||
    !nclose(initial.time, 0, 0) ||
    initial.collider !== ground.id
  )
    findings.push(
      "an initial approaching contact did not identify the floor at zero",
    );
  if (initial !== null)
    floor.meeting = {
      hit: initial,
      collider: ground.id,
      struck: { kind: "ground" },
    };
  floor.meet = (p: IAutoMovieProjectile): IAutoMovieMotionHumanPropOutcome.IMeeting | null => {
    sweeps++;
    if (sweeps > 1)
      throw new Error("departing floor contact repeated without refusal");
    const hit: ReturnType<typeof projectileFirstContact> =
      projectileFirstContact(
        p,
        [ground],
        { from: 0, to: 2 },
        { radius: 0, thickness: 1 },
      );
    return hit === null
      ? null
      : { hit, collider: "floor", struck: { kind: "ground" } };
  };
  refused("actual departing-floor hit", "contact.time", floor, 1);

  sweeps = 0;
  settlements = 0;
  const valid: Input = input(0.25, 2);
  valid.meet = (): IAutoMovieMotionHumanPropOutcome.IMeeting | null =>
    ++sweeps === 1 ? meeting(0.5, 0.25, -1) : null;
  const legs: IAutoMovieMotionHumanPropOutcome.ILeg[] = HumanPropOutcome.legs(valid);
  if (
    legs.length !== 2 ||
    !nclose(legs[0]?.from ?? NaN, 0.25, 0) ||
    !nclose(legs[0]?.end ?? NaN, 0.75, 0) ||
    !nclose(legs[1]?.from ?? NaN, 0.75, 0) ||
    legs[1]?.end !== Infinity ||
    sweeps !== 2 ||
    settlements !== 1
  )
    findings.push("valid relative-to-absolute contact clocks changed");
  if (legs.length === 2) {
    const ascending: ReturnType<typeof HumanPropOutcome.at> =
      HumanPropOutcome.at(legs[0]!, 0.5);
    const descending: ReturnType<typeof HumanPropOutcome.at> =
      HumanPropOutcome.at(legs[1]!, 1);
    if (
      !vclose(ascending.position, { x: 0, y: 0, z: 0 }) ||
      !vclose(ascending.velocity, { x: 0, y: 1, z: 0 }) ||
      !vclose(descending.position, { x: 0, y: 0, z: 0 }) ||
      !vclose(descending.velocity, { x: 0, y: -1, z: 0 })
    )
      findings.push(
        "leg readers did not preserve the independent launch-relative trajectory",
      );
  }
  TestValidator.equals(
    "flight continuations require a progressing clock",
    findings,
    [],
  );
}
