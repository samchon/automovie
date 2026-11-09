import { AutoMovieMeshCourse, AutoMovieMeshExtract, tessellateAutoMovieContourStrip64 } from "@automovie/engine";

import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeHeadJunction } from "./NodeHeadJunction";
import { NodeHeadNativeJunctions } from "./NodeHeadNativeJunctions";
import { NodeHeadTrace } from "./NodeHeadTrace";

type V2 = [number, number];
type V3 = [number, number, number];
type Face = [number, number, number];
type Joined = { clay: CaptureModel.ITriangles; receipt: string; original?: CaptureModel.ICurve; lines?: CaptureModel.ILine[] };

const frame: AutoMovieMeshExtract.IFrame = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };

/** The directly observed outer skin at the original eye and upper-neck breaks. */
export namespace NodeHeadOrbit {
  /** Keep the fixed original rims while joining the proved exterior; preserve the sewn posterior on refusal. */
  export function attach(clay: CaptureModel.ITriangles, mesh: AutoMovieMeshExtract.IMesh, lower: number[], upper: number[]): Joined {
    try {
      return exterior(clay, mesh, lower, upper);
    } catch (error) {
      const fallback = posterior(clay, mesh, lower, upper);
      return { ...fallback, receipt: `orbit exterior refused: ${error instanceof Error ? error.message : String(error)}\n${fallback.receipt}` };
    }
  }

