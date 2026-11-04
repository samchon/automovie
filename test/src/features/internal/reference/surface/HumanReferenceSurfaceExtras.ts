import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceFlag } from "./HumanReferenceSurfaceFlag";
import { HumanReferenceSurfaceGrid } from "./HumanReferenceSurfaceGrid";
import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";
import type { HumanReferenceSurfacePair } from "./HumanReferenceSurfacePair";

/**
 * Generated to reference: geometry the reference's normals never reach, such
 * as a spike thinner than the reference's vertex spacing or a part floating
 * apart from the body.
 */
export namespace HumanReferenceSurfaceExtras {
  /** What every generated vertex read. */
  export interface IExtras {
    /** Flag code per generated vertex: 0 unflagged, else extra or detached. */
    flag: Uint8Array;

    /** Signed nearest distance to the reference per generated vertex, mm; positive outside. */
    value: Float64Array;

    /** Limit per generated vertex, mm: the largest among the nearest reference triangle's vertices. */
    limit: Float64Array;
  }

  /**
   * Reads every generated outer-skin vertex's nearest distance to the
   * reference and flags extra and detached geometry.
   *
   * A generated vertex beyond the limit is extra geometry unless a reference
   * patch of the same sign, or one missing, lies within twice its distance,
   * the reach of a 60-degree crossing: the reference then already shows it,
   * and a bump the reference normals see is listed once, from the reference.
   * A generated piece detached from the body's largest piece that reaches
   * beyond its limit anywhere is listed whole as a floating part, since its
   * nearest reference skin may lie within a wide region's spread.
   *
   * @param reference The reference side.
   * @param generated The generated side.
   * @param limit Limit per reference vertex, mm.
   * @param flag Flag code per reference vertex, from the offsets.
   */
  export function extras(
    reference: HumanReferenceSurfacePair.IReferenceSide,
    generated: HumanReferenceSurfacePair.IGeneratedSide,
    limit: Float64Array,
    flag: Uint8Array,
  ): IExtras {
    const G: Float64Array = generated.P;
    const m: number = generated.count;
    const out: IExtras = { flag: new Uint8Array(m), value: new Float64Array(m), limit: new Float64Array(m) };
    const beyond: Uint8Array = new Uint8Array(m);
    const flagged: HumanReferenceSurfaceGrid = new HumanReferenceSurfaceGrid(reference.P, flag, 10);
    const hit: HumanReferenceSurface.INearest = { d2: 0, tri: -1, q: [0, 0, 0] };
    const nt: Float64Array = reference.tree.normal;

    for (let g: number = 0; g < m; g++) {
      if (generated.skin[g] === 0) continue;

      const px: number = G[3 * g]!;
      const py: number = G[3 * g + 1]!;
      const pz: number = G[3 * g + 2]!;
      reference.tree.nearest(px, py, pz, hit);

      const f: number = hit.tri;
      const a: number = reference.I[3 * f]!;
      const b: number = reference.I[3 * f + 1]!;
      const c: number = reference.I[3 * f + 2]!;
      const L: number = Math.max(limit[a]!, limit[b]!, limit[c]!);
      const d: number = Math.sqrt(hit.d2);
      const side: number =
        (px - hit.q[0]) * nt[3 * f]! + (py - hit.q[1]) * nt[3 * f + 1]! + (pz - hit.q[2]) * nt[3 * f + 2]!;
      out.value[g] = side >= 0 ? d : -d;
      out.limit[g] = L;
      if (d <= L) continue;

      beyond[g] = 1;
      const sign: number = side >= 0 ? HumanReferenceSurfaceFlag.OUTSIDE : HumanReferenceSurfaceFlag.INSIDE;
      if (!flagged.within(px, py, pz, 2 * d, sign)) out.flag[g] = HumanReferenceSurfaceFlag.EXTRA;
    }

    // A detached piece of generated skin that reaches beyond its limit anywhere is a floating part, listed whole.
    const piece: Int32Array = HumanReferenceSurfaceMesh.components(generated.I, m);
    const main: number = HumanReferenceSurfaceMesh.largest(piece, generated.area);
    const floating: Set<number> = new Set();
    for (let g: number = 0; g < m; g++) if (beyond[g] === 1 && piece[g] !== main) floating.add(piece[g]!);
    for (let g: number = 0; g < m; g++)
      if (generated.skin[g] === 1 && floating.has(piece[g]!)) out.flag[g] = HumanReferenceSurfaceFlag.DETACHED;

    return out;
  }
}
