import { AutoMovieMeshExtract, type AutoMovieMeshCourse } from "@automovie/engine";

import type { CaptureModel } from "../inspection/CaptureModel";

type Edge = [number, number];
type V3 = [number, number, number];
type HalfEdge = { a: number; b: number; count: number; winding: number; owners: number[] };
type Clip = (points: number[], faces: readonly number[], plane: AutoMovieMeshCourse.IPlane, sign: 1 | -1) => number[];
type Mesh = CaptureModel.ITriangles;

// The cheek already exposes this exact original cut below both eyelids.
const UPPER_BASE: number = 1584.1547393798828;
// F1 crown terminal critical.1379, transformed to capture world.
const CROWN: V3 = [15.341168642044067, 1699.6932983398438, 0.3223508596420288];
const FRAME: AutoMovieMeshExtract.IFrame = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };

/** Reconnects the observed head skin through its original indexed source sheets. */
export namespace NodeHeadSourceSkin {
  function separate(points: number[], clipped: readonly number[], source: AutoMovieMeshExtract.IMesh): number[] {
    const uses: Map<string, number[]> = new Map();
    for (let i: number = 0; i < clipped.length; ++i) {
      const key: string = edge(clipped[i]!, clipped[next(i)]!);
      const group: number[] = uses.get(key) ?? [];
      group.push(i);
      uses.set(key, group);
    }
    const overlap: Set<string> = new Set([...uses.values()].filter((group: number[]): boolean => group.length > 2)
      .map(([i]: number[]): string => coordinates(points, clipped[i!]!, clipped[next(i!)]!)));
    const original: Map<string, Map<string, string>> = new Map();
    for (let i: number = 0; i < source.indices.length; i += 3) {
      const triangle: number[] = [source.indices[i]!, source.indices[i + 1]!, source.indices[i + 2]!];
      for (let j: number = 0; j < 3; ++j) {
        const a: number = triangle[j]!;
        const b: number = triangle[(j + 1) % 3]!;
        const physical: string = coordinates(source.positions, a, b);
        if (!overlap.has(physical)) continue;
        const owners: Map<string, string> = original.get(physical) ?? new Map();
        const face: string = shape(source.positions, triangle);
        if (owners.has(face)) throw new Error("the same orbital face has two original indexed owners");
        owners.set(face, edge(a, b));
        original.set(physical, owners);
      }
    }

    // Ordinary UV seams have exactly two opposite uses. At a coincident
    // eyelid seam, join only the half-edges that share original vertex IDs.
    const parent: Int32Array = Int32Array.from({ length: clipped.length }, (_: unknown, i: number): number => i);
    const root = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]!]!;
        i = parent[i]!;
      }
      return i;
    };
    const join = ([a, b]: Edge): void => {
      if (clipped[a] !== clipped[next(b)] || clipped[next(a)] !== clipped[b])
        throw new Error("the original orbital half-edges do not have reciprocal winding");
      parent[root(a)] = root(next(b));
      parent[root(next(a))] = root(b);
    };
    for (const group of uses.values()) {
      if (group.length === 2) {
        join([group[0]!, group[1]!]);
      } else if (group.length > 2) {
        const i: number = group[0]!;
        const owners: Map<string, string> | undefined = original.get(coordinates(points, clipped[i]!, clipped[next(i)]!));
        if (owners?.size !== group.length) throw new Error("an overlapping orbital edge lacks exact source incidence");
        const byOwner: Map<string, number[]> = new Map();
        for (const corner of group) {
          const first: number = corner - corner % 3;
          const key: string | undefined = owners.get(shape(points, clipped.slice(first, first + 3)));
          if (key === undefined) throw new Error("an overlapping orbital face lacks its original owner");
          const same: number[] = byOwner.get(key) ?? [];
          same.push(corner);
          byOwner.set(key, same);
        }
        for (const same of byOwner.values()) {
          if (same.length > 2) throw new Error("the original orbital sheet itself has a multiple-use edge");
          if (same.length === 2) join([same[0]!, same[1]!]);
        }
      }
    }

    const used: Set<number> = new Set();
    const indexed: Map<number, number> = new Map();
    return clipped.map((id: number, corner: number): number => {
      const owner: number = root(corner);
      const found: number | undefined = indexed.get(owner);
      if (found !== undefined) return found;
      const index: number = used.has(id) ? points.push(points[3 * id]!, points[3 * id + 1]!, points[3 * id + 2]!) / 3 - 1 : id;
      used.add(id);
      indexed.set(owner, index);
      return index;
    });
  }

  /** Continue the observed skin through the crown and the two existing oral seams. */
  export function attach(capture: CaptureModel.IPart, native: Mesh, original: AutoMovieMeshExtract.IMesh, clip: Clip): void {
    if (capture.loft.status !== "available") return;
    const loft: Extract<CaptureModel.ILoft, { status: "available" }> = capture.loft;
    const spans: readonly (readonly [string, readonly number[]])[] = [
      ["upper head", [UPPER_BASE]],
      // These paired planes already bound the adjoining native mouth, neck and midface runs.
      ["upper oral exterior", [1525.7013702392578, 1526.2989807128906]],
      ["lower oral exterior", [1517.5642395019531, 1518.1841659545898]],
    ];
    for (const [name, levels] of spans) {
      let receipt: string;
      try {
        const patch = reconnect(loft.clay, native, original, clip, levels);
        loft.clay = patch.mesh;
        const end: number = levels[1] ?? Infinity;
        loft.lines = loft.lines.filter((line: CaptureModel.ILine): boolean =>
          line.id.startsWith("head.globe.") || line.points.some(([, y]): boolean => y < levels[0]! || y > end));
        patch.rails.forEach((row: number[], i: number): void => {
          loft.lines.push({ id: `${name}.source.rail.${i}`, points: row.map((id: number): V3 => point(patch.mesh.positions, id)), closed: true, colour: "9e4c74" });
        });
        if (levels.length === 1) {
          const heights: number[] = [1603.79025131464, 1623.79025131464, 1653.79025131464, 1683.79025131464];
          const cuts: AutoMovieMeshExtract.ISection[] = AutoMovieMeshExtract.outline({ positions: patch.mesh.positions, indices: patch.core }, FRAME, heights, 1, 0.5, 0);
          for (const [i, cut] of cuts.entries()) {
            const rings: AutoMovieMeshExtract.ILoop[] = cut.loops.filter((loop: AutoMovieMeshExtract.ILoop): boolean => loop.closed);
            if (rings.length !== 1) continue;
            loft.lines.push({ id: `crown.source.section.${i}`, points: rings[0]!.points.map(([z, x]): V3 => [x, heights[i]!, z]), closed: true, colour: "9e4c74" });
          }
        }
        receipt = `original ${name}: ${patch.faces} source faces, exact reciprocal rails ${patch.rails.map((row: number[]): number => row.length).join("/")}; ${patch.excluded} separate source sheets excluded`;
      } catch (error) {
        receipt = `original ${name} refused: ${error instanceof Error ? error.message : String(error)}`;
      }
      capture.diagnostics.push(receipt);
      loft.diagnostics.push(receipt);
      console.log(receipt);
    }
  }

  /** Index the complete original source once to read the closed shells at the published extrema. */
  export function globeReader(source: AutoMovieMeshExtract.IMesh): (minimum: V3, maximum: V3) => Mesh {
    const vertices: Map<string, number> = new Map();
    const positions: number[] = [];
    const index = (id: number): number => {
      const key: string = vertex(source.positions, id);
      const prior: number | undefined = vertices.get(key);
      if (prior !== undefined) return prior;
      const result: number = positions.push(...point(source.positions, id)) / 3 - 1;
      vertices.set(key, result);
      return result;
    };
    const indices: number[] = [];
    // Source winding is reversed by the reference-to-capture world reflection.
    for (let i: number = 0; i < source.indices.length; i += 3)
      indices.push(index(source.indices[i]!), index(source.indices[i + 2]!), index(source.indices[i + 1]!));
    // The two source extrema lie on a UV island of the globe. Index all
    // original faces before choosing the edge-connected shell they own.
    const parts: number[][] = components(indices);
    const owns = (faces: number[], terminal: V3): boolean =>
      faces.some((id: number): boolean => Math.hypot(...difference(point(positions, id), terminal)) <= 0.00001);
    return (minimum: V3, maximum: V3): Mesh => {
      const candidates: number[][] = parts.filter((faces: number[]): boolean =>
        owns(faces, minimum) && owns(faces, maximum));
      const closed: number[] | undefined = candidates.length === 1 ? candidates[0] : undefined;
      if (closed === undefined || signature(closed) !== "")
        throw new Error("both published globe extrema do not own one closed reciprocal source shell");
      const used: number[] = [...new Set(closed)];
      const mapped: Map<number, number> = new Map(used.map((id: number, i: number): Edge => [id, i]));
      return { positions: used.flatMap((id: number): V3 => point(positions, id)), indices: closed.map((id: number): number => mapped.get(id)!) };
    };
  }

  function reconnect(model: Mesh, native: Mesh, original: AutoMovieMeshExtract.IMesh, clip: Clip, levels: readonly number[]) {
    const lower: number = levels[0]!;
    const upper: number = levels[1] ?? Infinity;
    const within = (id: number): boolean => model.positions[3 * id + 1]! >= lower - 1e-7 && model.positions[3 * id + 1]! <= upper + 1e-7;
    const scoped: number[] = [];
    for (let i: number = 0; i < model.indices.length; i += 3) {
      const face: number[] = model.indices.slice(i, i + 3);
      if (face.every(within)) scoped.push(...face);
    }
    const existing = chooseExterior(model.positions, components(scoped), levels);
    const dropped: Set<string> = new Set();
    for (let i: number = 0; i < existing.faces.length; i += 3) dropped.add(existing.faces.slice(i, i + 3).join(":"));
    let outside: number[] = [];
    for (let i: number = 0; i < model.indices.length; i += 3) {
      const face: number[] = model.indices.slice(i, i + 3);
      if (!dropped.has(face.join(":"))) outside.push(...face);
    }
    const plane = (y: number): AutoMovieMeshCourse.IPlane => ({ station: y, origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const raw: number[] = native.positions.slice();
    let clipped: number[] = clip(raw, native.indices, plane(lower), 1);
    let excluded: number = 0;
    if (Number.isFinite(upper)) clipped = clip(raw, clipped, plane(upper), -1);
    else {
      const ownsPeak = (faces: number[]): boolean => faces.some((id: number): boolean =>
        Math.hypot(...difference(point(raw, id), CROWN)) <= 0.00001);
      const physical: number[][] = components(clipped).filter(ownsPeak);
      if (physical.length !== 1) throw new Error("the archived crown terminal has no unique original skin");
      const owned: number[][] = components(separate(raw, physical[0]!, original));
      const crown: number[][] = owned.filter(ownsPeak);
      if (crown.length !== 1) throw new Error("the separate original sheets do not identify one actual crown");
      clipped = crown[0]!;
      excluded = owned.length - 1;
    }
    const nativePart = chooseExterior(raw, components(clipped), levels);
    const positions: number[] = model.positions.slice();
    const ids: Map<number, number> = new Map([...new Set(nativePart.faces)].map((id: number): [number, number] =>
      [id, positions.push(...point(raw, id)) / 3 - 1]));
    let core: number[] = nativePart.faces.map((id: number): number => ids.get(id)!);
    const rails: number[][] = [];
    for (let i: number = 0; i < levels.length; ++i) {
      const older: number[] = existing.rails[i]!;
      const incoming: number[] = nativePart.rails[i]!.map((id: number): number => ids.get(id)!);
      const joined = refine(positions, outside, core, older, incoming);
      outside = joined.outside;
      core = joined.core;
      rails.push(joined.rail);
    }
    const indices: number[] = outside.concat(core);
    if (signature(indices) !== signature(model.indices)) throw new Error("the original source repair changed the head's indexed boundary");
    return { mesh: { positions, indices }, core, rails, faces: nativePart.faces.length / 3, excluded };
  }

  function chooseExterior(points: number[], parts: number[][], levels: readonly number[]) {
    const candidates = parts.flatMap((faces: number[]) => {
      const rail: number[][] | undefined = boundaries(points, faces, levels);
      return rail?.[0]?.some((id: number): boolean => points[3 * id]! < -40) ? [{ faces, rails: rail }] : [];
    });
    if (candidates.length !== 1) throw new Error("the original exterior does not expose the requested physical rails");
    return candidates[0]!;
  }

  function point(points: ArrayLike<number>, id: number): V3 {
    return [points[3 * id]!, points[3 * id + 1]!, points[3 * id + 2]!];
  }

  function difference(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function refine(positions: number[], outside: number[], core: number[], existing: number[], incoming: number[]) {
    // Both clips intersect the same native triangles. Their triangulation can
    // add different collinear samples. Match only within binary64 roundoff,
    // then split each owning triangle at the other side's actual source point.
    const epsilon: number = 64 * Number.EPSILON * Math.max(1, ...existing.flatMap((id: number): number[] => point(positions, id).map(Math.abs)));
    type Splits = Map<string, { id: number; t: number }[]>;
    const oldSplits: Splits = new Map();
    const newSplits: Splits = new Map();
    const alias: Map<number, number> = new Map();
    const locate = (id: number, rail: number[], splits: Splits): number | undefined => {
      const p: V3 = point(positions, id);
      const same: number | undefined = rail.find((j: number): boolean => Math.hypot(...difference(p, point(positions, j))) <= epsilon);
      if (same !== undefined) return same;
      for (let i: number = 0; i < rail.length; ++i) {
        const a: number = rail[i]!;
        const b: number = rail[(i + 1) % rail.length]!;
        const start: V3 = point(positions, a);
        const direction: V3 = difference(point(positions, b), start);
        const t: number = dot(difference(p, start), direction) / dot(direction, direction);
        if (t <= 0 || t >= 1) continue;
        const foot: V3 = [start[0] + t * direction[0], start[1] + t * direction[1], start[2] + t * direction[2]];
        if (Math.hypot(...difference(p, foot)) > epsilon) continue;
        const key: string = edge(a, b);
        const cuts: { id: number; t: number }[] = splits.get(key) ?? [];
        cuts.push({ id, t: a < b ? t : 1 - t });
        splits.set(key, cuts);
        return undefined;
      }
      throw new Error("two adjacent native clips do not share the same original physical rail");
    };
    for (const id of incoming) {
      const same: number | undefined = locate(id, existing, oldSplits);
      if (same !== undefined) alias.set(id, same);
    }
    for (const id of existing) locate(id, incoming, newSplits);
    const split = (faces: number[], splits: Splits): number[] => {
      const result: number[] = [];
      for (let i: number = 0; i < faces.length; i += 3) {
        const face: number[] = faces.slice(i, i + 3);
        const hits = face.flatMap((a: number, j: number) => {
          const b: number = face[(j + 1) % 3]!;
          const values = splits.get(edge(a, b));
          return values === undefined ? [] : [{ a, b, c: face[(j + 2) % 3]!, values }];
        });
        if (hits.length > 1) throw new Error("one native triangle has two distinct cut edges");
        const hit = hits[0];
        if (hit === undefined) result.push(...face);
        else {
          const values: number[] = hit.values.slice().sort((a, b): number => hit.a < hit.b ? a.t - b.t : b.t - a.t).map(({ id }): number => id);
          const row: number[] = [hit.a, ...values, hit.b];
          for (let j: number = 0; j < row.length - 1; ++j) result.push(row[j]!, row[j + 1]!, hit.c);
        }
      }
      return result;
    };
    const rail: number[] = existing.flatMap((a: number, i: number): number[] => {
      const b: number = existing[(i + 1) % existing.length]!;
      const middle = oldSplits.get(edge(a, b)) ?? [];
      return [a, ...middle.slice().sort((x, y): number => a < b ? x.t - y.t : y.t - x.t).map(({ id }): number => id)];
    });
    return { outside: split(outside, oldSplits), core: split(core, newSplits).map((id: number): number => alias.get(id) ?? id), rail };
  }

  function incidence(indices: readonly number[]): Map<string, HalfEdge> {
    const result: Map<string, HalfEdge> = new Map();
    for (let i: number = 0; i < indices.length; ++i) {
      const a: number = indices[i]!;
      const b: number = indices[next(i)]!;
      const key: string = edge(a, b);
      const winding: number = a < b ? 1 : -1;
      const prior: HalfEdge | undefined = result.get(key);
      if (prior === undefined) result.set(key, { a, b, count: 1, winding, owners: [Math.floor(i / 3)] });
      else {
        ++prior.count;
        prior.winding += winding;
        prior.owners.push(Math.floor(i / 3));
      }
    }
    return result;
  }

  function boundaries(points: number[], indices: number[], levels: readonly number[]): number[][] | undefined {
    const uses: HalfEdge[] = [...incidence(indices).values()];
    if (uses.some((e: HalfEdge): boolean => e.count > 2 || e.count === 2 && e.winding !== 0)) return undefined;
    const border: HalfEdge[] = uses.filter((e: HalfEdge): boolean => e.count === 1);
    const rails: number[][] = [];
    for (const y of levels) {
      const cut: HalfEdge[] = border.filter(({ a, b }): boolean =>
        Math.abs(points[3 * a + 1]! - y) < 1e-7 && Math.abs(points[3 * b + 1]! - y) < 1e-7);
      if (cut.length < 3) return undefined;
      const links: Map<number, number> = new Map(cut.map(({ a, b }): Edge => [a, b]));
      const rail: number[] = [];
      const visited: Set<number> = new Set();
      let vertex: number | undefined = cut[0]!.a;
      while (vertex !== undefined && !visited.has(vertex)) {
        rail.push(vertex);
        visited.add(vertex);
        vertex = links.get(vertex);
      }
      if (vertex !== rail[0] || rail.length !== cut.length) return undefined;
      rails.push(rail);
    }
    return rails.reduce((n: number, rail: number[]): number => n + rail.length, 0) === border.length ? rails : undefined;
  }

  function components(indices: readonly number[]): number[][] {
    const parent: Int32Array = Int32Array.from({ length: indices.length / 3 }, (_: unknown, i: number): number => i);
    const root = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]!]!;
        i = parent[i]!;
      }
      return i;
    };
    for (const { owners } of incidence(indices).values())
      for (const owner of owners.slice(1)) parent[root(owner)] = root(owners[0]!);
    const groups: Map<number, number[]> = new Map();
    for (let i: number = 0; i < indices.length; i += 3) {
      const id: number = root(i / 3);
      const faces: number[] = groups.get(id) ?? [];
      faces.push(indices[i]!, indices[i + 1]!, indices[i + 2]!);
      groups.set(id, faces);
    }
    return [...groups.values()];
  }

  function signature(indices: readonly number[]): string {
    const free: string[] = [];
    for (const [key, e] of incidence(indices)) {
      if (e.count === 1) free.push(`${key}:${e.winding}`);
      else if (e.count !== 2 || e.winding !== 0) throw new Error("the source head has a nonreciprocal indexed edge");
    }
    return free.sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0).join("|");
  }

  function next(corner: number): number {
    return corner - corner % 3 + (corner + 1) % 3;
  }

  function edge(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  function vertex(points: ArrayLike<number>, id: number): string {
    return `${points[3 * id]}:${points[3 * id + 1]}:${points[3 * id + 2]}`;
  }

  function coordinates(points: ArrayLike<number>, a: number, b: number): string {
    const first: string = vertex(points, a);
    const second: string = vertex(points, b);
    return first < second ? `${first}|${second}` : `${second}|${first}`;
  }

  function shape(points: ArrayLike<number>, face: readonly number[]): string {
    return face.map((id: number): string => vertex(points, id))
      .sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0).join("|");
  }
}
