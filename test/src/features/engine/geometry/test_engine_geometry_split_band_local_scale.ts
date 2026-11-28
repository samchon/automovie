import { AutoMovieEngineConstructionSplitBand as Band } from "@automovie/engine";
import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

type Event = IAutoMovieConstructionSplitBandTrace.Event;
type Pass = Extract<Event, { kind: "local-pass" }>;
type Prepared = Extract<Event, { kind: "prepared" }>;
type Minorant = Extract<Event, { kind: "minorant" }>;
type Near = (k: number, length: number) => IAutoMovieBlendColumn["start"];

/** Columns of the host loop: Delta = 2 pi / 192 fixes the Gaussian bound below. */
const COUNT: number = 192;

/** Log cap of the curved column. */
const ETA: number = 1 / 128;

/**
 * Bisection (40 steps of a half-unit interval, under 5e-13) plus trigonometric
 * correspondence and spline rounding; five orders under the old log excess.
 */
const TOLERANCE: number = 2e-11;

/**
 * `AutoMovieEngineConstructionSplitBand.strip` publishes a regular analytic ribbon
 * whose Gaussian-rounded local scale stays above one cap, by one certified
 * uniform attenuation, and keeps an original backward zero.
 *
 * Fixture: a unit circle of 192 cardinal columns in the plane y = 0 onto a unit
 * cylinder (station 1, length 1); the host's station jet is [0, L, 0], and on
 * the curved case column 0 has second jet [0, -4 e^eta L^2, 0], eta = 1/128:
 * the host G(s, theta) = (cos theta, s - 2 e^eta T(theta) s^2, sin theta) with
 * the cardinal kernel T, regular on |s| <= 1/16. Its quintic Hermite controls
 * [0, f/5, (2 f - e^eta f^2)/5, 1 - 2 f/5, 1 - f/5, 1] stay ordered only for f
 * <= e^-eta at column 0, and for f <= 1 elsewhere.
 *
 * Scenarios:
 *
 * 1. Curved: the prepared columns are the unit chords with those jets, all
 *    forward, factors e^-eta at column 0 and 1 elsewhere, common factor e^-eta.
 *    The 64 local passes each adjust only column 0 (`above-own`, no lower),
 *    with log targets -eta and 0 and a field in (0, 1]; the last pass's log
 *    excess is over 9e-6 (Gaussian self weight 0.079 < w < 0.10 gives delta_63
 *
 * > 0.9^64 / 128 - 1e-9). One accepted certificate, no refusal; the published
 * > factors are alpha times the last field with 0 < alpha < 1, e^-eta at column
 * > 0, rising by more than eta / 2 to the antipode, the certificate's field equal
 * > to them, under the prepared factors, limited at column 0. The published rails
 * > keep the points, u = [0, f, 0] and the scaled second jets, and their
 * > projected controls are ordered.
 *
 * 2. Normal (no curvature): one settled pass of field 1 and smooth 0, no
 *    certificate, and the published strip is the cylinder itself at stations 0,
 *    0.5 and 1 and four quarter clocks.
 * 3. Backward zero: the curved case with a zero first jet at the antipode keeps
 *    that column backward (191 forward), the same common factor and 64
 *    `above-own` passes with excess over 9e-6, one accepted positive
 *    certificate, and publishes the column's zero station jet and backward
 *    status with the certificate's scale at its child end.
 * 4. Mutating a certificate the trace hands out changes no publication.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names certified common attenuation, local trace ordering, the cylindrical control and backward-zero preservation.
 * @evidence contracts/development/testing.md#behavioral-verification Creates the actual ribbon with and without curved station jets and observes published factors, controls, recorded certificate and trace isolation.
 * @evidence contracts/development/testing.md#independent-expectations The written quintic controls stay ordered at the curved column only through exp(−η). The Gaussian self-weight bounds the last pre-certification residual. The straight cylinder supplies the unscaled reference.
 */
