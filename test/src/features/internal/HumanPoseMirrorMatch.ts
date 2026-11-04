import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanPoseMirror } from "./HumanPoseMirror";

/**
 * How a person's bind skin and joints correspond to its mirror image's: which
 * vertex of the mirror image is each vertex's reflection, and how far the two
 * binds already miss being mirror images, which is what a posed skin may miss
 * by without the pose being at fault.
 */
export namespace HumanPoseMirrorMatch {
  /** A vertex's mirror counterpart on the other body. */
  export interface IMatch {
    /** Index of each vertex's counterpart, or -1 when none was found. */
    index: Int32Array;

    /** Distance from each vertex's reflection to its counterpart, mm. */
    distance: Float64Array;
  }

  /** A bone of a rig's skeleton. */
  type IBone = HumanPoseMirror.ISubject["rig"]["skeleton"]["bones"][number];

  /** Edge of the grid cells the search buckets vertices in, mm. */
  const CELL: number = 4;

  /** Rings of cells the search may widen to before giving up. */
  const RINGS: number = 32;

  /**
   * Each vertex of `P` matched with the vertex of `Q` nearest its reflection
   * across the median plane that faces the same way once reflected. Facing
   * keeps two sheets that touch at the bind, such as closed lips, apart.
   */
  export function correspondence(P: Float64Array, Q: Float64Array, NP: Float64Array, NQ: Float64Array): IMatch {
    const n: number = P.length / 3;
    const index: Int32Array = new Int32Array(n).fill(-1);
    const distance: Float64Array = new Float64Array(n);
    const cells: Map<string, number[]> = new Map();

    // Bucket the other body's vertices on a grid.
    for (let u: number = 0; u < Q.length / 3; u++) {
      const key: string = cell(Q[3 * u]!, Q[3 * u + 1]!, Q[3 * u + 2]!);
      const list: number[] | undefined = cells.get(key);

      if (list === undefined) cells.set(key, [u]);
      else list.push(u);
    }

    for (let v: number = 0; v < n; v++) {
      // The reflection of the vertex, and the cell it falls in.
      const x: number = P[3 * v]!;
      const y: number = P[3 * v + 1]!;
      const z: number = -P[3 * v + 2]!;
      const i: number = Math.floor(x / CELL);
      const j: number = Math.floor(y / CELL);
      const k: number = Math.floor(z / CELL);
      let best: number = -1;
      let bestDistance: number = Infinity;

      // Search rings of cells outward, stopping once every nearer vertex has been seen.
      for (let r: number = 0; r < RINGS; r++) {
        for (let a: number = i - r; a <= i + r; a++)
          for (let b: number = j - r; b <= j + r; b++)
            for (let c: number = k - r; c <= k + r; c++) {
              if (Math.max(Math.abs(a - i), Math.abs(b - j), Math.abs(c - k)) !== r) continue;

              for (const u of cells.get(`${a},${b},${c}`) ?? []) {
                // The reflected normal of the vertex must point the way the counterpart's does.
                const facing: number = NP[3 * v]! * NQ[3 * u]! + NP[3 * v + 1]! * NQ[3 * u + 1]! - NP[3 * v + 2]! * NQ[3 * u + 2]!;

                if (facing <= 0) continue;

                const d: number = Math.hypot(Q[3 * u]! - x, Q[3 * u + 1]! - y, Q[3 * u + 2]! - z);

                if (d < bestDistance) {
                  bestDistance = d;
                  best = u;
                }
              }
            }

        if (best !== -1 && bestDistance <= r * CELL) break;
      }

      index[v] = best;
      distance[v] = bestDistance;
    }

    return { index, distance };
  }

  /** Area-weighted vertex normals of a skin, not normalised. */
  export function normals(skin: HumanAnatomy.ISkin): Float64Array {
    const out: Float64Array = new Float64Array(skin.P.length);
    const P: Float64Array = skin.P;

    for (let t: number = 0; t < skin.I.length / 3; t++) {
      // The triangle's edge cross product, whose length is twice its area, goes to each corner.
      const a: number = skin.I[3 * t]!;
      const b: number = skin.I[3 * t + 1]!;
      const c: number = skin.I[3 * t + 2]!;
      const u: HumanAnatomy.V3 = [P[3 * b]! - P[3 * a]!, P[3 * b + 1]! - P[3 * a + 1]!, P[3 * b + 2]! - P[3 * a + 2]!];
      const w: HumanAnatomy.V3 = [P[3 * c]! - P[3 * a]!, P[3 * c + 1]! - P[3 * a + 1]!, P[3 * c + 2]! - P[3 * a + 2]!];
      const n: HumanAnatomy.V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];

      for (const v of [a, b, c]) for (let k: number = 0; k < 3; k++) out[3 * v + k] = out[3 * v + k]! + n[k]!;
    }

    return out;
  }

  /** The chain of one triangle that uses each vertex, or -1 for a vertex no triangle uses. */
  export function chains(skin: HumanAnatomy.ISkin): Int32Array {
    const out: Int32Array = new Int32Array(skin.P.length / 3).fill(-1);

    for (let t: number = 0; t < skin.tri.length; t++)
      for (let k: number = 0; k < 3; k++) {
        const v: number = skin.I[3 * t + k]!;

        if (out[v] === -1) out[v] = skin.tri[t]!;
      }

    return out;
  }

  /**
   * Each bone's position allowance: the sum, from the root down to the bone,
   * of how far each rest offset misses the mirror image's reflected offset,
   * mm. Rotations that mirror each other carry the offsets as mirror images,
   * so a posed centre misses its mirror by no more than that sum.
   */
  export function allowance(a: HumanPoseMirror.ISubject, b: HumanPoseMirror.ISubject): Map<string, number> {
    const mm: number = 1 / a.scale;
    const mmOther: number = 1 / b.scale;
    const offsets: Map<string, { x: number; y: number; z: number }> = new Map(
      b.rig.skeleton.bones.map((bone: IBone): [string, { x: number; y: number; z: number }] => [bone.bone, bone.rest.translation]),
    );
    const out: Map<string, number> = new Map();

    for (const bone of a.rig.skeleton.bones) {
      // This bone's rest offset against the reflection of its counterpart's.
      const t: { x: number; y: number; z: number } = bone.rest.translation;
      const u: { x: number; y: number; z: number } | undefined = offsets.get(side(bone.bone));
      const miss: number =
        u === undefined ? Infinity : Math.hypot(t.x * mm - u.x * mmOther, t.y * mm - u.y * mmOther, t.z * mm + u.z * mmOther);

      out.set(bone.bone, (bone.parent === null ? 0 : out.get(bone.parent)!) + miss);
    }

    // The evaluator places a toe bone under the hallux bone it drives.
    out.set("leftHalluxProximal", out.get("leftToes") ?? out.get("leftHalluxProximal") ?? 0);
    out.set("rightHalluxProximal", out.get("rightToes") ?? out.get("rightHalluxProximal") ?? 0);

    return out;
  }

  /** The bone on the other side. */
  export function side(bone: string): string {
    return bone.startsWith("left") ? `right${bone.slice(4)}` : bone.startsWith("right") ? `left${bone.slice(5)}` : bone;
  }

  /** The grid cell a point falls in, as a key. */
  function cell(x: number, y: number, z: number): string {
    return `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
  }
}
