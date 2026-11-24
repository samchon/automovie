import { AutoMovieConstructionSplitBand as Band } from "@automovie/engine";
import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { checkConstructionLocalScaleBackwardZero } from "./checkConstructionLocalScaleBackwardZero";

/**
 * A regular analytic ribbon must survive Gaussian rounding above one scale cap.
 *
 * Scenarios:
 *
 * 1. The 192 cardinal samples of a regular trigonometric host have one negative
 *    station curvature. Its degree-five projected controls admit exp(-1/128)
 *    there and 1 elsewhere. The existing 64 passes remain above that one cap,
 *    although a positive common certificate exists; the strip must publish a
 *    certified nonconstant field.
 * 2. Removing that curvature gives the adjacent cylinder input. It settles on its
 *    first pass with scale 1 and retains its physical station jets.
 * 3. The curved case also retains a zero original first jet at its antipodal
 *    column, already classified backward. Attenuation must preserve that finite
 *    zero and its backward status; this asserts no surface regularity or
 *    forward admission at that column.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real SplitBand.strip with analytic input jets, collects every actual local pass and certificate, and reads its published surface. Mutating the detached certificate must not change publication. Refusing an admissible nonuniform field fails after the complete normal counterpart has also been inspected.
 * @evidence contracts/development/testing.md#independent-expectations Quintic Hermite endpoint data give projected controls [0,f/5,(2*f-exp(eta)*f*f)/5,1-2*f/5,1-f/5,1]. Their order requires f<=exp(-eta) at the curved column; the other columns admit 1. A Gaussian sum/integral bound proves the old 64-pass excess exceeds 9e-6. Float tolerances cover the 40-step scalar bisection and analytic correspondence rounding, not Human measurements. Only column constraints and rail jets are certified, not continuous-phase embedding.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates above-own-only exhaustion from backward geometry and predicate changes, requires positive common admission, rejects a constant fallback, and checks the neighboring already-converged case. The antipodal case distinguishes an original backward zero from underflow of a nonzero vector. Operator trace ownership and unrelated malformed correspondence cases belong to their existing operator tests.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable exported test owns all three explicit in-memory cases and calls only the engine operator; it imports no Human, asset, host, mesh or evaluator.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the regular host equation, independent control bound, old recurrence, numerical budget and normalized-cross versus physical-station derivative units.
 */
