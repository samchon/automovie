import { nclose } from "../../internal/nclose";
import {
  AutoMovieEngineLoftViewFullSource as Full,
  AutoMovieEngineViewAxis,
} from "@automovie/engine";
import { AutoMovieHumanF1NativeRootLaw as Root } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanF1NativeRoot,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A finite source-domain bracket must not query past its literal endpoint.
 *
 * Scenarios:
 * 1. Complete synthetic cylinders and ellipses retain their original controls
 *    under unit inputs, including source endpoints at nonzero stations.
 * 2. Opposite chart rays have a regular required root strictly between radial
 *    shares 1 and 2. The old computed lower/upper endpoint lies outside the
 *    closed source by 5.684e-14 mm, despite the interior solution.
 * 3. Literal endpoints remain valid; genuinely outside queries still refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Root.calibrate/prepare.resolve and the real full native source on eight-control synthetic definitions, with no person, loft, mesh or reference.
 * @evidence contracts/development/testing.md#independent-expectations A unit cylinder has x²+z²=1. The explicit child frame and calipers give F=((q*cos(c)+lambda-1)/lambda)²+(sin(.01*q*sin(c))/.01)². At the selected ray F(1)<rho<F(2), with both derivative terms positive on (1,2), independently fixing an interior regular root.
 * @evidence contracts/development/common.md#meaningful-documentation Synthetic cylinders and ellipses distinguish literal controls, an interior regular root on opposite rays, valid endpoints and exterior queries.
 */
