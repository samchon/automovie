import {
  boxExcludedSwivels,
  boxLeastSwivels,
  hingedSwivelFeasible,
  immobileAxisSwivels,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A chain root turned about a fixed axis by the swivel reads its joint limits
 * as sinusoids of the swivel (Tolani, Goswami and Badler 2000):
 * `boxExcludedSwivels` tests whether a swivel interval is refused in both
 * Euler charts, `hingedSwivelFeasible` returns the complement arcs,
 * `immobileAxisSwivels` the swivels where an immobile axis reads neutral, and
 * `boxLeastSwivels` the least-violation candidates.
 *
 * Fixture: the default basis (flexion x, abduction z, twist y); the rotation by
 * swivel s is s degrees about the twist axis, so the principal chart reads (0,
 * 0, +-s) and the alternate chart flexion 180.
 *
 * Scenarios:
 *
 * 1. Flexion and abduction within 10 and twist within 30: the alternate chart is
 *    refused throughout (flexion 180), the principal past twist 30, so [60, 120]
 *    is refused and [-10, 10] is not; the feasible swivels are one arc from 330
 *    to 390 within 0.05 (the tolerance margin).
 * 2. The same with an immobile twist (null): the neutral swivels are 0 and 180.
 * 3. No constraint: nothing refused, every swivel feasible, no immobile or least
 *    analysis (null).
 */
export function test_unit_engine_kinematics_box_swivels(): void {
  const basis: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 0, y: 1, z: 0 },
  };
  const rotation = (swivel: number): IAutoMovieQuaternion => {
    const h: number = (swivel * Math.PI) / 360;
    return { x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) };
  };
  const box: IAutoMovieJointConstraint = {
    flexion: { min: -10, max: 10 },
    abduction: { min: -10, max: 10 },
    twist: { min: -30, max: 30 },
  };

  // 1.
  const refused = boxExcludedSwivels({ basis, constraint: box, rotation });
  TestValidator.equals("refused", [refused(60, 120), refused(-10, 10)], [true, false]);
  const feasible = hingedSwivelFeasible({ basis, constraint: box, rotation });
  TestValidator.predicate(
    "feasible",
    feasible !== "all" && feasible.length === 1 && Math.abs(feasible[0]!.from - 330) <= 0.05 && Math.abs(feasible[0]!.to - 390) <= 0.05,
  );

  // 2.
  const neutral: number[] | null = immobileAxisSwivels({ basis, constraint: { ...box, twist: null }, rotation });
  const sorted: number[] = (neutral ?? []).slice().sort((a: number, b: number): number => a - b);
  TestValidator.predicate("neutral", sorted.length === 2 && Math.abs(sorted[0]!) <= 1e-9 && Math.abs(sorted[1]! - 180) <= 1e-9);

  // 3.
  TestValidator.equals("free refuses nothing", boxExcludedSwivels({ basis, constraint: null, rotation })(0, 360), false);
  TestValidator.equals("free feasible", hingedSwivelFeasible({ basis, constraint: null, rotation }), "all");
  TestValidator.equals(
    "no analysis",
    [immobileAxisSwivels({ basis, constraint: null, rotation }), boxLeastSwivels({ basis, constraint: null, rotation })],
    [null, null],
  );
}
