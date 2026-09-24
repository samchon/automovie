import {
  humanFaceIrisTexelColour,
  locateHumanFaceIrisDisc,
  rasterizeHumanFaceIrisTexels,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

type Point = [number, number, number];

const vclose = (
  a: readonly number[],
  b: readonly number[],
  eps = 1e-6,
): boolean =>
  a.length === b.length && a.every((value, k) => nclose(value, b[k]!, eps));

/** A 12 mm latitude-longitude globe about `axis`, with an optional cornea. */
const globe = (axis: Point, bulge: number, maxDegrees = 180): Point[] => {
  const up: Point = Math.abs(axis[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cross = (a: Point, b: Point): Point => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const u = cross(up, axis);
  const length = Math.hypot(...u);
  const e1: Point = [u[0] / length, u[1] / length, u[2] / length];
  const e2 = cross(axis, e1);
  const points: Point[] = [];
  for (let theta = 0; theta <= maxDegrees; theta += 5)
    for (
      let phi = 0;
      phi < 360;
      phi += theta === 0 || theta === 180 ? 360 : 15
    ) {
      const t = (theta * Math.PI) / 180;
      const p = (phi * Math.PI) / 180;
      const r = 0.012 + (theta < 30 ? bulge * Math.cos(3 * t) : 0);
      points.push(
        [0, 1, 2].map(
          (k) =>
            [0.03, 0.03, 0.1][k] +
            r *
              (Math.sin(t) * Math.cos(p) * e1[k] +
                Math.sin(t) * Math.sin(p) * e2[k] +
                Math.cos(t) * axis[k]),
        ) as Point,
      );
    }
  return points;
};

/**
 * The iris disc is located from the globe alone, and its texels and colours
 * follow the shared rule.
 * Scenarios:
 * 1. A globe whose cornea points along +Z has axis +Z, centre and radius of
 *    the 12 mm sphere, reference +Y, limbus asin(11.71/24) and pupil
 *    asin(3.5/24), the population's absolute sizes on it, and the painted
 *    half-angle asin(11.71/24.2); a globe scaled to 4.8 mm holds its limbus
 *    at a right angle; a cornea pointing straight up (+Y) takes the +X
 *    reference instead.
 * 2. Fewer than eight vertices, coplanar vertices, a sphere without cornea
 *    and a cornea with no sclera behind it refuse.
 * 3. The rasterizer keeps a texel once when two triangles share it, skips a
 *    degenerate UV triangle, clips the triangle to the texture and drops
 *    texels beyond the limbus plus margin; its angles are those of the
 *    interpolated surface point.
 * 4. The texel colour at rho 0 and phi 0 has fibre 0.6, so band 4; exactly
 *    on the pupil margin it is half pupil, half band; beyond rho 0.87 it is
 *    band 0; exactly at the limbus it is half band 0, half original; and
 *    inside the pupil it is the pupil colour.
 */
export const test_subject_human_iris_disc = (): void => {
  const disc = locateHumanFaceIrisDisc(globe([0, 0, 1], 0.0008));
  TestValidator.predicate("axis", vclose(disc.axis, [0, 0, 1], 1e-9));
  TestValidator.predicate("reference", vclose(disc.reference, [0, 1, 0], 1e-9));
  TestValidator.predicate(
    "centre",
    vclose(disc.centre, [0.03, 0.03, 0.1], 1e-6),
  );
  TestValidator.predicate("radius", nclose(disc.radius, 0.012, 1e-6));
  TestValidator.predicate("limbus", nclose(disc.limbus, Math.asin(11.71 / 24)));
  TestValidator.predicate("pupil", nclose(disc.pupil, Math.asin(3.5 / 24)));
  TestValidator.predicate(
    "painted",
    nclose(disc.painted, Math.asin(11.71 / 24.2)),
  );
  const small = locateHumanFaceIrisDisc(
    globe([0, 0, 1], 0.0008).map(
      (point) =>
        point.map((value, k) => {
          const centre = [0.03, 0.03, 0.1][k]!;
          return centre + (value - centre) * 0.4;
        }) as Point,
    ),
  );
  TestValidator.predicate(
    "a globe smaller than the iris holds a right angle",
    nclose(small.limbus, Math.PI / 2) &&
      nclose(small.pupil, Math.asin(3.5 / 9.6), 1e-4) &&
      nclose(small.painted, disc.painted),
  );
  const upward = locateHumanFaceIrisDisc(globe([0, 1, 0], 0.0008));
  TestValidator.predicate(
    "vertical axis takes +X",
    vclose(upward.axis, [0, 1, 0], 1e-9) &&
      vclose(upward.reference, [1, 0, 0], 1e-9),
  );
  TestValidator.predicate(
    "too few vertices",
    throwsError(
      () => locateHumanFaceIrisDisc(globe([0, 0, 1], 0.0008).slice(0, 7)),
      "eight",
    ),
  );
  TestValidator.predicate(
    "coplanar vertices",
    throwsError(
      () =>
        locateHumanFaceIrisDisc(
          Array.from(
            { length: 9 },
            (_, k): Point => [k % 3, Math.floor(k / 3), 0],
          ),
        ),
      "determine a sphere",
    ),
  );
  TestValidator.predicate(
    "no cornea",
    throwsError(
      () => locateHumanFaceIrisDisc(globe([0, 0, 1], 0)),
      "corneal protrusion",
    ),
  );
  TestValidator.predicate(
    "no sclera behind the cornea",
    throwsError(
      () => locateHumanFaceIrisDisc(globe([0, 0, 1], 0.0008, 20)),
      "sclera",
    ),
  );

  // Two triangles sharing the diagonal of the UV square [0.25, 0.75]^2 on an
  // 8x8 texture, mapped onto a flat patch 1 mm in front of the centre.
  const front = (x: number, y: number): Point => [0.03 + x, 0.03 + y, 0.112];
  const square = [
    {
      positions: [
        front(-0.002, -0.002),
        front(0.002, -0.002),
        front(0.002, 0.002),
      ],
      uvs: [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.75, 0.75],
      ],
    },
    {
      positions: [
        front(-0.002, -0.002),
        front(0.002, 0.002),
        front(-0.002, 0.002),
      ],
      uvs: [
        [0.25, 0.25],
        [0.75, 0.75],
        [0.25, 0.75],
      ],
    },
    {
      positions: [front(0, 0), front(0, 0), front(0, 0)],
      uvs: [
        [0.5, 0.5],
        [0.5, 0.5],
        [0.5, 0.5],
      ],
    },
    {
      positions: [
        front(-0.002, -0.002),
        front(0.002, -0.002),
        front(0.002, 0.002),
      ],
      uvs: [
        [-0.5, -0.5],
        [0.3, -0.5],
        [0.3, 0.3],
      ],
    },
  ] as { positions: Point[]; uvs: [number, number][] }[];
  const texels = rasterizeHumanFaceIrisTexels({
    width: 8,
    height: 8,
    triangles: square.slice(0, 3),
    disc,
    margin: 0,
  });
  TestValidator.equals(
    "each texel once",
    new Set(texels.index).size,
    texels.index.length,
  );
  TestValidator.equals("square texels", texels.index.length, 16);
  const centre = texels.index.indexOf(3 * 8 + 3);
  const expected = Math.atan2(Math.hypot(0.0005, 0.0005), 0.012);
  TestValidator.predicate(
    "interpolated polar angle",
    nclose(texels.theta[centre], expected, 1e-9),
  );
  TestValidator.predicate(
    "azimuth",
    nclose(texels.phi[centre], Math.atan2(1, -1), 1e-9),
  );
  const clipped = rasterizeHumanFaceIrisTexels({
    width: 8,
    height: 8,
    triangles: [square[3]],
    disc,
    margin: 0,
  });
  TestValidator.predicate(
    "clipped to the texture",
    clipped.index.every((index) => index >= 0 && index < 64),
  );
  const narrow = rasterizeHumanFaceIrisTexels({
    width: 8,
    height: 8,
    triangles: square.slice(0, 2),
    disc: { ...disc, limbus: expected - 1e-3 },
    margin: 0,
  });
  TestValidator.predicate(
    "beyond the limbus is dropped",
    narrow.index.length < 16 && !narrow.index.includes(3 * 8 + 3),
  );

  const bands = Array.from({ length: 8 }, (_, k): Point => [k / 10, 0.5, 0.2]);
  const pupilColour: Point = [0.0025, 0.002, 0.0015];
  const colour = (theta: number, phi = 0) =>
    humanFaceIrisTexelColour({
      theta,
      phi,
      limbus: 0.5,
      pupil: 0.1,
      bands,
      edge: 0.01,
      original: [1, 1, 1],
    });
  TestValidator.predicate(
    "band 4 at the margin",
    vclose(colour(0.1 + 0.01), bands[4]),
  );
  TestValidator.predicate(
    "half pupil on the margin",
    vclose(
      colour(0.1),
      [0, 1, 2].map((k) => (pupilColour[k] + bands[4][k]) / 2),
    ),
  );
  TestValidator.predicate(
    "limbal ring",
    vclose(colour(0.1 + 0.9 * 0.4), bands[0]),
  );
  TestValidator.predicate(
    "half original at the limbus",
    vclose(
      colour(0.5),
      [0, 1, 2].map((k) => (bands[0][k] + 1) / 2),
    ),
  );
  TestValidator.predicate("pupil", vclose(colour(0.05), pupilColour));
};
