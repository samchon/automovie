import { clusterHumanBodyPoints } from "./clusterHumanBodyPoints";
import { measureHumanBodyDistanceField } from "./measureHumanBodyDistanceField";
import { voxelizeHumanBodySkin } from "./voxelizeHumanBodySkin";

/**
 * Lay a garment across the narrow creases of the skin it is cut from, and lift
 * it off the skin by its thickness.
 *
 * `createHumanBodyUnderwear` takes triangles of the posed skin, and on the skin
 * itself a garment follows every concavity to its floor: it dives into the
 * intergluteal cleft, the cleavage and the fold under a breast. Real cloth
 * cannot bend tighter than a radius of its own, so where the skin is a crease
 * narrower than that it spans the mouth. The garment is therefore the
 * morphological closing of the body by a ball of radius `rho = spanMetres / 2`
 * (the surface a ball rolling over the skin from outside sweeps): a place
 * where such a ball touches the skin stays on it, and a place the ball cannot
 * reach, a crease narrower than `spanMetres`, is carried to the ball's arc
 * across the mouth. A concavity wider than `spanMetres` (the hollow of the
 * back, the waist) admits the ball and keeps its shape. The grid resolves
 * the ball's radius to about a cell: a crease is bridged for certain when it
 * is narrower than `spanMetres` less two cells (three fifths of it), never
 * when it is wider than `spanMetres`, and in between it depends on where the
 * grid falls. The closing is pose-free: it reads only the posed skin, so it
 * holds in any joint state.
 *
 * Method. The garment vertices are grouped by proximity
 * (`clusterHumanBodyPoints`), and each group gets a grid of cell
 * `spanMetres / 5` around it, padded by `rho` and two cells
 * (`voxelizeHumanBodySkin`), which holds the exact distance from every voxel
 * to the skin and tells a voxel in the air from one in the flesh by the
 * pseudo-normal of the skin sample nearest to it. A voxel in the air whose
 * distance to the skin is at least `rho` less one cell, and no more than two
 * cells beyond it, is a centre a ball could rest on (the centre nearest to a
 * skin vertex lies on that shell). A second distance transform from those
 * centres gives each vertex its nearest centre, which is moved along the line
 * from its nearest exact skin sample to sit exactly `rho` from the skin. A
 * vertex within `rho` of that centre is on the closing surface already and
 * stays; a vertex beyond is moved toward the centre to the ball surface, by
 * the excess `d - rho` eased in over the first `cell / 2` of it (a
 * smoothstep). The centre sits on the grid, so its excess over a vertex of a
 * flat or convex place is a quantisation error and not a crease: up to a
 * cell's lateral offset over a ball of radius `rho` is a millimetre or two, and
 * it tilts the normal by the offset over `rho`. The move is therefore also
 * scaled by how far the ball resting on the vertex along its own normal
 * pokes into the skin, eased in the same way: that ball touches the vertex by
 * construction, and where it is free no skin sample is nearer to its centre
 * than `rho`, so a vertex of a place the ball fits moves by nothing and the
 * displacement stays continuous across the surface. The sample spacing, not
 * the cell, bounds the error of that distance. The lift then runs along
 * the skin normal where the vertex stayed and along the ball outward normal
 * where it moved, blended by the same easing, and that normal is returned for
 * the moved vertices. Voxel quantisation costs at most a fraction of a cell in
 * where the centre sits along the crease, which moves the arc along the surface
 * it lies on and its dip by less than a millimetre for a crease of a few
 * millimetres.
 *
 * All lengths are metres of one frame (the posed skin's), `normals` are unit
 * outward normals of the skin at `points`, and the skin's triangles wind
 * counter-clockwise seen from outside. The input arrays are not modified. This is
 * not a cloth simulation: it takes no tension, gravity or pose history, does
 * not model fabric stretch or friction, and does not keep the fabric from
 * crossing itself where two parts of the body press together. A garment whose
 * grid would exceed 16 million voxels is refused.
 *
 * @evidence contracts/common.md#principled-implementation The closing of a set by a ball is dilation followed by erosion, and its boundary is where a ball rolling on the outside touches: a crease narrower than the ball's diameter stays unreached and is bridged by the ball's arc, which is the geometry of cloth that cannot bend tighter than a radius. The distance transform is exact between voxel centres; the ball's centre is snapped to the exact clearance from the nearest sample, so the quantisation of the grid moves the arc along its own surface and not off it. The flesh side of the skin is excluded by `voxelizeHumanBodySkin` through the pseudo-normal of the nearest feature (Baerentzen and Aanaes 2005), which needs the skin's winding to be consistent and is ambiguous only on the medial axis of a sheet thinner than the sample spacing. A vertex whose own ball is free is on the closing surface by definition, so the snapped centre moves it only in proportion to how far that ball pokes into the skin; the poke is measured against the skin samples, whose spacing (not the cell) bounds its error, and it trusts the supplied vertex normal, so a normal that contradicts the skin's geometry (a wall facing up) reads the ball as free there. The crotch's crease, where the ball cannot enter, still takes the grid's centre and carries the cell's quantisation as a stated ceiling.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: turn the skin under a garment into the closed, lifted surface. The voxels, their distance and the grouping have their own owners, the cut and the clipping stay in `createHumanBodyUnderwear`, and the one length this pass owns is the ball's radius, from the table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No landmark, region or vertex is named: the same closing runs on any skin, and a crease is found by whether the ball reaches it. Nothing is patched around another module.
 * @evidence contracts/common.md#meaningful-documentation The comment states the closing, the method in the order it runs, the easing that keeps the displacement continuous, the frame and winding it relies on, and what the pass does not model.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is an operation on the vertices of one garment part and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form; the span is a garment table value.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; it receives the skin, a fabric thickness and a fabric radius.
 */
