import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmSeedSpace as Space } from "./HumanArmSeedSpace";

/**
 * The restarts of a hold instant's inverse kinematics, tried after the caller's
 * own starts (`HumanArmSeedStarts`): TRAC-IK's remedy for a local solver caught
 * in a local minimum, restarting it from configurations spread over the joints'
 * ranges (Beeson and Ames 2015, "TRAC-IK: An open-source library for improved
 * solving of generic inverse kinematics", IEEE-RAS Humanoids, section II),
 * drawn here deterministically as each arm's own Halton sequence over its
 * coordinate box (Halton 1960, Numer. Math. 2:84; each coordinate the radical
 * inverse in its own prime base, a chart pair within its disc by `r = R √u`, `θ
 * = 2π v`). The arms are drawn apart, each on its own primes: at one instant
 * they couple only through their collision with each other, which the optimiser
 * holds, so a restart covers each arm's own space, never their product.
 *
 * The count is the coverage argument at the solver's measured basin: a solve
 * started within a normalised radius `ρ = 0.5` of a solution converged to it in
 * 17 of 18 trials (the tip-of-hat and karate hold instants), so a start lands
 * in a basin with the probability `v` of a 7-dimensional ball of radius 0.5 in
 * the unit box, `π^3.5 / Γ(4.5) · 0.5^7 ≈ 0.0369`, and `N = ⌈ln(1 − 0.95) /
 * ln(1 − v)⌉ = 80` restarts find one with 95 % probability. (Halton's own
 * dispersion bound, `d_N ≤ 2 (D*_N)^(1/7)` of Niederreiter 1992, Theorem 6.6,
 * asks some 10^10 points for that radius, a bound too loose to use.) A solution
 * whose basin is narrower than any restart's reach is the continuation's
 * (`HumanArmSeedContinuation`).
 *
 * @param context The instant's context.
 * @returns Each restart, each arm's coordinates.
 */
export function* HumanArmSeedRestarts(
  context: Space.Chart,
): IterableIterator<number[][]> {
  const space: Space.ISpace = Space.sampler(context);
  const arms: number = context.rest.length;
  for (let i: number = 1; i <= HumanArmSeedRestarts.RESTARTS; ++i) {
      const q: number[] = [...space.low];
      for (let a: number = 0; a < arms; ++a)
        for (let d: number = 0; d < G.DIMENSIONS; ++d) {
          const at: number = a * G.DIMENSIONS + d;
          q[at] =
            space.low[at]! +
            radical(i, PRIMES[a * (G.DIMENSIONS + 2) + d]!) *
              (space.high[at]! - space.low[at]!);
        }
      for (const disc of space.discs) {
        const a: number = Math.floor(disc.x / G.DIMENSIONS);
        const r: number =
          disc.radius *
          Math.sqrt(
            radical(i, PRIMES[a * (G.DIMENSIONS + 2) + G.DIMENSIONS]!),
          );
        const theta: number =
          2 *
          Math.PI *
          radical(i, PRIMES[a * (G.DIMENSIONS + 2) + G.DIMENSIONS + 1]!);
        q[disc.x] = r * Math.cos(theta);
        q[disc.y] = r * Math.sin(theta);
      }
      yield Space.split(q);
  }
}
/** Coverage parameters for the deterministic inverse-kinematics starts. */
export namespace HumanArmSeedRestarts {
  /** The measured basin radius, a share of each coordinate's range. */
  export const BASIN: number = 0.5;

  /** The probability the restarts reach a basin. */
  export const SUCCESS: number = 0.95;

  /**
   * The restarts' count: `⌈ln(1 − SUCCESS) / ln(1 − v)⌉`, `v` the volume of the
   * 7-dimensional ball of radius `BASIN`, `π^3.5 / Γ(4.5) · BASIN^7`.
   */
  export const RESTARTS: number = Math.ceil(
    Math.log(1 - SUCCESS) /
      Math.log(
        1 - (Math.PI ** 3.5 / ((105 / 16) * Math.sqrt(Math.PI))) * BASIN ** 7,
      ),
  );
}

/**
 * The first primes: each arm its own, one base per coordinate and two for its
 * disc.
 */
const PRIMES: readonly number[] = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79,
];

/**
 * The radical inverse of an index in a base: its digits mirrored about the
 * point.
 */
function radical(index: number, base: number): number {
  let out: number = 0;
  let f: number = 1 / base;
  for (let i: number = index; i > 0; i = Math.floor(i / base)) {
    out += f * (i % base);
    f /= base;
  }
  return out;
}
