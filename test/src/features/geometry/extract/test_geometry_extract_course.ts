import {
  AutoMovieMeshCourse as C,
  type AutoMovieMeshExtract as X,
} from "@automovie/engine";

type V3 = [number, number, number];

/** A made torus about +Y: major radius R in the XZ plane, minor radius r, `m` meridian rings around the core and `k` vertices around each ring. */
function torus(R: number, r: number, m: number, k: number): X.IMesh {
  const positions: number[] = [];
  for (let i: number = 0; i < m; ++i)
    for (let j: number = 0; j < k; ++j) {
      const a: number = (2 * Math.PI * i) / m;
      const b: number = (2 * Math.PI * j) / k;
      positions.push(
        (R + r * Math.cos(b)) * Math.cos(a),
        r * Math.sin(b),
        (R + r * Math.cos(b)) * Math.sin(a),
      );
    }
  const indices: number[] = [];
  for (let i: number = 0; i < m; ++i)
    for (let j: number = 0; j < k; ++j) {
      const p: number = i * k + j;
      const q: number = ((i + 1) % m) * k + j;
      const pj: number = i * k + ((j + 1) % k);
      const qj: number = ((i + 1) % m) * k + ((j + 1) % k);
      indices.push(p, q, qj, p, qj, pj);
    }
  return { positions, indices };
}

/**
 * A made circular cylinder along +Y, radius 20 mm about (cx, 0, 0), 64 sides,
 * rings every 10 mm from y = 0 to 100 mm; optionally ring `spike`'s vertex at
 * side 0 pushed 10 mm outward along +X.
 */
function cylinder(cx: number, spike?: number): X.IMesh {
  const n: number = 64;
  const positions: number[] = [];
  for (let r: number = 0; r <= 10; ++r)
    for (let k: number = 0; k < n; ++k) {
      const a: number = (2 * Math.PI * k) / n;
      positions.push(
        cx + (k === 0 && r === spike ? 30 : 20) * Math.cos(a),
        10 * r,
        20 * Math.sin(a),
      );
    }
  const indices: number[] = [];
  for (let r: number = 0; r < 10; ++r)
    for (let k: number = 0; k < n; ++k) {
      const a: number = r * n + k;
      const b: number = r * n + ((k + 1) % n);
      indices.push(a, b, a + n, b, b + n, a + n);
    }
  return { positions, indices };
}

/** Two meshes as one. */
function merge(a: X.IMesh, b: X.IMesh): X.IMesh {
  const base: number = a.positions.length / 3;
  return {
    positions: [...Array.from(a.positions), ...Array.from(b.positions)],
    indices: [
      ...Array.from(a.indices),
      ...Array.from(b.indices, (i: number): number => i + base),
    ],
  };
}

/** Level planes of the cylinders at the given heights: u = +X, v = +Z so the normal v x u is +Y, origin on the first cylinder's axis. */
function level(ys: readonly number[]): C.IPlane[] {
  return ys.map(
    (y: number): C.IPlane => ({
      station: y,
      origin: [0, y, 0],
      u: [1, 0, 0],
      v: [0, 0, 1],
    }),
  );
}