export function test_human_native_root_domain(): void {
  const failures: string[] = [];
  const close: (label: string, actual: number, expected: number) => void = (
    label: string, actual: number, expected: number,
  ): void => {
    if (!nclose(actual, expected, 1e-8))
      failures.push(label + ": " + actual + " vs " + expected);
  };
  const scenario: (label: string, work: () => void) => void = (
    label: string, work: () => void,
  ): void => {
    try { work(); }
    catch (error: unknown) {
      failures.push(label + ": " + (error instanceof Error ? error.message : String(error)));
    }
  };
  const rejects: (label: string, work: () => unknown) => void = (
    label: string, work: () => unknown,
  ): void => {
    try { work(); failures.push(label + ": outside native domain accepted"); }
    catch { /* The declared source domain remains strict. */ }
  };
  const count: number = 8;
  const phaseSemi: number = 0.01;
  const breadth: number = 0.01;
  const cases: readonly {
    name: string; centre: number; domain: readonly [number, number];
    semiMetres: number; scale: number; column: number;
  }[] = [
    {
      name: "negative ray at nonzero lower endpoint",
      centre: 484.4745946734332, domain: [28, 918.88],
      semiMetres: 0.07686205008353103, scale: 1.5, column: 3,
    },
    {
      name: "positive ray at nonzero upper endpoint",
      centre: -484.4745946734332, domain: [-918.88, -28],
      semiMetres: 0.07686205008353102, scale: 0.75, column: 1,
    },
  ];
  for (const entry of cases)
    scenario(entry.name, (): void => {
      const a: number = entry.semiMetres * 1000;
      const parent: IAutoMovieViewPart = ellipse(
        "made-domain-parent", 1, 1, entry.domain, AutoMovieEngineViewAxis.horizontal(),
      );
      const child: IAutoMovieViewPart = ellipse(
        "made-domain-child", a, breadth, [0, 1],
        AutoMovieEngineViewAxis.straight([2, entry.centre, 0], [0, 1, 0], [0, 0, 1]),
      );
      const loop: IAutoMovieConstructionPortLoop = {
        centre: { station: entry.centre / 1000, phase: 0 },
        semi: {
          stationMetres: entry.semiMetres,
          phaseRadians: phaseSemi,
        },
        sense: 1,
        shape: Array.from({ length: count }, (): number => 1),
      };
      const original: IAutoMovieHumanF1NativeRoot.ICalibration = Root.calibrate({
        name: "made-domain", parent, child, loop, rails: [0.5], count,
        correspondence: "angle",
        metric: { station: 0.5, depth: 2 * a, breadth: 2 * breadth },
        basis: child.axis.at(0.5),
      });
      const source: IAutoMovieLoftViewFullSource.IReader = Full.create(parent);
      close("literal lower station", source.point(entry.domain[0], 0)[1], entry.domain[0]);
      close("literal upper station", source.point(entry.domain[1], 0)[1], entry.domain[1]);
      rejects("below actual domain", (): AutoMovieVector3Tuple => source.point(entry.domain[0] - 1, 0));
      rejects("above actual domain", (): AutoMovieVector3Tuple => source.point(entry.domain[1] + 1, 0));
      const held: IAutoMovieHumanF1NativeRoot.IRootSpec = Root.prepare(original, parent, [1, 1]).resolve(child);
      if (held.loop !== loop) failures.push(entry.name + ": original loop was replaced");
      held.rows.forEach((row: IAutoMovieHumanF1NativeRoot.IRootRow): void => {
        if (!Object.is(row.level.share, 1)) failures.push("original share was changed");
      });

      const prepared: IAutoMovieHumanF1NativeRoot.IPrepared = Root.prepare(original, parent, [entry.scale, 1]);
      const candidate: IAutoMovieViewPart = ellipse(
        child.name, a * entry.scale, breadth, [0, 1], prepared.axis,
      );
      const made: IAutoMovieHumanF1NativeRoot.IRootSpec = prepared.resolve(candidate);
      const row: IAutoMovieHumanF1NativeRoot.IRootRow = made.rows[entry.column]!;
      const c: number = 2 * Math.PI * entry.column / count;
      const q: number = row.level.share;
      if (!(q > 1 && q < 2))
        failures.push(entry.name + ": selected root is not the independent interior branch: " + q);
      const p: AutoMovieVector3Tuple = row.actualParent;
      close("actual unit cylinder", p[0] * p[0] + p[2] * p[2], 1);
      close("actual native station", row.parentAddress[0], p[1]);
      const centre: number = entry.centre + (1 - entry.scale) * a;
      const actual: number = ((p[1] - centre) / (a * entry.scale)) ** 2 +
        (p[2] / breadth) ** 2;
      const expected: number = Math.cos(c) ** 2 +
        (Math.sin(phaseSemi * Math.sin(c)) / breadth) ** 2;
      close("independent source level", actual, expected);
      const derivative: number =
        2 * (q * Math.cos(c) + entry.scale - 1) * Math.cos(c) / entry.scale ** 2 +
        2 * Math.sin(phaseSemi * q * Math.sin(c)) *
          Math.cos(phaseSemi * q * Math.sin(c)) * phaseSemi * Math.sin(c) / breadth ** 2;
      if (!(derivative > 0)) failures.push("independent final root derivative is not positive");
      close("actual final level derivative", row.level.derivative!, derivative);
      if (!(row.parentAddress[0] >= entry.domain[0] && row.parentAddress[0] <= entry.domain[1]))
        failures.push("emitted source address left its literal domain");
    });
  TestValidator.predicate("actual native source-domain roots: " + failures.join(" | "), failures.length === 0);
}

/** Constant exact ellipse originals with regular physical2 throughout a closed domain. */
function ellipse(
  name: string, depth: number, breadth: number, domain: readonly [number, number],
  axis: IAutoMovieViewAxis.IAxis,
): IAutoMovieViewPart {
  const outline: (value: number) => IAutoMovieViewPart.IOutline = (
    value: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [{ station: domain[0], value, site: "first" }, { station: domain[1], value, site: "last" }],
  });
  const shoulder: IAutoMovieViewPart.IOutline = outline(Math.SQRT2 - 1);
  return {
    name, axis, stations: [...domain], order: 8, samples: 8,
    front: { positive: outline(depth), negative: outline(-depth) },
    side: { positive: outline(breadth), negative: outline(-breadth) },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] },
  };
}
