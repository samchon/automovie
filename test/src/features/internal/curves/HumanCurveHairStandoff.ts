import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHuman } from "../../../../../packages/human/src/AutoMovieHuman";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanScalpHair } from "../../../../../packages/human/src/structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairCurl } from "../../../../../packages/human/src/typings/AutoMovieHumanHairCurl";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;

/**
 * How far each scalp hair card stands off the head (catalog rule SPIKE-HR-1):
 * the generated model's card mesh read against its own head skin, in true
 * millimetres.
 *
 * A strand is a cantilever under its own weight: gravity bends a hair over
 * its elastogravity length `l = (A / (lambda g))^(1/3)`, about 50 mm for a
 * fibre of 79 micrometres (Goldstein, Warren and Ball 2012,
 * `packages/human/docs/sources/goldstein-2012-ponytail.md`). Straight to
 * wavy hair (curl classes I and II) lying over the vault therefore cannot
 * stand clear of the scalp by more than `l` unless something holds it, so a
 * card that does is a spike: a card detached from the hair mass. The bound
 * takes the diameter's 2.326 SD upper end, 116 micrometres, whose `l` is
 * 65 mm, the most generous fibre.
 *
 * The stand-off of a card vertex is its distance from the head's centre less
 * the head skin's outermost radius in the same direction (bins of 2 degrees),
 * so a vertex lying on the skin reads zero and one moved straight out by `d`
 * reads `d` more. Only vertices above the eyes' level are read: below it the
 * hair hangs free beside the face and neck, where it may lawfully stand off.
 */
export namespace HumanCurveHairStandoff {
  /** The bound, mm: the elastogravity length of the stiffest fibre within 2.326 SD of the diameter (Goldstein 2012). */
  export const BOUND: number = 65;

  /** Bin size of the skin's radius map, degrees. */
  export const BIN: number = 2;

  /** One person's head skin and scalp hair cards, in true mm. */
  export interface IHair {
    /** Person. */
    person: string;

    /** Head and ear skin vertices. */
    skin: V3[];

    /** Card vertices, with the card each belongs to. */
    cards: { points: V3[]; card: Int32Array; count: number };

    /** Height of the eyes' centres, mm. */
    eyes: number;

    /** Whether the hair's curl class lets the elastogravity bound bind (classes I and II). */
    straight: boolean;
  }

  /** One card's worst stand-off. */
  export interface IStandoff {
    /** Card index, in the mesh's order of components. */
    card: number;

    /** Largest stand-off of its vertices above the eyes, mm. */
    standoff: number;

    /** Where, mm. */
    at: V3;
  }

  /** A person's hair, generated once per process; null when the person carries no scalp hair. */
  export function hair(person: string): IHair | null {
    return hairs.read(person, (): IHair | null => {
      const params: IAutoMovieHumanParameters = HumanPeople.params(person);
      const scalp: IAutoMovieHumanScalpHair | undefined = params.appearance?.hair;
      if (scalp === undefined || !(scalp.length > 0)) return null;
      const curl: AutoMovieHumanHairCurl = scalp.curl;
      const parts: IAutoMovieModelPart[] = AutoMovieHuman.generate(params).model.parts;
      const mesh: (id: string) => IAutoMovieMesh | null = (id: string): IAutoMovieMesh | null => {
        const p: IAutoMovieModelPart | undefined = parts.find((q: IAutoMovieModelPart): boolean => q.id === id);
        return p !== undefined && p.geometry.type === "mesh" ? p.geometry.mesh : null;
      };
      const cards: IAutoMovieMesh | null = mesh("human.hair.cards");
      if (cards === null || cards.indices === null) return null;

      // Head and ear skin, the neck chain (`human.skin.head/<k>`) left out.
      const skin: V3[] = [];
      for (const p of parts)
        if ((p.id.startsWith("human.skin.head.") || p.id.startsWith("human.skin.ear.")) && p.geometry.type === "mesh") skin.push(...points(p.geometry.mesh));
      const left: IAutoMovieMesh | null = mesh("human.eye.left.sclera");
      const right: IAutoMovieMesh | null = mesh("human.eye.right.sclera");
      if (left === null || right === null) throw new Error(`${person} has scalp hair but no eye globes to set the eyes' level`);
      const eyes: number = (centroid(points(left))[1] + centroid(points(right))[1]) / 2;
      return { person, skin, cards: components(cards), eyes, straight: curl === AutoMovieHumanHairCurl.I || curl === AutoMovieHumanHairCurl.II };
    });
  }

