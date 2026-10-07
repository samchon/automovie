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
 * Each ribbon station moves as a whole, preserving its width under each
 * translation. Two passes use the largest sampled vertex push at that station;
 * they constrain neither strand arc length nor complete face clearance and
 * do not establish collision-free or biologically valid hair contact. The
 * assembled result and scalp root attachment remain separate observations.
 *
 * @evidence contracts/common.md#principled-implementation The existing oriented signed query admits the complete retained body surface, so a crop cannot break its incident fans. Each station uses the largest observed vertex displacement towards the requested offset surface; finite passes and vertex samples supply no whole-face clearance proof.
 * @evidence contracts/common.md#clear-and-simple-design One complete source query feeds the existing station translation; no spatial crop or corrective retry chooses a different topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source incidence, winding and requested clearance remain unchanged; the signed-query guard is neither bypassed nor weakened for a pose or subject.
 * @evidence contracts/common.md#meaningful-documentation States complete-source query ownership, rim refusal and the limits of station samples and passes.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared frame; the query retains the body's original winding and actual open boundary.
 * @evidence contracts/modeling.md#shared-boundaries Hair and body consume one document clearance; sampled station movement does not certify scalp attachment or complete contact under every pose.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function moves vertices of an existing part and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive beyond the query's private sheet.
 * @evidenceExclude contracts/modeling.md#rendered-observation The stage is observed on the assembled person, where the hair meets the shoulder.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the clearance is the hair document's.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
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
  return hair.map(({ positions: part, indices: triangles }) => {
    const output = part.slice();
    // A ribbon's stations move as wholes, so its width and frame survive: the
    // strand's vertices are its root followed by a left and a right corner
    // per station, and each strand is one connected component of the ribbon.
    for (const strand of humanRibbonStations(triangles))
      for (let pass = 0; pass < 2; pass++)
        for (const station of strand) {
          let push: number[] | null = null;
          let most = 0;
          for (const vertex of station) {
            const p = [
              output[vertex * 3],
              output[vertex * 3 + 1],
              output[vertex * 3 + 2],
            ];
            const found = query(p);
            if (found.boundary || found.signedDistance >= clearance) continue;
            const need = [0, 1, 2].map(
              (axis) =>
                found.point[axis] + found.normal[axis] * clearance - p[axis],
            );
            const size = Math.hypot(need[0], need[1], need[2]);
            if (size > most) {
              most = size;
              push = need;
            }
          }
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
