import { AutoMovieEngineSolidBody, AutoMovieEngineSolidClip } from "@automovie/engine";
import type {
  IAutoMovieSolidBody,
  IAutoMovieSolidClip,
  IAutoMovieSolidCycle,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Read a flat chart directly in millimetres, with either face orientation. */
function sheet(name: string, orientation: 1 | -1): IAutoMovieSolidSurface {
  return {
    name,
    orientation,
    domain: [6, 12],
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [u, v, 0],
      u: [1, 0, 0],
      v: [0, 1, 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
}

/** Make opposite faces whose optional shared rectangle has a seam at u=8. */
function body(shared: boolean): IAutoMovieSolidBody.IBody {
  const result: IAutoMovieSolidBody.IBody = AutoMovieEngineSolidBody.create(
    "flat seam",
    [sheet("front", 1), sheet("back", -1)].map(
      (surface: IAutoMovieSolidSurface): IAutoMovieSolidBody.IFaceInput => ({
        surface,
        stations: [6, 12],
        phases: [-1, 1],
      }),
    ),
  );
  if (shared) {
    result.mesh.positions.push(8, -1, 0, 8, 1, 0, 10, 1, 0, 10, -1, 0);
    result.faces.forEach((face: IAutoMovieSolidBody.IFace, index: number) => {
      const chart: [number, number][] = [
        [8, -1],
        [8, 1],
        [10, 1],
        [10, -1],
      ];
      face.cycles.push({
        kind: "island",
        vertices: [0, 1, 2, 3],
        chart,
        neighbours: chart.map(
          (
            from: [number, number],
            k: number,
          ): IAutoMovieSolidCycle.INeighbour => ({
            face: 1 - index,
            from,
            to: chart[(k + 1) % chart.length]!,
          }),
        ),
      });
    });
  }
  return result;
}

/**
 * `rail` settles an interval where neither face reads the rail. `trim` places a
 * crossing onto both charts before keeping the cut.
 *
 * Scenarios:
 *
 * 1. Touching world points cross without a declared shared seam.
 * 2. Separated ends 1 mm apart cross along the closest shared seam. Their chord
 *    distance is exactly zero. The opposite edge is 2 mm away, and the flat
 *    chart makes the sagitta zero.
 * 3. Separated ends without a shared seam refuse the crossing.
 * 4. A chart point at u=8 plus 2^-38 has enough chart-scaled rounding slack to
 *    snap exactly to the seam's u=8, despite exceeding the unscaled slack.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names touching and separated seam cases, shared-chart placement and scaled snapping.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual rail across several distinct chart arrangements and reads admitted crossing coordinates or a refusal.
 * @evidence contracts/development/testing.md#independent-expectations The authored chord is zero at the shared seam, while the opposite edge is 2 mm away. The flat chart has zero sagitta. The perturbation is within the scaled rounding allowance.
 */
export function test_engine_geometry_solid_clip_crossing(): void {
  type Join = Parameters<typeof AutoMovieEngineSolidClip.rail>[1];
  type Columns = Parameters<typeof AutoMovieEngineSolidClip.rail>[2];
  type Sample = NonNullable<ReturnType<Join["rail"]>>;
  const quarter: number = Math.PI / 4;
  for (const [name, shared, ends, accepted] of [
    [
      "touching world points",
      false,
      [
        [7, 0],
        [7, 0],
      ],
      true,
    ],
    [
      "nearest shared seam",
      true,
      [
        [8, -0.5],
        [8, 0.5],
      ],
      true,
    ],
    [
      "neither crossing premise",
      false,
      [
        [7, -0.5],
        [7, 0.5],
      ],
      false,
    ],
  ] satisfies [
    string,
    boolean,
    [[number, number], [number, number]],
    boolean,
  ][]) {
    const join: Join = {
      rail: (t: number): Sample | null => {
        const phase: number = t % (2 * Math.PI);
        const face: 0 | 1 = phase < Math.PI ? 0 : 1;
        const within: number = phase - face * Math.PI;
        if (within >= quarter && within <= 3 * quarter) return null;
        const hostFace: 0 | 1 = within < quarter ? face : face === 0 ? 1 : 0;
        const host: [number, number] = ends[hostFace];
        return { hostFace, host, hostPoint: [host[0], host[1], 0] };
      },
    };
    const columns: Columns = {
      seed: 0,
      host: { chart: ends, faces: [0, 1] },
      across: [
        [1, 0],
        [1, 0],
      ],
    };
    const rail: IAutoMovieSolidClip.IRailPoint[] | string =
      AutoMovieEngineSolidClip.rail(body(shared), join, columns, [0, 1], 2);
    if (!accepted) {
      TestValidator.predicate(
        name,
        typeof rail === "string" && rail.includes("no rail at t"),
      );
      continue;
    }
    if (typeof rail === "string") throw new Error(`${name}: ${rail}`);
    TestValidator.equals(
      name,
      rail.map(({ faces }) => faces),
      [[0], [0, 1], [1], [1, 0]],
    );
  }
  verifySnap();
}

/** Check snapping at the exact interior foot in both charts. */
function verifySnap(): void {
  const solid: IAutoMovieSolidBody.IBody = body(true);
  const lifted: number = 8 + 2 ** -38;
  solid.mesh.positions.push(lifted, -0.5, 0, 9, 0, 0, lifted, 0.5, 0, 9, 0, 0);
  const first: IAutoMovieSolidClip.IRailPoint = {
    vertex: 4,
    phase: 0,
    faces: [1, 0],
    chart: new Map<number, [number, number]>([
      [0, [lifted, -0.5]],
      [1, [lifted, -0.5]],
    ]),
  };
  const last: IAutoMovieSolidClip.IRailPoint = {
    vertex: 6,
    phase: Math.PI,
    faces: [0, 1],
    chart: new Map<number, [number, number]>([
      [0, [lifted, 0.5]],
      [1, [lifted, 0.5]],
    ]),
  };
  const rail: IAutoMovieSolidClip.IRailPoint[] = [
    first,
    {
      vertex: 5,
      phase: Math.PI / 2,
      faces: [0],
      chart: new Map<number, [number, number]>([[0, [9, 0]]]),
    },
    last,
    {
      vertex: 7,
      phase: (3 * Math.PI) / 2,
      faces: [1],
      chart: new Map<number, [number, number]>([[1, [9, 0]]]),
    },
  ];
  TestValidator.equals(
    "trim crosses both faces",
    AutoMovieEngineSolidClip.trim(solid, rail, 2, "island"),
    null,
  );
  for (const point of [first, last])
    for (const face of [0, 1])
      TestValidator.predicate(
        "interior foot snaps exactly to u=8",
        point.chart.get(face)?.[0] === 8,
      );
}
