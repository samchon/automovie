import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanPersonHairContactProps } from "../structures/IHumanPersonHairContactProps";

/**
 * Keep generated hair out of the body's shoulders and chest, at the same
 * clearance the hair document asked of the head.
 *
 * The face builder integrates every strand against the head alone, in the
 * head's own frame, because the head is all it knows. A person also has
 * shoulders, and a long strand, or a strand carried by a turned or tilted
 * head, can end inside them. The person owns that relation, so it is settled
 * here, after the body is posed. The query retains the complete source
 * triangle population: a spatial crop can disconnect a vertex's incident
 * fans even when the original surface is admitted. Its open mode preserves
 * the body's actual cut boundary, and a rim feature says no side and leaves
 * the station alone. Every hair vertex closer than `clearance` to that
 * surface, including the ones inside the body, contributes a displacement
 * to the nearest surface point plus the clearance along the surface's normal
 * there. Stations whose sampled vertices are already clear are not touched,
 * so a head with no contact keeps its hair byte for byte. An empty population allocates no
 * query. The full source hierarchy supplies nearest-feature pruning without
 * altering incidence or imposing a fixed reach on a document clearance.
 *
 * Geometry-owned stations move as wholes, preserving ribbon width or shaft
 * calibre. A supplied layout identifies each part's own gap and canonical
 * attached root; a root needing a body push refuses without changing its seat.
 * Only legacy ribbon transport derives paired stations from mesh topology.
 * Each non-root station moves as a whole under each
 * translation. Two passes use the largest sampled vertex push at that station;
 * they constrain neither strand arc length nor complete face clearance and
 * do not establish collision-free or biologically valid hair contact. The
 * assembled result and scalp root attachment remain separate observations.
 */
export function keepHumanPersonHairClear(
  props: IHumanPersonHairContactProps,
): number[][] {
  const { positions, hair, clearance } = props;
  if (!(clearance >= 0) || !Number.isFinite(clearance))
    throw new Error("Hair clearance must be a nonnegative finite length.");
  if (hair.every((part) => part.positions.length === 0))
    return hair.map((part) => part.positions.slice());
  const mesh: IAutoMovieMesh = {
    positions: positions.slice(),
    normals: null,
    uvs: null,
    indices: [...props.indices],
    skin: null,
  };
  const query = createAutoMovieSignedMeshQuery(mesh, { boundary: "open" });
  return hair.map(({ positions: part, indices: triangles, layout }) => {
    const output = part.slice();
    const gap = layout?.clearance ?? clearance;
    if (!Number.isFinite(gap) || gap < 0)
      throw new Error("Hair part clearance must be a nonnegative finite length.");
    const strands = layout === undefined ? humanRibbonStations(triangles) :
      layout.curves.map((curve) => curve.stations.map((station) => Array.from(station.vertices)));
    if (layout !== undefined) {
      const referenced = new Set(triangles);
      const seen = new Set<number>();
      for (const [curveIndex, curve] of layout.curves.entries()) {
        if (curve.stations.length === 0 || curve.stations[0].radius !== 0 ||
            curve.stations[0].arcLength !== 0 || curve.stations[0].vertices.length !== 1)
          throw new Error("Hair layout lacks its canonical attached root station: " + curveIndex);
        for (const station of curve.stations) {
          if (station.vertices.length === 0 || !Number.isFinite(station.radius) || station.radius < 0 ||
              !Number.isFinite(station.arcLength) || station.arcLength < 0)
            throw new Error("Hair layout station lacks finite geometry-owned radius and arc length.");
          for (const vertex of station.vertices) {
            if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex * 3 + 2 >= part.length ||
                !referenced.has(vertex) || seen.has(vertex))
              throw new Error("Hair layout must partition actual referenced station vertices exactly.");
            seen.add(vertex);
          }
        }
      }
      if (seen.size !== referenced.size)
        throw new Error("Hair layout omits actual referenced geometry.");
    }
    // Produced layouts define complete rings or ribbon pairs. The legacy
    // fallback retains only the original ribbon numbering contract.
    for (const strand of strands)
      for (let pass = 0; pass < 2; pass++)
        for (const [stationIndex, station] of strand.entries()) {
          let push: number[] | null = null;
          let most = 0;
          for (const vertex of station) {
            const p = [
              output[vertex * 3],
              output[vertex * 3 + 1],
              output[vertex * 3 + 2],
            ];
            const found = query(p);
            if (found.boundary || found.signedDistance >= gap) continue;
            const need = [0, 1, 2].map(
              (axis) =>
                found.point[axis] + found.normal[axis] * gap - p[axis],
            );
            const size = Math.hypot(need[0], need[1], need[2]);
            if (size > most) {
              most = size;
              push = need;
            }
          }
          if (push !== null && layout !== undefined && stationIndex === 0)
            throw new Error("Attached native hair root conflicts with the body's requested clearance.");
          if (push !== null)
            for (const vertex of station)
              for (let axis = 0; axis < 3; axis++)
                output[vertex * 3 + axis] += push[axis];
        }
    return output;
  });
}

/**
 * The stations of each strand of a ribbon mesh, root first. A ribbon strand is
 * a connected component of triangles whose vertices are numbered in order: one
 * root vertex, then a left and a right corner per station.
 */
function humanRibbonStations(triangles: readonly number[]): number[][][] {
  const parent = new Map<number, number>();
  const find = (vertex: number): number => {
    let root = vertex;
    while ((parent.get(root) ?? root) !== root) root = parent.get(root)!;
    parent.set(vertex, root);
    return root;
  };
  for (let at = 0; at < triangles.length; at += 3)
    for (let k = 1; k < 3; k++)
      parent.set(find(triangles[at + k]), find(triangles[at]));
  const strands = new Map<number, number[]>();
  for (const vertex of new Set(triangles)) {
    const root = find(vertex);
    let list = strands.get(root);
    if (list === undefined) {
      list = [];
      strands.set(root, list);
    }
    list.push(vertex);
  }
  return [...strands.values()].map((vertices) => {
    const ordered = vertices.sort((a, b) => a - b);
    const stations: number[][] = [[ordered[0]]];
    for (let k = 1; k + 1 < ordered.length; k += 2)
      stations.push([ordered[k], ordered[k + 1]]);
    return stations;
  });
}