/**
 * Course sections on each station's own plane: the holding loop, its Newell
 * normal and area centroid in its own plane, truthful nulls, and jumps read
 * on the holding loop only.
 *
 * Scenarios:
 * 1. Newell and centroid closed forms: an L-shaped hexagon (a 4 by 2 rectangle and a 2 by 2 square on top of its left half) rotated into a tilted plane has Newell vector twice its area (12) along the plane normal and area centroid the rotated `(5/3, 5/3)`; reversing its order reverses the vector and keeps the centroid. A collinear polygon has a zero Newell vector and no centroid (null), never a vertex mean.
 * 2. Turned planes on a torus (R 100, r 20 mm, 256 meridian rings of 64 vertices): seven planes normal to the core circle, each `EPS` = 1e-6 mm past one meridian ring of the mesh, with its own origin there: every loop point lies within `DELTA` of that ring's vertices, so the holding loop's centroid lies on the plane's origin, its unit normal on the core tangent, its reach is r, its area the inscribed 64-gon's `(k / 2) r^2 sin(2 pi / k)`, its extents r and every quarter shoulder that of a circle on a centred box, `sqrt(2) - 1`; no jump is flagged on the smooth tube.
 * 3. Jumps on the holding loop: three level planes through a cylinder whose middle ring has one vertex pushed 10 mm out flag `jump +u` at the middle station only; the sound cylinder flags nothing; with a separate spiked cylinder beside the sound one (a hand beside a hip), the holding loop flags nothing.
 * 4. Absence: a plane whose origin lies outside the mesh reads no loop, and its reading, area, reach, normal and centroid are all null.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieMeshCourse.newell`, `centroid` and `cut` on made polygons, a torus and cylinders, asserting vectors, centroids, loop readings, nulls and checks.
 * @evidence contracts/development/testing.md#independent-expectations The L's area and centroid follow from its two rectangles: area 8 at (2, 1) and area 4 at (1, 3) give (20 / 12, 20 / 12). On the torus, a plane `EPS` past ring i along the core tangent separates ring i from ring i + 1 (their tangent separation is about `2 pi (R - r) / m` = 1.96 mm, far above binary64 noise), so every crossing lies on an edge from a ring-i vertex at the fraction `EPS` over that edge's tangent rise, at most `EPS * 2.5 mm / 1.96 mm`, inside `DELTA` = 1e-5 mm of the vertex. The ring is the regular 64-gon inscribed in the tube's circle of radius r about the core point, with vertices on the chart's axis directions and diagonals, so its centroid is the core point, its reach r, its area `(k / 2) r^2 sin(2 pi / k)` (within the perimeter times `DELTA`), its extents r and each quarter's diagonal crossing the circle's own point, `sqrt(2) - 1` (within `3 DELTA` over the corner reach). The spike's departure is 5 mm against its neighbours' mean, against a 0.5 mm tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Planar and degenerate polygons, both windings, turned and level planes, sound and spiked holding loops, a spiked neighbouring body, and a plane missing the mesh. The plane cut's own flags belong to `test_geometry_extract_outline`; the shoulder's definition against the view section to `test_construction_operator_view_shoulder`. A torus checks planes normal to one circle next to mesh rings only, not an arbitrary course or a cut midway between rings.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include geometry_extract_course`, on made meshes with no person, reference file, loft or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios, the behaviour each pins and the oracle's limit.
 */
