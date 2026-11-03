import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveVector } from "./HumanCurveVector";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
const { crossingArc, perimeter, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { cross, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;
const { EAR_CROSSING, EAR_FOLD, EAR_PHASES, PHASES, SLIDE, SMALL }: typeof HumanCurveConstants = HumanCurveConstants;

/** The rules of an ear's rim and sections. */
export namespace HumanCurveEar {
  /**
   * An ear's sections are thin plates with a rim, so the general rules are not
   * read on them: their layers lie closer than `slide` looks and their corners
   * are by design. These three read what goes wrong on a plate instead. A rim
   * that moves round its ring between layers draws the sawtooth along the helix;
   * cells that reverse along the chain are folds in the skin; a crossing is
   * measured by the arc it encloses, since a pinch's corner may overshoot by a
   * fraction of the rim's own thickness.
   */
  export function auditEar(
    chain: IAutoMovieHumanLoftChain,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    const name: string = chain.name;
    const fine: number[] = uniform(EAR_PHASES);
    const stations: number[] = chain.layers.flatMap(
      (l: IAutoMovieHumanLoftChain.ILayer, k: number): number[] =>
        k === 0 ? [l.y] : [(chain.layers[k - 1]!.y + l.y) / 2, l.y],
    );
    const rings: V3[][] = stations.map((s: number): V3[] =>
      AutoMovieHumanLoftChain.ring(chain, s, fine),
    );
    const perimeters: number[] = rings.map(perimeter);

    // The rim, the point standing farthest off the head, keeps its phase.
    const rims: number[] = rings.map((ring: V3[]): number => {
      let at: number = 0;
      ring.forEach((p: V3, j: number): void => {
        if (Math.abs(p[2]) > Math.abs(ring[at]![2])) at = j;
      });
      return at;
    });
    for (let i: number = 1; i < rings.length; i++) {
      if (perimeters[i]! < SMALL || perimeters[i - 1]! < SMALL) continue;
      const gap: number = stations[i]! - stations[i - 1]!;
      const steps: number = Math.abs(rims[i]! - rims[i - 1]!);
      const turn: number = Math.min(steps, EAR_PHASES - steps) / EAR_PHASES;
      const value: number = (turn * perimeters[i]!) / gap;
      if (value > SLIDE)
        report(name, "rim-slide", `at ${Math.round(stations[i]!)}`, value, SLIDE, rings[i]![rims[i]!]!);
    }

    // Cells whose normals reverse from one layer to the next.
    const coarse: number = Math.floor(EAR_PHASES / PHASES);
    let previous: V3[] | null = null;
    for (let i: number = 0; i + 1 < rings.length; i++) {
      const normals: V3[] = [];
      for (let j: number = 0; j < PHASES; j++) {
        const a: V3 = rings[i]![j * coarse]!;
        const b: V3 = rings[i]![((j + 1) % PHASES) * coarse]!;
        const c: V3 = rings[i + 1]![j * coarse]!;
        const n: V3 = cross(sub(b, a), sub(c, a));
        normals.push(dot(n, n) > 1e-12 ? unit(n) : [0, 0, 0]);
        if (previous !== null && dot(previous[j]!, normals[j]!) < EAR_FOLD)
          report(name, "ear-fold", `at ${Math.round(stations[i]!)}`, 1, 0, a);
      }
      previous = normals;
    }

    // A crossing, by the shorter arc it encloses.
    rings.forEach((ring: V3[], i: number): void => {
      const sampled: V3[] = Array.from(
        { length: PHASES },
        (_: unknown, j: number): V3 => ring[j * coarse]!,
      );
      const arc: number = crossingArc(sampled);
      if (arc > EAR_CROSSING)
        report(name, "ear-crossing", `at ${Math.round(stations[i]!)}`, arc, EAR_CROSSING, sampled[0]!);
    });
  }
}
