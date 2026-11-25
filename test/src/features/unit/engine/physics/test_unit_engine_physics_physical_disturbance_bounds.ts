import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../../../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";

/**
 * The pushes the disturbance tests state lie where the inverted pendulum puts
 * them, checked once here so no simulation repeats it.
 *
 * Scenarios, for the four-support primitive and the same body on two diagonal
 * supports, forward and sideways:
 *
 * 1. Ceiling: the in-place bound never exceeds what the centre of pressure held
 *    at the support's edge through the whole 0.1 s pulse absorbs, m omega b
 *    (omega T) / (1 - e^(-omega T)), b the distance to the edge (Hof et al.
 *    2005, Eq. 3 integrated over the pulse): no stance law beats the edge.
 * 2. Order: sustained (half the in-place bound) < in-place < any-step < fall
 *    (one and a half times the any-step bound), and the four-support
 *    primitive's forward recover push lies strictly inside its one-step window.
 * 3. Anchor: the primitive's forward one-step bound lies within Koolen et al.'s Eq. 25 for
 *    the step times the literature reports, 0.3 to 0.6 s (Khadiv et al. 2017,
 *    Section V; Pratt et al., M2V2, IX-B).

 *
 * @evidence contracts/development/common.md#meaningful-documentation States each bound, its closed form and its source.
 * @evidence contracts/development/testing.md#behavioral-verification Computes `PhysicalDisturbance.bounds`, `.window` and `.impulse` on the two subjects and compares them with closed forms.
 * @evidence contracts/development/testing.md#independent-expectations The ceiling is the linear inverted pendulum's closed form with the centre of pressure at the edge; the anchor is Koolen et al.'s Eq. 25 at literature step times; neither is computed by the bound under test.
 * @evidence contracts/development/testing.md#distinguishing-cases A bound integrated past the edge fails the ceiling, a recover push outside the one-step window fails the order, and a step time outside 0.3 to 0.6 s fails the anchor; the simulated outcomes are the `test_physical_disturbance_*` runs.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on the synthetic primitive profile, two and four supports; no figure build, simulation, viewer or file host.
 */
export function test_unit_engine_physics_physical_disturbance_bounds(): void {
  const failures: string[] = [];
  const subjects: [string, PhysicalDisturbance.ISubject][] = [
    [
      "two",
      PhysicalDisturbance.planted(PhysicalModelFixtures.quadrupod(), {
        "support-0": ["support-0"],
        "support-3": ["support-3"],
      }),
    ],
    ["quad", PhysicalDisturbance.planted(PhysicalModelFixtures.quadrupod())],
  ];
  const T: number = 0.1;
  for (const [name, subject] of subjects)
    for (const axis of ["z", "x"] as const) {
      const label: string = `${name}/${axis}`;
      const pushes: PhysicalDisturbance.IPushes = PhysicalDisturbance.bounds(
        subject,
        axis,
      );
      const { mass, omega, from, high } = PhysicalDisturbance.pendulum(
        subject,
        axis,
      );
      const ceiling: number =
        (mass * omega * (high - from) * (omega * T)) /
        (1 - Math.exp(-omega * T));
      if (!(pushes.place > 0 && pushes.place <= ceiling * (1 + 1e-3)))
        failures.push(
          `${label}: in-place bound ${pushes.place} N s outside (0, ${ceiling}]`,
        );
      const sustained: number = PhysicalDisturbance.impulse(
        subject,
        "sustained",
        axis,
      );
      const fall: number = PhysicalDisturbance.impulse(subject, "fall", axis);
      if (
        !(sustained < pushes.place && pushes.place < pushes.any && pushes.any < fall)
      )
        failures.push(`${label}: pushes out of order ${JSON.stringify(pushes)}`);
      // The four-support primitive's forward push has a one-step window, the
      // recover case's; on two diagonal supports the remaining one stands
      // behind the centre of mass, so a step leaves none.
      if (axis === "z" && name === "quad") {
        const recover: number = PhysicalDisturbance.impulse(
          subject,
          "recover",
          axis,
        );
        if (!(pushes.place < recover && recover < pushes.step))
          failures.push(
            `${label}: recover push ${recover} N s outside the one-step window ${JSON.stringify(pushes)}`,
          );
        const slow: number = PhysicalDisturbance.window(subject, axis, 0.6).step;
        const fast: number = PhysicalDisturbance.window(subject, axis, 0.3).step;
        if (!(pushes.step >= slow - 1e-9 && pushes.step <= fast + 1e-9))
          failures.push(
            `${label}: one-step bound ${pushes.step} N s outside Koolen's Eq. 25 at 0.3-0.6 s, [${slow}, ${fast}]`,
          );
      }

    }
  TestValidator.equals("disturbance bounds", failures, []);
}
