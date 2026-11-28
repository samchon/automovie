import { nclose } from "../../internal/nclose";
import { AutoMovieEngineViewAxis } from "@automovie/engine";
import { AutoMovieHumanF1NativeRootLaw as Root } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanF1NativeRoot,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Original controls survive native root transport without a new identity solve.
 *
 * Scenarios:
 * 1. Unit calipers retain a literal wall and a held child. A one-ulp carry
 *    beside a much larger parent retains the small child's literal offset.
 * 2. Actual complete circle descriptors calibrate through the existing angle
 *    correspondence. Their unchanged clocks, rail, seed shares and phase stay
 *    literal controls even when a new interpolated phase graph would refuse.
 * 3. Final physical source2 retains a cylinder's unit station derivative and
 *    zero station bend; target clock2 remains a distinct periodic curve jet.
 * 4. The candidate axis owns physical2 and its root/angle parameter conversion;
 *    absent original axis2 remains unavailable rather than being invented.
 * 5. Uniform increasing/decreasing clocks and a rotated radial graph have
 *    closed inverses; reversed, nonfinite and nonmonotone graphs refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls targets, actual calibrate/prepare/resolve/seed/inspect, phaseCurve and reclock on complete in-memory native descriptors. All scenario failures are collected before one verdict, without a chain, person or renderer.
 * @evidence contracts/development/testing.md#independent-expectations Unit calipers require literal wall identity; a held wall retains its literal child, and the binary64 ulp at 1e20 is 16384, so adding that carry to child 1 gives literal 16385. These are generic Float64 control contracts, not physical measurements. Unchanged seed/source clocks are original controls, checked with Object.is. Circle derivatives, s=1+q^2, s=1+3*sin(q/2)^2, and a rotated constant-radius ellipse give the other closed expectations; no finite differences or copied implementation supplies an oracle.
 * @evidence contracts/development/common.md#meaningful-documentation The tests distinguish exact wall and child controls, finite cancellation, source-parameter conversion, final physical derivatives and forward or reverse clock direction.
 */
