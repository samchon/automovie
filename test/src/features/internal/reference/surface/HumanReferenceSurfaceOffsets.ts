import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceFlag } from "./HumanReferenceSurfaceFlag";
import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";
import type { HumanReferenceSurfacePair } from "./HumanReferenceSurfacePair";

/**
 * Reference to generated: the signed offset of every reference skin vertex
 * along its own outward normal to the generated skin, positive where the
 * generated skin stands outside.
 */
export namespace HumanReferenceSurfaceOffsets {
  /** What every reference vertex read. */
  export interface IOffsets {
    /** Signed deviation per vertex, mm; NaN where the vertex is not skin. */
    deviation: Float64Array;

    /** Whether each vertex was read by the nearest distance, its normal line having met no counterpart. */
    fallback: Uint8Array;

    /** Flag code per vertex: 0 within the limit, else outside, inside or missing. */
    flag: Uint8Array;
  }

  /**
   * Reads every reference skin vertex's deviation and flags those beyond
   * their limit.
   *
   * Only a generated triangle facing within 60 degrees of the reference
   * normal counts as the counterpart, within a reach of three times the
   * nearest distance plus the vertex's limit, since a farther or turned
   * crossing along the line is another part of the body. Where the line finds
   * no counterpart, the vertex falls back to the nearest distance, signed by
   * the side the nearest point lies on, and the fallback is recorded. A
   * fallback whose nearest generated skin turns more than 60 degrees away, or
   * ends at an open border, is another surface or a hole, so the generated
   * person is missing this one.
   *
   * @param reference The reference side.
   * @param generated The generated side.
   * @param limit Limit per reference vertex, mm.
   */
  export function offsets(
    reference: HumanReferenceSurfacePair.IReferenceSide,
    generated: HumanReferenceSurfacePair.IGeneratedSide,
    limit: Float64Array,
  ): IOffsets {
    const R: Float64Array = reference.P;
    const n: number = R.length / 3;
    const deviation: Float64Array = new Float64Array(n);
    const fallback: Uint8Array = new Uint8Array(n);
    const flag: Uint8Array = new Uint8Array(n);
    const hit: HumanReferenceSurface.INearest = { d2: 0, tri: -1, q: [0, 0, 0] };

    for (let v: number = 0; v < n; v++) {
      if (reference.skin[v] === 0) {
        deviation[v] = NaN;
        continue;
      }

      const px: number = R[3 * v]!;
      const py: number = R[3 * v + 1]!;
      const pz: number = R[3 * v + 2]!;
      const nx: number = reference.normal[3 * v]!;
      const ny: number = reference.normal[3 * v + 1]!;
      const nz: number = reference.normal[3 * v + 2]!;
      generated.tree.nearest(px, py, pz, hit);

      const d: number = Math.sqrt(hit.d2);
      const t: number = generated.tree.ray(px, py, pz, nx, ny, nz, 3 * d + limit[v]!);
      let value: number;
      let missing: boolean = false;

      if (!Number.isNaN(t)) value = t;
      else {
        fallback[v] = 1;

        const side: number = (hit.q[0] - px) * nx + (hit.q[1] - py) * ny + (hit.q[2] - pz) * nz;
        value = side >= 0 ? d : -d;

        const f: number = hit.tri;
        const nt: Float64Array = generated.tree.normal;
        missing =
          nt[3 * f]! * nx + nt[3 * f + 1]! * ny + nt[3 * f + 2]! * nz < HumanReferenceSurfaceFlag.FACING ||
          HumanReferenceSurfaceMesh.onBorder(
            generated.P,
            generated.outerIndices,
            f,
            hit.q,
            generated.border,
            generated.count,
          );
      }
      deviation[v] = value;

      if (Math.abs(value) > limit[v]!)
        flag[v] = missing
          ? HumanReferenceSurfaceFlag.MISSING
          : value > 0
            ? HumanReferenceSurfaceFlag.OUTSIDE
            : HumanReferenceSurfaceFlag.INSIDE;
    }

    return { deviation, fallback, flag };
  }
}
