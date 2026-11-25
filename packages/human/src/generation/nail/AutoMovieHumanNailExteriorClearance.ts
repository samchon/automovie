import {
  AutoMovieSolidVector as Vec,
  measureAutoMovieMeshClearance,
} from "@automovie/engine";
import type {
  IAutoMovieHumanLoftMesh,
  IAutoMovieLoftChain,
  IAutoMovieMesh,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanDigitNails } from "./AutoMovieHumanDigitNails";

/** Directional overlap of the actual, trimmed exterior nail triangles. */
export namespace AutoMovieHumanNailExteriorClearance {
  /** Projected triangle coverage for one ordered exterior pair. */
  export interface IProjection {
    /** Maximum inward depth in mm, or null without a tested depth. */
    maximumMm: number | null;
    /** Number of front triangles facing the reading direction. */
    frontTriangles: number;
    /** Number of back triangles facing the reading direction. */
    backTriangles: number;
    /** Number of front triangles with a projected overlap. */
    overlapTriangles: number;
    /** Number of projected overlap polygon vertices tested for depth. */
    witnesses: number;
  }

  /** Keep the directional masks behind the published scalar for inspection. */
  export interface IClipping {
    /** Name of the digit owner on the retained skin. */
    digit: string;
    /** Maximum inward depth in mm, or null when required depth is unavailable. */
    maximumMm: number | null;
    /** Projection of the plate against the surrounding digit skin. */
    plateSkin: IProjection;
    /** Projection of the fold strip against the skin when the strip exists. */
    stripSkin?: IProjection;
    /** Projection of the plate against the fold strip when the strip exists. */
    plateStrip?: IProjection;
  }

  /** One signed pair of opposite edge occurrences on a shared trim. */
  interface IEdge {
    vertices: [number, number];
    front: number;
    back: number;
    winding: number;
  }

  /** Measure only the distinct sites with complete indexed exterior contacts. */
  export function report(
    mesh: IAutoMovieHumanLoftMesh.IContext,
    chains: readonly IAutoMovieLoftChain[],
  ): IClipping[] | undefined {
    const prefix: string = AutoMovieHumanDigitNails.names("").plate;
    const plates: IAutoMovieLoftChain[] = chains.filter(({ name }): boolean =>
      name.startsWith(prefix),
    );
    if (plates.length === 0) return undefined;
    const wanted: Map<string, number[]> = new Map();
    const count: Map<string, number> = new Map();
    for (const { name } of plates) {
      const digit: string = name.slice(prefix.length);
      count.set(digit, (count.get(digit) ?? 0) + 1);
      wanted.set(digit, []);
      wanted.set(name, []);
      wanted.set("fold." + name, []);
    }

    for (const [i, { name, start }] of mesh.groups.entries()) {
      const slash: number = name.lastIndexOf("/");
      if (slash < 0) continue;
      const triangles: number[] | undefined = wanted.get(name.slice(0, slash));
      if (triangles === undefined) continue;
      const end: number = mesh.groups[i + 1]?.start ?? mesh.indices.length;
      for (let k: number = start; k < end; ++k)
        triangles.push(mesh.indices[k]!);
    }

    const out: IClipping[] = [];
    for (const { name, layers } of plates) {
      const digit: string = name.slice(prefix.length);

      // The plate's own middle section supplies the dorsal reading axis in
      // the exact retained frame, including any authored axial roll.
      const dorsal: P3 | undefined =
        layers[Math.floor(layers.length / 2)]?.frame?.u;
      if (count.get(digit) !== 1 || dorsal === undefined) continue;
      const plate: number[] = wanted.get(name)!;
      const skin: number[] = wanted.get(digit)!;
      const fold: number[] = wanted.get("fold." + name)!;
      const welded: boolean =
        fold.length === 0
          ? closedContact(plate, skin)
          : closedContact(plate, fold) && closedContact(fold, skin);
      if (!welded) continue;

      const plateSkin: IProjection | null = measure(
        mesh.positions,
        plate,
        skin,
        dorsal,
      );
      if (plateSkin === null) continue;
      if (fold.length !== 0) {
        const stripSkin: IProjection | null = measure(
          mesh.positions,
          fold,
          skin,
          dorsal,
        );
        const plateStrip: IProjection | null = measure(
          mesh.positions,
          plate,
          fold,
          dorsal,
        );
        if (stripSkin === null || plateStrip === null) continue;
        out.push({
          digit,
          // Only each of the two adjacent pairs owes a contact witness. A
          // strip can separate the crown and skin's projected footprints.
          maximumMm:
            stripSkin.maximumMm === null || plateStrip.maximumMm === null
              ? null
              : Math.max(
                  plateSkin.maximumMm ?? 0,
                  stripSkin.maximumMm,
                  plateStrip.maximumMm,
                ),
          plateSkin,
          stripSkin,
          plateStrip,
        });
      } else out.push({ digit, maximumMm: plateSkin.maximumMm, plateSkin });
    }
    return out.length === 0 ? undefined : out;
  }

