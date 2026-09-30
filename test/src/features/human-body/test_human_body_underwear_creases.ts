import { closeHumanBodyUnderwearCreases } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/** The corner order of a box: x fastest, then y, then z. */
const corners = (box: number[]): number[][] =>
  [0, 1].flatMap((z) =>
    [0, 1].flatMap((y) =>
      [0, 1].map((x) => [box[x], box[2 + y], box[4 + z]]),
    ),
  );

/**
 * A closed box `[x0, x1, y0, y1, z0, z1]` of twelve triangles wound
 * counter-clockwise from outside, each face flipped by its own outward test.
 */
function box(extent: number[]): { positions: number[]; indices: number[] } {
  const point = corners(extent);
  const centre = [
    (extent[0] + extent[1]) / 2,
    (extent[2] + extent[3]) / 2,
    (extent[4] + extent[5]) / 2,
  ];
  const quads = [
    [0, 1, 3, 2],
    [4, 6, 7, 5],
    [0, 4, 5, 1],
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [1, 5, 7, 3],
  ];
  const indices: number[] = [];
  for (const [a, b, c, d] of quads) {
    for (const triangle of [
      [a, b, c],
      [a, c, d],
    ]) {
      const [p, q, r] = triangle.map((i) => point[i]);
      const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      const n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const outward =
        n[0] * (p[0] - centre[0]) +
        n[1] * (p[1] - centre[1]) +
        n[2] * (p[2] - centre[2]);
      indices.push(
        ...(outward > 0 ? triangle : [triangle[0]!, triangle[2]!, triangle[1]!]),
      );
    }
  }
  return { positions: point.flat(), indices };
}

/**
 * Two blocks standing side by side with a slit between them, 0.1 m tall and
 * 0.06 m deep, the skin a garment over them is cut from. `width` is the slit's
 * width, and the blocks are 0.05 m wide each. Returns the skin and garment
 * points on it with their outward normals: on the top, the wall of the slit
 * at three depths, and far from the slit.
 */
function slit(width: number) {
  const half = width / 2;
  const skin = [
    box([-0.05 - half, -half, 0, 0.1, -0.03, 0.03]),
    box([half, half + 0.05, 0, 0.1, -0.03, 0.03]),
  ];
  const points: number[] = [];
  const normals: number[] = [];
  const add = (p: number[], n: number[]) => {
    points.push(...p);
    normals.push(...n);
  };
  // 0..2: the left wall at 10, 20 and 30 mm below the top, facing the slit
  for (const depth of [0.01, 0.02, 0.03]) add([-half, 0.1 - depth, 0], [1, 0, 0]);
  // 3..5: the right wall
  for (const depth of [0.01, 0.02, 0.03]) add([half, 0.1 - depth, 0], [-1, 0, 0]);
  // 6, 7: the top of each block, 0.03 m from the slit
  add([-half - 0.03, 0.1, 0], [0, 1, 0]);
  add([half + 0.03, 0.1, 0], [0, 1, 0]);
  return { skin, points, normals };
}

/**
 * The garment lifted off skin and laid across its narrow creases: the closing
 * of the body by a ball of half the span.
 *
 * The scenes are two closed blocks with a slit between them (twelve triangles
 * per block, so the skin has no vertex but its corners) and a ball of radius
 * 0.02 m (span 0.04) rolled over them, its oracle the ball's geometry. Over a
 * slit of width `w` the ball rests on the two crest edges, its centre 0.02
 * above the top at `sqrt(0.02^2 - (w / 2)^2)` over the slit's axis, and the
 * fabric of a floor point is the point of that ball nearest to it, lifted by
 * the thickness along the ball's normal.
 *
 * Scenarios:
 * 1. A slit 6 mm wide: the six wall points at 10, 20 and 30 mm depth all reach
 *    the ball's arc across the mouth, within 1 mm of the top's height plus the
 *    lift less the arc's sag of 0.2 mm and within 5 mm of the axis, with a
 *    bridged weight of one and an upward normal; the two points on the tops
 *    are lifted along their own normal by exactly the thickness with a weight
 *    of zero.
 * 2. A slit 60 mm wide, wider than the ball's diameter: the same wall points
 *    are lifted along the wall's own normal by the thickness alone, and none is
 *    bridged.
 * 3. A slit 20 mm wide, within three fifths of the span but far above what
 *    a crease of a few millimetres shows: the wall points reach the ball's
 *    arc, whose sag is 2.7 mm, so they lie no higher than the top plus the
 *    lift less that sag (3 mm of slack for the grid) and no lower than 10 mm
 *    below the top, and never sink below the top plane.
 * 4. A span of zero (or below) returns the skin lifted along its normals and
 *    changes no normal; a garment on skin of one block has nothing to bridge.
 * 5. A hollow cell, skin wound inward around the points, has no place for the
 *    ball outside it and the points are lifted alone.
 * 6. A garment whose one connected grid would exceed sixteen million voxels
 *    (three chained edges of a 2.4 m cube, each point within the grouping gap
 *    of the next) is refused.
 */
