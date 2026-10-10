import { Vector3 } from "@automovie/engine";

import type { IHumanHeadNasalRecipe } from "./structures/IHumanHeadNasalRecipe.ts";
import type { IHumanHeadSourceNasalSection } from "./structures/IHumanHeadSourceNasalSection.ts";
import type { IHumanHeadSourceProfiles } from "./structures/IHumanHeadSourceProfiles.ts";

/** Carry each original native cap's full incidence into its source vestibule.
 * Frozen source-family unit directions must remain inside every current facet's
 * positive normal cone. Two ruled sections share the original host rim and
 * terminal cap cells retain one-to-one native point and corner lineage.
 * Original caller coordinates and cells are read-only. No fan, projected cap,
 * clinical airway estimate or coordinate welding substitutes for source support.
 */
export function evaluateHumanHeadSourceNasalSections(
  vertices: Float64Array,
  polygons: readonly number[][],
  profiles: IHumanHeadSourceProfiles,
  recipe: IHumanHeadNasalRecipe,
): [Float64Array, number[][], IHumanHeadSourceNasalSection[]] {
  const positions = Array.from(vertices), removed = new Set<number>();
  const appended: number[][] = [], records: IHumanHeadSourceNasalSection[] = [];
  const point = (id: number) => Vector3.create(vertices[3 * id], vertices[3 * id + 1], vertices[3 * id + 2]);
  const boundary = (name: string, selected: readonly number[]): number[] => {
    const edges = new Map<string, Array<readonly [number, number]>>(), visited = new Set<number>();
    for (const ordinal of selected) {
      if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= polygons.length || visited.has(ordinal))
        throw new Error(name + ": source patch has an invalid or duplicate native cell ordinal.");
      visited.add(ordinal);
      const cell = polygons[ordinal];
      for (let index = 0; index < cell.length; index++) {
        const a = cell[index], b = cell[(index + 1) % cell.length];
        const key = Math.min(a, b) + ":" + Math.max(a, b);
        const values = edges.get(key) ?? [];
        values.push([a, b]); edges.set(key, values);
      }
    }
    const successor = new Map<number, number>(), incoming = new Set<number>();
    for (const values of edges.values()) {
      if (values.length > 2) throw new Error(name + ": source replacement patch is nonmanifold.");
      if (values.length === 2) {
        if (values[0][0] !== values[1][1] || values[0][1] !== values[1][0])
          throw new Error(name + ": inconsistent source winding across an interior edge.");
        continue;
      }
      const [a, b] = values[0];
      if (successor.has(a) || incoming.has(b)) throw new Error(name + ": source patch boundary branches.");
      successor.set(a, b); incoming.add(b);
    }
    if (successor.size === 0 || [...successor.keys()].some((id) => !incoming.has(id)))
      throw new Error(name + ": source patch boundary does not close.");
    const start = [...successor.keys()].reduce((value, id) => Math.min(value, id), Infinity);
    const cycle = [start], seen = new Set(cycle);
    let cursor = successor.get(start)!;
    while (cursor !== start) {
      if (seen.has(cursor) || cycle.length >= successor.size)
        throw new Error(name + ": source boundary cycle does not close once.");
      cycle.push(cursor); seen.add(cursor); cursor = successor.get(cursor)!;
    }
    if (cycle.length !== successor.size) throw new Error(name + ": source patch has multiple boundary cycles.");
    return cycle;
  };
  for (const side of ["right", "left"] as const) {
    const dimensions = recipe[side];
    if (!Object.values(dimensions).every(Number.isFinite)) throw new Error(side + ": nasal section dimensions must be finite.");
    const section = dimensions.rimSupportDepthMillimetres / 1000, depth = dimensions.liningDepthMillimetres / 1000;
    if (section <= 0 || depth <= section) throw new Error(side + ": nasal lining needs positive depth beyond its rim support.");
    const socket = profiles.nasalSocket.ports.find((port) => port.side === side);
    const fit = profiles.nasalAxis.axes.find((axis) => axis.side === side);
    if (socket === undefined || fit === undefined) throw new Error(side + ": original source socket and normal-cone axis are required.");
    const selected = socket.nativePolygonOrdinals, cycle = boundary("nasal-socket-" + side, selected);
    if (JSON.stringify(cycle) !== JSON.stringify(socket.orderedNativeBoundary))
      throw new Error("Nasal intrinsic source patch disagrees with its fixed port.");
    const sourceCells = selected.map((ordinal) => polygons[ordinal]);
    if (sourceCells.some((cell) => cell.length !== 4)) throw new Error(side + ": nasal source cap requires its original quadrilateral cells.");
    const sourceIds = [...new Set(sourceCells.flat())].sort((a, b) => a - b);
    const outward = fit.outwardAxisBlender;
    // Preserve the original NumPy isclose-to-one admission (rtol=1e-5,
    // atol=1e-8); this source-unit gate is neither a weld nor an area tolerance.
    if (outward.length !== 3 || !outward.every(Number.isFinite) || Math.abs(Math.hypot(...outward) - 1) > 1e-5 + 1e-8)
      throw new Error("Nasal source axis must be its fitted unit direction.");
    const axis = Vector3.create(outward[0], outward[1], outward[2]);
    let minimum = Infinity;
    for (const triangle of sourceCells.flatMap((cell) => [[cell[0], cell[1], cell[2]], [cell[0], cell[2], cell[3]]])) {
      const normal = Vector3.cross(Vector3.subtract(point(triangle[1]), point(triangle[0])), Vector3.subtract(point(triangle[2]), point(triangle[0])));
      const length = Math.hypot(normal.x, normal.y, normal.z), signed = Vector3.dot(normal, axis);
      if (length === 0 || ![normal.x, normal.y, normal.z].every(Number.isFinite))
        throw new Error(side + ": intrinsic native cap has a degenerate source facet.");
      if (signed <= 0) throw new Error(side + ": current source cap leaves its registered normal cone.");
      const cosine = signed / length;
      if (!Number.isFinite(cosine)) throw new Error(side + ": current native normal-cone observation is nonfinite.");
      minimum = Math.min(minimum, cosine);
    }
    const support = cycle.map((_id, ordinal) => positions.length / 3 + ordinal);
    for (const id of cycle) for (let coordinate = 0; coordinate < 3; coordinate++) positions.push(vertices[3 * id + coordinate] - outward[coordinate] * section);
    const capStart = positions.length / 3;
    const nativeToCap = new Map(sourceIds.map((id, ordinal) => [id, capStart + ordinal]));
    for (const id of sourceIds) for (let coordinate = 0; coordinate < 3; coordinate++) positions.push(vertices[3 * id + coordinate] - outward[coordinate] * depth);
    const capBoundary = cycle.map((id) => nativeToCap.get(id)!);
    for (const [previous, ring] of [[cycle, support], [support, capBoundary]])
      previous.forEach((id, ordinal) => {
        const next = (ordinal + 1) % cycle.length;
        appended.push([id, previous[next], ring[next], ring[ordinal]]);
      });
    const capCells = sourceCells.map((cell) => cell.map((id) => nativeToCap.get(id)!));
    appended.push(...capCells);
    selected.forEach((id) => removed.add(id));
    const bindings = cycle.map((id, ordinal) => ({ id: support[ordinal], nativeParents: [{ id, weight: 1 }], offsetBlenderMetres: outward.map((value) => -value * section) }));
    for (const id of sourceIds) bindings.push({ id: nativeToCap.get(id)!, nativeParents: [{ id, weight: 1 }], offsetBlenderMetres: outward.map((value) => -value * depth) });
    records.push({ side, dimensions: structuredClone(dimensions), removedNativePolygonOrdinals: [...selected], sharedNativeRim: cycle,
      generatedRings: [support, capBoundary], capNativeParents: sourceIds, capSourceCells: [...selected], terminalCapCells: capCells,
      appendedBindings: bindings, outwardSourceAxis: [...outward], minimumCurrentNativeNormalDot: minimum,
      chart: "embedded original native130-cell patch; source-family normal-cone ruled sections",
      qualification: "authored3D source section and closed vestibule; not clinical aperture or airway" });
  }
  if (!positions.every(Number.isFinite)) throw new Error("Nasal source sections produce nonfinite geometry.");
  return [Float64Array.from(positions), [...polygons.filter((_cell, ordinal) => !removed.has(ordinal)).map((cell) => [...cell]), ...appended], records];
}
