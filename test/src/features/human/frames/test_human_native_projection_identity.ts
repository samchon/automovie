import { nclose } from "../../internal/nclose";
import {
  AutoMovieEngineLoftViewFullSource as Full,
  AutoMovieEngineViewAxis,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeFamily as Native,
  AutoMovieHumanNativeProjectionCourse as Course,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNativeProjectionCourse,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * An original physical projection preserves its actual angled source identity.
 *
 * Scenarios:
 * 1. A 3-4-5 straight course at an offset origin has endpoint-chord projection
 *    D0 distinct from norm(actual station tangent)*material span in binary64.
 *    This premise is checked independently before the identity observations.
 * 2. Requesting that original D0 borrows its literal axis and emits no new
 *    course breaks. Existing native source/part readers keep the OLD cap,
 *    scalar controls, requested/cap grid and all six original physical jets.
 * 3. A translated source uses the same immutable-original D0. Translation is
 *    not permission to remeasure or replace the original projection datum.
 * 4. A copied same-valued original descriptor cannot reuse the captured source datum.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the source-bound course with prepare and project, creates the native family and part, and calls the engine's full-native reader on the original and translated definitions. Literal descriptors and an independently copied descriptor exercise successful reading and refusal.
 * @evidence contracts/development/testing.md#independent-expectations The immutable original rail and pole origins give the endpoint distance. Applying that same request preserves the original axis, cap, scalar controls and grid. The exact physical jet comparisons come from evaluating the original reader at the same addresses.
 * @evidence contracts/development/common.md#meaningful-documentation The original endpoint distance defines identity. The test checks literal control borrowing, translated-source reuse and refusal of a copied source descriptor.
 */
export function test_human_native_projection_identity(): void {
  const failures: string[] = [];
  const check: (label: string, condition: boolean) => void = (
    label: string,
    condition: boolean,
  ): void => { if (!condition) failures.push(label); };
  const rail: number = 10;
  const length: number = 17;
  const pole: number = rail + length;
  const originalAxis: IAutoMovieViewAxis.IAxis = AutoMovieEngineViewAxis.straight(
    [1000, 1000, 0], [0.8, -0.6, 0], [0, 0, 1],
  );
  const original: IAutoMovieViewPart = circle(originalAxis);
  const start: readonly number[] = originalAxis.at(rail).origin;
  const end: readonly number[] = originalAxis.at(pole).origin;
  const projection: number = Math.hypot(
    end[0]! - start[0]!, end[1]! - start[1]!, end[2]! - start[2]!,
  );
  const originalJet: IAutoMovieViewAxisJet.IJet | null = originalAxis.jet?.(rail) ?? null;
  check("independent original physical metric is finite and positive", Number.isFinite(projection) && projection > 0);
  if (originalJet === null) failures.push("made original actual station2 unavailable");
  else check("offset angled premise did not distinguish endpoint D0 from vL",
    projection !== Math.hypot(...originalJet.first.origin) * length);

  let projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner | null = null;
  try {
    projectionOwner = Course.prepare(original, rail);
    check("prepared metric differs from independent original endpoint D0", nclose(projectionOwner.projection, projection, 0));
  } catch (error: unknown) {
    failures.push("original owner preparation: " + (error instanceof Error ? error.message : String(error)));
  }
  const translated: IAutoMovieViewAxis.IAxis = AutoMovieEngineViewAxis.straight(
    [2000, 2000, 0], [0.8, -0.6, 0], [0, 0, 1],
  );
  const cases: readonly (readonly [string, IAutoMovieViewAxis.IAxis])[] = [
    ["original angled source", originalAxis],
    ["translated same original datum", translated],
  ];
  for (const [label, axis] of cases) {
    try {
      const before: IAutoMovieViewPart = sample(original, axis);
      if (projectionOwner === null) throw new Error("captured original projection unavailable");
      const course: IAutoMovieHumanNativeProjectionCourse.IPrepared = projectionOwner.project(original, axis, projection);
      check(label + ": literal original/current axis replaced", course.axis === axis);
      check(label + ": identity emitted new course breaks", course.materialBreaks.length === 0);
      const actual: IAutoMovieViewPart = sample(original, course.axis, course);
      check(label + ": source axis changed through the actual native consumer", actual.axis === axis);
      check(label + ": OLD scalar/parameter owners changed",
        actual.front.positive === original.front.positive &&
        actual.front.positive.parameter === original.front.positive.parameter &&
        actual.fullness === original.fullness);
      check(label + ": OLD cap/domain changed", actual.pole === "top" &&
        nclose(actual.stations[0]!, 9, 0) && nclose(actual.stations.at(-1)!, pole, 0));
      check(label + ": literal cap-inclusive grid changed",
        actual.stations.length === before.stations.length &&
        actual.stations.every((s: number, i: number): boolean => nclose(s, before.stations[i]!, 0)));
      const baselineReader: IAutoMovieLoftViewFullSource.IReader = Full.create(before);
      const reader: IAutoMovieLoftViewFullSource.IReader = Full.create(actual);
      for (const station of [12, 18, 26])
        for (const phase of [0, 0.37, 1.2]) {
          const expected: IAutoMovieSolidSurface.IJet = baselineReader.jet(station, phase);
          const measured: IAutoMovieSolidSurface.IJet = reader.jet(station, phase);
          for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
            check(label + ": literal physical2 " + key + " at " + station + "," + phase,
              measured[key].every((v: number, i: number): boolean => nclose(v, expected[key][i]!, 0)));
        }
      const expectedPole: readonly number[] = baselineReader.point(pole, 0);
      check(label + ": OLD material pole Point0 changed",
        reader.point(pole, 0).every((v: number, i: number): boolean => nclose(v, expectedPole[i]!, 0)));
    } catch (error: unknown) {
      failures.push(label + ": " + (error instanceof Error ? error.message : String(error)));
    }
  }
  if (projectionOwner !== null) {
    let refused: boolean = false;
    try { projectionOwner.project({ ...original }, originalAxis, projection); }
    catch (error: unknown) {
      refused = error instanceof Error && error.message.includes("source identity mismatch");
    }
    check("same-valued foreign original descriptor borrowed the captured datum", refused);
  }

  TestValidator.predicate("original projection identity: " + failures.join(" | "), failures.length === 0);
}

/** Tiny complete circular source with a fixed top square-root material cap. */
function circle(axis: IAutoMovieViewAxis.IAxis): IAutoMovieViewPart {
  const coordinate: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    parameter: { type: "root", end: "top", pole: 27 },
    knots: [{ station: 9, value: sign * Math.sqrt(18), site: "base" },
      { station: 27, value: 0, site: "pole" }],
  });
  const positive: IAutoMovieViewPart.IOutline = coordinate(1);
  const negative: IAutoMovieViewPart.IOutline = coordinate(-1);
  const shoulder: IAutoMovieViewPart.IOutline = { knots: [
    { station: 9, value: Math.SQRT2 - 1, site: "base" },
    { station: 27, value: Math.SQRT2 - 1, site: "pole" },
  ] };
  return { name: "made-projection-identity", axis, stations: [9, 10, 18, 26, 26.5, 27],
    pole: "top", order: 8, samples: 48,
    front: { positive, negative }, side: { positive, negative },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] } };
}

