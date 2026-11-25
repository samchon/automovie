import { AutoMovieGravity, integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanForceExchange,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanForceDrawn,
  HumanForceExchange,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** The scenarios of `test_unit_motions_grappling_force_drawn`. */
namespace ScenarioForceDrawn {
  /**
   * `HumanForceDrawn` is a body drawn off balance by a constant force against its
   * own inverted-pendulum stiffness: the offset `a (cosh ωt − 1)` with `a = F /
   * (m ω²)`, its speed `a ω sinh ωt`, and the extrapolated offset `x + v / ω`.
   *
   * A 70 kg body at ω = 3 /s is pulled by 63 N: `a = 63 / (70 · 9) = 0.1` m.
   *
   * Scenarios:
   *
   * 1. At 0 s nothing has moved; before it the state is the start's.
   * 2. At 1 s the offset is `0.1 (cosh 3 − 1)`, the speed `0.3 sinh 3`, and the
   *    extrapolation their sum over ω; the prepared motion agrees.
   */
  export function test_unit_motions_grappling_force_drawn(): void {
    const props: HumanForceDrawn.IProps = { mass: 70, frequency: 3, force: 63 };
    const start: HumanForceDrawn.IState = HumanForceDrawn.sample({
      ...props,
      seconds: -1,
    });
    TestValidator.equals("at rest at the start", start, {
      offset: 0,
      speed: 0,
      extrapolated: 0,
    });
    const at: HumanForceDrawn.IState = HumanForceDrawn.sample({
      ...props,
      seconds: 1,
    });
    const offset: number = 0.1 * (Math.cosh(3) - 1);
    const speed: number = 0.3 * Math.sinh(3);
    TestValidator.predicate(
      "the closed form at 1 s",
      nclose(at.offset, offset, 1e-12) &&
        nclose(at.speed, speed, 1e-12) &&
        nclose(at.extrapolated, offset + speed / 3, 1e-12) &&
        nclose(HumanForceDrawn.prepare(props).offset(1), offset, 1e-12) &&
        nclose(HumanForceDrawn.prepare(props).sample(1).speed, speed, 1e-12) &&
        HumanForceDrawn.prepare(props).sample(-1).offset === 0,
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_breaking`. */
namespace ScenarioForceExchangeBreaking {
  /**
   * `HumanForceExchange.breaking` is the constant pull that breaks a base at a
   * declared instant: a linear inverted pendulum's extrapolated centre `(F / M
   * ω²)(e^{ωT} - 1)` reaches the base's edge `e`, so `F = e M ω² / (e^{ωT} - 1)`
   * (Hof, Gazendam and Sinke 2005).
   *
   * A 70 kg partner at ω = 3 /s on a base 0.1 m deep.
   *
   * Scenarios:
   *
   * 1. Broken in 1 s, the pull is `63 / (e³ - 1)` N.
   * 2. Broken in half the time, the pull is larger.
   * 3. A non-positive instant is a caller's defect and throws.
   */
  export function test_unit_motions_grappling_force_exchange_breaking(): void {
    const at = (seconds: number): number =>
      HumanForceExchange.breaking({
        mass: 70,
        frequency: 3,
        edge: 0.1,
        seconds,
      });
    TestValidator.predicate(
      "the breaking pull",
      nclose(at(1), 63 / (Math.exp(3) - 1), 1e-9) &&
        at(0.5) > at(1) &&
        throwsError((): number => at(0)),
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_broken`. */
namespace ScenarioForceExchangeBroken {
  /**
   * `HumanForceExchange.broken` is when a constant pull breaks a base, `T = ln(1
   *
   * - E M ω² / F) / ω`, the inverse of `breaking`.
   *
   * A 70 kg partner at ω = 3 /s on a base 0.1 m deep; `e M ω²` is 63 N.
   *
   * Scenarios:
   *
   * 1. A pull of `63 / (e³ - 1)` N breaks the base in 1 s.
   * 2. A pull of 63 N breaks it in `ln 2 / 3` s.
   * 3. No pull never breaks it.
   */
  export function test_unit_motions_grappling_force_exchange_broken(): void {
    const at = (force: number): number =>
      HumanForceExchange.broken({ mass: 70, frequency: 3, edge: 0.1, force });
    TestValidator.predicate(
      "the breaking instant",
      nclose(at(63 / (Math.exp(3) - 1)), 1, 1e-12) &&
        nclose(at(63), Math.LN2 / 3, 1e-12) &&
        at(0) === Infinity,
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_drawn`. */
namespace ScenarioForceExchangeDrawn {
  /**
   * `HumanForceExchange.drawn` is a partner's centre under a constant pull from
   * rest: `x = a (cosh ωt - 1)`, `x' = a ω sinh ωt` and the extrapolated `x + x'
   * / ω`, with `a = F / (M ω²)`.
   *
   * A 70 kg partner at ω = 3 /s pulled by 63 N: `a = 0.1` m.
   *
   * Scenarios:
   *
   * 1. Half a second in, the closed form at `ωt = 1.5`.
   * 2. At the start nothing has moved.
   */
  export function test_unit_motions_grappling_force_exchange_drawn(): void {
    const at: IAutoMovieMotionHumanForceExchange.IDrawnResult =
      HumanForceExchange.drawn({
        mass: 70,
        frequency: 3,
        force: 63,
        seconds: 0.5,
      });
    const offset: number = 0.1 * (Math.cosh(1.5) - 1);
    const speed: number = 0.3 * Math.sinh(1.5);
    TestValidator.predicate(
      "the pendulum's closed form",
      nclose(at.offset, offset, 1e-12) &&
        nclose(at.speed, speed, 1e-12) &&
        nclose(at.extrapolated, offset + speed / 3, 1e-12),
    );
    TestValidator.equals(
      "at rest at the start",
      HumanForceExchange.drawn({
        mass: 70,
        frequency: 3,
        force: 63,
        seconds: 0,
      }),
      { offset: 0, speed: 0, extrapolated: 0 },
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_edge`. */
namespace ScenarioForceExchangeEdge {
  /** A 0.2 m square base on the floor about the origin. */
  const SQUARE: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];

  /**
   * `HumanForceExchange.edge` is how far a centre's floor point travels along a
   * horizontal direction before it leaves the convex hull of the support points.
   *
   * Scenarios:
   *
   * 1. From the middle of a 0.2 m square, the edge lies 0.1 m ahead, whatever the
   *    centre's height.
   * 2. Along the diagonal it lies at the corner, `0.1 sqrt(2)` m.
   * 3. From 0.05 m toward +X, the +X edge is 0.05 m away.
   * 4. A centre already outside the base, or a base of two points, gives none.
   */
  export function test_unit_motions_grappling_force_exchange_edge(): void {
    const diagonal: IAutoMovieVector3 = {
      x: Math.SQRT1_2,
      y: 0,
      z: Math.SQRT1_2,
    };
    TestValidator.predicate(
      "the hull's extent along the direction",
      nclose(
        HumanForceExchange.edge(
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 },
          SQUARE,
        ),
        0.1,
        1e-12,
      ) &&
        nclose(
          HumanForceExchange.edge({ x: 0, y: 1, z: 0 }, diagonal, SQUARE),
          0.1 * Math.SQRT2,
          1e-12,
        ) &&
        nclose(
          HumanForceExchange.edge(
            { x: 0.05, y: 1, z: 0 },
            { x: 1, y: 0, z: 0 },
            SQUARE,
          ),
          0.05,
          1e-12,
        ) &&
        HumanForceExchange.edge(
          { x: 0.2, y: 1, z: 0 },
          { x: 1, y: 0, z: 0 },
          SQUARE,
        ) === 0 &&
        HumanForceExchange.edge(
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 0, z: 0 },
          SQUARE.slice(0, 2),
        ) === 0,
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_pull`. */
namespace ScenarioForceExchangePull {
  /**
   * `HumanForceExchange.pull` spreads a pull equally over its grip sites as
   * sustained forces constant over the window.
   *
   * Scenarios:
   *
   * 1. 100 N toward +X through two grips is 50 N on each, over the window.
   * 2. No grip carries no force.
   */
  export function test_unit_motions_grappling_force_exchange_pull(): void {
    TestValidator.equals(
      "an equal share per grip",
      HumanForceExchange.pull({
        subject: "uke",
        sites: [
          "sternum",
          { bone: "leftLowerArm", point: { x: 0, y: 0, z: 0 } },
        ],
        direction: { x: 1, y: 0, z: 0 },
        force: 100,
        from: 1,
        to: 2,
      }),
      [
        {
          kind: "sustained",
          subject: "uke",
          at: "sternum",
          from: 1,
          to: 2,
          force: { x: 50, y: 0, z: 0 },
        },
        {
          kind: "sustained",
          subject: "uke",
          at: { bone: "leftLowerArm", point: { x: 0, y: 0, z: 0 } },
          from: 1,
          to: 2,
          force: { x: 50, y: 0, z: 0 },
        },
      ] satisfies IAutoMovieMotionHumanSustainedForce[],
    );
    TestValidator.equals(
      "no grip",
      HumanForceExchange.pull({
        subject: "uke",
        sites: [],
        direction: { x: 1, y: 0, z: 0 },
        force: 100,
        from: 1,
        to: 2,
      }),
      [],
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_resisted`. */
namespace ScenarioForceExchangeResisted {
  /**
   * `HumanForceExchange.resisted` is the static moment balance of a resisting
   * partner: a pull `F` at grip height `h` against the weight `M g` moves the
   * centre of pressure `F h / (M g)` toward the pull, resisted while that stays
   * within the base.
   *
   * A 70 kg partner pulled by 100 N at 1 m.
   *
   * Scenarios:
   *
   * 1. At g = 10 the shift is 1/7 m, inside a 0.2 m base.
   * 2. A 0.1 m base cannot hold it: none.
   * 3. Without a gravity the standard one is used.
   */
  export function test_unit_motions_grappling_force_exchange_resisted(): void {
    const props = (
      edge: number,
    ): IAutoMovieMotionHumanForceExchange.IResistedProps => ({
      mass: 70,
      force: 100,
      height: 1,
      edge,
    });
    TestValidator.predicate(
      "the moment balance's shift",
      nclose(HumanForceExchange.resisted(props(0.2), 10)!, 1 / 7, 1e-12) &&
        HumanForceExchange.resisted(props(0.1), 10) === null &&
        nclose(
          HumanForceExchange.resisted(props(0.2))!,
          100 / (70 * AutoMovieGravity.STANDARD),
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_force_exchange_swing`. */
namespace ScenarioForceExchangeSwing {
  /**
   * The release's bracket, seconds: the swing bisects for the release to
   * `integrateMotionTrajectory.STEP²` and returns the bracket's end past it
   * (`bracketedBisection`), so the read release lies at most this long after the
   * true one.
   */
  const BRACKET: number = integrateMotionTrajectory.STEP ** 2;

  /** The swing's stiffness `M g r / I`, per second squared. */
  const K: number = (70 * 10 * 1) / 80;

  /**
   * The fixed-step classical Runge-Kutta method's global error over the swing,
   * radians: fourth order, `O((ω h)⁴)` for a pendulum of rate scale `ω = sqrt(K)`
   * at the step `h` (Hairer, Nørsett and Wanner, Solving Ordinary Differential
   * Equations I, 2nd ed., 1993, §II.3).
   */
  const RK4: number = (Math.sqrt(K) * integrateMotionTrajectory.STEP) ** 4;

  /**
   * `HumanForceExchange.swing` turns a rigid body about a fulcrum by `I φ'' = M g
   * r sin φ` from the momentum the pull left and releases it where its centre
   * comes level with the fulcrum, `φ = π / 2`. Without a drive the swing keeps
   * its energy, so the release rate is `sqrt(φ'0² + 2 k cos φ0)` with `k = M g r
   * / I`.
   *
   * A 70 kg body with 10 kg m² about its centre, 1 m from the fulcrum (`I = 80`
   * kg m²), at g = 10.
   *
   * Scenarios:
   *
   * 1. From 0.2 rad at 0.5 rad/s the swing starts there and releases at π / 2, read
   *    at most `BRACKET` late: the angle exceeds it by at most the release rate
   *    times `BRACKET`, and the rate exceeds the energy's by at most `K` times
   *    `BRACKET`, each within the method's `RK4` error; past the release the
   *    state holds.
   * 2. From 0.5 rad behind the vertical at 0.1 rad/s the rate falls to none before
   *    the vertical: no swing.
   */
  export function test_unit_motions_grappling_force_exchange_swing(): void {
    const rate: number = Math.sqrt(0.25 + 2 * K * Math.cos(0.2));
    const within = (value: number, low: number, high: number): boolean =>
      value >= low && value <= high;
    const swing: IAutoMovieMotionHumanForceExchange.ISwing | null =
      HumanForceExchange.swing(
        { mass: 70, inertia: 10, radius: 1, angle: 0.2, rate: 0.5 },
        10,
      );
    TestValidator.predicate(
      "the conserved swing to its release",
      swing !== null &&
        swing.release > 0 &&
        nclose(swing.angle(0), 0.2, 1e-12) &&
        within(
          swing.angle(swing.release),
          Math.PI / 2 - RK4,
          Math.PI / 2 + rate * BRACKET + RK4,
        ) &&
        within(
          swing.rate(swing.release),
          rate - Math.sqrt(K) * RK4,
          rate + K * BRACKET + Math.sqrt(K) * RK4,
        ) &&
        swing.angle(swing.release + 1) === swing.angle(swing.release),
    );
    TestValidator.equals(
      "a swing that stops",
      HumanForceExchange.swing(
        { mass: 70, inertia: 10, radius: 1, angle: -0.5, rate: 0.1 },
        10,
      ),
      null,
    );
  }
}

/**
 * The `force_exchange` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_grappling_force_exchange(): void {
  ScenarioForceDrawn.test_unit_motions_grappling_force_drawn();
  ScenarioForceExchangeBreaking.test_unit_motions_grappling_force_exchange_breaking();
  ScenarioForceExchangeBroken.test_unit_motions_grappling_force_exchange_broken();
  ScenarioForceExchangeDrawn.test_unit_motions_grappling_force_exchange_drawn();
  ScenarioForceExchangeEdge.test_unit_motions_grappling_force_exchange_edge();
  ScenarioForceExchangePull.test_unit_motions_grappling_force_exchange_pull();
  ScenarioForceExchangeResisted.test_unit_motions_grappling_force_exchange_resisted();
  ScenarioForceExchangeSwing.test_unit_motions_grappling_force_exchange_swing();
}
