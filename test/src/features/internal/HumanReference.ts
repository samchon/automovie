import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanOnce } from "./HumanOnce";
import { HumanPeople } from "./HumanPeople";

/**
 * The private reference bodies f1, f2, m1 and m2: closed skins captured from
 * the reference source, read from the ignored `test/.shots` directory when the
 * checkout holds them. Each shares its person's public inputs, frame and
 * standing pose, so one observer reads a reference and the generated person
 * alike, and a reference proves an observer green on a real body.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanReference {
  /** A reference body as captured. */
  export interface IMesh {
    /** Reference alias. */
    id: string;

    /** Flat vertex positions, mm; the head and body welded where they meet. */
    P: Float64Array;

    /** Flat triangle vertex indices. */
    I: Uint32Array;

    /** Index of the source part of every triangle: 0 the head, 1 the body. */
    part: Uint8Array;
  }

  /** The references whose head and body both answer their person's inputs. */
  export const IDS: readonly string[] = ["f1", "f2", "m1", "m2"];

  /** Directory of a reference's private files. */
  export function directory(id: string): string {
    return path.join(ROOT, "test/.shots", id);
  }

  /** The references present in this checkout. */
  export function available(): string[] {
    return IDS.filter((id: string): boolean =>
      fs.existsSync(path.join(directory(id), "reference-model.json")),
    );
  }

  /**
   * A reference's mesh, read once. Coincident vertices are welded, since the
   * source stores the head and body as two parts whose shared neck seam would
   * otherwise read as an opening.
   */
  export function mesh(id: string): IMesh {
    return meshes.read(id, (): IMesh => {
      const model: IModel = JSON.parse(
        fs.readFileSync(path.join(directory(id), "reference-model.json"), "utf8"),
      ) as IModel;
      const positions: number[] = [];
      const indices: number[] = [];
      const parts: number[] = [];
      const weld: Map<string, number> = new Map();
      model.parts.forEach((part: IModel.IPart, k: number): void => {
        const local: number[] = [];
        const P: number[] = part.geometry.mesh.positions;
        for (let v: number = 0; v < P.length; v += 3) {
          const x: number = P[v]! * 1000;
          const y: number = P[v + 1]! * 1000;
          const z: number = P[v + 2]! * 1000;
          const key: string = `${Math.round(x * 1e3)},${Math.round(y * 1e3)},${Math.round(z * 1e3)}`;
          let at: number | undefined = weld.get(key);
          if (at === undefined) {
            at = positions.length / 3;
            weld.set(key, at);
            positions.push(x, y, z);
          }
          local.push(at);
        }
        const I: number[] = part.geometry.mesh.indices;
        for (let t: number = 0; t < I.length; t += 3) {
          const a: number = local[I[t]!]!;
          const b: number = local[I[t + 1]!]!;
          const c: number = local[I[t + 2]!]!;
          if (a === b || b === c || c === a) continue;
          indices.push(a, b, c);
          parts.push(k);
        }
      });
      return {
        id,
        P: Float64Array.from(positions),
        I: Uint32Array.from(indices),
        part: Uint8Array.from(parts),
      };
    });
  }

  /**
   * A reference as a skin the anatomy observers read.
   *
   * The reference carries no rig and no part names, so both come from the
   * generated person with the same inputs, and only to locate: each reference
   * triangle takes the chain of the nearest generated vertex, which separates
   * an arm from the trunk where the two skins differ by far less than a limb's
   * radius, and the rig's joint centres locate the sites. A joint the
   * generated person misplaces moves a site on the reference with it; that is
   * the observer's limit here.
   */
  export function skin(id: string): HumanAnatomy.ISkin {
    return skins.read(id, (): HumanAnatomy.ISkin => {
      const m: IMesh = mesh(id);
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
    });
  }

  /** A reference as an anatomy subject: its own skin against its person's inputs. */
  export function subject(id: string): HumanAnatomyAudit.ISubject {
    const params: IAutoMovieHumanParameters = HumanPeople.person(id).params;
    return {
      name: `${id} reference`,
      params,
      bind: (): HumanAnatomy.ISkin => skin(id),
      neutral: (): HumanAnatomy.ISkin => skin(id),
      mouth: false,
      construction: false,
      straightened: false,
    };
  }
}

const ROOT: string = path.resolve(__dirname, "../../../..");

/** Each reference is read and labelled once per run. */
const meshes: HumanOnce<HumanReference.IMesh> = new HumanOnce();
const skins: HumanOnce<HumanAnatomy.ISkin> = new HumanOnce();

/** The source's model file, as far as the meshes. */
interface IModel {
  parts: IModel.IPart[];
}
namespace IModel {
  export interface IPart {
    name: string;
    geometry: { mesh: { positions: number[]; indices: number[] } };
  }
}

/** The chain of one triangle that uses each vertex. */
function vertexChains(skin: HumanAnatomy.ISkin): Int32Array {
  const out: Int32Array = new Int32Array(skin.P.length / 3).fill(-1);
  for (let t: number = 0; t < skin.tri.length; t++)
    for (let k: number = 0; k < 3; k++) {
      const v: number = skin.I[3 * t + k]!;
      if (out[v] === -1) out[v] = skin.tri[t]!;
    }
  return out;
}

/** Uniform grid over points for nearest-point queries. */
class Grid {
  private readonly cells: Map<string, number[]> = new Map();
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

  /** The nearest point's index, searching rings of cells outward. */
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
      // Every point closer than the ring's inner face has been seen.
      if (best !== -1 && Math.sqrt(bestD) <= r * this.size) break;
    }
    return best;
  }

  private key(x: number, y: number, z: number): string {
    return `${Math.floor(x / this.size)},${Math.floor(y / this.size)},${Math.floor(z / this.size)}`;
  }
}