export function test_engine_geometry_split_band_local_scale(): void {
  const cap: number = Math.exp(-ETA);
  const bend: number = 4 * Math.exp(ETA);
  const zero: [number, number, number] = [0, 0, 0];
  const antipode: number = COUNT / 2;
  const close = (
    label: string,
    actual: readonly number[],
    expected: readonly number[],
  ): void =>
    TestValidator.predicate(
      label,
      actual.length === expected.length &&
        actual.every((value: number, i: number): boolean =>
          nclose(value, expected[i]!, TOLERANCE),
        ),
    );
  const loop: [number, number, number][] = Array.from(
    { length: COUNT },
    (_: unknown, k: number): [number, number, number] => [
      Math.cos((2 * Math.PI * k) / COUNT),
      0,
      Math.sin((2 * Math.PI * k) / COUNT),
    ],
  );
  const far = (k: number): number[] => [loop[k]![0], 1, loop[k]![2]];
  const cylinder: IAutoMovieSolidSurface = {
    name: "analytic-minorant-child",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [0, 2],
    jet: (s: number, theta: number): IAutoMovieSolidSurface.IJet => ({
      p: [Math.cos(theta), s, Math.sin(theta)],
      u: [0, 1, 0],
      v: [-Math.sin(theta), 0, Math.cos(theta)],
      uu: [...zero],
      uv: [...zero],
      vv: [-Math.cos(theta), 0, -Math.sin(theta)],
    }),
  };
  const near =
    (curved: boolean, hole: number | null): Near =>
    (k: number, length: number): IAutoMovieBlendColumn["start"] => ({
      point: loop[k]!,
      first: [0, k === hole ? 0 : length, 0],
      second: [0, curved && k === 0 ? -bend * length * length : 0, 0],
    });
  const strip = (
    name: string,
    host: Near,
  ): {
    result: IAutoMovieConstructionSplitBand.IStrip | string;
    prepared: Prepared;
    passes: Pass[];
    certificates: Minorant[];
    refusals: number;
  } => {
    const events: Event[] = [];
    const result: IAutoMovieConstructionSplitBand.IStrip | string = Band.strip(
      name,
      loop,
      host,
      [1, 0, 0],
      { surface: cylinder, station: 1, into: 1 },
      undefined,
      "angle",
      "column",
      [],
      (event: Event): void => {
        if (event.kind !== "minorant" || event.result.kind !== "accepted") {
          events.push(event);
          return;
        }
        events.push({
          kind: "minorant",
          result: {
            ...event.result,
            field: [...event.result.field],
            limitingIndices: [...event.result.limitingIndices],
          },
        });
        // 4. The handed-out certificate is the caller's to spoil.
        event.result.field.fill(NaN);
        event.result.limitingIndices.push(-1);
      },
    );
    const prepared: Prepared | undefined = events.find(
      (e: Event): e is Prepared => e.kind === "prepared",
    );
    if (prepared === undefined) throw new Error(`${name}: no prepared event`);
    return {
      result,
      prepared,
      passes: events.filter((e: Event): e is Pass => e.kind === "local-pass"),
      certificates: events.filter(
        (e: Event): e is Minorant => e.kind === "minorant",
      ),
      refusals: events.filter((e: Event): boolean => e.kind === "refusal")
        .length,
    };
  };
  const excess = (passes: Pass[]): number => {
    const last: Pass = passes.at(-1)!;
    const own: IAutoMovieConstructionSplitBandTrace.Target = last.own[0]!;
    return own.kind === "finite" ? last.smooth[0]! - own.value : NaN;
  };
  const exhausted = (
    label: string,
    passes: Pass[],
    hole: number | null,
  ): void => {
    TestValidator.equals(`${label} passes`, passes.length, 64);
    TestValidator.predicate(`${label} excess`, excess(passes) > 9e-6);
    passes.forEach((pass: Pass, index: number): void => {
      TestValidator.equals(
        `${label} pass ${index}`,
        [
          pass.pass,
          pass.settled,
          pass.backward,
          pass.adjustments.map(
            (
              a: IAutoMovieConstructionSplitBandTrace.IAdjustment,
            ): [number, string, number | null] => [a.column, a.reason, a.lower],
          ),
        ],
        [index, false, hole === null ? [] : [hole], [[0, "above-own", null]]],
      );
      TestValidator.predicate(
        `${label} pass ${index} targets`,
        pass.own.length === COUNT &&
          pass.own.every(
            (
              t: IAutoMovieConstructionSplitBandTrace.Target,
              k: number,
            ): boolean =>
              k === hole
                ? t.kind === "backward"
                : t.kind === "finite" &&
                  nclose(t.value, k === 0 ? -ETA : 0, TOLERANCE),
          ),
      );
      TestValidator.predicate(
        `${label} pass ${index} field`,
        pass.field.length === COUNT &&
          pass.field.every((v: number): boolean => v > 0 && v <= 1),
      );
    });
  };

  // 1.
  for (const curved of [true, false]) {
    const label: string = curved ? "curved" : "normal";
    const run = strip(`analytic-minorant-${label}-192`, near(curved, null));
    const { prepared, passes, certificates } = run;
    TestValidator.equals(
      `${label} cardinality`,
      [
        prepared.columns.length,
        prepared.factors.length,
        prepared.forwardIndices.length,
        prepared.backward.length,
      ],
      [COUNT, COUNT, COUNT, 0],
    );
    TestValidator.predicate(
      `${label} common factor`,
      nclose(prepared.commonFactor, curved ? cap : 1, TOLERANCE),
    );
    prepared.columns.forEach(
      (column: IAutoMovieBlendColumn, k: number): void => {
        close(`${label} start ${k}`, column.start.point, loop[k]!);
        close(`${label} end ${k}`, column.end.point, far(k));
        close(
          `${label} first ${k}`,
          [...column.start.first, ...column.end.first],
          [0, 1, 0, 0, 1, 0],
        );
        close(
          `${label} second ${k}`,
          [...column.start.second, ...column.end.second],
          [0, curved && k === 0 ? -bend : 0, 0, ...zero],
        );
        close(
          `${label} factor ${k}`,
          [prepared.factors[k]!],
          [curved && k === 0 ? cap : 1],
        );
      },
    );
    if (typeof run.result === "string")
      throw new Error(`${label}: ${run.result}`);
    const made: IAutoMovieConstructionSplitBand.IStrip = run.result;
    TestValidator.equals(`${label} backward`, made.scale.backward, []);
    close(`${label} length`, [made.length], [1]);
    if (!curved) {
      TestValidator.equals(
        "normal settled",
        passes.map((p: Pass): [number, boolean, number, boolean, boolean] => [
          p.pass,
          p.settled,
          p.adjustments.length,
          p.field.every((v: number): boolean => v === 1),
          p.smooth.every((v: number): boolean => v === 0),
        ]),
        [[0, true, 0, true, true]],
      );
      TestValidator.equals("normal certificates", certificates.length, 0);
      for (const station of [0, 0.5, 1])
        for (const k of [0, COUNT / 4, COUNT / 2, (3 * COUNT) / 4]) {
          const phase: number = (2 * Math.PI * k) / COUNT;
          const jet: IAutoMovieSolidSurface.IJet = made.surface.jet(
            station,
            phase,
          );
          close(
            `normal ${station}/${k}`,
            [...jet.p, ...jet.u, ...jet.uu],
            [Math.cos(phase), station, Math.sin(phase), 0, 1, 0, ...zero],
          );
        }
      continue;
    }
    exhausted("curved", passes, null);
    TestValidator.equals("curved refusals", run.refusals, 0);
    TestValidator.equals("curved certificates", certificates.length, 1);
    const certificate: Minorant["result"] = certificates[0]!.result;
    const factors: number[] = loop.map(
      (_: unknown, k: number): number =>
        made.surface.jet(0, (2 * Math.PI * k) / COUNT).u[1],
    );
    const last: Pass = passes.at(-1)!;
    const alpha: number = factors[0]! / last.field[0]!;
    TestValidator.predicate("curved alpha", alpha > 0 && alpha < 1);
    close("curved published cap", [factors[0]!], [cap]);
    TestValidator.predicate(
      "curved nonconstant",
      factors[antipode]! - factors[0]! > ETA / 2,
    );
    close(
      "curved uniform ratio",
      factors,
      last.field.map((v: number): number => alpha * v),
    );
    if (certificate.kind !== "accepted")
      throw new Error(`curved certificate ${certificate.stage}`);
    close("curved certificate alpha", [certificate.alpha], [alpha]);
    close("curved certificate field", certificate.field, factors);
    TestValidator.predicate(
      "curved certificate under factors",
      certificate.field.every(
        (v: number, k: number): boolean => v > 0 && v <= prepared.factors[k]!,
      ),
    );
    TestValidator.equals("curved limiting", certificate.limitingIndices, [0]);
    factors.forEach((f: number, k: number): void => {
      const phase: number = (2 * Math.PI * k) / COUNT;
      const start: IAutoMovieSolidSurface.IJet = made.surface.jet(0, phase);
      const end: IAutoMovieSolidSurface.IJet = made.surface.jet(
        made.length,
        phase,
      );
      const b: number = k === 0 ? bend : 0;
      TestValidator.predicate(
        `curved cap ${k}`,
        f > 0 && f <= (k === 0 ? cap : 1) + TOLERANCE,
      );
      close(
        `curved rail ${k}`,
        [...start.p, ...end.p, ...start.u, ...end.u, ...start.uu, ...end.uu],
        [...loop[k]!, ...far(k), 0, f, 0, 0, f, 0, 0, -b * f * f, 0, ...zero],
      );
      const controls: number[] = [
        0,
        f / 5,
        (2 * f - (k === 0 ? Math.exp(ETA) : 0) * f * f) / 5,
        1 - (2 * f) / 5,
        1 - f / 5,
        1,
      ];
      TestValidator.predicate(
        `curved controls ${k}`,
        controls.every(
          (v: number, i: number): boolean =>
            i === 0 || v + TOLERANCE >= controls[i - 1]!,
        ),
      );
    });
  }

  // 3.
  const hole = strip(
    "analytic-minorant-backward-zero-192",
    near(true, antipode),
  );
  TestValidator.equals(
    "zero ownership",
    [
      hole.prepared.columns.length,
      hole.prepared.forwardIndices.length,
      hole.prepared.factors.length,
      hole.prepared.backward,
      hole.prepared.forwardIndices.includes(antipode),
    ],
    [COUNT, COUNT - 1, COUNT - 1, [antipode], false],
  );
  close("zero common factor", [hole.prepared.commonFactor], [cap]);
  hole.prepared.columns.forEach(
    (column: IAutoMovieBlendColumn, k: number): void =>
      close(
        `zero column ${k}`,
        [
          ...column.start.point,
          ...column.end.point,
          ...column.start.first,
          ...column.end.first,
          ...column.start.second,
          ...column.end.second,
        ],
        [
          ...loop[k]!,
          ...far(k),
          0,
          k === antipode ? 0 : 1,
          0,
          0,
          1,
          0,
          0,
          k === 0 ? -bend : 0,
          0,
          ...zero,
        ],
      ),
  );
  close(
    "zero factors",
    hole.prepared.factors,
    hole.prepared.forwardIndices.map((k: number): number =>
      k === 0 ? cap : 1,
    ),
  );
  exhausted("zero", hole.passes, antipode);
  TestValidator.equals("zero certificates", hole.certificates.length, 1);
  if (typeof hole.result === "string")
    throw new Error(`backward zero refused: ${hole.result}`);
  const certificate: Minorant["result"] = hole.certificates[0]!.result;
  if (certificate.kind !== "accepted")
    throw new Error(`zero certificate ${certificate.stage}`);
  TestValidator.predicate(
    "zero certificate",
    certificate.field.length === COUNT &&
      certificate.field.every((v: number): boolean => v > 0 && v <= 1),
  );
  TestValidator.equals("zero backward kept", hole.result.scale.backward, [
    antipode,
  ]);
  const phase: number = (2 * Math.PI * antipode) / COUNT;
  const start: IAutoMovieSolidSurface.IJet = hole.result.surface.jet(0, phase);
  const end: IAutoMovieSolidSurface.IJet = hole.result.surface.jet(
    hole.result.length,
    phase,
  );
  close("zero length", [hole.result.length], [1]);
  close(
    "zero rail",
    [...start.p, ...start.u, ...start.uu, ...end.p, ...end.uu, ...end.u],
    [
      ...loop[antipode]!,
      ...zero,
      ...zero,
      ...far(antipode),
      ...zero,
      0,
      certificate.field[antipode]!,
      0,
    ],
  );
}