  /** Loft the continuous original exterior and leave the separately open lid curves alone. */
  function exterior(clay: CaptureModel.ITriangles, mesh: AutoMovieMeshExtract.IMesh, lower: number[], upper: number[]): Joined {
    const points: number[] = clay.positions.slice();
    const point = (index: number): V3 => at(points, index);
    const lowerY: number = point(lower[0]!)[1];
    const upperY: number = point(upper[0]!)[1];
    // The archive's first/last open-looking rows and the raw continuity checks
    // between them expose the same physical outer contour once its UV seam is read.
    const stations: number[] = [lowerY, 1593.3102798461914, 1593.9, 1594.8, 1595.808048248291, 1596.6, 1597.6, 1598.3057403564453, upperY];
    const raw: CaptureModel.ITriangles = skin(mesh);
    const observed = contours(raw, stations).map(({ loop, open }, i: number) => {
      if (loop === null) throw new Error(`y ${stations[i]} does not have one native exterior ring`);
      return { loop, open };
    });
    const lowCut: number = stations[2]!;
    const highCut: number = stations[6]!;
    const plane = (station: number): AutoMovieMeshCourse.IPlane => ({ station, origin: [0, station, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const patch = clipped(raw, plane(lowCut), plane(highCut), true);
    const offset: number = points.length / 3;
    for (const coordinate of patch.clay.positions) points.push(coordinate);
    const clippedFaces: number[] = patch.clay.indices.map((id: number): number => id + offset);
    const first: number[] = patch.rails.get("first")!.map((id: number): number => id + offset);
    const last: number[] = patch.rails.get("last")!.map((id: number): number => id + offset);
    const lowerStrip: number[] = connect(clay.indices, clippedFaces, lower, first, point);
    const upperStrip: number[] = connect(clippedFaces, clay.indices, last, upper, point);
    const faces: number[] = clippedFaces.concat(lowerStrip, upperStrip);
    const mids: number[] = stations.slice(1).flatMap((y: number, i: number): number[] => {
      const a: number = stations[i]!;
      const fractions: number[] = i === 0 || i === stations.length - 2 ? [0.25, 0.5, 0.75] : [0.5];
      return fractions.map((fraction: number): number => a + fraction * (y - a));
    });
    const target = contours(raw, mids);
    const emitted = contours({ positions: points, indices: faces }, mids);
    const missing: string[] = [];
    const errors: { y: number; deviation: number }[] = target.flatMap(({ loop }, i: number) => {
      const built: V2[] | null = emitted[i]!.loop;
      if (loop !== null && built !== null) return [{ y: mids[i]!, deviation: deviation(loop, built) }];
      missing.push(`${mids[i]} mm (${loop === null && built === null ? "raw and loft" : loop === null ? "raw" : "loft"})`);
      return [];
    });
    const worst = errors.reduce<(typeof errors)[number] | undefined>((best, reading) =>
      best === undefined || reading.deviation > best.deviation ? reading : best, undefined);
    if (worst === undefined) throw new Error("no independent physical midplane could be read");
    const rims: number[] = [lower, upper].map((rail: number[], i: number): number =>
      deviation(rail.map((index: number): V2 => [point(index)[0], point(index)[2]]), observed.at(i === 0 ? 0 : -1)!.loop));
    const original: CaptureModel.ICurve = {
      id: "orbit.original.outer", part: "head", frame: "world", kind: "original exterior sections", aids: [], datums: [],
      lines: observed.map(({ loop }, i: number): CaptureModel.ILine => ({ id: `orbit.original.${i}`, points: loop.map(([x, z]: V2): V3 => [x, stations[i]!, z]), closed: true, colour: "15817e" })),
    };
    const wire: CaptureModel.ILine[] = ([lower, first, last, upper] as const).map((ring: number[], i: number): CaptureModel.ILine =>
      ({ id: `orbit.source-seam.${i}`, points: ring.map(point), closed: true, colour: "9e4c74" }));
    const interior: number[] = stations.slice(3, 6);
    for (const [{ loop }, y] of contours({ positions: points, indices: faces }, interior).map((cut, i) => [cut, interior[i]!] as const))
      if (loop !== null) wire.push({ id: `orbit.clip:${y}`, points: loop.map(([x, z]: V2): V3 => [x, y, z]), closed: true, colour: "9e4c74" });
    return {
      clay: { positions: points, indices: clay.indices.concat(faces) }, original, lines: wire,
      receipt: `orbit exterior ${lowerY}–${upperY} mm: ${observed.length}/${stations.length} closed physical source rings, ${lower.length}/${upper.length} reciprocal shared original edges; source clip ${lowCut}–${highCut} mm ${clippedFaces.length / 3} actual native skin triangles, clip rails ${first.length}/${last.length}, ${(lowerStrip.length + upperStrip.length) / 3} ordinary seam triangles; rim residuals ${rims.map((v: number): string => v.toFixed(3)).join("/")} mm; ${errors.length}/${mids.length} readable raw midplanes, worst ${worst.deviation.toFixed(3)} mm at y ${worst.y} mm; unreadable [${missing.join(", ")}]; independent open eye arcs receive no caps`,
    };
  }

  /** Join all three exterior spans at their existing free rims and leave separate open eye arcs untouched. */
  export function attachBelow(clay: CaptureModel.ITriangles, mesh: AutoMovieMeshExtract.IMesh, rims: readonly [number[], number[]][]): Joined {
    const points: number[] = clay.positions.slice();
    const point = (id: number): V3 => at(points, id);
    const heights: [number, number][] = rims.map(([a, b]): [number, number] => [point(a[0]!)[1], point(b[0]!)[1]]);
    const mids: number[] = heights.map(([a, b]): number => (a + b) / 2);
    const raw: CaptureModel.ITriangles = skin(mesh);
    const sections = contours(raw, mids);
    const faces: number[] = [];
    const lines: CaptureModel.ILine[] = [];
    const receipts: string[] = [];
    for (const [i, [lower, upper]] of rims.entries()) {
      const { loop, open } = sections[i]!;
      if (loop === null) throw new Error(`no closed physical lower-eye exterior at y ${mids[i]} mm`);
      const middle: number[] = AutoMovieMeshExtract.reduceLoop(loop, 0.5).knots
        .map(({ point: [x, z] }): number => points.push(x, mids[i]!, z) / 3 - 1);
      const a: number[] = connect(clay.indices, null, lower, middle, point);
      const b: number[] = connect(a, clay.indices, middle, upper, point);
      faces.push(...a, ...b);
      lines.push({ id: `orbit.lower.source.${i}`, points: middle.map(point), closed: true, colour: "9e4c74" });
      receipts.push(`${heights[i]!.join("–")} mm, ${lower.length}/${upper.length} reciprocal exterior edges, ${loop.length} original points at y ${mids[i]}, ${(a.length + b.length) / 3} triangles, ${open} separate open source arcs preserved`);
    }
    return { clay: { positions: points, indices: clay.indices.concat(faces) }, lines, receipt: `lower orbit skin: ${receipts.join(" | ")}` };
  }

  /** Join two existing native rims with reciprocal indexed edge use. */
  export function connect(before: readonly number[], after: readonly number[] | null, a: number[], b: number[], point: (id: number) => V3): number[] {
    const low: number = NodeHeadTrace.railDirection(before, a);
    const high: number | null = after === null ? null : NodeHeadTrace.railDirection(after, b);
    if (low === 0 || high === 0) throw new Error("an original skin rim is not a complete free indexed rail");
    const strip: number[] = tiles(a, b, point);
    if (NodeHeadTrace.railDirection(strip, a) === low)
      for (let i: number = 0; i < strip.length; i += 3) [strip[i + 1], strip[i + 2]] = [strip[i + 2]!, strip[i + 1]!];
    if (NodeHeadTrace.railDirection(strip, a) !== -low || (high !== null && NodeHeadTrace.railDirection(strip, b) !== -high))
      throw new Error("the source clip does not share both rim edge sequences in opposite pairs");
    return strip;
  }

  function area(points: V3[]): number {
    return points.reduce((sum: number, [x, , z]: V3, i: number): number => {
      const [u, , v]: V3 = points[(i + 1) % points.length]!;
      return sum + x * v - z * u;
    }, 0);
  }

  /** Clip the native skin through the observed neck split, preserving both free cut boundaries for sewing. */
  export function clip(mesh: AutoMovieMeshExtract.IMesh, from: AutoMovieMeshCourse.IPlane, to: AutoMovieMeshCourse.IPlane): { clay: CaptureModel.ITriangles; lines: CaptureModel.ILine[]; rails: Map<string, number[]>; receipt: string } {
    return clipped(skin(mesh), from, to, false);
  }

  function clipped(native: CaptureModel.ITriangles, from: AutoMovieMeshCourse.IPlane, to: AutoMovieMeshCourse.IPlane, outer: boolean): ReturnType<typeof clip> {
    const points: number[] = native.positions.slice();
    const above: number[] = clipPlane(points, native.indices, from, 1);
    const crossed: Map<string, number> = new Map();
    const all: number[] = clipPlane(points, above, to, -1, crossed);
    const faces: number[] = outer ? NodeHeadNativeJunctions.sideSkin(points, NodeHeadJunction.posteriorComponent(points, all), clipPlane(points, above, to, 1, crossed), to.station) : all;
    const used: number[] = [...new Set(faces)];
    const map: Map<number, number> = new Map(used.map((id: number, i: number): [number, number] => [id, i]));
    const clay: CaptureModel.ITriangles = { positions: used.flatMap((id: number): V3 => at(points, id)), indices: faces.map((id: number): number => map.get(id)!) };
    const first: number[] = boundary(clay, from, outer);
    const last: number[] = boundary(clay, to, outer);
    const rails: Map<string, number[]> = new Map([["first", first], ["last", last]]);
    const lines: CaptureModel.ILine[] = [...rails].map(([name, rail]): CaptureModel.ILine =>
      ({ id: `submental.original.${name}`, points: rail.map((id: number): V3 => at(clay.positions, id)), closed: true, colour: "9e4c74" }));
    return { clay, lines, rails, receipt: `original submental skin ${from.station}–${to.station} mm: ${faces.length / 3} clipped source triangles, ${first.length}/${last.length} unchanged physical boundary edges around the actual two-ring event` };
  }

  function contours(mesh: AutoMovieMeshExtract.IMesh, stations: readonly number[]): { loop: V2[] | null; open: number }[] {
    return AutoMovieMeshExtract.outline(mesh, frame, stations, 1, 0.5, 0).map((section: AutoMovieMeshExtract.ISection) => {
      const outer: AutoMovieMeshExtract.ILoop[] = section.loops.filter((loop: AutoMovieMeshExtract.ILoop): boolean =>
        loop.closed && loop.points.some(([, x]: V2): boolean => x < -60));
      return { loop: outer.length === 1 ? outer[0]!.points.map(([z, x]: V2): V2 => [x, z]) : null,
        open: section.loops.filter((loop: AutoMovieMeshExtract.ILoop): boolean => !loop.closed).length };
    });
  }

  function tiles(a: readonly number[], b: readonly number[], point: (id: number) => V3): number[] {
    const lower: V3[] = a.map(point);
    const upper: V3[] = b.map(point);
    const ids: Map<V3, number> = new Map([...lower.map((p: V3, i: number): [V3, number] => [p, a[i]!]), ...upper.map((p: V3, i: number): [V3, number] => [p, b[i]!])]);
    // Chart correspondence uses the same point progression; triangle winding
    // is certified independently against the two physical free rails.
    if (area(lower) < 0) lower.reverse();
    if (area(upper) < 0) upper.reverse();
    const faces: number[] = [];
    let refusal: string | null = null;
    tessellateAutoMovieContourStrip64(lower, upper, (p: V3, q: V3, r: V3): void => {
      faces.push(ids.get(p)!, ids.get(q)!, ids.get(r)!);
    }, undefined, (result): void => {
      if (!result.qualified) refusal = result.diagnostics.join(" | ") || "an original contour strip was unqualified";
    });
    if (refusal !== null) throw new Error(refusal);
    return faces;
  }

  /** Recover the native exterior through exact UV duplicates without joining separated surfaces by proximity. */
  export function skin(mesh: AutoMovieMeshExtract.IMesh): CaptureModel.ITriangles {
    const ids: Map<string, number> = new Map();
    const positions: number[] = [];
    const vertex: number[] = [];
    for (let i: number = 0; i < mesh.positions.length / 3; ++i) {
      const p: V3 = at(mesh.positions, i);
      const key: string = p.join(":");
      let id: number | undefined = ids.get(key);
      if (id === undefined) {
        id = positions.push(...p) / 3 - 1;
        ids.set(key, id);
      }
      vertex.push(id);
    }
    const parent: Int32Array = Int32Array.from({ length: positions.length / 3 }, (_: unknown, i: number): number => i);
    const root = (id: number): number => {
      while (parent[id] !== id) { parent[id] = parent[parent[id]!]!; id = parent[id]!; }
      return id;
    };
    const indices: number[] = Array.from(mesh.indices, (id: number): number => vertex[id]!);
    for (let i: number = 0; i < indices.length; i += 3) {
      const a: number = root(indices[i]!);
      parent[root(indices[i + 1]!)] = a;
      parent[root(indices[i + 2]!)] = a;
    }
    let posterior: number = -1;
    for (let i: number = 0; i < positions.length / 3; ++i) {
      const [x, y]: V3 = at(positions, i);
      if (y > 1593 && y < 1599 && (posterior < 0 || x < positions[3 * posterior]!)) posterior = i;
    }
    if (posterior < 0) throw new Error("the original head exterior component is unavailable");
    const owner: number = root(posterior);
    const exterior: number[] = [];
    // Reflection to the capture world changes the original triangle winding.
    for (let i: number = 0; i < indices.length; i += 3)
      if (root(indices[i]!) === owner) exterior.push(indices[i]!, indices[i + 2]!, indices[i + 1]!);
    return { positions, indices: exterior };
  }

  /** Share one exact interpolation per crossed native edge on both sides of a cut. */
  export function clipPlane(points: number[], faces: readonly number[], plane: AutoMovieMeshCourse.IPlane, sign: 1 | -1, crossed: Map<string, number> = new Map()): number[] {
    const distances: number[] = Array.from({ length: points.length / 3 }, (_: unknown, id: number): number => distance(at(points, id), plane));
    const kept: number[] = [];
    for (let i: number = 0; i < faces.length; i += 3) {
      const face: Face = [faces[i]!, faces[i + 1]!, faces[i + 2]!];
      const polygon: number[] = [];
      for (let j: number = 0; j < 3; ++j) {
        const a: number = face[j]!;
        const b: number = face[(j + 1) % 3]!;
        const da: number = sign * distances[a]!;
        const db: number = sign * distances[b]!;
        if (da >= 0) polygon.push(a);
        if (da * db >= 0) continue;
        const key: string = edge(a, b);
        let id: number | undefined = crossed.get(key);
        if (id === undefined) {
          const t: number = da / (da - db);
          const p: V3 = at(points, a);
          const q: V3 = at(points, b);
          id = points.push(...p.map((value: number, k: number): number => value + t * (q[k]! - value))) / 3 - 1;
          crossed.set(key, id);
        }
        polygon.push(id);
      }
      for (let j: number = 1; j + 1 < polygon.length; ++j) kept.push(polygon[0]!, polygon[j]!, polygon[j + 1]!);
    }
    return kept;
  }

  function boundary(clay: CaptureModel.ITriangles, plane: AutoMovieMeshCourse.IPlane, outer: boolean): number[] {
    const uses: Map<string, [number, number, number]> = new Map();
    for (let i: number = 0; i < clay.indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = clay.indices[i + j]!;
        const b: number = clay.indices[i + (j + 1) % 3]!;
        const key: string = edge(a, b);
        const prior = uses.get(key);
        if (prior === undefined) uses.set(key, [a, b, 1]);
        else ++prior[2];
      }
    const next: Map<number, number[]> = new Map();
    for (const [a, b, count] of uses.values())
      if (count === 1 && [a, b].every((id: number): boolean => Math.abs(distance(at(clay.positions, id), plane)) < 1e-8)) {
        const outgoing: number[] = next.get(a) ?? [];
        outgoing.push(b);
        next.set(a, outgoing);
      }
    const keys: number[] = [...next.keys()];
    const first: number | undefined = outer ? keys.reduce<number | undefined>((best, id): number =>
      best === undefined || at(clay.positions, id)[0] < at(clay.positions, best)[0] ? id : best, undefined) : keys[0];
    if (first === undefined) throw new Error("the clipped original skin has no free boundary on the plane");
    const found: number[][] = [];
    const path: number[] = [first];
    const seen: Set<number> = new Set(path);
    const walk = (id: number): void => {
      if (found.length > 1) return;
      for (const child of next.get(id) ?? []) {
        if (child === first && path.length >= 3) found.push(path.slice());
        else if (!seen.has(child)) {
          seen.add(child);
          path.push(child);
          walk(child);
          path.pop();
          seen.delete(child);
        }
      }
    };
    walk(first);
    if (found.length !== 1 || (!outer && found[0]!.length !== next.size)) throw new Error("the clipped plane does not have one physical exterior rim");
    return found[0]!;
  }
  function at(positions: ArrayLike<number>, id: number): V3 {
    return [positions[3 * id]!, positions[3 * id + 1]!, positions[3 * id + 2]!];
  }

  function edge(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  function distance([x, y, z]: V3, plane: AutoMovieMeshCourse.IPlane): number {
    const [a, b, c]: V3 = plane.v;
    const [u, v, w]: V3 = plane.u;
    const [px, py, pz]: V3 = plane.origin;
    return (x - px) * (b * w - c * v) + (y - py) * (c * u - a * w) + (z - pz) * (a * v - b * u);
  }

  function deviation(a: V2[], b: V2[]): number {
    return Math.sqrt(Math.max(NodeHeadTrace.directed(a, b), NodeHeadTrace.directed(b, a)));
  }

  /** Join the measured posterior overlap with opposite incidence on both existing rims. */
  function posterior(clay: CaptureModel.ITriangles, mesh: AutoMovieMeshExtract.IMesh, lower: number[], upper: number[]): Joined {
    const { positions, indices } = clay;
    const lowerY: number = positions[3 * lower[0]! + 1]!;
    const upperY: number = positions[3 * upper[0]! + 1]!;
    const projected = (index: number): V2 => [positions[3 * index]!, positions[3 * index + 2]!];
    const steps: number[] = CaptureSpecs.steps(lowerY, upperY, 1);
    const mids: number[] = steps.slice(1).map((station: number, i: number): number => (station + steps[i]!) / 2);
    const rows: V2[][] = posteriorSections(mesh, steps);
    const original: V2[][] = posteriorSections(mesh, mids);
    const native: V2[][] = rows.concat(original);
    const low: number = Math.max(...native.map((arc: V2[]): number => arc[0]![1]));
    const high: number = Math.min(...native.map((arc: V2[]): number => arc.at(-1)![1]));
    const sides = [lower, upper].map((ring: number[], i: number) => {
      const source: V2[] = rows.at(i === 0 ? 0 : -1)!;
      const points: V2[] = ring.map(projected);
      const indexed: Map<string, number> = new Map(points.map((p: V2, k: number): [string, number] => [p.join(":"), ring[k]!]));
      const rear: V2[] = posteriorArc([{ points, closed: true }]);
      const rearIndex: number = posteriorIndex(rear);
      const agrees = (p: V2): boolean => p[1] >= low && p[1] <= high && gap(p, source) <= 0.5;
      if (!agrees(rear[rearIndex]!)) throw new Error("the retained and original posterior supports differ");
      let a: number = rearIndex;
      let b: number = rearIndex;
      while (a > 0 && agrees(rear[a - 1]!)) --a;
      while (b + 1 < rear.length && agrees(rear[b + 1]!)) ++b;
      if (a === rearIndex || b === rearIndex) throw new Error("no proved two-sided posterior overlap with the retained rim");
      const arc: V2[] = rear.slice(a, b + 1);
      return { arc, rail: arc.map((p: V2): number => indexed.get(p.join(":"))!) };
    });
    const bounds = (y: number): V2 => {
      const t: number = (y - lowerY) / (upperY - lowerY);
      const a: V2[] = sides[0]!.arc;
      const b: V2[] = sides[1]!.arc;
      return [(1 - t) * a[0]![1] + t * b[0]![1], (1 - t) * a.at(-1)![1] + t * b.at(-1)![1]];
    };
    const profiles: V2[][] = rows.map((arc: V2[], i: number): V2[] => trim(arc, bounds(steps[i]!)));
    const rimErrors: number[] = sides.map(({ arc }, i: number): number => openDeviation(arc, profiles.at(i === 0 ? 0 : -1)!));
    if (rimErrors.some((error: number): boolean => error > 0.5)) throw new Error(`the proved posterior arc differs from an existing rim by ${rimErrors.map((error: number): string => error.toFixed(3)).join("/")} mm`);
    const sense: number[] = sides.map(({ rail }): number => NodeHeadTrace.railDirection(indices, rail, false));
    if (sense[0] === 0 || sense[0] !== -sense[1]!) throw new Error("the two observed posterior rails are not oppositely oriented free edges");
    const points: number[] = positions.slice();
    const indexed: number[][] = [sides[0]!.rail];
    for (let i: number = 1; i + 1 < profiles.length; ++i)
      indexed.push(profiles[i]!.map(([x, z]: V2): number => points.push(x, steps[i]!, z) / 3 - 1));
    indexed.push(sides[1]!.rail);
    const faces: number[] = [];
    for (let i: number = 1; i < indexed.length; ++i) {
      const a: number[] = indexed[i - 1]!;
      const b: number[] = indexed[i]!;
      const phaseA: number[] = arcPhase(a, points);
      const phaseB: number[] = arcPhase(b, points);
      let j: number = 0;
      let k: number = 0;
      while (j + 1 < a.length || k + 1 < b.length) {
        const triangle: [number, number, number] = (phaseA[j + 1] ?? Infinity) <= (phaseB[k + 1] ?? Infinity)
          ? [a[j]!, a[++j]!, b[k]!] : [a[j]!, b[++k]!, b[k - 1]!];
        if (sense[0] === 1) [triangle[1], triangle[2]] = [triangle[2], triangle[1]];
        faces.push(...triangle);
      }
    }
    if (sides.some(({ rail }, i: number): boolean => NodeHeadTrace.railDirection(faces, rail, false) !== -sense[i]!))
      throw new Error("the posterior patch did not reuse both free rails in opposite incidence");
    const derived: V2[][] = posteriorSections({ positions: points, indices: faces }, mids);
    const worst: number = Math.max(...original.map((arc: V2[], i: number): number => openDeviation(trim(arc, bounds(mids[i]!)), derived[i]!)));
    return {
      clay: { positions: points, indices: indices.concat(faces) },
      receipt: `posterior orbit skin ${lowerY}–${upperY} mm: ${sides.map(({ rail }): number => rail.length - 1).join("/")} reciprocal existing edges, ${faces.length / 3} ordinary open triangles, rim residuals ${rimErrors.map((error: number): string => error.toFixed(3)).join("/")} mm, ${mids.length} raw midplanes, worst ${worst.toFixed(3)} mm; facial apertures and lateral edges remain open`,
    };
  }

  function posteriorIndex(arc: readonly V2[]): number {
    return arc.reduce((best: number, p: V2, i: number): number => p[0] < arc[best]![0] ? i : best, 0);
  }

  /** Trim at the actual intersections of an original polyline and the two seam planes. */
  function trim(arc: V2[], bounds: V2): V2[] {
    const back: number = posteriorIndex(arc);
    const half = (step: -1 | 1, z: number): V2[] => {
      const points: V2[] = [arc[back]!];
      for (let i: number = back + step; i >= 0 && i < arc.length; i += step) {
        const p: V2 = arc[i]!;
        const a: V2 = points.at(-1)!;
        if (step * (p[1] - z) >= 0) {
          const t: number = (z - a[1]) / (p[1] - a[1]);
          points.push(t === 1 ? p : [a[0] + t * (p[0] - a[0]), z]);
          return points;
        }
        points.push(p);
      }
      throw new Error("a seam plane falls outside the observed posterior arc");
    };
    return half(-1, bounds[0]).reverse().concat(half(1, bounds[1]).slice(1));
  }

  function gap([x, z]: V2, target: readonly V2[]): number {
    let minimum: number = Infinity;
    for (let i: number = 1; i < target.length; ++i) {
      const [u, v]: V2 = target[i - 1]!;
      const [du, dv]: V2 = [target[i]![0] - u, target[i]![1] - v];
      const length: number = du * du + dv * dv;
      const t: number = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - u) * du + (z - v) * dv) / length));
      minimum = Math.min(minimum, Math.hypot(x - u - t * du, z - v - t * dv));
    }
    return minimum;
  }

