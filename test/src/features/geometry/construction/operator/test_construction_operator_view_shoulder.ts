import {
  AutoMovieMeshCourse,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

type Quarters = IAutoMovieViewPart.IQuarters<number>;

/**
 * One conic shoulder definition, `rho = |M->S| / |M->A|`, for the view
 * section that lofts it and the reader that traces it.
 *
 * Scenarios:
 * 1. Closed forms on the unit box: `AutoMovieViewSection` with every shoulder `sqrt(2) - 1` stands at radius 1 along the corner diagonal (the circle quarter, middle weight `sqrt(2) / 2`), and with every shoulder 0.5 at `0.75 sqrt(2)` (the parabola, middle weight 1). Red: the other weight convention `w = rho` would put the parabola's diagonal point at `(1 + 2 rho) / (2 + 2 rho) sqrt(2) = (2 / 3) sqrt(2)`, which the second check refuses.
 * 2. The reader's crossing is the section's own: on a centred box and an asymmetric box, each quarter's diagonal point of the actual section is located on M->A by bisection of the section's radius, a dense polygon of the section is sampled with that point as a vertex, and `AutoMovieMeshCourse.read` returns that point's share on M->A within 1e-9, with extents equal to the box's and touch offsets 0.
 * 3. A concave quarter reads its own signed value: a square loop notched at its first corner reads q0 at or below zero and the other three quarters equal (a square's corner shoulder is 1, which a conic cannot hold and the reader reports unclamped); the unnotched square reads 1 in all four. Red: a reader clamping to (0, 1) or defaulting to 0.5.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates `AutoMovieViewSection.radius` on sections from `AutoMovieViewSection.of` and calls `AutoMovieMeshCourse.read` on loops sampled from them or made by hand, asserting radii, shares, extents and touch offsets.
 * @evidence contracts/development/testing.md#independent-expectations The rational quadratic quarter with end weights 1 and middle weight w meets M->A at `w / (1 + w)` of the way (Farin 2006, eq. 1; Shene's derivation of `|MX| / |MP1|`): the circle's `w = sqrt(2) / 2` gives `sqrt(2) - 1` and radius 1, the parabola's `w = 1` gives 0.5 and the point (0.75, 0.75). The issue text's 0.2929 (`1 - 1 / sqrt(2)`) is not a shoulder of either under this definition and is not used. The reader's expectation is the section's own diagonal point found by bisection on its radius, independent of the reader's polygon crossing; the notched square's expectation is its corner geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Circle and parabola closed forms, the competing weight convention, centred and asymmetric boxes, every quarter, a convex loop at the conic limit and a concave notch. The section's admission and girth belong to `test_construction_operator_view_section` and `_girth`; course cutting to `test_geometry_extract_course`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_view_shoulder`, on made boxes and loops with no mesh file, person, loft or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios, the behaviour each pins and why the issue's 0.2929 example is excluded.
 */
export function test_construction_operator_view_shoulder(): void {
  const failures: string[] = [];
  const unit: AutoMovieViewSection.IBox = { extents: [1, 1, 1, 1] };
  const radius = (
    box: AutoMovieViewSection.IBox,
    rho: number,
    phi: number,
  ): number =>
    AutoMovieViewSection.radius(
      AutoMovieViewSection.of(box, [rho, rho, rho, rho] as Quarters),
      phi,
    )[0];

  // 1. Closed forms along the corner diagonal of the unit box.
  const circle: number = radius(unit, Math.SQRT2 - 1, Math.PI / 4);
  if (!(Math.abs(circle - 1) <= 1e-9))
    failures.push(`circle quarter: diagonal radius ${circle}, expected 1`);
  const parabola: number = radius(unit, 0.5, Math.PI / 4);
  const wrong: number = (2 / 3) * Math.SQRT2;
  if (!(Math.abs(parabola - 0.75 * Math.SQRT2) <= 1e-9))
    failures.push(
      `parabola quarter: diagonal radius ${parabola}, expected ${0.75 * Math.SQRT2}`,
    );
  if (!(Math.abs(parabola - wrong) > 0.1))
    failures.push(
      `the parabola check does not separate w = rho / (1 - rho) from w = rho (${parabola} against ${wrong})`,
    );

  // 2. The reader's crossing equals the section's own diagonal point.
  const boxes: [Quarters, Quarters][] = [
    [
      [1, 1, 1, 1],
      [0.45, 0.45, 0.45, 0.45],
    ],
    [
      [40, 25, 30, 20],
      [0.42, 0.55, 0.38, 0.6],
    ],
  ];
  for (const [extents, shoulders] of boxes) {
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
      { extents },
      shoulders,
    );
    const [eu, ev, nu, nv] = extents;
    const guides: [number, number][] = [
      [eu, 0],
      [0, ev],
      [-nu, 0],
      [0, -nv],
    ];
    const expected: number[] = [];
    const special: number[] = [];
    for (let q: number = 0; q < 4; ++q) {
      const g0: [number, number] = guides[q]!;
      const g1: [number, number] = guides[(q + 1) % 4]!;
      const M: [number, number] = [(g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2];
      const A: [number, number] = [g0[0] + g1[0], g0[1] + g1[1]];
      // Bisection on t in [0, 1]: inside the section below the crossing, outside above it.
      let lo: number = 0;
      let hi: number = 1;
      for (let k: number = 0; k < 200; ++k) {
        const t: number = (lo + hi) / 2;
        const p: [number, number] = [
          M[0] + t * (A[0] - M[0]),
          M[1] + t * (A[1] - M[1]),
        ];
        if (
          Math.hypot(...p) <
          AutoMovieViewSection.radius(section, Math.atan2(p[1], p[0]))[0]
        )
          lo = t;
        else hi = t;
      }
      expected.push((lo + hi) / 2);
      const t: number = (lo + hi) / 2;
      special.push(
        Math.atan2(M[1] + t * (A[1] - M[1]), M[0] + t * (A[0] - M[0])),
      );
    }
    const phases: number[] = [
      ...Array.from(
        { length: 720 },
        (_: unknown, k: number): number => (2 * Math.PI * k) / 720 - Math.PI,
      ),
      ...special,
    ].sort((a: number, b: number): number => a - b);
    const loop: [number, number][] = phases.map(
      (phi: number): [number, number] => {
        const r: number = AutoMovieViewSection.radius(section, phi)[0];
        return [r * Math.cos(phi), r * Math.sin(phi)];
      },
    );
    const reading: AutoMovieMeshCourse.IReading =
      AutoMovieMeshCourse.read(loop);
    const signed: Quarters = [eu, -nu, ev, -nv];
    reading.extents.forEach((e: number, k: number): void => {
      if (!(Math.abs(e - signed[k]!) <= 1e-9))
        failures.push(
          `box [${extents}]: extent ${k} ${e}, expected ${signed[k]}`,
        );
    });
    reading.touch.forEach((t: number, k: number): void => {
      if (!(Math.abs(t) <= 1e-9))
        failures.push(`box [${extents}]: touch ${k} ${t}, expected 0`);
    });
    reading.quarters.forEach(
      (q: AutoMovieMeshCourse.IQuarter, k: number): void => {
        if (q.rho === null || !(Math.abs(q.rho - expected[k]!) <= 1e-9))
          failures.push(
            `box [${extents}]: quarter ${k} read ${q.rho}, the section's own crossing ${expected[k]}`,
          );
      },
    );
  }

  // 3. A notched square reads its concave quarter unclamped.
  const square: [number, number][] = [
    [10, 0],
    [10, 10],
    [0, 10],
    [-10, 10],
    [-10, 0],
    [-10, -10],
    [0, -10],
    [10, -10],
  ];
  const plain: AutoMovieMeshCourse.IReading = AutoMovieMeshCourse.read(square);
  plain.quarters.forEach((q: AutoMovieMeshCourse.IQuarter, k: number): void => {
    if (q.rho === null || !(Math.abs(q.rho - 1) <= 1e-12))
      failures.push(
        `square: quarter ${k} read ${q.rho}, expected 1 (the corner)`,
      );
  });
  const notched: [number, number][] = [
    [10, 0],
    [10, 2],
    [2, 2],
    [2, 10],
    ...square.slice(2),
  ];
  const concave: AutoMovieMeshCourse.IReading =
    AutoMovieMeshCourse.read(notched);
  const q0: number | null = concave.quarters[0].rho;
  if (q0 === null || !(q0 <= 0))
    failures.push(
      `notched square: quarter 0 read ${q0}, expected at or below 0`,
    );
  concave.quarters
    .slice(1)
    .forEach((q: AutoMovieMeshCourse.IQuarter, k: number): void => {
      if (q.rho === null || !(Math.abs(q.rho - 1) <= 1e-12))
        failures.push(
          `notched square: quarter ${k + 1} read ${q.rho}, expected 1`,
        );
    });

  if (failures.length !== 0)
    throw new Error(`view shoulder:\n${failures.join("\n")}`);
}
