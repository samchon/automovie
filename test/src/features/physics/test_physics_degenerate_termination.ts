import {
  AutoMovieStepPlanner as Planner,
  resolveAutoMovieContactEvents,
} from "@automovie/engine";
import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { throwsError } from "../internal/throwsError";

/**
 * The step planner's clock and the contact scan's grid end on every finite
 * input, the degenerate ones that once never ended included.
 *
 * Scenarios:
 * 1. A step planner over [1e20, 1e20 + 1e6] s, where doubles lie 16384 s
 *    apart, sampling at 120 Hz, whose period no longer moves the clock, is
 *    refused; the same planner over [0, 2] s builds its schedule.
 * 2. A weapon resting inside a wall and live from 1e7 + 0.3 s, past 2^23 s
 *    where adjacent doubles lie farther apart (1.86e-9 s) than the scan's
 *    1e-9 s resolution, on a 1/120 s grid from 1e7 s, is reported against
 *    the wall at its first live second: the halving toward an unmeasured
 *    clear end stops at adjacent doubles.
 * 3. A contact span to an infinite end, and a step (1e-20 s) whose count
 *    over one second passes 2^53, are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public planner and contact resolver on inputs whose loops did not end before the termination fixes (a clock period under the time resolution, a bracket of adjacent doubles wider than the resolution, an unbounded or uncountable grid) and asserts the refusals and the reported contact; a loop without a bound never returns, and a contact at another second or against another body fails.
 * @evidence contracts/development/testing.md#independent-expectations The spacing of doubles at 1e20 (2^14) and at 1e7 (2^-29) are binary64 facts; a weapon inside the wall from the moment it is live touches at that moment; 1 / 1e-20 = 1e20 steps exceeds 2^53.
 * @evidence contracts/development/testing.md#distinguishing-cases A refused and an ordinary planner clock; a late-live weapon past 2^23 s; an infinite span and an uncountable step. Ordinary contact resolution is owned by the contact-event tests and planning by the physical planner tests.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit test of public engine functions over the shared physical fixtures, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_physics_degenerate_termination(): void {
  // 1. A clock period under the time resolution.
  const pattern: IAutoMovieStepPlanner.IInput["pattern"] =
    PhysicalSupportFixtures.body(PhysicalModelFixtures.quadrupod(), 0).balance!
      .pattern;
  const planner = (start: number, span: number): IAutoMovieStepPlanner =>
    new Planner({
      pattern,
      start,
      end: start + span,
      rate: 120,
      desired: (
        seconds: number,
      ): Record<string, IAutoMovieStepPlanner.IPlacement> =>
        Object.fromEntries(
          pattern.limbs.map(
            (
              limb: (typeof pattern.limbs)[number],
            ): [string, IAutoMovieStepPlanner.IPlacement] => [
              limb.bone,
              {
                point: [seconds - start, limb.offset.left],
                yaw: 0,
                pitch: 0,
                clearance: 0,
              },
            ],
          ),
        ),
      heading: (): number => 0,
      reservations: [],
      duration: 0.2,
      threshold: 0.1,
      height: 0.04,
      maximumStride: 0.6,
      overlap: 0,
      reservationMargin: 0,
      margin: 0,
      yawLever: 0,
      pitchLever: 0,
      alternationWindow: 0,
    });
  TestValidator.predicate(
    "a period that no longer moves the clock is refused",
    throwsError((): unknown => planner(1e20, 1e6), "resolution"),
  );
  TestValidator.predicate(
    "the same planner from zero builds its schedule",
    planner(0, 2).steps.length > 0,
  );

  // 2. A late-live weapon past 2^23 s.
  const from: number = 1e7;
  const live: number = from + 0.3;
  const inside: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const input = (
    change: Partial<IAutoMovieResolveContactEvents.IInput>,
  ): IAutoMovieResolveContactEvents.IInput => ({
    weapons: [
      {
        id: "fist",
        owner: "S",
        radius: 0.05,
        from: live,
        position: (): IAutoMovieVector3 => inside,
      },
    ],
    bodies: [{ id: "wall", distance: (p: IAutoMovieVector3): number => -p.x }],
    from,
    to: from + 1,
    step: 1 / 120,
    ...change,
  });
  const events: IAutoMovieResolveContactEvents.IEvent[] =
    resolveAutoMovieContactEvents(input({}));
  TestValidator.predicate(
    "a late-live weapon past 2^23 s touches at its first live second",
    events.length === 1 &&
      events[0]!.against === "wall" &&
      events[0]!.seconds === live,
  );

  // 3. Unbounded and uncountable grids.
  TestValidator.predicate(
    "an infinite span end is refused",
    throwsError((): unknown =>
      resolveAutoMovieContactEvents(input({ to: Infinity })),
    ),
  );
  TestValidator.predicate(
    "a step count past 2^53 is refused",
    throwsError((): unknown =>
      resolveAutoMovieContactEvents(input({ step: 1e-20 })),
    ),
  );
}