  function openDeviation(a: readonly V2[], b: readonly V2[]): number {
    return Math.max(...a.map((p: V2): number => gap(p, b)), ...b.map((p: V2): number => gap(p, a)));
  }

  function posteriorSections(mesh: AutoMovieMeshExtract.IMesh, stations: readonly number[]): V2[][] {
    return AutoMovieMeshExtract.outline(mesh, { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }, stations, 1, 0.5, 0)
      .map((section: AutoMovieMeshExtract.ISection): V2[] => posteriorArc(section.loops.map(({ points, closed }): AutoMovieMeshExtract.ILoop =>
        ({ closed, points: points.map(([z, x]: V2): V2 => [x, z]) }))));
  }

  function arcPhase(rail: readonly number[], positions: readonly number[]): number[] {
    const phase: number[] = [0];
    for (let i: number = 1; i < rail.length; ++i) {
      const a: number = 3 * rail[i - 1]!;
      const b: number = 3 * rail[i]!;
      phase.push(phase[i - 1]! + Math.hypot(positions[a]! - positions[b]!, positions[a + 2]! - positions[b + 2]!));
    }
    return phase.map((distance: number): number => distance / phase.at(-1)!);
  }

  /** Keep the native arc between the two lateral extrema reached from the posterior support. */
  function posteriorArc(loops: readonly AutoMovieMeshExtract.ILoop[]): V2[] {
    const graph: Map<string, { point: V2; neighbours: Set<string> }> = new Map();
    const node = (point: V2): string => {
      const key: string = point.join(":");
      if (!graph.has(key)) graph.set(key, { point, neighbours: new Set() });
      return key;
    };
    for (const loop of loops) {
      const path: string[] = loop.points.map(node);
      for (let i: number = 0; i < path.length - (loop.closed ? 0 : 1); ++i) {
        const a: string = path[i]!;
        const b: string = path[(i + 1) % path.length]!;
        if (a === b) continue;
        graph.get(a)!.neighbours.add(b);
        graph.get(b)!.neighbours.add(a);
      }
    }
    const anchor: string | undefined = [...graph.keys()].reduce<string | undefined>((best, key) =>
      best === undefined || graph.get(key)!.point[0] < graph.get(best)!.point[0] ? key : best, undefined);
    if (anchor === undefined) throw new Error("the posterior support is absent");
    const origin: V2 = graph.get(anchor)!.point;
    const seam = graph.get(anchor)!;
    // The two raw posterior seam edges have the same source endpoints.
    // Opposite interpolation order can differ by one binary64 rounding step.
    if (seam.neighbours.size === 1) {
      const epsilon: number = 8 * Number.EPSILON * Math.max(1, Math.abs(origin[0]), Math.abs(origin[1]));
      const coincident = [...graph].filter(([key, entry]): boolean =>
        key !== anchor && entry.neighbours.size === 1 && Math.hypot(entry.point[0] - origin[0], entry.point[1] - origin[1]) <= epsilon);
      if (coincident.length === 1) {
        const [key, entry] = coincident[0]!;
        const neighbour: string = [...entry.neighbours][0]!;
        graph.get(neighbour)!.neighbours.delete(key);
        graph.get(neighbour)!.neighbours.add(anchor);
        seam.neighbours.add(neighbour);
        graph.delete(key);
      }
    }
    if (seam.neighbours.size !== 2) throw new Error("the raw posterior support lacks two unique continuations");
    const paths: V2[][] = [...graph.get(anchor)!.neighbours].map((next: string): V2[] => {
      const path: V2[] = [];
      const visited: Set<string> = new Set([anchor]);
      let previous: string = anchor;
      let current: string | undefined = next;
      let extreme: number = 0;
      while (current !== undefined && !visited.has(current)) {
        const entry: { point: V2; neighbours: Set<string> } = graph.get(current)!;
        if (path.length > 0 && (path[0]![1] - origin[1]) * (entry.point[1] - origin[1]) <= 0) break;
        if (Math.abs(entry.point[1] - origin[1]) > Math.abs((path[extreme]?.[1] ?? origin[1]) - origin[1])) extreme = path.length;
        path.push(entry.point);
        visited.add(current);
        const following: string[] = [...entry.neighbours].filter((key: string): boolean => key !== previous);
        previous = current;
        current = following.length === 1 ? following[0] : undefined;
      }
      return path.slice(0, extreme + 1);
    }).sort((a: V2[], b: V2[]): number => a.at(-1)![1] - b.at(-1)![1]);
    if (!(paths[0]!.at(-1)![1] < origin[1] && paths[1]!.at(-1)![1] > origin[1])) throw new Error("the raw posterior continuations do not reach opposite sides");
    return paths[0]!.reverse().concat([origin], paths[1]!);
  }
}
