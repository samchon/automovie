import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBreath,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRandom,
} from "@automovie/interface";
import { HumanBreath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_human_breath_add {
  /** Rounding of one product and sum per angle, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `HumanBreath.add` adds a lung volume's trunk angles to a posture: each bone
   * of the tidal table (`HumanBreath.TIDAL`) turns by the volume times its tidal
   * angles over what the posture holds, zero where it holds none, and nothing
   * else changes.
   *
   * Scenarios:
   *
   * 1. Half a tidal breath over a posture holding (1, 2, 3) at every tidal bone
   *    gives `(1, 2, 3) + TIDAL / 2` there.
   * 2. Over a posture holding none, a whole breath gives the table itself.
   * 3. The root and the limbs are left as they are.
   */
  export function verify(): void {
    const bones: readonly AutoMovieHumanoidBone[] = [
      "chest",
      "upperChest",
      "spine",
      "leftShoulder",
      "rightShoulder",
    ];
    const held: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of bones) held[bone] = [1, 2, 3];
    const posture = (
      joints: IAutoMovieMotionHumanPosture["joints"],
    ): IAutoMovieMotionHumanPosture => ({
      root: { x: 1, y: 0, z: 2 },
      yaw: 30,
      pitch: 0,
      roll: 0,
      joints,
      limbs: {},
    });
    const tidal = (bone: AutoMovieHumanoidBone): readonly number[] =>
      HumanBreath.TIDAL[bone]!;

    // 1. Half a breath over held angles.
    const half: IAutoMovieMotionHumanPosture = HumanBreath.add(
      posture(held),
      0.5,
    );
    for (const bone of bones)
      TestValidator.predicate(
        `half a breath at ${bone}`,
        half.joints[bone]!.every((v: number, i: number): boolean =>
          nclose(v, i + 1 + tidal(bone)[i]! / 2, ROUNDING),
        ),
      );

    // 2. A whole breath over none.
    const whole: IAutoMovieMotionHumanPosture = HumanBreath.add(posture({}), 1);
    for (const bone of bones)
      TestValidator.predicate(
        `a whole breath at ${bone}`,
        whole.joints[bone]!.every((v: number, i: number): boolean =>
          nclose(v, tidal(bone)[i]!, ROUNDING),
        ),
      );

    // 3. The rest untouched.
    TestValidator.predicate(
      "the root and the limbs",
      whole.root.x === 1 &&
        whole.root.z === 2 &&
        whole.yaw === 30 &&
        Object.keys(whole.limbs).length === 0,
    );
  }
}

namespace part_human_breath_state {
  /** The resting rate the cycles are read at, breaths a minute. */
  const RATE: number = 15;

  /** One sigh every 300 s (Bell et al.), as a share of cycles. */
  const SIGH: number = 60 / RATE / 300;

