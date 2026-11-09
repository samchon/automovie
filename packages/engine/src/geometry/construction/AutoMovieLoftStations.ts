import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Tessellation stations of a chain: where a face's grid rings stand.
 *
 * Every principal layer inside the range is a station, since it is a shape event. Each remaining interval is split at its midpoint while the section there departs from the straight band between the interval's end sections by more than the chord tolerance at any probe phase, and both halves are examined the same way. That departure is the error a flat band of triangles makes there, so curved stretches refine and straight ones stay coarse; `depth` bounds the recursion, so a pathological interval yields an explicit coarse band instead of unbounded work.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the error measure, the fixed marks and the depth bound.
 * @evidence contracts/development/design.md#principled-representation Represents Tessellation stations of a chain: where a face's grid rings stand: companion namespace of 2 members (`PROBES`, `bisect`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftStations` in packages/engine/src/geometry/construction/AutoMovieLoftStations.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieLoftStations {
  /** Forty-eight uniform phases define the sampled band criterion, not a bound on unsampled phase error. */
  export const PROBES: number = 48;

  /**
   * Stations between two stations by recursive bisection.
   *
   * @param chain The chain.
   * @param from First station, mm.
   * @param to Last station, mm.
   * @param tolerance Largest departure of a band from its sections, mm.
   * @param depth Largest bisection depth.
   * @returns Increasing stations including both ends.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Keeps principal layers and recursively bisects intervals whose midpoint ring exceeds the chord tolerance at the 48 declared phases; valid increasing endpoints/layers are caller premises.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One depth-first splitter passes endpoint rings to both children and appends accepted right endpoints in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The depth bound may leave a coarse interval even above tolerance, and finite midpoint/phase probes do not certify continuous maximum error; neither limitation is hidden by smoothing.
   * @evidence contracts/development/common.md#meaningful-documentation States physical tolerance units, fixed marks, probe criterion, recursion bound and endpoint inclusion.
   * @evidence contracts/development/implementation.md#efficient-algorithms For L principal intervals and depth D, at most O(L*2^D) ring tests of 48 points run; chain evaluation cost is additional and refinement stops early when the sampled rule passes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every tested midpoint ring is reused as its children's common endpoint; adjacent principal intervals reuse the preceding endpoint ring.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Working rings follow one recursion path, O(48D), beside O(L) marks and the O(L*2^D) worst-case returned stations; no ring cache survives the call.
   */
  export function bisect(
    chain: IAutoMovieLoftChain,
    from: number,
    to: number,
    tolerance: number,
    depth: number = 8,
  ): number[] {
    const probes: number[] = Array.from(
      { length: PROBES },
      (_: unknown, i: number): number => (2 * Math.PI * i) / PROBES,
    );
    const marks: number[] = [
      from,
      ...chain.layers
        .map((l: IAutoMovieLoftChain.ILayer): number => l.y)
        .filter((y: number): boolean => y > from && y < to),
      to,
    ];
    const out: number[] = [from];
    const at = (s: number): Ring => AutoMovieLoftChain.ring(chain, s, probes);
    const split = (
      a: number,
      b: number,
      level: number,
      ra: Ring,
      rb: Ring,
    ): void => {
      if (level < depth) {
        const m: number = (a + b) / 2;
        const rm: Ring = at(m);
        let error: number = 0;
        rm.forEach((p: [number, number, number], i: number): void => {
          error = Math.max(
            error,
            Math.hypot(
              p[0] - (ra[i]![0] + rb[i]![0]) / 2,
              p[1] - (ra[i]![1] + rb[i]![1]) / 2,
              p[2] - (ra[i]![2] + rb[i]![2]) / 2,
            ),
          );
        });
        if (error > tolerance) {
          split(a, m, level + 1, ra, rm);
          split(m, b, level + 1, rm, rb);
          return;
        }
      }
      out.push(b);
    };
    let last: Ring = at(marks[0]!);
    for (let i: number = 1; i < marks.length; i++) {
      const next: Ring = at(marks[i]!);
      split(marks[i - 1]!, marks[i]!, 0, last, next);
      last = next;
    }
    return out;
  }
}

/** A section's points at the probe phases, mm. */
type Ring = [number, number, number][];
