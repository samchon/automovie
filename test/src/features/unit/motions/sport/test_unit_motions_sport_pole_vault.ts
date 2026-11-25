import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poleVaultBend,
  poleVaultOnLine,
  poleVaultSwing,
  poleVaultTakeoffAngle,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_pole_vault_bend`. */
namespace ScenarioPoleVaultBend {
  /** A pole hinge at a height along the pole from its tip. */
  const hinge = (id: string, y: number): IAutoMovieAffordance => ({
    id,
    kind: "hinge",
    frame: {
      translation: { x: 0, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  });

  /**
   * `poleVaultBend` lays a jointed pole along the pinned elastica its swing's
   * chord asks (the bent pole's shape): each link's direction is the elastica's
   * slope at the link's middle, so the hinges turn between them, and the chain's
   * chord is what its links span.
   *
   * A 70 kg vaulter plants 3 m behind and 3 m above the tip at 8 m/s on a 700 N
   * pole, `3 sqrt(2)` m of it; the pole hinges at 2 m and 1 m from its tip.
   *
   * Scenarios:
   *
   * 1. The hinges are listed from the tip up.
   * 2. At the plant the pole is straight: no hinge turns and the chain spans the
   *    whole pole with its top along the chord.
   * 3. Mid-swing the pole is bent: its chain spans less than its length.
   */
  export function test_unit_motions_sport_pole_vault_bend(): void {
    const swing: poleVaultSwing.ISwing = poleVaultSwing({
      radius: { forward: -3, up: 3 },
      velocity: { forward: 8, up: 0 },
      mass: 70,
      buckling: 700,
      gravity: 9.81,
      upright: 0,
      run: 8,
    });
    const bend: poleVaultBend.IBend = poleVaultBend(swing, [
      hinge("upper", 2),
      hinge("lower", 1),
    ]);
    const straight: poleVaultBend.IChain = bend.chain(0);
    TestValidator.equals("from the tip up", bend.hinges, ["lower", "upper"]);
    TestValidator.predicate(
      "straight at the plant",
      nclose(bend.turn(0, 0), 0, 1e-6) &&
        nclose(bend.turn(1, 0), 0, 1e-6) &&
        nclose(straight.chord, swing.length, 1e-6) &&
        nclose(straight.top, 0, 1e-6),
    );
    TestValidator.predicate(
      "bent mid-swing",
      bend.chain(swing.duration / 2).chord < swing.length - 0.01,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_pole_vault_on_line`. */
