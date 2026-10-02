import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";

/**
 * Keep generated hair out of the body's shoulders and chest, at the same
 * clearance the hair document asked of the head.
 *
 * The face builder integrates every strand against the head alone, in the
 * head's own frame, because the head is all it knows. A person also has
 * shoulders, and a long strand, or a strand carried by a turned or tilted
 * head, can end inside them. The person owns that relation, so it is settled
 * here, after the body is posed. Only the skin that hair can touch matters,
 * so the body's triangles are first culled on a coarse grid (cells of
 * `HUMAN_PERSON_SEAM.hairCullMetres`): the triangles whose box, inflated by
 * one cell, meets a cell that holds a hair vertex become an oriented sheet
 * for the engine's signed mesh query in its open mode. Its sign is valid
 * within the reach of the sheet, which the inflation makes at least one cell
 * around every hair vertex, and a result the query marks as a rim feature says
 * no side and leaves the vertex alone. Every hair vertex closer than
 * `clearance` to that sheet, including the ones inside the body, is then moved
 * to the nearest surface point plus the clearance along the surface's normal
 * there. Vertices already clear are not touched, so a head with no contact
 * keeps its hair byte for byte, and a person whose hair is nowhere near the
 * body compiles no query at all.
 *
 * This is the contact stage of a card or ribbon, not a strand solver: each
 * vertex moves alone, so a strand that lay through a shoulder ends draped over
 * it with its arc length stretched by the push, and the width of a ribbon
 * (which the face builder derived from root density) is kept only to the
 * extent the pushes are alike. A vertex buried deeper than one cell inside a
 * body that no sheet triangle is near is not seen; a strand rooted on the
 * scalp cannot be that deep without its vertices before it having passed
 * through the layer that is queried.
 *
 * @evidence contracts/common.md#principled-implementation The nearest point of an oriented surface and its outward normal are what the signed mesh query returns, and moving a point to that point plus the clearance along the normal is the projection onto the offset surface, exact for a point inside and for one within the clearance outside; culling by inflated boxes only removes triangles farther than the query's reach from every hair vertex, so it cannot change the nearest feature of a vertex that is being asked about.
 * @evidence contracts/common.md#clear-and-simple-design One grid pass selects the sheet, one query answers each vertex near it, and nothing else is held.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hair vertex, strand or subject is special-cased; the clearance is the hair document's own, the cull distance is a named cost bound, and untouched vertices are returned as they were.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the person, not the face builder, owns this contact, how the sheet is chosen, what a moved vertex does and where the stage stops.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared frame; the sheet keeps the body's outward-facing winding, so a normal points out of the skin.
 * @evidence contracts/modeling.md#shared-boundaries The hair and the shoulder are two parts that meet; the clearance is the one definition both sides share, and the stage keeps the hair off the skin in every pose the body evaluates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function moves vertices of an existing part and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive beyond the query's private sheet.
 * @evidenceExclude contracts/modeling.md#rendered-observation The stage is observed on the assembled person, where the hair meets the shoulder.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the clearance is the hair document's.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function keepHumanPersonHairClear(props: {
  /** The body skin surface's posed shared positions. */
  positions: readonly number[];
  /** The retained body triangles over those vertices. */
  indices: readonly number[];
  /** Hair parts: flat XYZ vertices in the same frame and their ribbon triangles. */
  hair: readonly { positions: readonly number[]; indices: readonly number[] }[];
  /** Least distance in metres a hair vertex may have from the skin. */
  clearance: number;
}): number[][] {
  const { positions, indices, hair, clearance } = props;
  if (!(clearance >= 0) || !Number.isFinite(clearance))
    throw new Error("Hair clearance must be a nonnegative finite length.");
  const cell = HUMAN_PERSON_SEAM.hairCullMetres;
  // the grid spans the hair and the body together
  const extent = (
    values: readonly (readonly number[])[],
    axis: number,
  ): number[] => {
    let least = Infinity;
    let most = -Infinity;
    for (const list of values)
      for (let at = axis; at < list.length; at += 3) {
        least = Math.min(least, list[at]);
        most = Math.max(most, list[at]);
      }
    return [least, most];
  };
  const low = [0, 1, 2].map(
    (axis) =>
      Math.min(extent([positions], axis)[0], extent(hair.map((part) => part.positions), axis)[0]) - 2 * cell,
  );
  const size = [0, 1, 2].map(
    (axis) =>
      Math.ceil(
        (Math.max(extent([positions], axis)[1], extent(hair.map((part) => part.positions), axis)[1]) +
          2 * cell -
          low[axis]) /
          cell,
      ) + 1,
  );
  const cellOf = (value: number, axis: number): number =>
    Math.floor((value - low[axis]) / cell);
  const slot = (x: number, y: number, z: number): number =>
    (x * size[1] + y) * size[2] + z;
  const held = new Uint8Array(size[0] * size[1] * size[2]);
  for (const { positions: list } of hair)
    for (let at = 0; at < list.length; at += 3)
      held[
        slot(
          cellOf(list[at], 0),
          cellOf(list[at + 1], 1),
          cellOf(list[at + 2], 2),
        )
      ] = 1;
  const sheet: number[] = [];
  for (let corner = 0; corner < indices.length; corner += 3) {
    const ids = [indices[corner], indices[corner + 1], indices[corner + 2]];
    const range = [0, 1, 2].map((axis) => {
      const values = ids.map((id) => positions[id * 3 + axis]);
      return [
        cellOf(Math.min(...values) - cell, axis),
        cellOf(Math.max(...values) + cell, axis),
      ];
    });
    let touches = false;
    for (let x = range[0][0]; x <= range[0][1] && !touches; x++)
      for (let y = range[1][0]; y <= range[1][1] && !touches; y++)
        for (let z = range[2][0]; z <= range[2][1] && !touches; z++)
          touches = held[slot(x, y, z)] === 1;
    if (touches) sheet.push(...ids);
  }
  if (sheet.length === 0) return hair.map((part) => part.positions.slice());
  const mesh: IAutoMovieMesh = {
    positions: positions.slice(),
    normals: null,
    uvs: null,
    indices: sheet,
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