  /** Every card's worst stand-off above the eyes on a skin and a card set. */
  export function standoffs(skin: readonly V3[], cards: IHair["cards"], eyes: number): IStandoff[] {
    const centre: V3 = centroid(skin);
    const columns: number = Math.round(360 / BIN);
    const rows: number = Math.round(180 / BIN);
    const outer: Float64Array = new Float64Array(columns * rows).fill(NaN);
    const bin: (q: V3) => number = (q: V3): number => {
      const r: number = Math.hypot(q[0], q[1], q[2]);
      const polar: number = Math.acos(Math.max(-1, Math.min(1, q[1] / r)));
      const azimuth: number = Math.atan2(q[2], q[0]) + Math.PI;
      return Math.min(rows - 1, Math.floor(((polar * 180) / Math.PI) / BIN)) * columns + (Math.min(columns - 1, Math.floor(((azimuth * 180) / Math.PI) / BIN)));
    };
    for (const p of skin) {
      const q: V3 = sub(p, centre);
      const k: number = bin(q);
      const r: number = Math.hypot(q[0], q[1], q[2]);
      if (!(outer[k]! >= r)) outer[k] = r;
    }

    const out: IStandoff[] = Array.from({ length: cards.count }, (_: unknown, card: number): IStandoff => ({ card, standoff: -Infinity, at: centre }));
    cards.points.forEach((p: V3, v: number): void => {
      if (p[1] <= eyes) return;
      const q: V3 = sub(p, centre);
      const skinRadius: number = outer[bin(q)]!;
      if (Number.isNaN(skinRadius)) return;
      const standoff: number = Math.hypot(q[0], q[1], q[2]) - skinRadius;
      const o: IStandoff = out[cards.card[v]!]!;
      if (standoff > o.standoff) {
        o.standoff = standoff;
        o.at = p;
      }
    });
    return out.filter((o: IStandoff): boolean => o.standoff > -Infinity);
  }

  /** The failing cards of one person as rows, every card past the bound listed. */
  export function rows(h: IHair): IRow[] {
    return standoffs(h.skin, h.cards, h.eyes)
      .filter((o: IStandoff): boolean => o.standoff > BOUND)
      .map(
        (o: IStandoff): IRow => ({
          person: h.person,
          site: `scalp hair card ${o.card} of ${h.cards.count} stands off the head skin above the eyes, at ${o.at.map((v: number): string => v.toFixed(0)).join(" ")} mm (SPIKE-HR-1)`,
          value: o.standoff,
          low: -Infinity,
          high: BOUND,
          unit: "mm",
        }),
      );
  }

  /** A mesh's vertices in true mm (the model is in metres). */
  export function points(mesh: IAutoMovieMesh): V3[] {
    const out: V3[] = [];
    for (let i: number = 0; i + 2 < mesh.positions.length; i += 3) out.push([1000 * mesh.positions[i]!, 1000 * mesh.positions[i + 1]!, 1000 * mesh.positions[i + 2]!]);
    return out;
  }

  /** The mean of points. */
  export function centroid(points: readonly V3[]): V3 {
    const c: V3 = [0, 0, 0];
    for (const p of points) for (let k: number = 0; k < 3; k++) c[k] += p[k]! / points.length;
    return c;
  }
}

/** Each person's hair, generated once. */
const hairs: HumanOnce<HumanCurveHairStandoff.IHair | null> = new HumanOnce();

/** The difference of two points. */
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** A card mesh's vertices and the connected component (one card) each belongs to. */
function components(mesh: IAutoMovieMesh): HumanCurveHairStandoff.IHair["cards"] {
  const points: V3[] = HumanCurveHairStandoff.points(mesh);
  const parent: Int32Array = Int32Array.from({ length: points.length }, (_: unknown, i: number): number => i);
  const find: (i: number) => number = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };
  const indices: number[] = mesh.indices!;
  for (let t: number = 0; t + 2 < indices.length; t += 3) {
    const a: number = find(indices[t]!);
    for (let k: number = 1; k < 3; k++) {
      const b: number = find(indices[t + k]!);
      if (a !== b) parent[b] = a;
    }
  }
  const label: Map<number, number> = new Map();
  const card: Int32Array = new Int32Array(points.length);
  for (let v: number = 0; v < points.length; v++) {
    const root: number = find(v);
    if (!label.has(root)) label.set(root, label.size);
    card[v] = label.get(root)!;
  }
  return { points, card, count: label.size };
}
