import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanCurveHairStandoff } from "./HumanCurveHairStandoff";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;

/**
 * How far the head skin and the scalp hair reach from the head's centre
 * (catalog rules HR-EXT-1 and HR-EXT-3), in true millimetres.
 *
 * - HR-EXT-3, the head upstream of the hair: the centroid of the head and
 *   ear skin lies inside the head, so no head point stands farther from it
 *   than the head's largest diameter by its own inputs, the greater of the
 *   head length (glabella to opisthocranion) and the head height, and an ear
 *   stands out by its protrusion input beyond that.
 * - HR-EXT-1, the hair: a strand grows from a root on the scalp and is never
 *   farther from its root than its own length (a chord is never longer than
 *   its arc), so no card vertex stands farther from the head's centre than
 *   the head skin's own farthest point, plus the hair length input, plus the
 *   card's root width (the ribbon's breadth across its strand).
 */
export namespace HumanCurveHairExtent {
  /** The head skin's farthest point from its centroid, mm. */
  export function radius(skin: readonly V3[]): number {
    const c: V3 = HumanCurveHairStandoff.centroid(skin);
    let r: number = 0;
    for (const p of skin) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]));
    return r;
  }

  /** HR-EXT-3: the head skin's farthest point from its centroid against the head's own largest diameter and ear protrusion. */
  export function head(person: string, skin: readonly V3[], params: IAutoMovieHumanParameters): IRow {
    const ear: number = Math.max(params.head.earPair.left.protrusion, params.head.earPair.right.protrusion);
    const bound: number = Math.max(params.head.length, params.head.height) + ear;
    return { person, site: `head and ear skin: farthest point from the head's centroid, against the head's largest diameter plus ear protrusion ${bound.toFixed(0)} mm, mm (HR-EXT-3)`, value: radius(skin), low: 0, high: bound, unit: "mm" };
  }

  /** HR-EXT-1: every card whose vertices reach past the head's radius plus the hair length plus the card's own root width, one row each. */
  export function cards(person: string, hair: HumanCurveHairStandoff.IHair, length: number): IRow[] {
    const c: V3 = HumanCurveHairStandoff.centroid(hair.skin);
    const R: number = radius(hair.skin);
    const first: V3[][] = Array.from({ length: hair.cards.count }, (): V3[] => []);
    const reach: number[] = new Array<number>(hair.cards.count).fill(0);
    const at: V3[] = new Array<V3>(hair.cards.count).fill(c);
    hair.cards.points.forEach((p: V3, v: number): void => {
      const k: number = hair.cards.card[v]!;
      if (first[k]!.length < 2) first[k]!.push(p);
      const d: number = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
      if (d > reach[k]!) {
        reach[k] = d;
        at[k] = p;
      }
    });
    const out: IRow[] = [];
    for (let k: number = 0; k < hair.cards.count; k++) {
      const root: V3[] = first[k]!;
      const width: number = root.length < 2 ? 0 : Math.hypot(root[0]![0] - root[1]![0], root[0]![1] - root[1]![1], root[0]![2] - root[1]![2]);
      const bound: number = R + length + width;
      if (reach[k]! > bound)
        out.push({ person, site: `scalp hair card ${k} of ${hair.cards.count}: farthest vertex from the head's centroid at ${at[k]!.map((v: number): string => v.toFixed(0)).join(" ")} mm, against the head radius ${R.toFixed(0)} plus hair length ${length} plus root width ${width.toFixed(1)}, mm (HR-EXT-1)`, value: reach[k]!, low: 0, high: bound, unit: "mm" });
    }
    return out;
  }
}