  /**
   * `HumanBreath` draws a resting respiratory rate and reads the breathing state
   * at a second: zero volume at each cycle's boundary, a deep breath on a cycle
   * whose sigh draw falls under one sigh per five minutes, and an exertion that
   * raises the rate and recovers it with the phase continuous.
   *
   * Scenarios:
   *
   * 1. 200 resting rates lie in 12 to 20 a minute, their mean 15.24 within 0.4, the
   *    mean of N(15, 2) truncated to [12, 20] (`15 + 2 (phi(-1.5) - phi(2.5)) /
   *    (Phi(2.5) - Phi(-1.5))`), 0.4 three standard errors.
   * 2. At 15 a minute the volume is zero at the boundaries of cycles 0, 1, 7 and 40,
   *    and positive inside cycle 3.
   * 3. The cycle drawn just under the sigh probability breathes deep (over 1.5 of a
   *    tidal breath) at its inspiration's end; the one just over it a tidal
   *    breath, 1.
   * 4. A full exertion at 30 s recovering over 60 s runs at `EXERTION_RATE` just
   *    before it ends, is back at rest by 91 s, and its phase is continuous at
   *    its end.
   * 5. The same inputs read the same volume.
   */
  export function verify(): void {
    const stream: (k: string) => IAutoMovieRandom = (
      k: string,
    ): IAutoMovieRandom =>
      createAutoMovieRandom(deriveAutoMovieSeed("breath", k));
    const rates: number[] = Array.from(
      { length: 200 },
      (_: unknown, i: number): number =>
        HumanBreath.restingRate(stream(`rate${i}`)),
    );
    const mean: number =
      rates.reduce((a: number, b: number): number => a + b, 0) / rates.length;
    TestValidator.predicate(
      `rates in band, mean ${mean}`,
      rates.every((r: number): boolean => r >= 12 && r <= 20) &&
        Math.abs(mean - 15.24) < 0.4,
    );

    const sigh: IAutoMovieRandom = stream("sigh");
    const atCycle: (
      n: number,
      f: number,
    ) => IAutoMovieMotionHumanBreath.IStateResult = (
      n: number,
      f: number,
    ): IAutoMovieMotionHumanBreath.IStateResult =>
      HumanBreath.state(((n + f) * 60) / RATE, RATE, [], 0, sigh);
    TestValidator.predicate(
      "zero at the boundaries, positive inside",
      [0, 1, 7, 40].every(
        (n: number): boolean => Math.abs(atCycle(n, 0).volume) < 1e-9,
      ) &&
        [0.2, 0.42, 0.7].every(
          (f: number): boolean => atCycle(3, f).volume > 0,
        ),
    );

    let below: number = -1;
    let above: number = -1;
    for (let cycle: number = 0; cycle < 20000; cycle++) {
      const draw: number = sigh.float(cycle);
      if (draw < SIGH && (below < 0 || draw > sigh.float(below))) below = cycle;
      if (draw >= SIGH && (above < 0 || draw < sigh.float(above)))
        above = cycle;
    }
    TestValidator.predicate(
      "a deep breath under the sigh's probability, a tidal one over it",
      below >= 0 &&
        atCycle(below, HumanBreath.INSPIRATION).volume > 1.5 &&
        above >= 0 &&
        Math.abs(atCycle(above, HumanBreath.INSPIRATION).volume - 1) < 1e-9,
    );

    const bout: IAutoMovieMotionHumanBreath.IExertion = {
      at: 30,
      level: 1,
      recovery: 60,
    };
    const a: IAutoMovieMotionHumanBreath.IStateResult = HumanBreath.state(
      30 - 1e-6,
      RATE,
      [bout],
      0,
      sigh,
    );
    const b: IAutoMovieMotionHumanBreath.IStateResult = HumanBreath.state(
      30 + 1e-6,
      RATE,
      [bout],
      0,
      sigh,
    );
    TestValidator.predicate(
      "the exertion and its recovery",
      Math.abs(
        HumanBreath.state(29, RATE, [bout], 0, sigh).rate -
          HumanBreath.EXERTION_RATE,
      ) < 1e-9 &&
        Math.abs(HumanBreath.state(91, RATE, [bout], 0, sigh).rate - RATE) <
          1e-9 &&
        Math.abs(b.phase - a.phase) < (HumanBreath.EXERTION_RATE / 60) * 1e-3,
    );
    TestValidator.equals(
      "deterministic",
      HumanBreath.state(12.3, RATE, [bout], 0.4, sigh).volume,
      HumanBreath.state(12.3, RATE, [bout], 0.4, sigh).volume,
    );
  }
}

/**
 * `HumanBreath`'s unit contract: its state and added layer.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `human_breath_add`: `HumanBreath.add` adds a lung volume's trunk angles to a
 *   posture:
 * - `human_breath_state`: `HumanBreath` draws a resting respiratory rate and
 *   reads the breathing state at a second:
 */
export async function test_unit_motions_everyday_human_breath(): Promise<void> {
  part_human_breath_add.verify();
  part_human_breath_state.verify();
}