  /** Admit one shared cycle with one opposite incidence from each owner. */
  function closedContact(
    front: readonly number[],
    back: readonly number[],
  ): boolean {
    if (front.length === 0 || back.length === 0) return false;
    const frontIds: Set<number> = new Set(front);
    const common: Set<number> = new Set(
      back.filter((id): boolean => frontIds.has(id)),
    );
    if (common.size < 3) return false;
    const edges: Map<string, IEdge> = new Map();
    for (const [side, indices] of [
      ["front", front],
      ["back", back],
    ] as const)
      for (let i: number = 0; i < indices.length; i += 3)
        for (let k: number = 0; k < 3; ++k) {
          const a: number = indices[i + k]!;
          const b: number = indices[i + ((k + 1) % 3)]!;
          if (a === b || !common.has(a) || !common.has(b)) continue;
          const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
          const edge: IEdge = edges.get(key) ?? {
            vertices: [a, b],
            front: 0,
            back: 0,
            winding: 0,
          };
          edge[side]++;
          edge.winding += a < b ? 1 : -1;
          edges.set(key, edge);
        }

    const neighbours: Map<number, number[]> = new Map();
    for (const {
      front: a,
      back: b,
      winding,
      vertices: [i, j],
    } of edges.values()) {
      if (a === 0 || b === 0) continue;
      if (a !== 1 || b !== 1 || winding !== 0) return false;
      neighbours.set(i, [...(neighbours.get(i) ?? []), j]);
      neighbours.set(j, [...(neighbours.get(j) ?? []), i]);
    }
    if (
      neighbours.size !== common.size ||
      [...neighbours.values()].some((row): boolean => row.length !== 2)
    )
      return false;

    const start: number = neighbours.keys().next().value!;
    let before: number = start;
    let at: number = neighbours.get(start)![0]!;
    let size: number = 1;
    while (at !== start) {
      const [a, b]: number[] = neighbours.get(at)!;
      [before, at] = [at, (a === before ? b : a)!];
      ++size;
    }
    return size === neighbours.size;
  }

  /**
   * Project outward triangles into the nail's dorsal chart. The engine
   * intersects the projected triangles and reads their minimum signed depth.
   */
  function measure(
    points: readonly number[],
    front: readonly number[],
    back: readonly number[],
    dorsal: P3,
  ): IProjection | null {
    const n: P3 | null = dorsal.every(Number.isFinite)
      ? Vec.unit(dorsal)
      : null;
    if (n === null || front.length === 0 || back.length === 0) return null;
    const depth: P3 = n;
    const u: P3 = Vec.unit(
      Vec.cross(n, Math.abs(n[0]) < Math.abs(n[1]) ? [1, 0, 0] : [0, 1, 0]),
    )!;
    const v: P3 = Vec.cross(n, u);
    const positions: number[] = [];
    const addresses: Map<number, number> = new Map();

    /** Copy only the indexed triangles owned by this contact. */
    function project(ids: readonly number[]): IAutoMovieMesh | null {
      const indices: number[] = [];
      for (let i: number = 0; i < ids.length; i += 3) {
        const triangle: [number, number, number] = [0, 0, 0];
        for (let k: number = 0; k < 3; ++k) {
          const id: number = ids[i + k]!;
          let index: number | undefined = addresses.get(id);
          if (index === undefined) {
            const p: P3 = [
              points[3 * id]!,
              points[3 * id + 1]!,
              points[3 * id + 2]!,
            ];
            if (!p.every(Number.isFinite)) return null;
            index = positions.length / 3;
            addresses.set(id, index);
            positions.push(
              Vec.dot(u, p) / 1000,
              Vec.dot(v, p) / 1000,
              Vec.dot(depth, p) / 1000,
            );
          }
          triangle[k] = index;
        }
        const [a, b, c]: [number, number, number] = [
          3 * triangle[0],
          3 * triangle[1],
          3 * triangle[2],
        ];
        const du: number = positions[b]! - positions[a]!;
        const dv: number = positions[b + 1]! - positions[a + 1]!;
        if (
          du * (positions[c + 1]! - positions[a + 1]!) >
          dv * (positions[c]! - positions[a]!)
        )
          indices.push(...triangle);
      }
      return indices.length === 0
        ? null
        : { positions, indices, normals: null, uvs: null, skin: null };
    }

    const plate: IAutoMovieMesh | null = project(front);
    const skin: IAutoMovieMesh | null = project(back);
    if (plate === null || skin === null) return null;
    let witnesses: number = 0;
    const gaps = measureAutoMovieMeshClearance(plate, skin, "z", () => {
      ++witnesses;
    });
    return {
      // Touching edges and points count in the engine's overlap. A mask with
      // no tested depth has no reported clearance for the retained contact.
      maximumMm:
        witnesses === 0
          ? null
          : gaps.reduce(
              (max, { minimum }): number => Math.max(max, -1000 * minimum),
              0,
            ),
      frontTriangles: plate.indices!.length / 3,
      backTriangles: skin.indices!.length / 3,
      overlapTriangles: gaps.length,
      witnesses,
    };
  }
}
