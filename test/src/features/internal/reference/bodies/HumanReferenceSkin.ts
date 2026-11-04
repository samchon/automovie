
import { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanReference } from "./HumanReference";
import { HumanReferenceWeld } from "./HumanReferenceWeld";

/**
 * Each reference body as a skin the anatomy observers read, labelled once per
 * process and shared.
 *
 * The reference carries no rig and no part names, so both come from the
 * generated person with the same inputs, and only to locate: each reference
 * triangle takes the chain of the nearest generated vertex, which separates an
 * arm from the trunk where the two skins differ by far less than a limb's
 * radius, and the rig's joint centres locate the sites. A joint the generated
 * person misplaces moves a site on the reference with it; that is the
 * observer's limit here. The skin is built for each call, and the
 * generated person is the caller's own.
 */
export namespace HumanReferenceSkin {
  /**
   * Label a reference body's triangles by the generated person's chains.
   *
   * @param id Reference alias.
   */
  export function get(id: string): HumanAnatomy.ISkin {
    const m: HumanReference.IMesh = HumanReferenceWeld.get(id);
    const generated: HumanAnatomy.ISkin = HumanAnatomy.bind(id);
    const owner: Int32Array = vertexChains(generated);
    const grid: Grid = new Grid(generated.P, 12);
    const tri: Int32Array = new Int32Array(m.I.length / 3);

    for (let t: number = 0; t < tri.length; t++) {
      const c: HumanAnatomy.V3 = [0, 0, 0];

      for (let k: number = 0; k < 3; k++)
        for (let a: number = 0; a < 3; a++) c[a] += m.P[3 * m.I[3 * t + k]! + a]! / 3;
      tri[t] = owner[grid.nearest(c)]!;
    }

    return {
      name: `${id} reference`,
      P: m.P,
      I: m.I,
      tri,
      chains: generated.chains,
      joints: generated.joints,
    };
  }

  /**
   * The chain of the first triangle that uses each vertex.
   *
   * @param skin The generated skin.
   * @returns Per vertex the chain index, -1 for a vertex no triangle uses.
   */
  function vertexChains(skin: HumanAnatomy.ISkin): Int32Array {
    const out: Int32Array = new Int32Array(skin.P.length / 3).fill(-1);

    for (let t: number = 0; t < skin.tri.length; t++)
      for (let k: number = 0; k < 3; k++) {
        const v: number = skin.I[3 * t + k]!;

        if (out[v] === -1) out[v] = skin.tri[t]!;
      }
    return out;
  }
}

/** Uniform grid over points for exact nearest-point queries. */
class Grid {
  /** Point indices by cell key. */
  private readonly cells: Map<string, number[]> = new Map();

  /**
   * Bucket every point.
   *
   * @param P Flat point positions, mm.
   * @param size Cell edge, mm.
   */
  public constructor(
    private readonly P: ArrayLike<number>,
    private readonly size: number,
  ) {
    for (let v: number = 0; v < P.length / 3; v++) {
      const key: string = this.key(P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!);
      const list: number[] | undefined = this.cells.get(key);

      if (list === undefined) this.cells.set(key, [v]);
      else list.push(v);
    }
  }

  /**
   * The nearest point's index, searching shells of cells outward until no
   * unseen cell can hold a closer point.
   *
   * @param p Query point, mm.
   */
  public nearest(p: HumanAnatomy.V3): number {
    const i: number = Math.floor(p[0] / this.size);
    const j: number = Math.floor(p[1] / this.size);
    const k: number = Math.floor(p[2] / this.size);
    let best: number = -1;
    let bestD: number = Infinity;

    for (let r: number = 0; r < 64; r++) {
      for (let a: number = i - r; a <= i + r; a++)
        for (let b: number = j - r; b <= j + r; b++)
          for (let c: number = k - r; c <= k + r; c++) {
            if (Math.max(Math.abs(a - i), Math.abs(b - j), Math.abs(c - k)) !== r) continue;
            for (const v of this.cells.get(`${a},${b},${c}`) ?? []) {
              const d: number =
                (this.P[3 * v]! - p[0]) ** 2 + (this.P[3 * v + 1]! - p[1]) ** 2 + (this.P[3 * v + 2]! - p[2]) ** 2;

              if (d < bestD) {
                bestD = d;
                best = v;
              }
            }
          }

      // Every point closer than the shell's inner face has been seen.
      if (best !== -1 && Math.sqrt(bestD) <= r * this.size) break;
    }
    return best;
  }

  /**
   * The cell key of a position.
   *
   * @param x Position, mm.
   * @param y Position, mm.
   * @param z Position, mm.
   */
  private key(x: number, y: number, z: number): string {
    return `${Math.floor(x / this.size)},${Math.floor(y / this.size)},${Math.floor(z / this.size)}`;
  }
}