namespace ScenarioPoleVaultOnLine {
  /**
   * `poleVaultOnLine` finds where a sphere about a grip meets a segment: the
   * farther along of the two roots of `|from + s slide - grip|² = length²`,
   * clamped to the segment, none when the sphere misses the line.
   *
   * The segment runs from the origin 4 m along +X; the grip stands 1 m above x =
   * 2.
   *
   * Scenarios:
   *
   * 1. A sphere of `sqrt(2)` m meets the line at x = 1 and 3: the farther, (3, 0,
   *    0).
   * 2. A sphere reaching past the segment's end is clamped to (4, 0, 0).
   * 3. A sphere of 0.5 m misses the line; a segment of no length has no point.
   */
  export function test_unit_motions_sport_pole_vault_on_line(): void {
    const from: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const slide: IAutoMovieVector3 = { x: 4, y: 0, z: 0 };
    const grip: IAutoMovieVector3 = { x: 2, y: 1, z: 0 };
    TestValidator.predicate(
      "the farther crossing, clamped",
      vclose(
        poleVaultOnLine(from, slide, grip, Math.SQRT2)!,
        { x: 3, y: 0, z: 0 },
        1e-12,
      ) &&
        vclose(
          poleVaultOnLine(from, slide, grip, 5)!,
          { x: 4, y: 0, z: 0 },
          1e-12,
        ),
    );
    TestValidator.equals(
      "missed, and degenerate",
      [
        poleVaultOnLine(from, slide, grip, 0.5),
        poleVaultOnLine(from, { x: 0, y: 0, z: 0 }, grip, 2),
      ],
      [undefined, undefined],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_pole_vault_swing`. */
namespace ScenarioPoleVaultSwing {
  /**
   * `poleVaultSwing` admits a swing that reaches the release and reads it at any
   * second by each interval's uniformly accelerated motion, `x + v τ + a τ² / 2`
   * from the interval's start; a failing swing is refused.
   *
   * A 70 kg vaulter plants 3 m behind and 3 m above the tip at 8 m/s on a 700 N
   * pole, which reaches the release.
   *
   * Scenarios:
   *
   * 1. The swing lasts to its last sample and keeps the pole's length.
   * 2. Read on a sample, it is that sample; read 4 ms into an interval, it is the
   *    closed form from the interval's start.
   * 3. A plant moving away from the tip is refused.
   */
  export function test_unit_motions_sport_pole_vault_swing(): void {
    const props: poleVaultSwing.IProps = {
      radius: { forward: -3, up: 3 },
      velocity: { forward: 8, up: 0 },
      mass: 70,
      buckling: 700,
      gravity: 9.81,
      upright: 0,
      run: 8,
    };
    const swing: poleVaultSwing.ISwing = poleVaultSwing(props);
    const k: poleVaultSwing.ISample = swing.samples[5]!;
    const tau: number = 0.004;
    const inside: poleVaultSwing.ISample = swing.at(k.seconds + tau);
    TestValidator.predicate(
      "its span and its reading",
      swing.duration === swing.samples[swing.samples.length - 1]!.seconds &&
        nclose(swing.length, 3 * Math.SQRT2, 1e-12) &&
        nclose(swing.at(k.seconds).position.up, k.position.up, 1e-12) &&
        nclose(
          inside.position.forward,
          k.position.forward +
            k.velocity.forward * tau +
            0.5 * k.acceleration.forward * tau * tau,
          1e-12,
        ) &&
        nclose(
          inside.velocity.up,
          k.velocity.up + k.acceleration.up * tau,
          1e-12,
        ),
    );
    TestValidator.predicate(
      "a failing plant refused",
      throwsError(() =>
        poleVaultSwing({ ...props, velocity: { forward: -8, up: 8 } }),
      ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_pole_vault_swing_integrate`. */
namespace ScenarioPoleVaultSwingIntegrate {
  /** A plant 3 m behind and 3 m above the planted tip, at a run's speed. */
  const plant = (
    forward: number,
    up: number,
    buckling: number,
  ): poleVaultSwing.IProps => ({
    radius: { forward: -3, up: 3 },
    velocity: { forward, up },
    mass: 70,
    buckling,
    gravity: 9.81,
    upright: 0,
    run: Math.hypot(forward, up),
  });

  /**
   * `poleVaultSwing.integrate` swings a vaulter on a bending pole from the plant
   * (the elastic-pole model of Linthorne 2000): at the plant the velocity's part
   * along the pole loses at most `F² / (2 · 250) cos² θ` of its energy (Eq. 1 and
   * 3), then the grip moves under the pole's compressive force and gravity at a
   * 10 ms step until the pole recoils to its length, or the swing fails.
   *
   * The grip stands 3 m behind and 3 m above the tip, `3 sqrt(2)` m of pole; the
   * 70 kg vaulter runs at 8 m/s along +forward, at 45 degrees to the pole.
   *
   * Scenarios:
   *
   * 1. On a 700 N pole the plant keeps `sqrt(64 - 2 · 490 / 70)` = `sqrt(50)` m/s,
   *    since `700² / 500 · cos² 45°` = 490 J is less than the 1120 J the velocity
   *    carries along the pole.
   * 2. That vault reaches the release: the last chord is the pole's length again.
   * 3. A plant moving away from the tip along the pole fails at once.
   * 4. A standing plant on a soft pole swings back before upright.
   */
  export function test_unit_motions_sport_pole_vault_swing_integrate(): void {
    const vault: poleVaultSwing.IOutcome = poleVaultSwing.integrate(
      plant(8, 0, 700),
    );
    const first: poleVaultSwing.ISample = vault.samples[0]!;
    const last: poleVaultSwing.ISample =
      vault.samples[vault.samples.length - 1]!;
    TestValidator.predicate(
      "the plant's kept speed and the release",
      nclose(vault.length, 3 * Math.SQRT2, 1e-12) &&
        nclose(first.velocity.forward, Math.sqrt(50), 1e-12) &&
        first.velocity.up === 0 &&
        vault.failure === null &&
        Math.hypot(last.position.forward, last.position.up) >= vault.length,
    );
    TestValidator.equals(
      "carried away",
      poleVaultSwing.integrate(plant(-8, 8, 700)).failure,
      "the plant carries the body away from the planted pole",
    );
    TestValidator.predicate(
      "swung back",
      poleVaultSwing
        .integrate(plant(0, 0, 10))
        .failure?.startsWith("the body swings back") === true,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_pole_vault_takeoff_angle`. */
namespace ScenarioPoleVaultTakeoffAngle {
  /**
   * `poleVaultTakeoffAngle` gives a vaulter's take-off angle from the run-up
   * speed by the linear regression it cites: 48.8 degrees less 3.51 per m/s.
   *
   * Scenarios:
   *
   * 1. At 9 m/s the angle is 48.8 - 31.59 = 17.21 degrees; it falls as the run
   *    quickens.
   */
  export function test_unit_motions_sport_pole_vault_takeoff_angle(): void {
    TestValidator.predicate(
      "the take-off angle at 9 m/s, falling with speed",
      nclose(poleVaultTakeoffAngle(9), 17.21, 1e-12) &&
        poleVaultTakeoffAngle(9.5) < poleVaultTakeoffAngle(9),
    );
  }
}

/**
 * The `pole_vault` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_pole_vault(): void {
  ScenarioPoleVaultBend.test_unit_motions_sport_pole_vault_bend();
  ScenarioPoleVaultOnLine.test_unit_motions_sport_pole_vault_on_line();
  ScenarioPoleVaultSwing.test_unit_motions_sport_pole_vault_swing();
  ScenarioPoleVaultSwingIntegrate.test_unit_motions_sport_pole_vault_swing_integrate();
  ScenarioPoleVaultTakeoffAngle.test_unit_motions_sport_pole_vault_takeoff_angle();
}
