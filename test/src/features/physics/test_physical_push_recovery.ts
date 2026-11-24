import {
  physicalPlanarPolygon as Polygon,
  physicalPushRecovery as Recovery,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The push recovery is IHMC 201903's (`PushRecoveryControlModule` l.137-301): a
 * fall out of double support swings the foot farther from the capture point;
 * the swing time shrinks by tenths until a capture region exists; the footstep
 * moves into the region once per recovery, never close to touchdown nor while
 * the error is small.
 *
 * Scenarios, feet 0.2 x 0.1 m centred at y = +-0.1 (y to the left), a 0.6 m
 * range, a 0.1 m foot width and omega 3.2 per second:
 *
 * 1. The capture point 0.3 m right with the plan at the origin swings the left
 *    foot, the right being closer; 0.3 m ahead, equidistant, swings the right,
 *    the left winning the tie.
 * 2. Inside the support, or outside within 0.05 m of the plan, nothing swings; 100
 *    such updates make the robot safe, 99 do not.
 * 3. From a 2 cm left support foot with the capture point 0.12 m right and 0.6 s
 *    left, the preferred swing time is 0.48 s, the first tenth-step whose
 *    prediction, about 0.52 m out, is within reach; 0.001 s left with a 0.002 s
 *    update stays 0.001 s; a capture point 1 m out has none, and the time ends
 *    below zero.
 * 4. With a large error a footstep 0.2 m right of the support moves into the
 *    region, recovering; a second check, recovering, moves nothing; nor does
 *    one with 0.05 s left, nor one with a small error, which counts toward
 *    safe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rules, the fixture and each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each operation on in-memory states and reads the swing, the time, the footstep and the flags.
 * @evidence contracts/development/testing.md#independent-expectations The swing sides follow the reference's distance rule by hand; 0.48 s is where cop + (xi - cop) e^(3.2 t) from the small foot first falls within 0.6 m; the guards are the reference's thresholds.
 * @evidence contracts/development/testing.md#distinguishing-cases Swinging the closer foot, breaking the tie the other way, a safe filter of another window, a time not shrunk by tenths, adjusting twice or near touchdown each fails a scenario.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states and polygons.
 */
export function test_physical_push_recovery(): void {
  const box = (
    cx: number,
    cy: number,
    hx: number,
    hy: number,
  ): Polygon.IPoint[] =>
    Polygon.hull([
      { x: cx - hx, y: cy - hy },
      { x: cx + hx, y: cy - hy },
      { x: cx + hx, y: cy + hy },
      { x: cx - hx, y: cy + hy },
    ]);
  const support: Polygon.IPoint[] = Polygon.hull([
    ...box(0, 0.1, 0.1, 0.05),
    ...box(0, -0.1, 0.1, 0.05),
  ]);
  const feet: { bone: string; centroid: Polygon.IPoint }[] = [
    { bone: "left", centroid: { x: 0, y: 0.1 } },
    { bone: "right", centroid: { x: 0, y: -0.1 } },
  ];
  const double = (
    capture: Polygon.IPoint,
    desired: Polygon.IPoint = { x: 0, y: 0 },
    state: Recovery.IState = Recovery.initial(),
  ): { state: Recovery.IState; swing?: string } =>
    Recovery.doubleSupport({ state, capture, desired, support, feet });

  // 1. The farther foot swings; the left wins a tie.
  TestValidator.equals("lateral", double({ x: 0, y: -0.3 }).swing, "left");
  TestValidator.equals("tie", double({ x: 0.3, y: 0 }).swing, "right");

  // 2. No fall inside or near the plan; safe after a hundred updates.
  TestValidator.equals("inside", double({ x: 0, y: 0 }).swing, undefined);
  TestValidator.equals(
    "near plan",
    double({ x: 0, y: -0.3 }, { x: 0, y: -0.27 }).swing,
    undefined,
  );
  let state: Recovery.IState = Recovery.initial();
  for (let i: number = 0; i < 99; i++)
    state = double({ x: 0, y: 0 }, undefined, state).state;
  TestValidator.equals("99 not safe", state.safe.value, false);
  state = double({ x: 0, y: 0 }, undefined, state).state;
  TestValidator.equals("100 safe", state.safe.value, true);

  // 3. The preferred swing time.
  const region = (capture: Polygon.IPoint): Recovery.IRegion => ({
    support: "left",
    capture,
    omega: 3.2,
    foot: box(0, 0, 0.01, 0.01),
    footWidth: 0.1,
    range: 0.6,
  });
  TestValidator.predicate(
    "shrunk by tenths",
    nclose(
      Recovery.preferredSwingTime({
        remaining: 0.6,
        dt: 0.002,
        region: region({ x: 0, y: -0.12 }),
      }),
      0.48,
      1e-9,
    ),
  );
  TestValidator.equals(
    "within one update",
    Recovery.preferredSwingTime({
      remaining: 0.001,
      dt: 0.002,
      region: region({ x: 0, y: -0.12 }),
    }),
    0.001,
  );
  TestValidator.predicate(
    "none",
    Recovery.preferredSwingTime({
      remaining: 0.6,
      dt: 0.002,
      region: region({ x: 0, y: -1 }),
    }) < 0,
  );

  // 4. The footstep moves once, never near touchdown nor with a small error.
  const check = (
    from: Recovery.IState,
    remaining: number,
  ): ReturnType<typeof Recovery.checkAndUpdate> =>
    Recovery.checkAndUpdate({
      state: from,
      remaining,
      dt: 0.002,
      region: region({ x: 0, y: -0.12 }),
      position: { x: 0, y: -0.2 },
      outline: box(0, -0.2, 0.1, 0.05),
    });
  const large: Recovery.IState = { ...Recovery.initial(), large: true };
  const first: ReturnType<typeof Recovery.checkAndUpdate> = check(large, 0.6);
  TestValidator.predicate(
    "moved into region",
    first.adjusted &&
      first.state.recovering &&
      Polygon.signedDistance(first.region, first.position) <= 1e-9,
  );
  TestValidator.equals("once", check(first.state, 0.5).adjusted, false);
  TestValidator.equals("near touchdown", check(large, 0.05).adjusted, false);
  const small: ReturnType<typeof Recovery.checkAndUpdate> = check(
    Recovery.initial(),
    0.6,
  );
  TestValidator.predicate(
    "small error",
    !small.adjusted && small.state.safe.count === 1,
  );
}