export function test_human_native_root_transport(): void {
  const failures: string[] = [];
  const close: (
    label: string,
    actual: readonly number[],
    expected: readonly number[],
  ) => void = (
    label: string,
    actual: readonly number[],
    expected: readonly number[],
  ): void => {
    if (
      actual.length !== expected.length ||
      actual.some(
        (value: number, k: number): boolean =>
          !nclose(value, expected[k]!, 1e-10),
      )
    )
      failures.push(
        label +
          ": " +
          JSON.stringify(actual) +
          " vs " +
          JSON.stringify(expected),
      );
  };
  const exact: (label: string, actual: number, expected: number) => void = (
    label: string,
    actual: number,
    expected: number,
  ): void => {
    if (!Object.is(actual, expected))
      failures.push(label + ": " + actual + " vs literal " + expected);
  };
  const scenario: (label: string, work: () => void) => void = (
    label: string,
    work: () => void,
  ): void => {
    try {
      work();
    } catch (error: unknown) {
      failures.push(
        label + ": " + (error instanceof Error ? error.message : String(error)),
      );
    }
  };
  const refuses: (label: string, work: () => unknown) => void = (
    label: string,
    work: () => unknown,
  ): void => {
    try {
      work();
      failures.push(label + ": unsupported graph/capability accepted");
    } catch {
      /* This input is outside its declared graph/capability. */
    }
  };
  const turn: number = 2 * Math.PI;
  const parent: IAutoMovieViewPart = circle(
    "parent",
    2,
    AutoMovieEngineViewAxis.straight([0, 0, 0], [1, 0, 0], [0, 0, 1]),
  );
  const child: IAutoMovieViewPart = circle(
    "child",
    0.2,
    AutoMovieEngineViewAxis.straight([4, 1.81, 0], [0, 1, 0], [0, 0, 1]),
  );
  const basis: IAutoMovieLoftSectionFrame = child.axis.at(2);
  const loop: IAutoMovieConstructionPortLoop = {
    centre: { station: 0.002, phase: 0 },
    semi: { stationMetres: 0.0002, phaseRadians: 0.01 },
    sense: 1,
  };

  scenario("literal and conditioned root targets", (): void => {
    // These finite Float64 controls isolate a sum's conditioning. They are
    // not observations of an anatomical distance or a supported body size.
    const cases: readonly {
      name: string;
      parent: number;
      wall: number;
      child: number;
      expectedChild: number;
    }[] = [
      {
        name: "tiny wall",
        parent: 1,
        wall: 1e-20,
        child: 1,
        expectedChild: 1e-20,
      },
      {
        name: "held small child",
        parent: 1e20,
        wall: 1e20,
        child: 1,
        expectedChild: 1,
      },
      {
        name: "positive one-ulp carry",
        parent: 1e20,
        wall: 1e20 + 16384,
        child: 1,
        expectedChild: 16385,
      },
      {
        name: "negative one-ulp carry",
        parent: -1e20,
        wall: -1e20 - 16384,
        child: -1,
        expectedChild: -16385,
      },
      {
        name: "representable subnormal",
        parent: 0,
        wall: Number.MIN_VALUE,
        child: 0,
        expectedChild: Number.MIN_VALUE,
      },
    ];
    for (const row of cases) {
      const wall: AutoMovieVector3Tuple = [row.wall, 0, 0];
      const result: IAutoMovieHumanF1NativeRoot.ICurves = Root.targets({
        parent: [[row.parent, 0, 0]],
        child: [[row.child, 0, 0]],
        wall: [wall],
        basis,
        scale: [1, 1],
      });
      for (let axis: number = 0; axis < 3; ++axis)
        exact(
          row.name + " unit-caliper parent wall axis " + axis,
          result.parent[0]![axis]!,
          wall[axis]!,
        );
      exact(row.name + " child target", result.child[0]![0], row.expectedChild);
    }
  });

  scenario("actual original transport", (): void => {
    const original: IAutoMovieHumanF1NativeRoot.ICalibration = Root.calibrate({
      name: "made-offset-circles",
      parent,
      child,
      loop,
      rails: [2],
      count: 4,
      correspondence: "angle",
      metric: { station: 2, depth: 0.4, breadth: 0.4 },
      basis,
    });

    // The loop is seen about y=1.81 in the child's own yz plane. Its four
    // angles are 0, epsilon, pi, 2pi-epsilon, with epsilon<pi/6. The new
    // periodic cubic's derivative at zero is -1/2+3*epsilon/pi<0, although
    // the actual original operator's discrete clock advances strictly once.
    const epsilon: number = Math.atan2(2 * Math.sin(0.01), 0.19);
    close("existing original angle correspondence", original.childPhases, [
      0,
      epsilon,
      Math.PI,
      turn - epsilon,
    ]);
    refuses("new cubic is stricter than original clock", (): unknown =>
      Root.phaseCurve(
        original.childPhases.map((phase: number): [number, number] => [
          2,
          phase,
        ]),
        1,
        "made stricter graph",
      ),
    );
    const prepared: IAutoMovieHumanF1NativeRoot.IPrepared = Root.prepare(original, parent, [1, 1]);
    if (prepared.axis !== child.axis)
      failures.push("unchanged candidate replaced its original course");
    const root: IAutoMovieHumanF1NativeRoot.IRootSpec = prepared.resolve(child);
    if (root.loop !== loop)
      failures.push("unchanged root replaced its original radial controls");
    exact("unchanged rail station", root.railStations[0]!, 2);
    for (let k: number = 0; k < 4; ++k)
      exact(
        "borrowed original source clock " + k,
        root.rows[k]!.sourceClock,
        (turn * k) / 4,
      );
    const seed: IAutoMovieHumanF1NativeRoot.ISeed = { phase: 0.17, from: 0.1, to: 0.9 };
    const transported: IAutoMovieHumanF1NativeRoot.ISeedTransport = root.seed(child, child, seed);
    exact("unchanged seed phase", transported.seed.phase, seed.phase);
    exact("unchanged seed from", transported.seed.from, seed.from);
    exact("unchanged seed to", transported.seed.to, seed.to);
    for (const control of transported.controls)
      close("unchanged seed physical residual", control.residual, [0, 0, 0]);

    const inspection: readonly IAutoMovieHumanF1NativeRoot.IInspection[] = root.inspect(child);
    if (inspection.length !== 4)
      failures.push("actual source2 inspection lost a column");
    for (const row of inspection) {
      if ("unavailable" in row) {
        failures.push("actual source2 unavailable: " + row.unavailable);
        continue;
      }
      close(
        "candidate physical station derivative",
        row.physicalCandidate2.u,
        [-1, 0, 0],
      );
      close(
        "final physical station derivative",
        row.physicalFinal2.u,
        [-1, 0, 0],
      );
      close("final physical station bend", row.physicalFinal2.uu, [0, 0, 0]);
      close(
        "target clock runs in the yz plane",
        [row.targetClock2.child.first[0], row.targetClock2.child.second[0]],
        [0, 0],
      );
    }
  });

  scenario("candidate physical axis2", (): void => {
    const original: IAutoMovieHumanF1NativeRoot.ICalibration = Root.calibrate({
      name: "made-axis",
      parent,
      child,
      loop,
      rails: [2],
      count: 4,
      correspondence: "angle",
      metric: { station: 2, depth: 0.4, breadth: 0.4 },
      basis,
    });
    const axis: IAutoMovieViewAxis.IAxis = Root.prepare(
      original,
      parent,
      [2, 3],
    ).axis;
    close("affine candidate origin", axis.at(2).origin, [2, 1.42, 0]);
    const physical: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(2) ?? null;
    const root: IAutoMovieViewAxisJet.IJet | null =
      axis.jet?.(2, { type: "root", pole: 1, end: "bottom" }) ?? null;
    const angle: IAutoMovieViewAxisJet.IJet | null =
      axis.jet?.(2, { type: "angle", bottom: 1, top: 4 }) ?? null;
    if (physical === null || root === null || angle === null)
      failures.push("candidate lost available physical/root/angle axis2");
    else {
      close("physical origin1", physical.first.origin, [-1, 0, 0]);
      close("physical origin2", physical.second.origin, [0, 0, 0]);
      close("root-coordinate origin1", root.first.origin, [-2, 0, 0]);
      close("root-coordinate origin2", root.second.origin, [-2, 0, 0]);
      close("angle-coordinate origin1", angle.first.origin, [
        -Math.SQRT2,
        0,
        0,
      ]);
      close("angle-coordinate origin2", angle.second.origin, [-0.5, 0, 0]);
    }
    if (
      (axis.jet?.(0, { type: "root", pole: 1, end: "bottom" }) ?? null) !== null
    )
      failures.push("out-of-parameter-domain axis2 was fabricated");
    const without2: IAutoMovieViewPart = {
      ...child,
      axis: { at: (s: number): IAutoMovieLoftSectionFrame => child.axis.at(s) },
    };
    const valueOriginal: IAutoMovieHumanF1NativeRoot.ICalibration = Root.calibrate({
      name: "made-value-only",
      parent,
      child: without2,
      loop,
      rails: [2],
      count: 4,
      correspondence: "angle",
      metric: { station: 2, depth: 0.4, breadth: 0.4 },
      basis,
    });
    const valuePrepared: IAutoMovieHumanF1NativeRoot.IPrepared = Root.prepare(
      valueOriginal,
      parent,
      [2, 3],
    );
    close(
      "value-only candidate remains readable",
      valuePrepared.axis.at(2).origin,
      [2, 1.42, 0],
    );
    if ((valuePrepared.axis.jet?.(2) ?? null) !== null)
      failures.push("missing original axis2 was fabricated");
    refuses("native address requires actual axis2", (): unknown =>
      valuePrepared.resolve(without2),
    );
  });

  scenario("clock graph admission and inverse", (): void => {
    for (const sense of [1, -1] as const) {
      const graph: ReturnType<typeof Root.phaseCurve> = Root.phaseCurve(
        Array.from({ length: 8 }, (_: unknown, k: number): [number, number] => [
          2,
          0.3 + (sense * turn * k) / 8,
        ]),
        sense,
        "made uniform clock",
      );
      const clock: number = 0.37 * turn;
      close("uniform clock value " + sense, graph.at(clock), [
        2,
        0.3 + sense * clock,
      ]);
      close(
        "wrapped uniform inverse " + sense,
        [graph.clock(0.3 + sense * clock + 2 * turn)],
        [clock],
      );
    }
    refuses("reversed phase control", (): unknown =>
      Root.phaseCurve(
        [
          [2, 0],
          [2, 1],
          [2, 0.5],
          [2, 4],
        ],
        1,
        "made reversed",
      ),
    );
    refuses("nonfinite phase control", (): unknown =>
      Root.phaseCurve(
        [
          [2, 0],
          [2, 1],
          [2, NaN],
          [2, 4],
        ],
        1,
        "made nonfinite",
      ),
    );
    refuses("monotone samples with a nonmonotone cubic", (): unknown =>
      Root.phaseCurve(
        [
          [2, 0],
          [2, 0.1],
          [2, 0.2],
          [2, 4],
        ],
        1,
        "made cubic reversal",
      ),
    );
  });

  scenario("radial source clock provenance", (): void => {
    const original: IAutoMovieConstructionPortLoop = {
      centre: { station: 0.002, phase: 0.4 },
      semi: { stationMetres: 0.0002, phaseRadians: 0.1 },
      sense: 1,
    };
    const rotation: number = 0.2;
    const addresses: [number, number][] = Array.from(
      { length: 8 },
      (_: unknown, k: number): [number, number] => [
        2 + 0.3 * Math.cos((turn * k) / 8 + rotation),
        0.4 + 0.15 * Math.sin((turn * k) / 8 + rotation),
      ],
    );
    const made: ReturnType<typeof Root.reclock> = Root.reclock(
      original,
      addresses,
    );
    for (let k: number = 0; k < 8; ++k) {
      close("constant radial share " + k, [made.loop.shape![k]!], [1.5]);
      close(
        "inverse original source clock " + k,
        [made.clocks[k]!],
        [((((turn * k) / 8 - rotation) % turn) + turn) % turn],
      );
    }
    refuses("collapsed radial graph", (): unknown =>
      Root.reclock(original, [
        [2, 0.4],
        [2, 0.4],
        [2, 0.4],
        [2, 0.4],
      ]),
    );
    refuses("one-ray radial graph", (): unknown =>
      Root.reclock(original, [
        [2.2, 0.4],
        [2.3, 0.4],
        [2.4, 0.4],
        [2.5, 0.4],
      ]),
    );
  });

  TestValidator.predicate(
    "native root transport: " + failures.join(" | "),
    failures.length === 0,
  );
}

/** Complete constant circle controls over the material domain [1,4] mm. */
function circle(
  name: string,
  radius: number,
  axis: IAutoMovieViewAxis.IAxis,
): IAutoMovieViewPart {
  const outline: (value: number) => IAutoMovieViewPart.IOutline = (
    value: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { station: 1, value, site: "first" },
      { station: 4, value, site: "last" },
    ],
  });
  const positive: IAutoMovieViewPart.IOutline = outline(radius);
  const negative: IAutoMovieViewPart.IOutline = outline(-radius);
  const shoulder: IAutoMovieViewPart.IOutline = outline(Math.SQRT2 - 1);
  return {
    name,
    axis,
    stations: [1, 4],
    order: 8,
    samples: 8,
    front: { positive, negative },
    side: { positive, negative },
    fullness: {
      kind: "top",
      shoulders: [shoulder, shoulder, shoulder, shoulder],
    },
  };
}