export function test_construction_local_scale_minorant(): void {
  const failures: string[] = [];
  const evidence: string[] = [];
  const count: number = 192;
  const eta: number = 1 / 128;
  const cap: number = Math.exp(-eta);
  const bend: number = 4 * Math.exp(eta);

  // A half-unit bisection interval after 40 steps is below 5e-13.
  // The 2e-11 budget also covers trigonometric correspondence and spline
  // evaluation; it is over five orders below the proved old log excess.
  const tolerance: number = 2e-11;
  const zero: [number, number, number] = [0, 0, 0];

  /** Compare world vectors with the analytic floating-point budget. */
  const close: (
    actual: readonly number[],
    expected: readonly number[],
  ) => boolean = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, tolerance),
    );
  const loop: [number, number, number][] = Array.from(
    { length: count },
    (_: unknown, k: number): [number, number, number] => [
      Math.cos((2 * Math.PI * k) / count),
      0,
      Math.sin((2 * Math.PI * k) / count),
    ],
  );
  const cylinder: IAutoMovieSolidSurface = {
    name: "analytic-minorant-child",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [0, 2],

    /** Unit-radius cylinder with station measured in world length. */
    jet(s: number, theta: number): IAutoMovieSolidSurface.IJet {
      return {
        p: [Math.cos(theta), s, Math.sin(theta)],
        u: [0, 1, 0],
        v: [-Math.sin(theta), 0, Math.cos(theta)],
        uu: [...zero],
        uv: [...zero],
        vv: [-Math.cos(theta), 0, -Math.sin(theta)],
      };
    },
  };

  for (const curved of [true, false]) {
    const name: string = curved
      ? "analytic-minorant-192"
      : "analytic-minorant-normal-192";
    const events: IAutoMovieConstructionSplitBandTrace.Event[] = [];

    // T(theta)=[sin(N*theta/2)/(N*sin(theta/2))]^2 is a finite
    // trigonometric polynomial, with T(0)=1 and exact cardinal zeros.
    // G(s,theta)=(cos(theta),s-2*exp(eta)*T(theta)*s^2,sin(theta))
    // is regular on |s|<=1/16: G_s.y>=1-exp(eta)/4>0.
    // At s=0 these are its jets composed with normalized cross speed L.
    /** Exact cardinal host jets; L is the actual normalized cross length. */
    const near: (
      k: number,
      length: number,
    ) => IAutoMovieBlendColumn["start"] = (
      k: number,
      length: number,
    ): IAutoMovieBlendColumn["start"] => ({
      point: loop[k]!,
      first: [0, length, 0],
      second: [0, curved && k === 0 ? -bend * length * length : 0, 0],
    });
    let result: IAutoMovieConstructionSplitBand.IStrip | string =
      "strip did not return";
    try {
      result = Band.strip(
        name,
        loop,
        near,
        [1, 0, 0],
        { surface: cylinder, station: 1, into: 1 },
        undefined,
        "angle",
        "column",
        [],
        (event: IAutoMovieConstructionSplitBandTrace.Event): void => {
          if (event.kind === "minorant" && event.result.kind === "accepted") {
            events.push({
              kind: "minorant",
              result: {
                ...event.result,
                field: [...event.result.field],
                limitingIndices: [...event.result.limitingIndices],
              },
            });
            event.result.field.fill(NaN);
            event.result.limitingIndices.push(-1);
          } else events.push(event);
        },
      );
    } catch (error) {
      failures.push(name + ": threw " + String(error));
    }
    const prepared:
      | Extract<
          IAutoMovieConstructionSplitBandTrace.Event,
          { kind: "prepared" }
        >
      | undefined = events.find(
      (
        event: IAutoMovieConstructionSplitBandTrace.Event,
      ): event is Extract<
        IAutoMovieConstructionSplitBandTrace.Event,
        { kind: "prepared" }
      > => event.kind === "prepared",
    );
    const passes: Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "local-pass" }
    >[] = events.filter(
      (
        event: IAutoMovieConstructionSplitBandTrace.Event,
      ): event is Extract<
        IAutoMovieConstructionSplitBandTrace.Event,
        { kind: "local-pass" }
      > => event.kind === "local-pass",
    );
    const adjustments: IAutoMovieConstructionSplitBandTrace.IAdjustment[] =
      passes.flatMap(
        (
          pass: Extract<
            IAutoMovieConstructionSplitBandTrace.Event,
            { kind: "local-pass" }
          >,
        ): IAutoMovieConstructionSplitBandTrace.IAdjustment[] =>
          pass.adjustments,
      );
    const certificates: Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "minorant" }
    >[] = events.filter(
      (
        event: IAutoMovieConstructionSplitBandTrace.Event,
      ): event is Extract<
        IAutoMovieConstructionSplitBandTrace.Event,
        { kind: "minorant" }
      > => event.kind === "minorant",
    );
    const last:
      | Extract<
          IAutoMovieConstructionSplitBandTrace.Event,
          { kind: "local-pass" }
        >
      | undefined = passes.at(-1);
    const lastOwn: IAutoMovieConstructionSplitBandTrace.Target | undefined =
      last?.own[0];
    const excess: number | null =
      last !== undefined && lastOwn?.kind === "finite"
        ? last.smooth[0]! - lastOwn.value
        : null;
    evidence.push(
      JSON.stringify({
        name,
        returned: typeof result === "string" ? result : "strip",
        localPasses: passes.length,
        common: prepared?.commonFactor ?? null,
        backward: prepared?.backward ?? null,
        adjustments: adjustments.length,
        aboveOwnOnly: adjustments.every(
          (value: IAutoMovieConstructionSplitBandTrace.IAdjustment): boolean =>
            value.reason === "above-own" && value.column === 0,
        ),
        lastLogExcess: excess,
      }),
    );

    if (typeof result === "string")
      failures.push(name + ": admissible analytic strip refused: " + result);
    if (prepared === undefined) {
      failures.push(name + ": prepared columns and common certificate missing");
      continue;
    }
    if (
      prepared.columns.length !== count ||
      prepared.factors.length !== count ||
      prepared.forwardIndices.length !== count ||
      prepared.backward.length !== 0
    )
      failures.push(name + ": analytic forward-column cardinality changed");
    if (
      !(prepared.commonFactor > 0) ||
      !nclose(prepared.commonFactor, curved ? cap : 1, tolerance)
    )
      failures.push(
        name + ": common admission differs from independent control bound",
      );
    for (let k: number = 0; k < prepared.columns.length; ++k) {
      const column: IAutoMovieBlendColumn = prepared.columns[k]!;
      const chordLength: number = Math.hypot(
        ...column.end.point.map(
          (value: number, axis: number): number =>
            value - column.start.point[axis]!,
        ),
      );
      if (
        !nclose(chordLength, 1, tolerance) ||
        !close(column.start.point, loop[k]!) ||
        !close(column.end.point, [loop[k]![0], 1, loop[k]![2]])
      )
        failures.push(name + ": analytic unit chord premise failed at " + k);
      if (
        !close(column.start.first, [0, 1, 0]) ||
        !close(column.end.first, [0, 1, 0]) ||
        !close(column.start.second, [0, curved && k === 0 ? -bend : 0, 0]) ||
        !close(column.end.second, zero)
      )
        failures.push(
          name + ": normalized host/child jet premise failed at " + k,
        );
      if (!nclose(prepared.factors[k]!, curved && k === 0 ? cap : 1, tolerance))
        failures.push(
          name + ": degree-five analytic factor bound failed at " + k,
        );
    }

    if (curved) {
      // With Delta=2*pi/192, Gaussian sum/integral bounds give self
      // weight .079<w<.10. Only goal0 is negative: |goal0|<.099<4*Delta.
      // For c=-eta and epsilon=1e-9, delta_(m+1)=(1-w)*delta_m-w*epsilon.
      // Hence delta_63>.9^64/128-1e-9>9e-6. No extra passes are needed
      // to certify a uniform downward translation of the last log field.
      if (passes.length !== 64 || excess === null || !(excess > 9e-6))
        failures.push(
          name + ": old 64-pass above-cap prefix did not reproduce",
        );
      if (
        certificates.length !== 1 ||
        certificates[0]!.result.kind !== "accepted" ||
        events.some(
          (event: IAutoMovieConstructionSplitBandTrace.Event): boolean =>
            event.kind === "refusal",
        )
      )
        failures.push(
          name +
            ": missing single accepted minorant certificate or premature refusal",
        );
      for (let index: number = 0; index < passes.length; ++index) {
        const pass: Extract<
          IAutoMovieConstructionSplitBandTrace.Event,
          { kind: "local-pass" }
        > = passes[index]!;
        if (
          pass.pass !== index ||
          pass.settled ||
          pass.backward.length !== 0 ||
          pass.adjustments.length !== 1 ||
          pass.adjustments[0]!.column !== 0 ||
          pass.adjustments[0]!.reason !== "above-own" ||
          pass.adjustments[0]!.lower !== null
        )
          failures.push(
            name + ": non-above-own branch or changed pass at " + index,
          );
        if (
          pass.own.length !== count ||
          pass.own.some(
            (
              target: IAutoMovieConstructionSplitBandTrace.Target,
              k: number,
            ): boolean =>
              target.kind !== "finite" ||
              !nclose(target.value, k === 0 ? -eta : 0, tolerance),
          )
        )
          failures.push(name + ": admitted log targets changed at " + index);
        if (
          pass.field.length !== count ||
          pass.field.some(
            (value: number): boolean => !(value > 0 && value <= 1),
          )
        )
          failures.push(name + ": invalid Gaussian field at " + index);
      }
    } else {
      const first:
        | Extract<
            IAutoMovieConstructionSplitBandTrace.Event,
            { kind: "local-pass" }
          >
        | undefined = passes[0];
      if (
        passes.length !== 1 ||
        first === undefined ||
        first.pass !== 0 ||
        !first.settled ||
        first.adjustments.length !== 0 ||
        !first.field.every((value: number): boolean => value === 1) ||
        !first.smooth.every((value: number): boolean => value === 0)
      )
        failures.push(
          name + ": adjacent normal case lost its settled unit field",
        );
      if (certificates.length !== 0)
        failures.push(
          name + ": settled prefix entered the new minorant policy",
        );
    }

    if (typeof result === "string") continue;
    if (
      !nclose(result.length, 1, tolerance) ||
      result.scale.backward.length !== 0
    )
      failures.push(name + ": physical span or backward ownership changed");
    const factors: number[] = [];
    for (let k: number = 0; k < count; ++k) {
      const phase: number = (2 * Math.PI * k) / count;
      const start: IAutoMovieSolidSurface.IJet = result.surface.jet(0, phase);
      const end: IAutoMovieSolidSurface.IJet = result.surface.jet(
        result.length,
        phase,
      );
      const factor: number = start.u[1];
      factors.push(factor);
      if (!(factor > 0 && factor <= (curved && k === 0 ? cap : 1) + tolerance))
        failures.push(name + ": published analytic factor cap failed at " + k);
      if (
        !close(start.p, loop[k]!) ||
        !close(end.p, [loop[k]![0], 1, loop[k]![2]]) ||
        !close(start.u, [0, factor, 0]) ||
        !close(end.u, [0, factor, 0]) ||
        !close(start.uu, [
          0,
          curved && k === 0 ? -bend * factor * factor : 0,
          0,
        ]) ||
        !close(end.uu, zero)
      )
        failures.push(name + ": published physical rail jets failed at " + k);

      // These scalar controls follow directly from the analytic host and
      // endpoint Hermite equations, independently of the engine predicate.
      const projected: number[] = [
        0,
        factor / 5,
        (2 * factor -
          (curved && k === 0 ? Math.exp(eta) : 0) * factor * factor) /
          5,
        1 - (2 * factor) / 5,
        1 - factor / 5,
        1,
      ];
      if (
        !projected.every(
          (value: number, index: number): boolean =>
            index === 0 || value + tolerance >= projected[index - 1]!,
        )
      )
        failures.push(
          name + ": analytic projected controls go backward at " + k,
        );
    }
    if (curved && last !== undefined) {
      const alpha: number = factors[0]! / last.field[0]!;
      const certificate:
        | Extract<
            IAutoMovieConstructionSplitBandTrace.Event,
            { kind: "minorant" }
          >["result"]
        | undefined = certificates[0]?.result;
      if (
        !(alpha > 0 && alpha < 1) ||
        !nclose(factors[0]!, cap, tolerance) ||
        !(factors[count / 2]! - factors[0]! > eta / 2)
      )
        failures.push(name + ": missing bounded nonconstant attenuation");
      if (
        !factors.every((value: number, k: number): boolean =>
          nclose(value, alpha * last.field[k]!, tolerance),
        )
      )
        failures.push(
          name + ": publication changed the last field by a nonuniform ratio",
        );
      if (
        certificate?.kind !== "accepted" ||
        !nclose(certificate.alpha, alpha, tolerance) ||
        certificate.field.length !== count ||
        !certificate.field.every(
          (value: number, k: number): boolean =>
            nclose(value, factors[k]!, tolerance) &&
            value > 0 &&
            value <= prepared.factors[k]!,
        ) ||
        certificate.limitingIndices.length !== 1 ||
        certificate.limitingIndices[0] !== 0
      )
        failures.push(
          name +
            ": actual certificate differs from the published independently checked field",
        );
    } else if (!curved) {
      for (const station of [0, 0.5, 1])
        for (const k of [0, count / 4, count / 2, (3 * count) / 4]) {
          const phase: number = (2 * Math.PI * k) / count;
          const jet: IAutoMovieSolidSurface.IJet = result.surface.jet(
            station,
            phase,
          );
          if (
            !close(jet.p, [Math.cos(phase), station, Math.sin(phase)]) ||
            !close(jet.u, [0, 1, 0]) ||
            !close(jet.uu, zero)
          )
            failures.push(
              name +
                ": normal analytic cylinder changed at " +
                station +
                "/" +
                k,
            );
        }
    }
  }
  const backward: ReturnType<typeof checkConstructionLocalScaleBackwardZero> =
    checkConstructionLocalScaleBackwardZero({
      loop,
      cylinder,
      cap,
      bend,
      tolerance,
    });
  failures.push(...backward.failures);
  evidence.push(...backward.evidence);
  TestValidator.predicate(
    failures.join("\n") + "\n" + evidence.join("\n"),
    failures.length === 0,
  );
}
