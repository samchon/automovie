import {
  AutoMovieConstructionNativeProfile,
  AutoMovieConstructionProfile,
  AutoMovieLoftAdmissionError,
  AutoMovieViewAxis,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieSolidSurface,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";
import type { IAutoMovieConstructionProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionNativeContinuation as Made } from "../../internal/construction/ConstructionNativeContinuation";
import { nclose } from "../../internal/nclose";

/** Six open line pieces form a nonconvex L without a polar replacement. */
const CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
];

/**
 * Original nonpolar pieces, holes and active regions reach real atlas readers.
 *
 * Scenarios:
 * 1. Six exact line fields form a concave L, with alternating original clock
 *    directions over [2,5]; an independent hole uses a clockwise circle.
 *    Every world total2 component follows polynomial/elementary equations.
 * 2. Actual atlas boundaries are inclusive and across uses identical original
 *    positions. Source region membership, material/binding refs and logical
 *    names survive without treating a conservative piece address as a region.
 *    Original derivative integration reads the L boundary's perimeter 8a(s),
 *    distinct from its taut convex hull perimeter (6+sqrt2)a(s).
 * 3. The current native original adapter retains circle Point0/world2 at
 *    off-layer stations, independent of compatibility order or a raw loft.
 * 4. Unclosed loops, missing owners, invalid clocks, nonfinite values, absent
 *    local/plane2 and collapsed charts refuse; foreign exceptions retain identity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual Profile surfaces, section closure, atlas kept/across and original region predicates, then the real native source adapter, while observing explicit failures and Point0 separately from physical2.
 * @evidence contracts/development/testing.md#independent-expectations The L's line interpolation scales by a(s)=1+s+s². The hole and native circle use elementary sin/cos; native radius is3+s+s². Their analytic derivatives determine all six world vectors independently with absolute2e-9mm component allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes nonconvex multi-piece/negative clocks, separate hole winding and world orientation, station-dependent trimmed regions, off-layer native evaluation, invalid topology/reference/domain, missing derivatives and original exception identity.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous construction_profile_source CPU entry uses synthetic original functions only, without Human generation, process, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Six exact line fields form a concave L, with alternating original clock).
 */