export function closeHumanBodyUnderwearCreases(props: {
  skin: readonly {
    positions: readonly number[];
    indices: readonly number[];
  }[];
  points: readonly number[];
  normals: readonly number[];
  offsetMetres: number;
  spanMetres: number;
}): { positions: number[]; normals: number[]; bridged: number[] } {
  const { points, normals, offsetMetres, spanMetres } = props;
  const count = points.length / 3;
  const positions = points.map((value, k) => value + offsetMetres * normals[k]);
  const lifted = [...normals];
  const bridged: number[] = new Array<number>(count).fill(0);
  if (!(spanMetres > 0) || count === 0)
    return { positions, normals: lifted, bridged };
  const rho = spanMetres / 2;
  const cell = spanMetres / 5;
  const pad = rho + 2 * cell;
  // each stretch of garment apart from the rest by more than the grid's
  // padding gets a grid of its own, so a bra and briefs do not pay for the
  // abdomen between them
  for (const members of clusterHumanBodyPoints(points, 2 * pad)) {
    const part = closeCluster({
      skin: props.skin,
      points: members.flatMap((v) => at3(points, v)),
      normals: members.flatMap((v) => at3(normals, v)),
      offsetMetres,
      rho,
      cell,
      pad,
    });
    members.forEach((v, member) => {
      bridged[v] = part.bridged[member];
      for (let k = 0; k < 3; k++) {
        positions[v * 3 + k] = part.positions[member * 3 + k];
        lifted[v * 3 + k] = part.normals[member * 3 + k];
      }
    });
  }
  return { positions, normals: lifted, bridged };
}

/**
 * The closing of one cluster of garment vertices: its voxels, the ball
 * centres and their distance transform, then each vertex moved to the ball's
 * surface where the ball does not reach it.
 */
function closeCluster(props: {
  skin: readonly { positions: readonly number[]; indices: readonly number[] }[];
  points: readonly number[];
  normals: readonly number[];
  offsetMetres: number;
  rho: number;
  cell: number;
  pad: number;
}): { positions: number[]; normals: number[]; bridged: number[] } {
  const { points, normals, offsetMetres, rho, cell } = props;
  const count = points.length / 3;
  const positions = points.map((value, k) => value + offsetMetres * normals[k]);
  const lifted = [...normals];
  const bridged: number[] = new Array<number>(count).fill(0);
  const voxels = voxelizeHumanBodySkin({
    skin: props.skin,
    points,
    pad: props.pad,
    cell,
  });
  const centres = measureHumanBodyDistanceField({
    dimensions: voxels.dimensions,
    sites: voxels.centres(rho),
    nearest: true,
  });
  const ease = cell / 2;
  for (let v = 0; v < count; v++) {
    const x = at3(points, v);
    const source = centres.source![voxels.voxelOf(x)];
    if (source < 0) continue;
    const seed = voxels.centre(source);
    const sample = voxels.nearest(voxels.distance.source[source], seed);
    // the centre, moved along the line from its nearest skin sample to sit
    // exactly rho from it
    const away = subtract(seed, sample);
    const clearance = Math.hypot(away[0], away[1], away[2]);
    const centre = sample.map((value, k) => value + (rho * away[k]) / clearance);
    const toCentre = subtract(centre, x);
    const distance = Math.hypot(toCentre[0], toCentre[1], toCentre[2]);
    // the ball resting on the vertex along its own normal: where it stays
    // clear of the skin the vertex is on the closing surface already, and the
    // snapped centre above only decides where a ball that does not fit lands
    let normal = at3(normals, v);
    const rest = x.map((value, k) => value + rho * normal[k]);
    const touch = voxels.nearest(
      voxels.distance.source[voxels.voxelOf(rest)],
      rest,
    );
    const poke = rho - Math.hypot(...subtract(rest, touch));
    const weight = smoothstep((distance - rho) / ease) * smoothstep(poke / ease);
    let position = x;
    if (weight > 0) {
      // the closing surface's point nearest to x, and the ball's outward normal
      // there, which points at the centre
      const moved = x.map(
        (value, k) =>
          value + (toCentre[k] * (distance - rho) * weight) / distance,
      );
      const ball = subtract(centre, moved);
      const size = Math.hypot(ball[0], ball[1], ball[2]);
      normal = normal.map(
        (value, k) => value + weight * (ball[k] / size - value),
      );
      const length = Math.hypot(normal[0], normal[1], normal[2]);
      normal = normal.map((value) => value / length);
      position = moved;
      bridged[v] = weight;
    }
    for (let k = 0; k < 3; k++) {
      positions[v * 3 + k] = position[k] + offsetMetres * normal[k];
      lifted[v * 3 + k] = normal[k];
    }
  }
  return { positions, normals: lifted, bridged };
}

/** The triple at index `v` of a flat array. */
function at3(values: readonly number[], v: number): number[] {
  return [values[v * 3], values[v * 3 + 1], values[v * 3 + 2]];
}

function subtract(a: readonly number[], b: readonly number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** The smoothstep of `t` clamped to [0, 1]. */
function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
