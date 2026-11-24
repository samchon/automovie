import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/** Original MPFB material faces of one nail on the pinned indexed body. */
export namespace FamilyConicMpfbNailStock {
  /** One indexed nail material patch and the original skin along its border. */
  export interface IPatch {
    /** Compact indexed skin triangles of the published nail material. */
    readonly indices: number[];
    /** The source skin's world millimetre vertices in the material patch. */
    readonly points: P3[];
    /** Exact world triangles of the original material surface. */
    readonly faces: [P3, P3, P3][];
    /** Area-weighted outward face normal in the source frame. */
    readonly outward: P3;
    /** Shared material edges and original opposite skin corners. */
    readonly margins: { edge: readonly [P3, P3]; skin: P3 }[];
  }

  /**
   * Prepare the source's independently enumerated nail patches for this read.
   *
   * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/entities/socketobject/_extra_vertex_groups.py
   */
  export async function prepare(
    source: Mpfb.ISource,
  ): Promise<(digit: string, pole: P3) => IPatch> {
    const url: string = new URL(
      "../../entities/socketobject/_extra_vertex_groups.py",
      source.source.url,
    ).href;
    const response: Response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`MPFB nail material table returned ${response.status}`);
    const table: string = await response.text();
    const across = neighbours(source);
    const hands: IPatch[] = patches(
      source,
      group(table, "fingernails"),
      across,
    );
    const feet: IPatch[] = patches(source, group(table, "toenails"), across);
    if (hands.length !== 10 || feet.length !== 10)
      throw new Error(
        `Expected ten bilateral MPFB nail patches of each kind, found ${hands.length} / ${feet.length}`,
      );
    return (digit, pole): IPatch => {
      const candidates: IPatch[] = digit.startsWith("finger.") ? hands : feet;
      const gap = ({ points }: IPatch): number =>
        Math.min(...points.map((p): number => Math.hypot(...Vec.sub(p, pole))));
      return candidates.reduce((a, b): IPatch => (gap(a) <= gap(b) ? a : b));
    };
  }

  /** Read both original incidences of a stock material edge. */
  function neighbours(
    source: Mpfb.ISource,
  ): (a: number, b: number) => readonly number[] {
    const { positions, indices } = source.body;
    const base: number = positions.length / 3;
    const key = (a: number, b: number): number =>
      Math.min(a, b) * base + Math.max(a, b);
    const adjacent: Map<number, number[]> = new Map();
    for (let i: number = 0; i < indices.length; i += 3) {
      for (let j: number = 0; j < 3; ++j) {
        const k: number = key(indices[i + j]!, indices[i + ((j + 1) % 3)]!);
        const point: number = indices[i + ((j + 2) % 3)]!;
        const prior: number[] | undefined = adjacent.get(k);
        if (prior === undefined) adjacent.set(k, [point]);
        else prior.push(point);
      }
    }
    return (a, b): readonly number[] => adjacent.get(key(a, b)) ?? [];
  }

  /** Read an original named numeric assignment without executing the file. */
  function group(table: string, name: "fingernails" | "toenails"): Set<number> {
    const prefix: string = `vertex_group_information["basemesh"]["${name}"] = `;
    const line: string | undefined = table
      .split(/\r?\n/)
      .find((value): boolean => value.startsWith(prefix));
    if (line === undefined) throw new Error(`Missing MPFB group ${name}`);
    const ids: unknown = JSON.parse(line.slice(prefix.length));
    if (!Array.isArray(ids) || ids.some((i): boolean => !Number.isInteger(i)))
      throw new Error(`Invalid MPFB group ${name}`);
    return new Set<number>(ids);
  }

  /** Read complete labelled triangles and partition by original incidence. */
  function patches(
    source: Mpfb.ISource,
    original: ReadonlySet<number>,
    across: ReturnType<typeof neighbours>,
  ): IPatch[] {
    const { indices, positions } = source.body;
    const triangles: [number, number, number][] = [];
    const incident: Map<number, number[]> = new Map();
    for (let i: number = 0; i < indices.length; i += 3) {
      const f: [number, number, number] = [
        indices[i]!,
        indices[i + 1]!,
        indices[i + 2]!,
      ];
      if (!f.every((k): boolean => original.has(source.bodyVertexIds[k]!)))
        continue;
      for (const k of f) {
        const existing: number[] | undefined = incident.get(k);
        if (existing === undefined) incident.set(k, [triangles.length]);
        else existing.push(triangles.length);
      }
      triangles.push(f);
    }
    const at = (i: number): P3 => [
      positions[3 * i]!,
      positions[3 * i + 1]!,
      positions[3 * i + 2]!,
    ];
    const seen: Set<number> = new Set();
    const out: IPatch[] = [];
    for (let seed: number = 0; seed < triangles.length; ++seed) {
      if (seen.has(seed)) continue;
      const queue: number[] = [seed];
      const footprint: Set<number> = new Set();
      let normal: P3 = [0, 0, 0];
      seen.add(seed);
      for (let j: number = 0; j < queue.length; ++j) {
        const f: [number, number, number] = triangles[queue[j]!]!;
        const [a, b, c] = [at(f[0]), at(f[1]), at(f[2])];
        normal = Vec.add(normal, Vec.cross(Vec.sub(b, a), Vec.sub(c, a)));
        for (const k of f) {
          footprint.add(k);
          for (const face of incident.get(k)!) {
            if (seen.has(face)) continue;
            seen.add(face);
            queue.push(face);
          }
        }
      }
      const outward: P3 | null = Vec.unit(normal);
      if (outward === null) throw new Error("An MPFB nail has no outward area");
      const margins: IPatch["margins"] = [];
      for (const i of queue) {
        const f: [number, number, number] = triangles[i]!;
        for (let j: number = 0; j < 3; ++j) {
          const a: number = f[j]!,
            b: number = f[(j + 1) % 3]!;
          const outer: number | undefined = across(a, b).find(
            (k): boolean => !footprint.has(k),
          );
          if (outer !== undefined)
            margins.push({ edge: [at(a), at(b)], skin: at(outer) });
        }
      }
      out.push({
        indices: queue.flatMap((i): number[] => triangles[i]!),
        points: [...footprint].map(at),
        faces: queue.map((i): [P3, P3, P3] => {
          const [a, b, c] = triangles[i]!;
          return [at(a), at(b), at(c)];
        }),
        outward,
        margins,
      });
    }
    return out;
  }
}