export function test_construction_profile_source(): void {
  const failures: string[] = [];
  const source: IAutoMovieConstructionProfileSource = made();
  const prepared: AutoMovieConstructionProfile.IPrepared =
    AutoMovieConstructionProfile.create(source);
  for (const station of [0, 0.37, 1]) {
    if (prepared.section(station).length !== 2)
      failures.push("The actual section lost its outer loop or hole.");
    for (let index: number = 0; index < 6; index++) {
      const face: IAutoMovieSolidSurface = prepared.surfaces.get(`L.${index}`)!;
      for (const v of [0, 0.19, 0.73, 1]) {
        const from: readonly [number, number] = CORNERS[index]!;
        const to: readonly [number, number] = CORNERS[(index + 1) % 6]!;
        const p: number[] = [
          from[0] + v * (to[0] - from[0]),
          from[1] + v * (to[1] - from[1]),
        ];
        const delta: number[] = [to[0] - from[0], to[1] - from[1]];
        const a: number = 1 + station + station * station;
        const d: number = 1 + 2 * station;
        const expected: IAutoMovieSolidSurface.IJet = {
          p: [a * p[0]!, station, a * p[1]!],
          u: [d * p[0]!, 1, d * p[1]!],
          v: [a * delta[0]!, 0, a * delta[1]!],
          uu: [2 * p[0]!, 0, 2 * p[1]!],
          uv: [d * delta[0]!, 0, d * delta[1]!],
          vv: [0, 0, 0],
        };
        jets(face.jet(station, v), expected, failures);
        vector(face.point!(station, v), expected.p, failures);
      }
      if (
        !prepared.atlas.kept(index, station, 0) ||
        !prepared.atlas.kept(index, station, 1)
      )
        failures.push("An actual piece boundary was excluded.");
      const next: ReturnType<typeof prepared.atlas.across> =
        prepared.atlas.across(index, station, 1.01);
      if (next?.face !== (index + 1) % 6 || next.v !== 0)
        failures.push("The original neighbor chart correspondence changed.");
    }
    const hole: IAutoMovieSolidSurface = prepared.surfaces.get("hole")!;
    const v: number = 0.23;
    const t: number = 2 * Math.PI * (1 - v);
    const k: number = -2 * Math.PI;
    jets(
      hole.jet(station, v),
      {
        p: [0.5 + 0.1 * Math.cos(t), station, 0.5 + 0.1 * Math.sin(t)],
        u: [0, 1, 0],
        v: [-0.1 * Math.sin(t) * k, 0, 0.1 * Math.cos(t) * k],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-0.1 * Math.cos(t) * k * k, 0, -0.1 * Math.sin(t) * k * k],
      },
      failures,
    );
    if (
      hole.orientation !== 1 ||
      prepared.definition.loops[1]!.orientation !== -1
    )
      failures.push(
        "Hole winding was incorrectly used as a surface-normal sign.",
      );
  }
  if (
    !prepared.contains("active", "L.0", 0.3, 0.2) ||
    prepared.contains("active", "L.0", 0.3, 0.8) ||
    prepared.contains("active", "L.0", 0.1, 0.2) ||
    prepared.contains("active", "L.1", 0.3, 0.2)
  )
    failures.push(
      "Actual source membership was replaced by its broad piece address.",
    );
  if (
    prepared.definition.regions[0]!.material !== "skin.chart" ||
    prepared.definition.regions[0]!.binding !== "shared.weights"
  )
    failures.push("Original material or binding identity changed.");
  const perimeter: ReturnType<typeof measureAutoMovieCurveLength64> =
    measureAutoMovieCurveLength64(
      prepared.definition.loops[0]!.pieces.map(
        (
          piece: IAutoMovieConstructionProfile.IPiece,
        ): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({
          domain: [0, 1],
          derivative: (v: number): [number, number, number] =>
            prepared.phase(piece.id, 0.37, v).t,
        }),
      ),
    );
  if (!nclose(perimeter.lengthMm, 8 * (1 + 0.37 + 0.37 ** 2), 2e-11))
    failures.push(
      "Actual nonconvex source perimeter was changed to a hull or display fit.",
    );
  refuses(
    (): unknown => prepared.contains("unknown", "L.0", 0.3, 0.2),
    failures,
    "unknown original region",
  );
  refuses(
    (): unknown => prepared.contains("active", "unknown", 0.3, 0.2),
    failures,
    "unknown original piece",
  );
  const native: IAutoMovieConstructionProfileSource =
    AutoMovieConstructionNativeProfile(Made.source("native.profile", 64, 17), {
      material: "real.material",
      binding: "real.binding",
      revisions: {
        source: "source1",
        constraints: "constraints1",
        topology: "topology1",
      },
    });
  const nativeReader: AutoMovieConstructionProfile.IPrepared =
    AutoMovieConstructionProfile.create(native);
  const actual: IAutoMovieSolidSurface = nativeReader.atlas.faces[0]!;
  for (const s of [0, 0.17, 0.81, 1])
    for (const v of [0, 0.137, 0.5, 1]) {
      const e: ReturnType<typeof Made.oracle> = Made.oracle(
        s,
        2 * Math.PI * v,
        1,
      );
      const k: number = 2 * Math.PI;
      jets(
        actual.jet(s, v),
        {
          p: e.p,
          u: e.s,
          v: e.t.map((n: number): number => k * n) as [number, number, number],
          uu: e.ss,
          uv: e.st.map((n: number): number => k * n) as [
            number,
            number,
            number,
          ],
          vv: e.tt.map((n: number): number => k * k * n) as [
            number,
            number,
            number,
          ],
        },
        failures,
      );
      const phase: ReturnType<typeof nativeReader.phase> = nativeReader.phase(
        "native.profile.native",
        s,
        v,
      );
      vector(phase.p, e.p, failures);
      vector(
        phase.t,
        e.t.map((n: number): number => k * n),
        failures,
      );
      if (phase.tt === null)
        failures.push("The actual native phase2 was discarded.");
      else
        vector(
          phase.tt,
          e.tt.map((n: number): number => k * k * n),
          failures,
        );
    }
  refusals(failures);
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Exact original linear fields with deliberately different parameter direction. */
function made(): IAutoMovieConstructionProfileSource {
  const curves: Map<string, IAutoMovieConstructionProfileSource.ICurve> =
    new Map();
  const pieces: IAutoMovieConstructionProfile.IPiece[] = [];
  for (let index: number = 0; index < 6; index++) {
    const from: readonly [number, number] = CORNERS[index]!;
    const to: readonly [number, number] = CORNERS[(index + 1) % 6]!;
    const direction: 1 | -1 = index % 2 === 0 ? 1 : -1;
    const read: (
      s: number,
      t: number,
    ) => IAutoMovieConstructionProfileSource.IJet = (
      s: number,
      t: number,
    ): IAutoMovieConstructionProfileSource.IJet => {
      const v: number = direction === 1 ? (t - 2) / 3 : (5 - t) / 3;
      const p: [number, number] = [
        from[0] + v * (to[0] - from[0]),
        from[1] + v * (to[1] - from[1]),
      ];
      const delta: [number, number] = [
        ((to[0] - from[0]) * direction) / 3,
        ((to[1] - from[1]) * direction) / 3,
      ];
      const a: number = 1 + s + s * s;
      return {
        p: [a * p[0], a * p[1]],
        s: [(1 + 2 * s) * p[0], (1 + 2 * s) * p[1]],
        t: [a * delta[0], a * delta[1]],
        ss: [2 * p[0], 2 * p[1]],
        st: [(1 + 2 * s) * delta[0], (1 + 2 * s) * delta[1]],
        tt: [0, 0],
      };
    };
    curves.set(`L.${index}`, {
      domain: [0, 1],
      clock: [2, 5],
      point: (s: number, t: number): [number, number] => read(s, t).p,
      jet: read,
    });
    pieces.push({
      id: `L.${index}`,
      source: `L.${index}`,
      clock: [2, 5],
      direction,
      branch: "L",
    });
  }
  curves.set("hole", {
    domain: [0, 1],
    clock: [0, 2 * Math.PI],
    point: (_s: number, t: number): [number, number] => [
      0.5 + 0.1 * Math.cos(t),
      0.5 + 0.1 * Math.sin(t),
    ],
    jet: (_s: number, t: number): IAutoMovieConstructionProfileSource.IJet => ({
      p: [0.5 + 0.1 * Math.cos(t), 0.5 + 0.1 * Math.sin(t)],
      s: [0, 0],
      t: [-0.1 * Math.sin(t), 0.1 * Math.cos(t)],
      ss: [0, 0],
      st: [0, 0],
      tt: [-0.1 * Math.cos(t), -0.1 * Math.sin(t)],
    }),
  });
  return {
    definition: {
      name: "profile",
      domain: [0, 0.001],
      plane: "original.plane",
      loops: [
        { id: "L", kind: "outer", orientation: 1, domain: [0, 0.001], pieces },
        {
          id: "hole",
          kind: "hole",
          orientation: -1,
          surfaceOrientation: 1,
          domain: [0, 0.001],
          pieces: [
            {
              id: "hole",
              source: "hole",
              clock: [0, 2 * Math.PI],
              direction: -1,
              branch: "hole",
            },
          ],
        },
      ],
      guides: [{ id: "corner", piece: "L.0", clock: 2 }],
      regions: [
        {
          id: "active",
          logicalParts: ["logical.feature"],
          pieces: ["L.0"],
          domain: [0.0002, 0.0008],
          trim: "actual.region",
          material: "skin.chart",
          binding: "shared.weights",
        },
      ],
      revisions: { source: "1", constraints: "2", topology: "3" },
    },
    plane: { id: "original.plane", axis: AutoMovieViewAxis.horizontal() },
    curves,
    regions: new Map([
      [
        "actual.region",
        {
          domain: [0.2, 0.8],
          contains: (s: number, t: number): boolean => t < 2 + 3 * s,
        },
      ],
    ]),
  };
}

