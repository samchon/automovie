import {
  type IAutoMovieProjectile,
  projectileAt,
  projectileFirstContact,
} from "@automovie/engine";
import { HumanPropOutcome, type IHumanProp } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** The real continuation callbacks, without a second collision implementation. */
type Input = Parameters<typeof HumanPropOutcome.legs>[0];

/**
 * Certified departure preserves a real rebound and still detects its later return.
 *
 * Scenarios:
 * 1. An initial approaching point at a plane reports contact at zero. After
 *    unit elastic rebound under zero gravity, the actual opted-in sweep has
 *    no new entry, and the one continued leg reaches y=1 m at t=1 s.
 * 2. With downward acceleration 2 m/s² the same outgoing 1 m/s returns at
 *    2v/g=1 s, then returns again at t=2 s within a 2.25 s window. Both real contacts survive a
 *    sweep whose configured step spans the whole horizon; at t=0.5 and 1.5
 *    both completed arcs reach the independent peak 0.25 m with zero normal speed, then a third flight remains unended.
 * 3. The continuation supplies the resolved collider through departing and
 *    leaves the pass-only exclusion unset, so no collider is blacklisted to
 *    manufacture an unended flight.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs actual continuation planning, opted-in engine plane contact search and leg sampling, checking contact identity, callback arguments, leg endpoints, peak/world positions and velocities. Missing opt-in, a zero-time loop, permanent collider exclusion or a shifted clock fails.
 * @evidence contracts/development/testing.md#independent-expectations A unit outgoing speed under zero gravity gives y=t. Constant downward acceleration 2 yields y=t-t², return time 1 s and peak 0.25 m at 0.5 s; a unit elastic rebound repeats that arc at launch-relative t=1.5. The 2.25 s window places two contacts strictly inside it and the next at 3 s outside it, avoiding an event-presence assertion at a numerically bisected window endpoint. These authored quantities are independent of the resolver's 24 bisections; existing finite-aware nclose/vclose tolerances remain 1e-6. The point-contact model and fixed plane match the certificate's explicit supported domain.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts monotone departure and gravity-return/repeated entry inside a finite horizon, preserves default initial approaching contact, and distinguishes bounce departing from pass exclusion. The neighboring clock test retains malformed/raw-query nonprogression refusals and the exact horizon boundary; engine contact tests own unsupported attitudes and initial-overlap defaults.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous entry provides explicit body vectors and callbacks that call the real engine rather than replace a foreign method; it builds no Human or host. Callback counts have a fixture-only unexpected-call marker, without adding a production bounce limit.
 * @evidence contracts/development/common.md#meaningful-documentation Lists three scenarios, the resolved-contact opt-in, independent SI arc equations, same-horizon reentry, default contact preservation and fixed-plane scope.
 */
export function test_human_prop_outcome_departure(): void {
  const findings: string[] = [];
  const prop: IHumanProp = {
    subject: "departure sphere",
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
  const plane: projectileFirstContact.ICollider = projectileFirstContact.plane(
    "resolved plane",
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  );
  const horizon: number = 2.25;
  for (const gravity of [0, -2]) {
    const projectile: IAutoMovieProjectile = {
      origin: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: -1, z: 0 },
      gravity: { x: 0, y: gravity, z: 0 },
    };
    const initial: ReturnType<typeof projectileFirstContact> =
      projectileFirstContact(
        projectile,
        [plane],
        { from: 0, to: horizon },
        { radius: 0, thickness: Number.MAX_VALUE },
      );
    if (
      initial === null ||
      !nclose(initial.time, 0, 0) ||
      initial.collider !== plane.id
    ) {
      findings.push(`${gravity}: default approaching contact was lost`);
      continue;
    }
    let queries: number = 0;
    let contacts: number = 0;
    const input: Input = {
      prop,
      projectile,
      meeting: { hit: initial, collider: plane.id, struck: { kind: "ground" } },
      horizon,
      meet: (
        p: IAutoMovieProjectile,
        base: number,
        leave?: string,
        departing?: string,
      ): HumanPropOutcome.IMeeting | null => {
        queries++;
        if (queries > 3)
          throw new Error(
            "unexpected additional sweep in the analytic fixture",
          );
        if (leave !== undefined || departing !== plane.id)
          findings.push(
            `${gravity}: bounce lost its separate departure argument`,
          );
        const hit: ReturnType<typeof projectileFirstContact> =
          projectileFirstContact(
            p,
            [plane],
            { from: 0, to: horizon - base },
            {
              radius: 0,
              thickness: Number.MAX_VALUE,
              ...(departing === undefined ? {} : { departing }),
            },
          );
        return hit === null
          ? null
          : { hit, collider: plane.id, struck: { kind: "ground" } };
      },
      settle: (
        meeting: HumanPropOutcome.IMeeting,
        p: IAutoMovieProjectile,
      ): ReturnType<Input["settle"]> => {
        contacts++;
        return {
          struck: meeting.struck,
          point: meeting.hit.point,
          normal: meeting.hit.normal!,
          velocity: projectileAt(p, meeting.hit.time).velocity,
          offset: prop.frame,
          outcome: "bounce",
        };
      },
    };
    try {
      const legs: HumanPropOutcome.ILeg[] = HumanPropOutcome.legs(input);
      if (gravity === 0) {
        if (
          legs.length !== 1 ||
          queries !== 1 ||
          contacts !== 0 ||
          legs[0]?.end !== Infinity
        )
          findings.push(
            "zero gravity: departure was stopped or queried repeatedly",
          );
        else {
          const state: ReturnType<typeof HumanPropOutcome.at> =
            HumanPropOutcome.at(legs[0]!, 1);
          if (
            !vclose(state.position, { x: 0, y: 1, z: 0 }) ||
            !vclose(state.velocity, { x: 0, y: 1, z: 0 })
          )
            findings.push("zero gravity: outgoing flight changed");
        }
      } else if (
        legs.length !== 3 ||
        queries !== 3 ||
        contacts !== 2 ||
        !nclose(legs[0]?.end ?? NaN, 1) ||
        !nclose(legs[1]?.from ?? NaN, 1) ||
        !nclose(legs[1]?.end ?? NaN, 2) ||
        !nclose(legs[2]?.from ?? NaN, 2) ||
        legs[2]?.end !== Infinity
      )
        findings.push(
          "gravity return: a real later plane entry was lost or shifted",
        );
      else
        for (const [index, at] of [
          [0, 0.5],
          [1, 1.5],
        ] as const) {
          const state: ReturnType<typeof HumanPropOutcome.at> =
            HumanPropOutcome.at(legs[index]!, at);
          if (
            !vclose(state.position, { x: 0, y: 0.25, z: 0 }) ||
            !vclose(state.velocity, { x: 0, y: 0, z: 0 })
          )
            findings.push(
              `gravity return: leg ${index} disagrees with the independent peak`,
            );
        }
    } catch (error) {
      findings.push(
        `${gravity}: physical departure was refused ${String(error)}`,
      );
    }
  }
  TestValidator.equals(
    "resolved plane contacts depart and return without a clock nudge",
    findings,
    [],
  );
}