/** Exercise the real native consumer, applying exactly its opt-in course metadata. */
function sample(
  original: IAutoMovieViewPart,
  axis: IAutoMovieViewAxis.IAxis,
  course?: IAutoMovieHumanNativeProjectionCourse.IPrepared,
): IAutoMovieViewPart {
  const radii: number[] = [Math.sqrt(18), 3, 1];
  const prior: IAutoMovieHumanConicLoft.IFamily = {
    name: original.name!, centres: [original.axis.at(0).origin, original.axis.at(27).origin],
    halves: [], up: [0.8, -0.6, 0], layout: S.limb(0), knots: [9, 18, 26],
    values: [radii, [0, 0, 0], [0, 0, 0], radii,
      radii.map((v: number): number => -v), [0, 0, 0], [0, 0, 0], radii.map((v: number): number => -v),
      ...[0, 1, 2, 3].map((): number[] => [Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1])],
    tips: [null, { from: 26, tip: 27, rings: 2 }],
  };
  const selected: IAutoMovieViewPart = { ...original, axis };
  const family: IAutoMovieHumanConicLoft.IFamily = Native.create({
    original: prior, bone: prior,
    originals: new Map([[original.name!, original]]), axis,
    scale: (): AutoMovieVector2Tuple => [1, 1], station: (s: number): number => s,
    features: [], protection: [], authority: {
      sources: new Map([[original.name!, selected]]),
      ...(course === undefined || course.materialBreaks.length === 0 ? {} : {
        sampling: { maximumSpeed: course.maximumSpeed, materialBreaks: course.materialBreaks },
      }),
    },
  });
  return H.part(family, [9, 10, 18, 26]);
}
