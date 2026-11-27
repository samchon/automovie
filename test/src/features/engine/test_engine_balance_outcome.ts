import { AutoMovieEngineGravity, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieResolveBalanceOutcome,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The balance outcome of an impulse on a standing body (#3429):
 * `resolveAutoMovieBalanceOutcome`.
 *
 * Every case stands a body of mass `m` with its centre 1 m over the middle
 * of a square base of half-side `b` = 0.1 m, its pendulum `l` = 1 m long,
 * `ω0 = sqrt(g / l)`, a leg's reach 0.9 m, a foot's half-length 0.13 m as
 * the margin, the first step landing 0.458 s after the impulse and each
 * later step swinging 0.238 s (the forward recovery step's landing and swing
 * that `stagger`'s bounds state), the bodies' masses those of `EXTREMES`'
 * lightest and heaviest (38 and 118 kg) and the average man's (76 kg).
 *
 * Scenarios:
 * 1. No impulse on a still body: `absorb`, no step, the velocity unchanged.
 * 2. The absorb bound is `m ω0 b` along the push, within 1e-9 relative, for
 *    pushes along +z, -x and a diagonal; an impulse 1 % under it absorbs and
 *    1 % over it steps.
 * 3. The step bound is `m ω0 (e + d* exp(-ω0 first))` with `e` the centre's
 *    distance to the base's edge along the push and `d* = (reach + margin) a /
 *    (a - 1)`, `a = exp(ω0 step)`, the capture point's fixed point, within
 *    1e-9 relative; 1 % under it steps and 1 % over it falls.
 * 4. Metamorphic: at equal impulse the 118 kg body's velocity change is
 *    38 / 118 of the 38 kg body's within 1e-12 relative, and the heavier
 *    body's outcome is never worse (absorb before step before fall) over a
 *    sweep of 20 impulses.
 * 5. An impulse applied 0.5 m above the centre along +z changes the angular
 *    momentum by `(p - c) × J`, +x here, within 1e-12; applied at the
 *    centre, by nothing.
 * 6. Steps: between the bounds, the number of capture steps never falls as
 *    the impulse grows; every step lies along the push, the first at most a
 *    reach beyond the base's edge and each later one at most a reach beyond
 *    the last foot's front edge, a reach and a half foot from its centre.
 * 7. A non-positive mass, pendulum, reach, step time or first landing, or
 *    an empty base, is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public outcome on closed-form bodies; a velocity change not `J / m`, a bound off its closed form, an outcome that does not flip at its bound, a wrong cross product or a step laid off the push fails.
 * @evidence contracts/development/testing.md#independent-expectations Hof's extrapolated centre against a square base in closed form, the step recurrence's fixed point written out, momentum's `J / m` and the moment `(p - c) × J`.
 * @evidence contracts/development/testing.md#distinguishing-cases Three masses, three directions, both sides of both bounds, a push above and at the centre, a sweep of impulses and the refusals; the perturbation law that plans these outcomes belongs to `test_human_motion_perturb`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of a pure engine function, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios, the bodies and the bounds.
 */
export function test_engine_balance_outcome(): void {
  const findings: string[] = [];
  const half: number = 0.1;
  const length: number = 1;
  const reach: number = 0.9;
  const margin: number = 0.13;
  const step: number = 0.238;
  const first: number = 0.458;
  const w0: number = Math.sqrt(AutoMovieEngineGravity.STANDARD / length);
  const centre: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const support: IAutoMovieVector3[] = [
    { x: -half, y: 0, z: -half },
    { x: half, y: 0, z: -half },
    { x: half, y: 0, z: half },
    { x: -half, y: 0, z: half },
  ];
  const outcome = (
    mass: number,
    impulse: IAutoMovieVector3,
    at?: IAutoMovieVector3,
  ): IAutoMovieResolveBalanceOutcome.IOutcome =>
    AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome({
      centre,
      velocity: { x: 0, y: 0, z: 0 },
      mass,
      impulse,
      ...(at === undefined ? {} : { at }),
      length,
      support,
      reach,
      margin,
      step,
      first,
    });
  const close = (a: number, b: number, tolerance: number): boolean =>
    Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b));

  // 1. Nothing pushes.
  const still: IAutoMovieResolveBalanceOutcome.IOutcome = outcome(76, {
    x: 0,
    y: 0,
    z: 0,
  });
  if (still.outcome !== "absorb" || still.steps.length !== 0)
    findings.push(
      `no impulse: ${still.outcome} with ${still.steps.length} steps`,
    );

  // 2. The absorb bound, three directions.
  const a: number = Math.exp(w0 * step);
  const capturable: number = ((reach + margin) * a) / (a - 1);
  const directions: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 1 },
    { x: -1, y: 0, z: 0 },
    AutoMovieEngineVector3.normalize({ x: 1, y: 0, z: 1 }),
  ];
  for (const mass of [38, 76, 118])
    for (const d of directions) {
      const edge: number = d.x !== 0 && d.z !== 0 ? half * Math.SQRT2 : half;
      const absorb: number = mass * w0 * edge;
      const read: IAutoMovieResolveBalanceOutcome.IOutcome = outcome(
        mass,
        AutoMovieEngineVector3.scale(d, absorb),
      );
      if (!close(read.bounds.absorb, absorb, 1e-9))
        findings.push(
          `${mass} kg along ${JSON.stringify(d)}: absorb bound ${read.bounds.absorb}, closed form ${absorb}`,
        );
      if (outcome(mass, AutoMovieEngineVector3.scale(d, 0.99 * absorb)).outcome !== "absorb")
        findings.push(`${mass} kg: 1 % under the absorb bound does not absorb`);
      if (outcome(mass, AutoMovieEngineVector3.scale(d, 1.01 * absorb)).outcome !== "step")
        findings.push(`${mass} kg: 1 % over the absorb bound does not step`);

      // 3. The step bound.
      const stepped: number =
        mass * w0 * (edge + capturable * Math.exp(-w0 * first));
      if (!close(read.bounds.step, stepped, 1e-9))
        findings.push(
          `${mass} kg: step bound ${read.bounds.step}, closed form ${stepped}`,
        );
      if (outcome(mass, AutoMovieEngineVector3.scale(d, 0.99 * stepped)).outcome !== "step")
        findings.push(`${mass} kg: 1 % under the step bound does not step`);
      if (outcome(mass, AutoMovieEngineVector3.scale(d, 1.01 * stepped)).outcome !== "fall")
        findings.push(`${mass} kg: 1 % over the step bound does not fall`);
    }

  // 4. Mass scales the velocity change; a heavier body is never worse off.
  const rank: Record<string, number> = { absorb: 0, step: 1, fall: 2 };
  for (let k: number = 1; k <= 20; k++) {
    const j: IAutoMovieVector3 = { x: 0, y: 0, z: 10 * k };
    const light: IAutoMovieResolveBalanceOutcome.IOutcome = outcome(38, j);
    const heavy: IAutoMovieResolveBalanceOutcome.IOutcome = outcome(118, j);
    if (!close(heavy.velocity.z, (light.velocity.z * 38) / 118, 1e-12))
      findings.push(
        `${10 * k} N s: velocity changes ${heavy.velocity.z} and ${light.velocity.z} not in the masses' ratio`,
      );
    if (rank[heavy.outcome]! > rank[light.outcome]!)
      findings.push(
        `${10 * k} N s: the 118 kg body ${heavy.outcome}s where the 38 kg body ${light.outcome}s`,
      );
  }

  // 5. The moment of an impulse above the centre.
  const above: IAutoMovieResolveBalanceOutcome.IOutcome = outcome(
    76,
    { x: 0, y: 0, z: 20 },
    { x: 0, y: 1.5, z: 0 },
  );
  if (
    !(
      close(above.angular.x, 10, 1e-12) &&
      Math.abs(above.angular.y) <= 1e-12 &&
      Math.abs(above.angular.z) <= 1e-12
    )
  )
    findings.push(
      `a push 0.5 m above the centre: angular change ${JSON.stringify(above.angular)}, expected (10, 0, 0)`,
    );
  if (AutoMovieEngineVector3.length(outcome(76, { x: 0, y: 0, z: 20 }).angular) !== 0)
    findings.push("a push at the centre changes the angular momentum");

  // 6. Steps grow with the impulse and stay within reach along the push.
  const absorb76: number = 76 * w0 * half;
  const step76: number = 76 * w0 * (half + capturable * Math.exp(-w0 * first));
  let last: number = 0;
  for (let k: number = 1; k < 20; k++) {
    const j: number = absorb76 + ((step76 - absorb76) * k) / 20;
    const read: IAutoMovieResolveBalanceOutcome.IOutcome = outcome(76, {
      x: 0,
      y: 0,
      z: j,
    });
    if (read.outcome !== "step") {
      findings.push(
        `${j.toFixed(1)} N s between the bounds reads ${read.outcome}`,
      );
      continue;
    }
    if (read.steps.length < last)
      findings.push(
        `${j.toFixed(1)} N s takes ${read.steps.length} steps, fewer than ${last} at a smaller impulse`,
      );
    last = read.steps.length;
    let from: IAutoMovieVector3 = { x: centre.x, y: 0, z: centre.z + half };
    let allowed: number = reach;
    for (const s of read.steps) {
      if (Math.abs(s.x) > 1e-12)
        findings.push(`${j.toFixed(1)} N s: a step off the push at x ${s.x}`);
      if (AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(s, from)) > allowed + 1e-12)
        findings.push(`${j.toFixed(1)} N s: a step longer than the reach`);
      from = s;
      allowed = reach + margin;
    }
  }

  // 7. Refusals.
  const props: IAutoMovieResolveBalanceOutcome.IProps = {
    centre,
    velocity: { x: 0, y: 0, z: 0 },
    mass: 76,
    impulse: { x: 0, y: 0, z: 1 },
    length,
    support,
    reach,
    margin,
    step,
  };
  for (const [label, broken] of [
    ["mass", { ...props, mass: 0 }],
    ["length", { ...props, length: -1 }],
    ["reach", { ...props, reach: 0 }],
    ["step", { ...props, step: 0 }],
    ["first", { ...props, first: 0 }],
    ["support", { ...props, support: [] }],
  ] as const)
    TestValidator.error(`a broken ${label} is refused`, (): void => {
      AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(broken);
    });

  TestValidator.predicate(
    `balance outcome: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
