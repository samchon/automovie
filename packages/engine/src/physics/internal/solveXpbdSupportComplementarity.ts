import { AutoMovieEngineMath } from "../../math/AutoMovieEngineMath";
import type { solveXpbdArticulationContacts as Contacts } from "./solveXpbdArticulationContacts";

function solveXpbdSupportComplementarityImplementation(
  input: solveXpbdSupportComplementarity.IInput,
): number[] | null {
  const { k, u, set }: solveXpbdSupportComplementarity.IInput = input;
  const size: number = set.rows.length;
  const held: Map<number, number> = new Map();
  const sliding: Map<Contacts.IPatch, Contacts.ISlip> = new Map();
  let lambda: number[] | null = null;
  for (let round: number = 0; round <= 2 * size; ++round) {
    const matrix: number[][] = k.map((line: number[]): number[] => [...line]);
    const right: number[] = u.map((value: number): number => -value);
    for (const [r, value] of held) {
      matrix[r] = matrix[r]!.map((_: number, s: number): number =>
        s === r ? 1 : 0,
      );
      right[r] = value;
    }
    for (const [patch, slip] of sliding)
      patch.tangents.forEach((r: number, which: number): void => {
        const along: number = which === 0 ? slip.first : slip.second;
        const prior: number =
          which === 0 ? patch.prior.first : patch.prior.second;
        matrix[r] = matrix[r]!.map((_: number, s: number): number =>
          s === r ? 1 : patch.normals.includes(s) ? -patch.friction * along : 0,
        );
        right[r] = patch.friction * patch.normal * along - prior;
      });
    lambda = AutoMovieEngineMath.solveLinearSystem(matrix, right);
    if (lambda === null) return null;
    const current: number[] = lambda;
    let changed: boolean = false;
    set.rows.forEach((row: Contacts.IRow, r: number): void => {
      if (row.lower === undefined) return;
      if (!held.has(r) && current[r]! < row.lower) {
        held.set(r, row.lower);
        changed = true;
      } else if (held.has(r) && velocity(k, u, current, r) < 0) {
        held.delete(r);
        changed = true;
      }
    });
    for (const patch of set.patches) {
      if (sliding.has(patch)) continue;
      const t0: number = patch.prior.first + current[patch.tangents[0]!]!;
      const t1: number = patch.prior.second + current[patch.tangents[1]!]!;
      const magnitude: number = Math.hypot(t0, t1);
      if (magnitude > cone(patch, current)) {
        sliding.set(patch, {
          first: t0 / magnitude,
          second: t1 / magnitude,
        });
        changed = true;
      }
    }
    if (!changed) return current;
  }
  return lambda;
}

/** The input of solveXpbdSupportComplementarity. */
export namespace solveXpbdSupportComplementarity {
  /**
   * The support rows of a tree without a root task, solved as a complementarity
   * problem by active set (Mirtich 1996, "Impulse-based Dynamic Simulation of
   * Rigid Body Systems", chapter 6), every condition inside the one linear system
   * of each round:
   *
   * - A free row holds its velocity: `(K lambda + u)_r = 0`;
   * - A normal row below its bound is held at it, `lambda_r = lower_r`, and
   *   released again when, held, its point would approach (`(K lambda + u)_r <
   *   0`), the Signorini complementarity;
   * - A patch whose total friction, the contact passes' `F` plus the rows'
   *   `lambda_t`, leaves its cone `mu (N + sum lambda_n)` slides along the
   *   direction `d` the total left in: `F + lambda_t = d mu (N + sum lambda_n)`,
   *   linear in the patch's normal impulses (Coulomb's law, sliding branch, on
   *   the substep's whole friction).
   *
   * A round that changes no row's state is the answer. Every change holds or
   * releases one normal or starts one patch sliding, so the rounds are bounded by
   * twice the rows; the last round's solution stands if the bound is reached.
   *
   * @param input The rows' coupling matrix, the motors' velocity change at them
   *   and the rows.
   * @returns The rows' impulses, or null when a round's system is singular.
   */
  export function run(
    input: Parameters<typeof solveXpbdSupportComplementarityImplementation>[0],
  ): ReturnType<typeof solveXpbdSupportComplementarityImplementation> {
    return solveXpbdSupportComplementarityImplementation(input);
  }

  /** One tree's rows. */
  export interface IInput {
    /** Each row's velocity change per unit impulse of every row. */
    k: readonly number[][];

    /** Each row's velocity change under the motors alone. */
    u: readonly number[];

    /** The rows and patches. */
    set: Contacts.ISet;
  }
}

/**
 * A row's velocity change along its direction under impulses `lambda`: `(K
 * lambda + u)_r`.
 */
function velocity(
  k: readonly number[][],
  u: readonly number[],
  lambda: readonly number[],
  r: number,
): number {
  let sum: number = u[r]!;
  for (let s: number = 0; s < lambda.length; ++s) sum += k[r]![s]! * lambda[s]!;
  return sum;
}

/**
 * A patch's cone on its whole friction: mu times the contact passes' normal
 * plus the rows' normal impulses, at least zero.
 */
function cone(patch: Contacts.IPatch, lambda: readonly number[]): number {
  const normal: number = patch.normals.reduce(
    (sum: number, r: number): number => sum + lambda[r]!,
    0,
  );
  return Math.max(0, patch.friction * (patch.normal + normal));
}