export const test_human_body_underwear_creases = (): void => {
  const lift = 0.003;
  const run = (
    scene: ReturnType<typeof slit>,
    spanMetres: number,
    extraSkin: { positions: number[]; indices: number[] }[] = [],
  ) =>
    closeHumanBodyUnderwearCreases({
      skin: [...scene.skin, ...extraSkin],
      points: scene.points,
      normals: scene.normals,
      offsetMetres: lift,
      spanMetres,
    });
  const at = (values: number[], vertex: number) => [
    values[vertex * 3]!,
    values[vertex * 3 + 1]!,
    values[vertex * 3 + 2]!,
  ];

  // 1. narrow slit
  const narrow = slit(0.006);
  // the skin also holds a degenerate triangle, a block far outside the grid and
  // a floor larger than it (0.4 m), which the sampling has to pass over or clip
  const clutter = [
    { positions: [0, 0, 0, 0.01, 0, 0, 0.02, 0, 0], indices: [0, 1, 2] },
    box([5, 5.1, 0, 0.1, 0, 0.1]),
    {
      positions: [-0.2, -0.02, -0.2, 0.2, -0.02, -0.2, 0, -0.02, 0.2],
      indices: [0, 2, 1],
    },
  ];
  const closed = run(narrow, 0.04, clutter);
  const sag = 0.02 - Math.sqrt(0.02 ** 2 - 0.003 ** 2);
  for (const vertex of [0, 1, 2, 3, 4, 5]) {
    const [x, y] = at(closed.positions, vertex);
    TestValidator.predicate(
      "narrow slit: wall point " + vertex + " reaches the arc",
      Math.abs(y! - (0.1 + lift - sag)) < 0.001 && Math.abs(x!) < 0.005,
    );
    TestValidator.equals("narrow slit: bridged " + vertex, closed.bridged[vertex], 1);
    TestValidator.predicate(
      "narrow slit: upward normal " + vertex,
      closed.normals[vertex * 3 + 1]! > 0.9,
    );
  }
  for (const vertex of [6, 7]) {
    const skin = at(narrow.points, vertex);
    const lifted = at(closed.positions, vertex);
    TestValidator.predicate(
      "narrow slit: a top point is lifted by the thickness alone " + vertex,
      lifted.every((value, k) => nclose(value, skin[k]! + (k === 1 ? lift : 0), 1e-3)),
    );
    TestValidator.predicate(
      "narrow slit: a top point is not bridged " + vertex,
      closed.bridged[vertex]! < 0.15,
    );
  }

  // 2. a slit wider than the ball's diameter keeps its walls
  const wide = slit(0.06);
  const open = run(wide, 0.04);
  for (const vertex of [0, 1, 2, 3, 4, 5]) {
    const skin = at(wide.points, vertex);
    const normal = at(wide.normals, vertex);
    const lifted = at(open.positions, vertex);
    TestValidator.predicate(
      "wide slit: wall point " + vertex + " is lifted along its normal",
      lifted.every((value, k) => nclose(value, skin[k]! + lift * normal[k]!, 1e-3)),
    );
    TestValidator.predicate("wide slit: not bridged " + vertex, open.bridged[vertex]! < 0.15);
  }

  // 3. a slit narrower than the diameter but wide: the arc's sag is 6.6 mm
  const middle = slit(0.02);
  const between = run(middle, 0.04);
  const deepSag = 0.02 - Math.sqrt(0.02 ** 2 - 0.01 ** 2);
  for (const vertex of [0, 1, 2, 3, 4, 5]) {
    const y = at(between.positions, vertex)[1]!;
    TestValidator.predicate(
      "mid slit: wall point " + vertex + " lies within the arc's sag",
      y <= 0.1 + lift - deepSag + 0.003 && y >= 0.1 - 0.01,
    );
    TestValidator.predicate(
      "mid slit: wall point " + vertex + " never sinks below the top plane",
      y >= 0.1 - 0.001,
    );
  }

  // 4. a span of zero lifts along the normals and leaves them
  const flat = run(narrow, 0);
  TestValidator.predicate(
    "zero span lifts along the normals",
    flat.positions.every((value, k) =>
      nclose(value, narrow.points[k]! + lift * narrow.normals[k]!, 1e-12),
    ),
  );
  TestValidator.equals("zero span keeps the normals", flat.normals, narrow.normals);
  TestValidator.equals("zero span bridges nothing", flat.bridged.every((w) => w === 0), true);
  const plain = closeHumanBodyUnderwearCreases({
    skin: [box([-0.1, 0.1, 0, 0.05, -0.1, 0.1])],
    points: [0, 0.05, 0, 0.03, 0.05, 0.02],
    normals: [0, 1, 0, 0, 1, 0],
    offsetMetres: lift,
    spanMetres: 0.04,
  });
  TestValidator.predicate(
    "a flat top has nothing to bridge",
    plain.bridged.every((w) => w < 0.15) &&
      nclose(plain.positions[1]!, 0.05 + lift, 1e-3) &&
      nclose(plain.positions[4]!, 0.05 + lift, 1e-3),
  );
  const nothing = closeHumanBodyUnderwearCreases({
    skin: [],
    points: [],
    normals: [],
    offsetMetres: lift,
    spanMetres: 0.04,
  });
  TestValidator.equals("no points return no positions", nothing.positions, []);

  // 5. inside a hollow, wound inward: the ball has no outside to sit on
  const solid = box([-0.01, 0.01, -0.01, 0.01, -0.01, 0.01]);
  const hollow = {
    positions: solid.positions,
    indices: solid.indices.map((_, at, all) => {
      const first = at - (at % 3);
      return all[first + [0, 2, 1][at % 3]!]!;
    }),
  };
  const inside = closeHumanBodyUnderwearCreases({
    skin: [hollow],
    points: [0, 0, 0.01],
    normals: [0, 0, -1],
    offsetMetres: lift,
    spanMetres: 0.04,
  });
  TestValidator.predicate(
    "a hollow cell is lifted alone",
    inside.bridged[0]! < 0.15 && nclose(inside.positions[2]!, 0.01 - lift, 1e-3),
  );

  // 6. a garment the grid cannot hold is refused: three chained edges of a 2.4 m cube
  const along = (from: number[], to: number[]) =>
    Array.from({ length: 49 }, (_, i) => i / 48).flatMap((t) =>
      from.map((value, k) => value + (to[k]! - value) * t),
    );
  const chain = [
    ...along([0, 0, 0], [2.4, 0, 0]),
    ...along([2.4, 0, 0], [2.4, 2.4, 0]),
    ...along([2.4, 2.4, 0], [2.4, 2.4, 2.4]),
  ];
  TestValidator.predicate(
    "a garment beyond the grid's limit is refused",
    throwsError(
      () =>
        closeHumanBodyUnderwearCreases({
          skin: [],
          points: chain,
          normals: chain.map((_, k) => (k % 3 === 1 ? 1 : 0)),
          offsetMetres: lift,
          spanMetres: 0.04,
        }),
      "too large",
    ),
  );
};
