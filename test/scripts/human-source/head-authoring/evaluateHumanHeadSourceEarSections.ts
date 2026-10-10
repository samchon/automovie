import { convexHull2D, Vector3 } from "@automovie/engine";

import type { IHumanHeadEarRecipe } from "./structures/IHumanHeadEarRecipe.ts";
import type { IHumanHeadEarSourceGuide } from "./structures/IHumanHeadEarSourceGuide.ts";

/** Compose paired source pinna charts from one unchanged native state.
 * Original polygon incidence supplies vertex normals and shared root supports.
 * The canonical engine hull owns the closed YZ outline; exact nearest native
 * root distances supply smooth attachment weights. These authored charts and
 * sparse conchal witnesses establish no clinical cartilage acquisition.
 * Differences compose once; the shared sulcus affects scalp and root together.
 */
export function evaluateHumanHeadSourceEarSections(
  positions: Float64Array,
  polygons: readonly number[][],
  authority: IHumanHeadEarSourceGuide,
  recipe: IHumanHeadEarRecipe,
): [Float64Array, Record<string, unknown>[]] {
  const result = positions.slice(), normals = new Float64Array(positions.length);
  const point = (id: number) => Vector3.create(positions[3 * id], positions[3 * id + 1], positions[3 * id + 2]);
  for (const cell of polygons) {
    if (cell.length !== 4) throw new Error("Source ear normals require original quadrilateral native cells.");
    const normal = Vector3.cross(Vector3.subtract(point(cell[1]), point(cell[0])), Vector3.subtract(point(cell[2]), point(cell[0])));
    for (const vertex of cell) {
      normals[3 * vertex] += normal.x;
      normals[3 * vertex + 1] += normal.y;
      normals[3 * vertex + 2] += normal.z;
    }
  }
  for (let at = 0; at < normals.length; at += 3) {
    const length = Math.hypot(normals[at], normals[at + 1], normals[at + 2]);
    if (length > 0) for (let axis = 0; axis < 3; axis++) normals[at + axis] /= length;
  }
  const support = recipe.foldSupportMillimetres / 1000;
  if (!Number.isFinite(support) || support <= 0)
    throw new Error("Ear source fold support must be finite and positive.");
  const records: Record<string, unknown>[] = [];
  const step = (value: number): number => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  for (const [side, sign] of [["right", -1], ["left", 1]] as const) {
    const request = recipe[side];
    if (!Object.values(request).every(Number.isFinite))
      throw new Error(side + ": ear section differences must be finite.");
    const port = authority.replacementPorts.find((item) => item.name === "ear-" + side);
    const region = authority.regions.find((item) => item.name === "ear-" + side);
    if (port === undefined || region === undefined || port.orderedNativeBoundary.length === 0)
      throw new Error(side + ": source ear needs its exact region and shared native root.");
    const roots = port.orderedNativeBoundary;
    const ids = [...new Set([...region.nativeSamples, ...roots])].sort((a, b) => a - b);
    const lower = [Infinity, Infinity], upper = [-Infinity, -Infinity];
    for (const id of ids) for (let axis = 0; axis < 2; axis++) {
      lower[axis] = Math.min(lower[axis], positions[3 * id + axis + 1]);
      upper[axis] = Math.max(upper[axis], positions[3 * id + axis + 1]);
    }
    const extent = upper.map((value, axis) => value - lower[axis]);
    if (extent.some((value) => value <= 0 || !Number.isFinite(value)))
      throw new Error(side + ": pinna support lacks a positive source span.");
    const rootDistance = (id: number): number => {
      let minimum = Infinity;
      for (const root of roots) minimum = Math.min(minimum,
        Math.hypot(positions[3 * id] - positions[3 * root], positions[3 * id + 1] - positions[3 * root + 1], positions[3 * id + 2] - positions[3 * root + 2]));
      return minimum;
    };
    const attachment = ids.map((id) => step(rootDistance(id) / support));
    const front = ids.map((id) => Math.max(0, Math.min(1, sign * normals[3 * id])));
    const anchor = (yRatio: number, zRatio: number): number => {
      const target = [lower[0] + extent[0] * yRatio, lower[1] + extent[1] * zRatio];
      let minimum = Infinity, chosen: number | undefined;
      ids.forEach((id, index) => {
        if (front[index] <= 0) return;
        const distance = Math.hypot(positions[3 * id + 1] - target[0], positions[3 * id + 2] - target[1]);
        if (distance < minimum) { minimum = distance; chosen = id; }
      });
      if (chosen === undefined) throw new Error(side + ": no outward source surface for its profile anchor.");
      return chosen;
    };
    const anchors = { stem: anchor(0.46, 0.23), fork: anchor(0.48, 0.61), superior: anchor(0.52, 0.88),
      inferior: anchor(0.22, 0.73), tragus: anchor(0.12, 0.48), antitragus: anchor(0.28, 0.25) };
    // Project native YZ to the engine's XZ plane and carry IDs separately.
    // Exact duplicate chart points retain the first native identity, matching
    // the hull owner's exact deduplication and declared source order.
    const projected = ids.map((id) => ({ x: positions[3 * id + 1], y: 0, z: positions[3 * id + 2] }));
    const projectedIds = new Map<string, number>();
    projected.forEach((value, ordinal) => {
      const key = value.x + "," + value.z;
      if (!projectedIds.has(key)) projectedIds.set(key, ids[ordinal]);
    });
    const outline = convexHull2D(projected).map((value) => projectedIds.get(value.x + "," + value.z)!);
    if (outline.length < 3) throw new Error(side + ": source pinna outline is degenerate.");
    const strokeWeight = (curve: readonly number[]): number[] => ids.map((id, index) => {
      let squared = Infinity;
      for (let segment = 0; segment + 1 < curve.length; segment++) {
        const first = curve[segment], last = curve[segment + 1];
        const dy = positions[3 * last + 1] - positions[3 * first + 1], dz = positions[3 * last + 2] - positions[3 * first + 2];
        const denominator = dy * dy + dz * dz;
        if (denominator === 0) throw new Error(side + ": source fold has a degenerate segment.");
        const py = positions[3 * id + 1] - positions[3 * first + 1], pz = positions[3 * id + 2] - positions[3 * first + 2];
        const along = Math.max(0, Math.min(1, (py * dy + pz * dz) / denominator));
        squared = Math.min(squared, (py - along * dy) ** 2 + (pz - along * dz) ** 2);
      }
      return Math.exp(-squared / support ** 2) * front[index] * attachment[index];
    });
    const weights = { helix: strokeWeight([...outline, outline[0]]), antihelix: strokeWeight([anchors.stem, anchors.fork]),
      superiorCrus: strokeWeight([anchors.fork, anchors.superior]), inferiorCrus: strokeWeight([anchors.fork, anchors.inferior]) };
    const lobule = authority.regions.find((item) => item.name === "lobule-" + side);
    if (lobule === undefined || lobule.nativeSamples.length === 0) throw new Error(side + ": source lobule support is absent.");
    const lobeTop = lobule.nativeSamples.reduce((value, id) => Math.max(value, positions[3 * id + 2]), -Infinity);
    const lobeBottom = ids.reduce((value, id) => Math.min(value, positions[3 * id + 2]), Infinity);
    if (lobeTop <= lobeBottom) throw new Error(side + ": source lobule support has zero superior/inferior span.");
    const lobeWeights = ids.map((id, index) => step((lobeTop - positions[3 * id + 2]) / (lobeTop - lobeBottom)) * attachment[index]);
    const deltaX = ids.map((_id, index) => request.helixRimProjectionOffsetMillimetres * weights.helix[index] * (1 - lobeWeights[index]) +
      request.antihelixProjectionOffsetMillimetres * weights.antihelix[index] + request.superiorCrusProjectionOffsetMillimetres * weights.superiorCrus[index] + request.inferiorCrusProjectionOffsetMillimetres * weights.inferiorCrus[index]);
    const floorAnchors: Record<string, number> = {};
    for (const [name, amount] of [["cymba-conchae", request.cymbaFloorRecessionOffsetMillimetres], ["cavum-conchae", request.cavumFloorRecessionOffsetMillimetres]] as const) {
      const floor = authority.regions.find((item) => item.name === name + "-" + side);
      if (floor === undefined || floor.nativeSamples.length === 0) throw new Error(side + ": source conchal support is absent.");
      const native = floor.nativeSamples.reduce((chosen, id) => sign * positions[3 * id] < sign * positions[3 * chosen] ? id : chosen);
      floorAnchors[name] = native;
      ids.forEach((id, index) => {
        const distance = Math.hypot(positions[3 * id + 1] - positions[3 * native + 1], positions[3 * id + 2] - positions[3 * native + 2]);
        deltaX[index] -= amount * Math.exp(-((distance / (support * 2)) ** 2)) * front[index] * attachment[index];
      });
    }
    for (const [name, amount] of [["tragus", request.tragusProjectionOffsetMillimetres], ["antitragus", request.antitragusProjectionOffsetMillimetres]] as const)
      ids.forEach((id, index) => {
        const distance = Math.hypot(positions[3 * id + 1] - positions[3 * anchors[name] + 1], positions[3 * id + 2] - positions[3 * anchors[name] + 2]);
        deltaX[index] += amount * Math.exp(-((distance / support) ** 2)) * front[index] * attachment[index];
      });
    const lobeCentre = lobule.nativeSamples.reduce((sum, id) => sum + positions[3 * id + 1], 0) / lobule.nativeSamples.length;
    const lobeRadius = lobule.nativeSamples.reduce((value, id) => Math.max(value, Math.abs(positions[3 * id + 1] - lobeCentre)), 0);
    if (lobeRadius <= 0) throw new Error(side + ": source lobule support has zero anterior/posterior span.");
    ids.forEach((id, index) => {
      result[3 * id] += sign * deltaX[index] / 1000;
      for (let axis = 0; axis < 3; axis++) result[3 * id + axis] += request.pinnaSectionThicknessOffsetMillimetres / 2000 * normals[3 * id + axis] * attachment[index];
      result[3 * id + 2] -= request.lobuleHeightOffsetMillimetres / 1000 * lobeWeights[index];
      result[3 * id + 1] += (positions[3 * id + 1] - lobeCentre) / lobeRadius * request.lobuleBreadthOffsetMillimetres / 2000 * lobeWeights[index];
    });
    const rootMin = roots.reduce((value, id) => Math.min(value, positions[3 * id + 1]), Infinity);
    const rootMax = roots.reduce((value, id) => Math.max(value, positions[3 * id + 1]), -Infinity);
    if (rootMax <= rootMin) throw new Error(side + ": source root lacks a positive anterior/posterior span.");
    for (let id = 0; id < positions.length / 3; id++) {
      const posterior = Math.max(0, Math.min(1, (positions[3 * id + 1] - rootMin) / (rootMax - rootMin)));
      const sulcus = Math.exp(-((rootDistance(id) / support) ** 2)) * posterior * posterior;
      result[3 * id] -= sign * request.retroauricularSulcusRecessionOffsetMillimetres / 1000 * sulcus;
    }
    const centre = [0, 1, 2].map((axis) => roots.reduce((sum, id) => sum + positions[3 * id + axis], 0) / roots.length);
    const angle = request.pinnaInclinationOffsetDegrees * Math.PI / 180;
    ids.forEach((id, index) => {
      const y = result[3 * id + 1] - centre[1], z = result[3 * id + 2] - centre[2];
      result[3 * id + 1] += (y * Math.cos(angle) - z * Math.sin(angle) - y) * attachment[index];
      result[3 * id + 2] += (y * Math.sin(angle) + z * Math.cos(angle) - z) * attachment[index];
    });
    records.push({ side, request: structuredClone(request), rootNativeCycle: [...roots], outlineNativeProfile: outline,
      foldNativeAnchors: anchors, conchalSourceSupports: floorAnchors,
      qualification: "authored source profile/section; sparse conchal witnesses are not clinical floors or boundaries" });
  }
  if (!result.every(Number.isFinite)) throw new Error("Ear source sections produce nonfinite geometry.");
  return [result, records];
}
