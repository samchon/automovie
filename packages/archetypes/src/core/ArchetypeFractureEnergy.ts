import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeBinary64 } from "./ArchetypeBinary64";

/** One exact signed input or nonnegative square, integer times 2^exponent. */
type IDyadic = ReturnType<ReturnType<typeof ArchetypeBinary64>>;

/**
 * Admit the energy needed to give departing fragments the supplied momentum.
 * Their common velocity p/M has kinetic energy ||p||²/(2M), the minimum at
 * fixed total momentum. A threshold alone does not supply that energy.
 *
 * The comparison uses the exact dyadic values of its binary64 inputs,
 * ||p||² <= 2 M E. Integer significands and exponent alignment avoid both
 * overflow and a tolerance that could admit the next float below a boundary.
 * On refusal, positive finite binary64 bit patterns are monotonically
 * ordered, so bisection finds the least representable energy that is enough.
 *
 * @param energy The incident energy, finite and nonnegative, joules.
 * @param mass The departing fragments' total finite positive mass, kilograms.
 * @param momentum Their finite-component total momentum, kilogram metres per second.
 * @returns A sufficient result, or the least supported energy on refusal; null means no finite binary64 energy suffices.
 * @throws {Error} When a caller supplies invalid physical numeric inputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the kinetic-energy constraint, states SI units, exact numeric comparison, refusal result and unsupported-energy meaning.
 * @evidence contracts/development/implementation.md#principled-implementation Cauchy-Schwarz makes a common velocity the minimum-energy momentum allocation. IEEE-754 binary64 significands and exponents exactly represent each nonnegative product in ||p||² <= 2ME; positive finite encodings are ordered integers, so bisection returns an admissible lower endpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit numeric premises, return the zero-momentum bound without allocation, decompose nonzero inputs once, compare energy and search its representable lower bound only on refusal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No energy margin, momentum cap, rescaling or missing dissipation model changes the input; this necessary bound does not model fracture work, a striker or a remainder's dynamics.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three momentum squares and one budget product have a bit width bounded by binary64's exponent and significand ranges. A successful call does one exact comparison; a refusal adds one maximum-budget check and at most 63 bisection comparisons, independent of scene or fragment count.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work ArchetypeBinary64 shares the encoding owner with mass arithmetic. Nonzero momentum squares and mass are reused by every budget comparison; zero axes never enlarge the exact alignment span. One call-local view also serves bisection; no body or cross-call result is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One eight-byte view and fixed-count bounded integer terms are call-local; only the result's boolean and optional scalar escape, with no handle, task or retained input.
 */
export function ArchetypeFractureEnergy(
  energy: number,
  mass: number,
  momentum: IAutoMovieVector3,
): { sufficient: true } | { sufficient: false; minimum: number | null } {
  if (
    !(
      Number.isFinite(energy) &&
      energy >= 0 &&
      Number.isFinite(mass) &&
      mass > 0 &&
      Number.isFinite(momentum.x) &&
      Number.isFinite(momentum.y) &&
      Number.isFinite(momentum.z)
    )
  )
    throw new Error(
      "Fracture energy needs finite nonnegative energy, positive mass and finite momentum",
    );

  if (momentum.x === 0 && momentum.y === 0 && momentum.z === 0)
    return { sufficient: true };

  const view: DataView = new DataView(new ArrayBuffer(8));
  const parts: ReturnType<typeof ArchetypeBinary64> = ArchetypeBinary64(view);
  const squares: IDyadic[] = [momentum.x, momentum.y, momentum.z]
    .filter((value: number): boolean => value !== 0)
    .map((value: number): IDyadic => {
      const term: IDyadic = parts(value);
      return {
        integer: term.integer * term.integer,
        exponent: 2 * term.exponent,
      };
    });
  const lowest: number = Math.min(
    ...squares.map((term: IDyadic): number => term.exponent),
  );
  const massTerm: IDyadic = parts(mass);

  /** Compare exactly at one nonnegative finite candidate energy. */
  const enough: (candidate: number) => boolean = (
    candidate: number,
  ): boolean => {
    const budget: IDyadic = parts(candidate);
    const power: number = massTerm.exponent + budget.exponent;
    const base: number = Math.min(lowest, power);
    let required: bigint = 0n;
    for (const term of squares)
      required += term.integer << BigInt(term.exponent - base);
    return (
      required <=
      (2n * massTerm.integer * budget.integer) << BigInt(power - base)
    );
  };
  if (enough(energy)) return { sufficient: true };
  if (!enough(Number.MAX_VALUE)) return { sufficient: false, minimum: null };

  let low: bigint = 0n;
  let high: bigint = 0x7fefffffffffffffn;
  while (low < high) {
    const middle: bigint = (low + high) >> 1n;
    view.setBigUint64(0, middle, false);
    const candidate: number = view.getFloat64(0, false);
    if (enough(candidate)) high = middle;
    else low = middle + 1n;
  }
  view.setBigUint64(0, low, false);
  return { sufficient: false, minimum: view.getFloat64(0, false) };
}
