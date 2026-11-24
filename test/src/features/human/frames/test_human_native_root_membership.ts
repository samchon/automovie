import { nclose } from "../../internal/nclose";
import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieViewAxis,
} from "@automovie/engine";
import { AutoMovieHumanNativeRootLaw as Root } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanNativeRoot,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A parent root cut belongs to the actual curved source, with independent calipers.
 *
 * Scenarios:
 * 1. Zero change borrows original loop/rail/clock controls on complete native
 *    cylinder and ellipse definitions, without another identity admission.
 * 2. Doubling only the child's breadth retains its literal depth and doubles
 *    the actual source breadth, measured on the declared section axes.
 * 3. On the radius-10 cylinder, at the breadth-facing root column the original
 *    z is -10 sin(.3). Preserving the original normalized elliptic radius
 *    after breadth doubles requires z=-20 sin(.3), y=0 and the positive-x
 *    cylinder branch x=sqrt(100-z²). A raw angle of an off-cylinder target
 *    does not solve that geometric intersection.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the existing calibrate/prepare/resolve public source law and the complete native Point0 reader on small made definitions; no person, loft, mesh or reference is built.
 * @evidence contracts/development/testing.md#independent-expectations The cylinder equation x²+z²=100 and the normalized ellipse equation give the changed boundary point in closed form. Literal controls are checked with Object.is; source calipers come from independent opposite guide readings.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes unit-input identity, an actual anisotropic ellipse, a curved parent that rejects off-surface affine projection, and positive-hemisphere branch/clock counterparts. The old world-target and a correct source intersection give different z and x here.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU source unit discovered as human_native_root_membership. The supervisor runs the combined RED after its one type-check watch; this test starts no process and consumes no saved body.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios, source mm/radian units, literal-control scope and the independent curved-surface oracle. This is an engineering root-law contract, not clinical measurement evidence.
 */
export function test_human_native_root_membership(): void {
  const failures: string[] = [];
  const close: (name: string, actual: number, expected: number) => void = (
    name: string,
    actual: number,
    expected: number,
  ): void => {
    if (!nclose(actual, expected, 1e-9))
      failures.push(name + ": " + actual + " vs " + expected);
  };
  const exact: (name: string, actual: number, expected: number) => void = (
    name: string,
    actual: number,
    expected: number,
  ): void => {
    if (!Object.is(actual, expected))
      failures.push(name + ": " + actual + " vs literal " + expected);
  };
  const scenario: (name: string, work: () => void) => void = (
    name: string,
    work: () => void,
  ): void => {
    try {
      work();
    } catch (error: unknown) {
      failures.push(name + ": " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const count: number = 16;
  const parent: IAutoMovieViewPart = ellipse(
    "made-parent",
    10,
    10,
    [-2, 2],
    AutoMovieViewAxis.horizontal(),
  );
  const child: IAutoMovieViewPart = ellipse(
    "made-child",
    1,
    3,
    [0, 4],
    AutoMovieViewAxis.straight([10, 0, 0], [0, 1, 0], [0, 0, -1]),
  );
  const loop: IAutoMovieConstructionPortLoop = {
    centre: [0, 0],
    semi: [0.001, 0.3],
    sense: -1,
    shape: Array.from({ length: count }, (): number => 1),
  };
  const original: IAutoMovieHumanNativeRoot.ICalibration = Root.calibrate({
    name: "made-cylinder-ellipse",
    parent,
    child,
    loop,
    rails: [1],
    count,
    correspondence: "angle",
    metric: { station: 1, depth: 2, breadth: 6 },
    basis: child.axis.at(1),
  });

  scenario("unchanged original controls and clock", (): void => {
    const same: IAutoMovieHumanNativeRoot.IRootSpec = Root.prepare(original, parent, [1, 1]).resolve(child);
    if (same.loop !== loop) failures.push("unchanged loop was replaced");
    exact("unchanged rail length", same.railStations.length, 1);
    exact("unchanged rail station", same.railStations[0]!, 1);
    same.rows.forEach((row: IAutoMovieHumanNativeRoot.IRootRow, k: number): void => {
      exact("original clock " + k, row.sourceClock, (2 * Math.PI * k) / count);
      exact("original child phase " + k, row.targetChildAddress[1], original.childPhases[k]!);
      row.actualParent.forEach((value: number, axis: number): void =>
        exact("original parent control " + k + "/" + axis, value, original.parent[k]![axis]!),
      );
    });
  });

  scenario("actual calipers and curved parent membership", (): void => {
    const prepared: IAutoMovieHumanNativeRoot.IPrepared = Root.prepare(original, parent, [1, 2]);
    const candidate: IAutoMovieViewPart = ellipse(
      "made-child",
      1,
      6,
      [0, 4],
      prepared.axis,
    );
    const source: IAutoMovieLoftViewFullSource.IReader = Full.create(candidate);
    const up: AutoMovieVector3Tuple = source.point(1, 0);
    const down: AutoMovieVector3Tuple = source.point(1, Math.PI);
    const side: AutoMovieVector3Tuple = source.point(1, Math.PI / 2);
    const twin: AutoMovieVector3Tuple = source.point(1, (3 * Math.PI) / 2);
    close("independent source depth", up[1] - down[1], 2);
    close("independent source breadth", twin[2] - side[2], 12);

    const made: IAutoMovieHumanNativeRoot.IRootSpec = prepared.resolve(candidate);
    const row: IAutoMovieHumanNativeRoot.IRootRow = made.rows[count / 4]!;
    const z: number = -20 * Math.sin(0.3);
    const x: number = Math.sqrt(100 - z * z);
    close("actual parent stays on cylinder", row.actualParent[0] ** 2 + row.actualParent[2] ** 2, 100);
    close("breadth-facing source clock", row.sourceClock, Math.PI / 2);
    close("source cut x", row.actualParent[0], x);
    close("source cut y", row.actualParent[1], 0);
    close("source cut z", row.actualParent[2], z);

    // This point's field value is dimensionless. It is distinct from the
    // source's mm/radian physical2 or an operator's normalized cross jet.
    const actualLevel: number =
      row.actualParent[1] ** 2 + (row.actualParent[2] / 6) ** 2;
    const originalLevel: number = (10 * Math.sin(0.3) / 3) ** 2;
    close("actual source preserves original root level", actualLevel, originalLevel);
  });

  TestValidator.predicate(
    "native root source membership: " + failures.join(" | "),
    failures.length === 0,
  );
}

/** Complete constant ellipse originals; the four rational conic quarters have ellipse fullness. */
function ellipse(
  name: string,
  depth: number,
  breadth: number,
  domain: readonly [number, number],
  axis: IAutoMovieViewAxis.IAxis,
): IAutoMovieViewPart {
  const outline: (value: number) => IAutoMovieViewPart.IOutline = (
    value: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { station: domain[0], value, site: "first" },
      { station: domain[1], value, site: "last" },
    ],
  });
  const shoulder: IAutoMovieViewPart.IOutline = outline(Math.SQRT2 - 1);
  return {
    name,
    axis,
    stations: [...domain],
    order: 8,
    samples: 8,
    front: { positive: outline(depth), negative: outline(-depth) },
    side: { positive: outline(breadth), negative: outline(-breadth) },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] },
  };
}
