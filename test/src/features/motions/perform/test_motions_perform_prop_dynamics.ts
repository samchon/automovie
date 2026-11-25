import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieIntegrateMotionTrajectory } from "@automovie/interface";
import { HumanPropDynamics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `HumanPropDynamics` moves a prop under a push: a slide under Newton's second
 * law and Coulomb friction, a hinge under its torque, and the lean balancing a
 * push's reaction.
 *
 * A 10 kg crate with static friction 0.5 and kinetic 0.3.
 *
 * Scenarios:
 *
 * 1. A push within the static friction, 40 N under `0.5 · 10 g`, leaves it at
 *    rest.
 * 2. A steady 60 N push accelerates it at `(60 − 0.3 · 10 g) / 10`, its distance
 *    `a t² / 2` after 2 s.
 * 3. The same push for 1 s and then none: it decelerates at `0.3 g` to a stop at
 *    `1 + v₁ / (0.3 g)` and stays there, `a / 2 + v₁² / (0.6 g)` along.
 * 4. Let go at a declared 1 s, the push's slide is exact at the cut: `a` m/s and
 *    `a / 2` m there, stopping `a² / (0.6 g)` further on.
 * 5. A door of 2 kg m² under 1 N m turns `t² / 4` radians; with the torque
 *    switched off at a declared 1 s it turns on at half a radian a second.
 * 6. A 70 kg body with its centre at 1 m pushing 100 N at its hands' 1.2 m leans
 *    `asin(120 / (70 g))`; a push its weight cannot balance gives none.
 */
export function test_motions_perform_prop_dynamics(): void {
  const g: number = AutoMovieGravity.STANDARD;
  const crate = (
    force: (seconds: number) => number,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory =>
    HumanPropDynamics.slide({
      from: 0,
      to: 4,
      mass: 10,
      friction: 0.5,
      kinetic: 0.3,
      force,
    });

  const held: IAutoMovieIntegrateMotionTrajectory.ITrajectory = crate(
    (): number => 40,
  );
  TestValidator.predicate(
    "within the static friction",
    held.at(4).x[0] === 0 && held.at(4).x[1] === 0,
  );

  const a: number = (60 - 0.3 * 10 * g) / 10;
  const steady: IAutoMovieIntegrateMotionTrajectory.ITrajectory = crate(
    (): number => 60,
  );
  TestValidator.predicate(
    "a steady push",
    nclose(steady.at(2).x[0]!, (a * 4) / 2, 1e-9) &&
      nclose(steady.at(2).x[1]!, a * 2, 1e-9),
  );

  const pulse: IAutoMovieIntegrateMotionTrajectory.ITrajectory = crate(
    (seconds: number): number => (seconds < 1 ? 60 : 0),
  );
  // After the push, from a second past its end: the kinetic deceleration,
  // a stop at `v / (0.3 g)` on, `v² / (0.6 g)` further, then rest.
  const after: readonly number[] = pulse.at(1.2).x;
  const decel: number = 0.3 * g;
  const stop: number = 1.2 + after[1]! / decel;
  TestValidator.predicate(
    "a pulse slides to a stop",
    nclose(pulse.at(1.5).x[1]! - after[1]!, -decel * 0.3, 1e-9) &&
      nclose(
        pulse.at(stop + 0.5).x[0]!,
        after[0]! + (after[1]! * after[1]!) / (2 * decel),
        1e-9,
      ) &&
      pulse.at(stop + 0.5).x[1] === 0 &&
      pulse.at(4).x[0] === pulse.at(stop + 0.5).x[0],
  );
  // The push let go at 1 s, declared: the integration ends there and restarts,
  // so the speed at 1 s is `a`, and the slide stops `a / (0.3 g)` later, `a / 2
  // + a² / (0.6 g)` along, exact to the integrator's rounding.
  const cut: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide({
      from: 0,
      to: 4,
      mass: 10,
      friction: 0.5,
      kinetic: 0.3,
      force: (seconds: number): number => (seconds < 1 ? 60 : 0),
      breaks: [1],
    });
  const halt: number = 1 + a / decel;
  TestValidator.predicate(
    "a push let go at a declared second",
    nclose(cut.at(1).x[1]!, a, 1e-9) &&
      nclose(cut.at(1).x[0]!, a / 2, 1e-9) &&
      nclose(cut.at(halt + 0.5).x[0]!, a / 2 + (a * a) / (2 * decel), 1e-9) &&
      cut.at(halt + 0.5).x[1] === 0,
  );

  const door: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.hinge(2, (): number => 1, 0, 2);
  // A torque switched off at 1 s: `t² / 4` to 1 s, then turning on at half a
  // radian a second, `1 / 4 + (t − 1) / 2`.
  const swung: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.hinge(
      2,
      (seconds: number): number => (seconds < 1 ? 1 : 0),
      0,
      2,
      [1],
    );
  TestValidator.predicate(
    "a door under a torque",
    nclose(door.at(2).x[0]!, 1, 1e-9) &&
      nclose(door.at(2).x[1]!, 1, 1e-9) &&
      nclose(swung.at(1).x[1]!, 0.5, 1e-9) &&
      nclose(swung.at(2).x[0]!, 0.25 + 0.5, 1e-9) &&
      nclose(swung.at(2).x[1]!, 0.5, 1e-9),
  );
  TestValidator.predicate(
    "the lean",
    nclose(
      HumanPropDynamics.lean(70, 1, 100, 1.2)!,
      (Math.asin(120 / (70 * g)) * 180) / Math.PI,
      1e-12,
    ) && HumanPropDynamics.lean(70, 1, 1000, 1.2) === null,
  );
}