export function test_geometry_extract_course(): void {
  const failures: string[] = [];
  const near = (a: number, b: number, tol: number): boolean =>
    Math.abs(a - b) <= tol;

  // 1. Newell and centroid on a tilted L.
  const c: number = Math.cos(0.6);
  const s: number = Math.sin(0.6);
  const tilt = ([x, y]: [number, number]): V3 => [x, y * c, y * s];
  const L: V3[] = (
    [
      [0, 0],
      [4, 0],
      [4, 2],
      [2, 2],
      [2, 4],
      [0, 4],
    ] as [number, number][]
  ).map(tilt);
  const normal: V3 = [0, -s, c];
  const vector: V3 = C.newell(L);
  vector.forEach((x: number, k: number): void => {
    if (!near(x, 2 * 12 * normal[k]!, 1e-12))
      failures.push(
        `L Newell vector ${vector}, expected ${normal.map((n: number): number => 24 * n)}`,
      );
  });
  const expected: V3 = tilt([5 / 3, 5 / 3]);
  for (const polygon of [L, [...L].reverse()]) {
    const g: V3 | null = C.centroid(polygon);
    if (
      g === null ||
      !g.every((x: number, k: number): boolean => near(x, expected[k]!, 1e-12))
    )
      failures.push(`L centroid ${g}, expected ${expected}`);
  }
  const reversed: V3 = C.newell([...L].reverse());
  if (
    !reversed.every((x: number, k: number): boolean =>
      near(x, -vector[k]!, 1e-12),
    )
  )
    failures.push(
      `reversed L Newell vector ${reversed}, expected ${vector.map((x: number): number => -x)}`,
    );
  const line: V3[] = [
    [0, 0, 0],
    [1, 1, 1],
    [2, 2, 2],
  ];
  if (C.newell(line).some((x: number): boolean => x !== 0))
    failures.push(`collinear Newell vector ${C.newell(line)}, expected zero`);
  if (C.centroid(line) !== null)
    failures.push(`collinear centroid ${C.centroid(line)}, expected null`);

  // 2. Turned planes on a torus, each just past one meridian ring.
  const R: number = 100;
  const r: number = 20;
  const m: number = 256;
  const k: number = 64;
  const EPS: number = 1e-6;
  const DELTA: number = 1e-5;
  const polygon: number = (k / 2) * r * r * Math.sin((2 * Math.PI) / k);
  const perimeter: number = 2 * k * r * Math.sin(Math.PI / k);
  const planes: C.IPlane[] = [5, 30, 77, 128, 150, 201, 240].map(
    (i: number): C.IPlane => {
      const a: number = (2 * Math.PI * i) / m;
      const tangent: V3 = [-Math.sin(a), 0, Math.cos(a)];
      return {
        station: R * a,
        origin: [
          R * Math.cos(a) + EPS * tangent[0],
          0,
          R * Math.sin(a) + EPS * tangent[2],
        ],
        u: [Math.cos(a), 0, Math.sin(a)],
        v: [0, -1, 0],
      };
    },
  );
  for (const section of C.cut(torus(R, r, m, k), planes)) {
    const at: string = `torus at ${section.plane.station.toFixed(1)}`;
    const tangent: V3 = [-section.plane.u[2], 0, section.plane.u[0]];
    if (
      section.loop === null ||
      section.reading === null ||
      section.centroid === null ||
      section.normal === null ||
      section.area === null ||
      section.reach === null
    ) {
      failures.push(`${at}: no holding loop`);
      continue;
    }
    const off: number = Math.max(
      ...section.loop.map(([a, b]: [number, number]): number =>
        Math.abs(Math.hypot(a, b) - r),
      ),
    );
    if (!(off <= DELTA))
      failures.push(
        `${at}: a loop point stands ${off} mm off the tube's circle`,
      );
    if (
      !section.centroid.every((x: number, j: number): boolean =>
        near(x, section.plane.origin[j]!, DELTA),
      )
    )
      failures.push(
        `${at}: centroid ${section.centroid}, expected ${section.plane.origin}`,
      );
    if (
      !near(
        Math.abs(
          section.normal[0] * tangent[0] +
            section.normal[1] * tangent[1] +
            section.normal[2] * tangent[2],
        ),
        1,
        1e-12,
      )
    )
      failures.push(
        `${at}: normal ${section.normal} off the core tangent ${tangent}`,
      );
    if (!near(section.area, polygon, perimeter * DELTA))
      failures.push(`${at}: area ${section.area}, expected ${polygon}`);
    if (!near(section.reach, r, DELTA))
      failures.push(`${at}: reach ${section.reach}, expected ${r}`);
    section.reading.extents.forEach((e: number, j: number): void => {
      if (!near(Math.abs(e), r, DELTA))
        failures.push(`${at}: extent ${j} ${e}, expected magnitude ${r}`);
    });
    section.reading.quarters.forEach((q: C.IQuarter, j: number): void => {
      if (q.rho === null || !near(q.rho, Math.SQRT2 - 1, (3 * DELTA) / q.reach))
        failures.push(
          `${at}: quarter ${j} shoulder ${q.rho}, expected sqrt(2) - 1`,
        );
    });
    if (section.checks.length !== 0)
      failures.push(
        `${at}: checks ${section.checks.join("; ")} on a smooth tube`,
      );
  }

  // 3. Jumps on the holding loop only.
  const ys: number[] = [45, 50, 55];
  const spiked: C.ISection[] = C.cut(cylinder(0, 5), level(ys));
  if (!spiked[1]!.checks.some((x: string): boolean => x.startsWith("jump +u")))
    failures.push(
      `spiked cylinder: the middle station flags [${spiked[1]!.checks.join("; ")}], expected a jump +u`,
    );
  if (spiked[0]!.checks.length !== 0 || spiked[2]!.checks.length !== 0)
    failures.push(
      `spiked cylinder: end stations flag [${spiked[0]!.checks.join("; ")}] and [${spiked[2]!.checks.join("; ")}]`,
    );
  const sound: C.ISection[] = C.cut(cylinder(0), level(ys));
  if (sound.some((x: C.ISection): boolean => x.checks.length !== 0))
    failures.push(
      `sound cylinder: checks ${sound.map((x: C.ISection): string => x.checks.join("; ")).join(" | ")}`,
    );
  const beside: C.ISection[] = C.cut(
    merge(cylinder(0), cylinder(100, 5)),
    level(ys),
  );
  if (beside.some((x: C.ISection): boolean => x.checks.length !== 0))
    failures.push(
      `sound cylinder beside a spiked one: checks ${beside.map((x: C.ISection): string => x.checks.join("; ")).join(" | ")}`,
    );
  if (beside[1]!.pieces !== 2)
    failures.push(
      `sound cylinder beside a spiked one: ${beside[1]!.pieces} outer pieces, expected 2`,
    );

  // 4. Absence.
  const [missed] = C.cut(cylinder(0), [
    { station: 0, origin: [60, 50, 0], u: [1, 0, 0], v: [0, 0, 1] },
  ]);
  if (
    missed === undefined ||
    missed.loop !== null ||
    missed.reading !== null ||
    missed.area !== null ||
    missed.reach !== null ||
    missed.normal !== null ||
    missed.centroid !== null
  )
    failures.push(
      `plane outside the mesh: ${JSON.stringify({ loop: missed?.loop !== null, area: missed?.area, reach: missed?.reach, normal: missed?.normal, centroid: missed?.centroid })}, expected all null`,
    );

  if (failures.length !== 0)
    throw new Error(`extract course:\n${failures.join("\n")}`);
}
