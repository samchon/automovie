import {
  AutoMovieConicFieldJet,
  AutoMovieConicHermite,
  AutoMovieViewConic,
  AutoMovieViewSectionField,
} from "@automovie/engine";
import type {
  IAutoMovieConicFieldJet,
  IAutoMovieViewConic,
  IAutoMovieViewSectionField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionConicFieldOracle } from "../../../internal/construction/ConstructionConicFieldOracle";
import { nclose } from "../../../internal/predicates";

type Scalar = IAutoMovieViewSectionField.IStationJet;

/**
 * `AutoMovieViewSectionField.prepare` prepares a section field from four
 * station values and shoulders (each with its first two derivatives) without
 * changing it from the generic composition `AutoMovieViewConic` offers.
 *
 * Fixtures: extents (3, 2, 3, 2) times a scale (0.001, 1 or 1000) with
 * shoulders sqrt 2 - 1 (an exact ellipse), and extents (3, 2, 4, 1) with
 * shoulders 0.2, 0.4, 0.6, 0.3 and derivatives 0.01 and -0.02 (asymmetric, with
 * active G2 ends); each extent v has derivatives v / 5 and -v / 7.
 *
 * Scenarios:
 *
 * 1. The prepared source and geometry equal those of the generic composition
 *    (`prepareGeometry` over `curvatures`, then `primal`) in every number
 *    within 1e-12 of its size, and the asymmetric case has at least one active
 *    G2 end.
 * 2. The ellipse's radial reading at 0, 0.13, pi / 4, pi / 2, -0.17 and 2 pi +
 *    0.13 equals the independent implicit ellipse's within 1e-7 times the scale
 *    plus 256 epsilon of its size.
 * 3. Two preparations share no output record; a copy whose quarter extents are
 *    overwritten is refused by `read` (a failure record).
 * 4. A callback's original thrown value (an Error, or undefined) passes through
 *    `AutoMovieViewConic.curvatures` unchanged; a nonpositive shared curvature
 *    is refused before any end arithmetic; equal own and shared curvature
 *    create no replacement end; the second end is evaluated (four divisions)
 *    before the first end's refusal "quarter 0: G2 conic end needs" is
 *    reported.
 * 5. Empty and malformed stations, shoulders 0 and 1, and unrepresentable
 *    curvature arithmetic (extents 1e308 and 1e-308) are refused.
 */