/** Every malformed/unsupported case runs without replacing any foreign method. */
function refusals(failures: string[]): void {
  const bad: IAutoMovieConstructionProfileSource = made();
  bad.definition.loops[0]!.pieces[0]!.clock = [2.1, 5];
  bad.definition.guides[0]!.clock = 2.1;
  const gap: AutoMovieConstructionProfile.IPrepared =
    AutoMovieConstructionProfile.create(bad);
  refuses((): unknown => gap.section(0.5), failures, "actual loop gap");
  refuses(
    (): unknown => gap.atlas.across(5, 0.5, 1.1),
    failures,
    "unmatched across boundary",
  );
  const missing: IAutoMovieConstructionProfileSource = made();
  missing.definition.loops[0]!.pieces[0]!.source = "absent";
  refuses(
    (): unknown => AutoMovieConstructionProfile.create(missing),
    failures,
    "missing original",
  );
  const clock: IAutoMovieConstructionProfileSource = made();
  clock.definition.loops[0]!.pieces[0]!.clock = [5, 2];
  refuses(
    (): unknown => AutoMovieConstructionProfile.create(clock),
    failures,
    "reversed declared interval",
  );
  const trim: IAutoMovieConstructionProfileSource = made();
  trim.regions = new Map();
  refuses(
    (): unknown => AutoMovieConstructionProfile.create(trim),
    failures,
    "missing actual region owner",
  );
  const orientation: IAutoMovieConstructionProfileSource = made();
  orientation.definition.loops[0]!.surfaceOrientation = 0 as 1;
  refuses(
    (): unknown => AutoMovieConstructionProfile.create(orientation),
    failures,
    "invalid world orientation",
  );
  const unavailable: IAutoMovieConstructionProfileSource = made();
  const own: IAutoMovieConstructionProfileSource.ICurve =
    unavailable.curves.get("L.0")!;
  const nonfinite: IAutoMovieConstructionProfileSource = made();
  nonfinite.curves = new Map(nonfinite.curves).set("L.0", {
    ...own,
    point: (): [number, number] => [Number.NaN, 0],
  });
  refuses(
    (): unknown =>
      AutoMovieConstructionProfile.create(nonfinite).atlas.faces[0]!.point!(
        0.5,
        0.5,
      ),
    failures,
    "nonfinite original point",
  );
  const collapsed: IAutoMovieConstructionProfileSource = made();
  collapsed.curves = new Map(collapsed.curves).set("L.0", {
    ...own,
    jet: (s: number, t: number): IAutoMovieConstructionProfileSource.IJet => ({
      ...own.jet(s, t)!,
      t: [0, 0],
    }),
  });
  refuses(
    (): unknown =>
      AutoMovieConstructionProfile.create(collapsed).atlas.faces[0]!.jet(
        0.5,
        0.5,
      ),
    failures,
    "collapsed original tangent plane",
  );
  unavailable.curves = new Map(unavailable.curves).set("L.0", {
    ...own,
    jet: (): null => null,
  });
  const value: IAutoMovieSolidSurface =
    AutoMovieConstructionProfile.create(unavailable).atlas.faces[0]!;
  vector(value.point!(0.5, 0.5), [1.75, 0.5, 0], failures);
  refuses((): unknown => value.jet(0.5, 0.5), failures, "unavailable total2");
  const marker: Error = new Error("original getter");
  const foreign: IAutoMovieConstructionProfileSource = made();
  foreign.curves = new Map(foreign.curves).set("L.0", {
    ...own,
    point: (): never => {
      throw marker;
    },
  });
  let caught: unknown;
  try {
    AutoMovieConstructionProfile.create(foreign).atlas.faces[0]!.point!(
      0.5,
      0.5,
    );
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("Original callback exception identity changed.");
  const axis: IAutoMovieConstructionProfileSource = made();
  axis.plane = {
    id: axis.plane.id,
    axis: { at: AutoMovieViewAxis.horizontal().at },
  };
  refuses(
    (): unknown =>
      AutoMovieConstructionProfile.create(axis).atlas.faces[0]!.jet(0.5, 0.5),
    failures,
    "missing actual plane2",
  );
}

/** Required admission failures cannot become successful geometry. */
function refuses(job: () => unknown, failures: string[], label: string): void {
  try {
    job();
    failures.push(`${label} was accepted.`);
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieLoftAdmissionError))
      failures.push(`${label} lost its admission error: ${String(error)}`);
  }
}

/** Compare every actual total2 vector with its independent equation. */
function jets(
  actual: IAutoMovieSolidSurface.IJet,
  expected: IAutoMovieSolidSurface.IJet,
  failures: string[],
): void {
  for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
    vector(actual[key], expected[key], failures);
}

/** Fixed absolute arithmetic budget, unrelated to display or fit tolerances. */
function vector(
  actual: readonly number[],
  expected: readonly number[],
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (value: number, index: number): boolean =>
        !nclose(value, expected[index]!, 2e-9),
    )
  )
    failures.push(`Profile actual ${actual}, expected ${expected}.`);
}
