import { physicalAngularMomentumIntegrator } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The smart integrator acts only while the body is stuck, as IHMC's
 * `AngularMomentumIntegrator.update` l.55-88 does: a plan moving faster than
 * the 0.06 m/s threshold clears it; a centre of mass slower than the threshold
 * makes the body stuck, and it stays stuck until the plan moves; while stuck
 * the integral gathers K_i dt e, decays by the leak ratio to the power dt and
 * is held within its maximum length.
 *
 * Scenarios, K_i 2.0 and dt 0.01 s unless set:
 *
 * 1. A moving plan: not stuck, a zero integral, whatever the state was.
 * 2. A slow centre of mass at rest: stuck, the integral 2 * 0.01 * e, then twice
 *    that on the next update.
 * 3. A fast centre of mass after that: still stuck, and the integral grows.
 * 4. A fast centre of mass from a new state: not stuck, a zero integral.
 * 5. The smart integrator off: stuck, but a zero integral.
 * 6. A leak of 0.25 per second over dt 0.5 halves the old integral; a maximum of 1
 *    cm holds a longer one to 1 cm along itself; a K_i under 1e-10 zeroes it.
 * 7. `reset` keeps the integral and clears the flag; a new integrator is not stuck
 *    with a zero integral.
 *
 */
export function test_unit_engine_physics_physical_angular_momentum_integrator(): void {
  const integrator = physicalAngularMomentumIntegrator;
  const still = { x: 0, y: 0 };
  const slow = { x: 0.03, y: 0.02 };
  const fast = { x: 0.1, y: 0 };
  const error = { x: 0.02, y: -0.01 };
  const step = (
    state: physicalAngularMomentumIntegrator.IState,
    desiredVelocity: { x: number; y: number },
    velocity: { x: number; y: number },
    e: { x: number; y: number } = error,
    gains: Partial<physicalAngularMomentumIntegrator.IGains> = {},
    dt: number = 0.01,
  ): physicalAngularMomentumIntegrator.IState =>
    integrator({ state, desiredVelocity, velocity, error: e, dt, gains });
  const close = (
    title: string,
    actual: { x: number; y: number },
    expected: { x: number; y: number },
  ): void =>
    TestValidator.predicate(
      `${title}: ${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`,
      Math.abs(actual.x - expected.x) < 1e-15 &&
        Math.abs(actual.y - expected.y) < 1e-15,
    );

  // 1. A moving plan clears everything.
  const held: physicalAngularMomentumIntegrator.IState = {
    stuck: true,
    integral: { x: 0.01, y: 0.01 },
  };
  TestValidator.equals("moving plan", step(held, { x: 0.05, y: 0.05 }, still), {
    stuck: false,
    integral: { x: 0, y: 0 },
  });

  // 2. Stuck at rest: K_i dt e per update.
  const once: physicalAngularMomentumIntegrator.IState = step(
    integrator.create(),
    still,
    slow,
  );
  TestValidator.equals("stuck", once.stuck, true);
  close("one update", once.integral, {
    x: 2 * 0.01 * 0.02,
    y: 2 * 0.01 * -0.01,
  });
  const twice: physicalAngularMomentumIntegrator.IState = step(
    once,
    still,
    slow,
  );
  close("two updates", twice.integral, {
    x: 2 * 2 * 0.01 * 0.02,
    y: 2 * 2 * 0.01 * -0.01,
  });

  // 3. A fast centre of mass keeps it stuck.
  const thrice: physicalAngularMomentumIntegrator.IState = step(
    twice,
    still,
    fast,
  );
  TestValidator.equals("still stuck", thrice.stuck, true);
  close("three updates", thrice.integral, {
    x: 3 * 2 * 0.01 * 0.02,
    y: 3 * 2 * 0.01 * -0.01,
  });

  // 4. A fast centre of mass from new: not stuck.
  TestValidator.equals("fast new", step(integrator.create(), still, fast), {
    stuck: false,
    integral: { x: 0, y: 0 },
  });

  // 5. The smart integrator off.
  TestValidator.equals(
    "smart off",
    step(integrator.create(), still, slow, error, { smart: false }),
    {
      stuck: true,
      integral: { x: 0, y: 0 },
    },
  );

  // 6. Leak, clamp and the gain cut.
  const old: physicalAngularMomentumIntegrator.IState = {
    stuck: true,
    integral: { x: 0.04, y: 0 },
  };
  close(
    "leak",
    step(old, still, slow, { x: 0, y: 0 }, { leak: 0.25 }, 0.5).integral,
    { x: 0.02, y: 0 },
  );
  close(
    "clamp",
    step(
      { stuck: true, integral: { x: 0.03, y: 0.04 } },
      still,
      slow,
      { x: 0, y: 0 },
      { maximum: 0.01 },
    ).integral,
    { x: 0.006, y: 0.008 },
  );
  TestValidator.equals(
    "gain cut",
    step(old, still, slow, error, { ki: 1e-11 }).integral,
    { x: 0, y: 0 },
  );

  // 7. Reset and create.
  TestValidator.equals("reset", integrator.reset(twice), {
    stuck: false,
    integral: twice.integral,
  });
  TestValidator.equals("create", integrator.create(), {
    stuck: false,
    integral: { x: 0, y: 0 },
  });
}