export function test_unit_engine_geometry_conic_preparation(): void {
  const inputs = (
    scale: number,
    ellipse: boolean,
  ): { e: Scalar[]; r: Scalar[] } => ({
    e: (ellipse ? [3, 2, 3, 2] : [3, 2, 4, 1]).map(
      (value: number): Scalar => [
        scale * value,
        (scale * value) / 5,
        (-scale * value) / 7,
      ],
    ),
    r: (ellipse
      ? [Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1]
      : [0.2, 0.4, 0.6, 0.3]
    ).map(
      (value: number): Scalar => [
        value,
        ellipse ? 0 : 0.01,
        ellipse ? 0 : -0.02,
      ],
    ),
  });
  const made = (
    e: readonly Scalar[],
    r: readonly Scalar[],
  ): IAutoMovieViewSectionField.IPrepared => {
    const result = AutoMovieViewSectionField.prepare(e, r);
    if (result.kind === "failure") throw new Error(result.detail);
    return result;
  };
  const near = (a: unknown, b: unknown): boolean => {
    if (typeof a === "number" && typeof b === "number")
      return nclose(a, b, 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)));
    if (
      a === null ||
      b === null ||
      typeof a !== "object" ||
      typeof b !== "object"
    )
      return a === b;
    const keys: string[] = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every(
        (key: string): boolean =>
          Object.hasOwn(b, key) &&
          near(Reflect.get(a, key), Reflect.get(b, key)),
      )
    );
  };

  for (const scale of [0.001, 1, 1000])
    for (const ellipse of [true, false]) {
      const label: string = `scale ${scale} ellipse ${ellipse}`;
      const { e, r } = inputs(scale, ellipse);
      const at: IAutoMovieViewSectionField.IPrepared = made(e, r);
      const ee: IAutoMovieConicFieldJet.IJet[] = e.map(
        AutoMovieConicFieldJet.fromStation,
      );
      const rr: IAutoMovieConicFieldJet.IJet[] = r.map(
        AutoMovieConicFieldJet.fromStation,
      );
      const expected: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet> =
        AutoMovieViewConic.prepareGeometry(
          AutoMovieConicFieldJet.AD,
          ee,
          rr,
          AutoMovieViewConic.curvatures(AutoMovieConicFieldJet.AD, ee, rr),
        );
      TestValidator.predicate(`${label} source`, near(at.source, expected));
      TestValidator.predicate(
        `${label} geometry`,
        near(
          at.geometry,
          AutoMovieViewConic.primal(AutoMovieConicFieldJet.AD, expected),
        ),
      );
      if (!ellipse)
        TestValidator.predicate(
          `${label} active G2 end`,
          at.source.quarters.some(
            (
              quarter: IAutoMovieViewConic.IQuarter<IAutoMovieConicFieldJet.IJet>,
            ): boolean => quarter.start !== null || quarter.end !== null,
          ),
        );
      if (ellipse)
        for (const phi of [
          0,
          0.13,
          Math.PI / 4,
          Math.PI / 2,
          -0.17,
          2 * Math.PI + 0.13,
        ]) {
          const value = AutoMovieViewSectionField.read(at, phi);
          if ("kind" in value)
            throw new Error(`${label}: no radial reading at ${phi}`);
          const target: readonly number[] =
            ConstructionConicFieldOracle.ellipse(e[0]!, e[1]!, phi);
          value.forEach((entry: number, i: number): void => {
            TestValidator.predicate(
              `${label} ellipse ${phi} component ${i}`,
              nclose(
                entry,
                target[i]!,
                1e-7 * scale + 256 * Number.EPSILON * Math.abs(target[i]!),
              ),
            );
          });
        }
      const again: IAutoMovieViewSectionField.IPrepared = made(e, r);
      TestValidator.predicate(
        `${label} fresh source`,
        again.source !== at.source,
      );
      TestValidator.predicate(
        `${label} fresh quarters`,
        again.source.quarters[0] !== at.source.quarters[0],
      );
      const copy: IAutoMovieViewSectionField.IPrepared = structuredClone(at);
      copy.geometry.quarters[0]!.extents = [99, 99];
      TestValidator.predicate(
        `${label} changed copy refused`,
        "kind" in AutoMovieViewSectionField.read(copy, 0),
      );
      TestValidator.predicate(
        `${label} another preparation unchanged`,
        near(at, again),
      );
    }

  const ops: IAutoMovieConicFieldJet.IAlgebra<number> = {
    ...AutoMovieConicFieldJet.NUMBER,
  };
  const originals: unknown[] = [new Error("owned algebra failure"), undefined];
  originals.forEach((original: unknown, i: number): void => {
    let caught: unknown = "none";
    try {
      AutoMovieViewConic.curvatures(
        {
          ...ops,
          value: (_value: number): number => {
            throw original;
          },
        },
        [1, 2, 3, 4],
        [0.5, 0.5, 0.5, 0.5],
      );
    } catch (error: unknown) {
      caught = error;
    }
    TestValidator.predicate(
      `original failure ${i} unchanged`,
      caught === original,
    );
  });
  const refuseArithmetic: IAutoMovieConicFieldJet.IAlgebra<number> = {
    ...ops,
    divide: (_a: number, _b: number): number => {
      throw new Error("End arithmetic must not precede admission");
    },
  };
  TestValidator.predicate(
    "nonpositive shared curvature refused",
    AutoMovieViewConic.prepareGeometry(
      refuseArithmetic,
      [1, 2, 3, 4],
      [0.5, 0.5, 0.5, 0.5],
      [0, 1, 1, 1],
    ).failure !== null,
  );
  TestValidator.equals(
    "equal curvature creates no end",
    AutoMovieConicHermite.prepare(ops, 2, 3, 0.5, 1 / 9),
    null,
  );
  let divisions: number = 0;
  const refused: IAutoMovieViewConic.ICurve =
    AutoMovieViewConic.prepareGeometry(
      {
        ...ops,
        divide: (a: number, b: number): number => {
          divisions++;
          return a / b;
        },
      },
      [1, 2, 3, 4],
      [0.5, 0.5, 0.5, 0.5],
      [1000, 1000, 1000, 1000],
    );
  TestValidator.equals("both ends evaluated", divisions, 4);
  TestValidator.predicate(
    "first end named",
    refused.failure?.startsWith("quarter 0: G2 conic end needs") === true,
  );

  const { e, r } = inputs(1, true);
  const malformed: Scalar[][] = [[], [[0, 0, 0], ...e.slice(1)]];
  for (const bad of malformed)
    TestValidator.equals(
      "malformed stations",
      AutoMovieViewSectionField.prepare(bad, r).kind,
      "failure",
    );
  for (const value of [0, 1])
    TestValidator.equals(
      `shoulder ${value}`,
      AutoMovieViewSectionField.prepare(
        e,
        r.map((): Scalar => [value, 0, 0]),
      ).kind,
      "failure",
    );
  const huge: Scalar[] = [1e308, 1e-308, 1e308, 1e-308].map(
    (value: number): Scalar => [value, 0, 0],
  );
  TestValidator.equals(
    "unrepresentable curvature",
    AutoMovieViewSectionField.prepare(huge, r).kind,
    "failure",
  );
}
