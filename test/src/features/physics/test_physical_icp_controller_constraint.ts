import { physicalIcpController } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * When the support stops the centre of pressure, IHMC's program holds it on the
 * support shrunk by the 2 mm safe distance and puts the rest of the feedback
 * into the pivot's offset, so the pivot leaves the support
 * (`ICPControllerQPSolver` l.643-669, `ConstraintToConvexRegion` l.167-172; the
 * pivot is unconstrained, Zulu's distance outside the support not being a
 * number).
 *
 * Scenarios, a plan at rest at the origin over a 4 cm square support, so the
 * feed-forward is the origin and K = 3 both ways:
 *
 * 1. A forward error of 5 cm: the centre of pressure sits at 2 cm - 2 mm, the
 *    offset dCMP takes the closed form below and the pivot lies outside the
 *    support.
 * 2. A forward error of 4 mm: K e = 1.2 cm stays inside, so the centre of pressure
 *    is the unconstrained one, short of the edge.
 * 3. A diagonal error of 5 cm each way: the centre of pressure sits on the shrunk
 *    square's corner.
 * 4. No support: the same 5 cm error goes unconstrained.
 *
 * Along x with the dCoP held at c, the stationary point of the reference's
 * tasks in dCMP m, with s = c + m, is 10 m + r s + 2 w / k (s / k - e) = 0 (r
 * the rate weight over dt^2, w the dynamics weight counted twice); and
 * unconstrained a c = 10 m, a the CoP weight 0.5 / (3 sqrt 2).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the constraint, its inset and each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the controller and reads the commanded centre of pressure, pivot and feedback pair.
 * @evidence contracts/development/testing.md#independent-expectations The edge is the square's half-width less the reference's 2 mm safe distance, and dCMP is the hand-derived stationary point of the reference's tasks with dCoP at that edge; a missing inset, an uninset or ignored support, a constrained pivot or a wrong split fails it.
 * @evidence contracts/development/testing.md#distinguishing-cases Binding, inactive, corner and empty supports; the unconstrained split, the gains and the brute-force solve belong to the feedback and exactness tests.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states.
 */
export function test_physical_icp_controller_constraint(): void {
  const zulu = physicalIcpController.ZULU;
  const dt: number = 0.004;
  const half: number = 0.02;
  const square = [
    { x: -half, y: -half },
    { x: half, y: -half },
    { x: half, y: half },
    { x: -half, y: half },
  ];
  const run = (
    error: { x: number; y: number },
    support: { x: number; y: number }[] = square,
  ): physicalIcpController.IResult =>
    physicalIcpController({
      state: physicalIcpController.create(),
      support,
      desired: { x: 0, y: 0 },
      desiredVelocity: { x: 0, y: 0 },
      capture: error,
      center: { x: 0, y: 0 },
      omega: Math.sqrt(9.81 / 0.9),
      dt,
    });
  const close = (title: string, actual: number, expected: number): void =>
    TestValidator.predicate(
      `${title}: ${actual} vs ${expected}`,
      Math.abs(actual - expected) <= 1e-9 * Math.max(1e-3, Math.abs(expected)),
    );
  const k: number = 1 + zulu.kpOrthogonal;
  const r: number = zulu.rateWeight / (dt * dt);
  const w: number = 2 * zulu.dynamicsWeight;
  const a: number = zulu.forwardWeight / (Math.sqrt(2) * k);
  const edge: number = half - zulu.safeCopDistance;

  // 1. Binding: dCoP at the shrunk edge, the rest in dCMP.
  const bound: physicalIcpController.IResult = run({ x: 0.05, y: 0 });
  const m: number =
    (-(r + w / (k * k)) * edge + (w / k) * 0.05) /
    (zulu.cmpWeight + r + w / (k * k));
  close("bound CoP", bound.cop.x, edge);
  close("bound dCMP", bound.state.cmpDelta.x, m);
  close("bound CMP", bound.cmp.x, edge + m);
  TestValidator.predicate("pivot outside the support", bound.cmp.x > half);
  TestValidator.predicate(
    "the constraint pushes back",
    a * bound.state.copDelta.x < zulu.cmpWeight * bound.state.cmpDelta.x,
  );

  // 2. Inactive: the unconstrained split, short of the edge.
  const inside: physicalIcpController.IResult = run({ x: 0.004, y: 0 });
  const s: number =
    ((w / k) * 0.004) /
    ((zulu.cmpWeight * a) / (a + zulu.cmpWeight) + r + w / (k * k));
  close(
    "inside CoP",
    inside.cop.x,
    (zulu.cmpWeight * s) / (a + zulu.cmpWeight),
  );
  TestValidator.predicate("inside short of the edge", inside.cop.x < edge);

  // 3. A diagonal error ends on the shrunk corner.
  const corner: physicalIcpController.IResult = run({ x: 0.05, y: 0.05 });
  close("corner x", corner.cop.x, edge);
  close("corner y", corner.cop.y, edge);
  TestValidator.predicate(
    "corner pivot outside",
    corner.cmp.x > half && corner.cmp.y > half,
  );

  // 4. No support, no constraint.
  const free: physicalIcpController.IResult = run({ x: 0.05, y: 0 }, []);
  const t: number =
    ((w / k) * 0.05) /
    ((zulu.cmpWeight * a) / (a + zulu.cmpWeight) + r + w / (k * k));
  close("free CoP", free.cop.x, (zulu.cmpWeight * t) / (a + zulu.cmpWeight));
  TestValidator.predicate("free CoP past the edge", free.cop.x > half);
}
