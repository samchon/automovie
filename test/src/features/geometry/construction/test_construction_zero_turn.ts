import { type AutoMovieLoftFrame, AutoMovieViewAxis } from "@automovie/engine";

/**
 * An exact straight joint consumes no turn length or setback, while a nonzero near-straight turn still requires its positive arclength.
 *
 * Scenarios:
 * 1. Collinear centres (0,0,0), (0,0.01,0), (0,0.03,0) accept both half=0 and an otherwise overlong positive half. Every source frame is the independent straight frame, and the runs meet at the original centre with zero omitted length.
 * 2. A second segment tilted by 1e-10 radians refuses half=0 and admits a positive 1e-4 half; its endpoint tangent retains that nonzero tilt even when acos(dot) rounds the angle to zero.
 * 3. Splitting a straight segment before an ordinary right-angle turn preserves every later frame and run endpoint; the zero joint cannot push the later turn along the station axis. Every successful frame, run and tangent has the expected count and finite components.
 * 4. Negative/nonfinite halves, an opposite turn, coincident/nonfinite centres and a nonfinite initial direction are explicit admission failures.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the jointed frame and published run consumer, asserting straight geometry and absence of reserved length, nonzero small-angle geometry and named admission failures.
 * @evidence contracts/development/testing.md#independent-expectations A straight arclength course is o(s)=(0,s,0), u=(1,0,0), v=(0,0,1). Its two runs cover [0,0.01] and [0.01,0.03] without a turn. The tilted final tangent is the unit vector (0,1,1e-10), observed through normal(frame); tolerance 1e-14 is below that distinction. Inserting a collinear centre changes neither the geometric course nor its arclength, an independent representation invariant checked before, inside and after a later turn. This invariant does not certify the common nonzero-turn quadrature, owned by the axis tests.
 * @evidence contracts/development/testing.md#distinguishing-cases Exact zero and overlong requested half on a zero-angle joint, tiny nonzero angle with zero/positive half, and malformed/opposite boundary cases distinguish zero-turn topology from a small-angle tolerance shortcut.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU test through --include construction_zero_turn; it builds synthetic axes and starts no Human, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Collinear centres (0,0,0), (0,0.01,0), (0,0.03,0) accept both half=0 and an otherwise overlong positive half. Every source frame is the...).
 */
export function test_construction_zero_turn(): void {
  const failures: string[] = [];
  const centres: [number, number, number][] = [
    [0, 0, 0],
    [0, 0.01, 0],
    [0, 0.03, 0],
  ];
  const up: [number, number, number] = [1, 0, 0];
  const equal = (
    label: string,
    actual: readonly number[],
    expected: readonly number[],
    tolerance: number = 1e-14,
  ): void => {
    if (actual.length !== expected.length || !actual.every(Number.isFinite)) {
      failures.push(
        `${label}: expected ${expected.length} finite components, received ${actual.length}: ${actual}`,
      );
      return;
    }
    actual.forEach((value: number, c: number): void => {
      if (!(Math.abs(value - expected[c]!) <= tolerance))
        failures.push(`${label}/${c}: ${value}, expected ${expected[c]}`);
    });
  };
  for (const half of [0, 1]) {
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
      centres,
      [half],
      up,
    );
    const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
      centres,
      [half],
    );
    if (typeof axis === "string" || typeof runs === "string") {
      failures.push(
        `straight half ${half}: ${typeof axis === "string" ? axis : runs}`,
      );
      continue;
    }
    for (const s of [0, 0.005, 0.01, 0.015, 0.03]) {
      const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
      const expected: number[] = [0, s, 0, 1, 0, 0, 0, 0, 1];
      equal(
        `straight frame ${half}/${s}`,
        [...frame.origin, ...frame.u, ...frame.v],
        expected,
      );
    }
    const values: number[] = runs.flatMap(
      (r: AutoMovieViewAxis.IRun): number[] => [r.from, r.to, r.start, r.end],
    );
    const expected: number[] = [0, 0.01, 0, 0.01, 0, 0.02, 0.01, 0.03];
    if (runs.length !== 2)
      failures.push(
        `straight half ${half}: expected two runs, received ${runs.length}`,
      );
    equal(`straight run ${half}`, values, expected);
  }
  const tilted: [number, number, number][] = [
    [0, 0, 0],
    [0, 0.01, 0],
    [0, 0.03, 2e-12],
  ];
  if (typeof AutoMovieViewAxis.jointed(tilted, [0], up) !== "string")
    failures.push("a nonzero tiny turn accepts zero half");
  const tiny: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    tilted,
    [1e-4],
    up,
  );
  if (typeof tiny === "string") failures.push(`tiny turn: ${tiny}`);
  else {
    const tangent: [number, number, number] = AutoMovieViewAxis.normal(
      tiny.at(0.03),
    );
    equal("tiny turn tangent", tangent, [0, 1, 1e-10]);
  }
  const base: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    [
      [0, 0, 0],
      [0, 2, 0],
      [1, 2, 0],
    ],
    [0.1],
    up,
  );
  const mixed: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
      [1, 2, 0],
    ],
    [10, 0.1],
    up,
  );
  const baseRuns: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
    [
      [0, 0, 0],
      [0, 2, 0],
      [1, 2, 0],
    ],
    [0.1],
  );
  const mixedRuns: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
      [1, 2, 0],
    ],
    [10, 0.1],
  );
  if (
    typeof base === "string" ||
    typeof mixed === "string" ||
    typeof baseRuns === "string" ||
    typeof mixedRuns === "string"
  )
    failures.push("a mixed zero/nonzero course is not admitted");
  else {
    if (baseRuns.length !== 2 || mixedRuns.length !== 3)
      failures.push(`mixed run counts ${baseRuns.length}/${mixedRuns.length}`);
    else {
      equal(
        "mixed first straight run",
        [
          mixedRuns[0]!.from,
          mixedRuns[0]!.to,
          mixedRuns[0]!.start,
          mixedRuns[0]!.end,
        ],
        [0, 1, 0, 1],
      );
      equal(
        "mixed later run",
        [
          mixedRuns[2]!.from,
          mixedRuns[2]!.to,
          mixedRuns[2]!.start,
          mixedRuns[2]!.end,
        ],
        [
          baseRuns[1]!.from,
          baseRuns[1]!.to,
          baseRuns[1]!.start,
          baseRuns[1]!.end,
        ],
      );
    }
    for (const s of [0, 0.5, 1, 1.5, 1.9, 2, 2.05, 2.5]) {
      const actual: AutoMovieLoftFrame.IFrame = mixed.at(s);
      const expected: AutoMovieLoftFrame.IFrame = base.at(s);
      equal(
        `mixed frame ${s}`,
        [...actual.origin, ...actual.u, ...actual.v],
        [...expected.origin, ...expected.u, ...expected.v],
        1e-13,
      );
    }
  }
  for (const half of [-1, NaN, Infinity])
    if (typeof AutoMovieViewAxis.jointed(centres, [half], up) !== "string")
      failures.push(`invalid half ${half} admitted`);
  for (const points of [
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, Infinity, 0],
    ],
  ] as [number, number, number][][])
    if (
      typeof AutoMovieViewAxis.jointed(
        points,
        points.length === 3 ? [0.1] : [],
        up,
      ) !== "string"
    )
      failures.push(`invalid centres admitted: ${points}`);
  if (
    typeof AutoMovieViewAxis.jointed(centres, [0], [Infinity, 0, 0]) !==
    "string"
  )
    failures.push("nonfinite initial direction admitted");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} zero-turn failures:\n${failures.join("\n")}`,
    );
}
