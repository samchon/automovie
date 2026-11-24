import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicPose as Pose,
  AutoMovieHumanConicSection as S,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

/**
 * A family's origin line moves its course's origin in the section chart and
 * nothing else; absent or zero, every reader returns what it returned before
 * the line existed.
 *
 * Scenarios:
 *
 * 1. A made jointed family with a roll, with no origin line and with the zero
 *    line: `axis` is the same frame and the same jet, bit for bit, at 201
 *    stations; `mirror` and `repose` return the same families, the zero line
 *    riding along as zeros.
 * 2. A made straight family along +Y with `up` +X and the line `u = 5, v = -3` at
 *    every knot: the origin stands 5 mm along +X and 3 mm against `v = u x t =
 *    +Z` from the course, the chart directions unchanged. The same family
 *    rolled a quarter turn from `u` toward `v` has its rolled `u` on +Z, so the
 *    origin stands 5 mm along +Z and 3 mm along +X.
 * 3. The twin of the made family with a line is its reflection in the median
 *    plane: at every station the twin's origin is the original's with `z`
 *    negated.
 * 4. A made three-centre family carried to a bent pose keeps its origin line's
 *    shifts, and its posed origin stands off the posed course by the same chart
 *    shifts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production `axis`, `mirror` and `repose` on synthetic families with known origins and chart axes.
 * @evidence contracts/development/testing.md#independent-expectations Identity with the line absent, a point's offset along given unit directions, a quarter turn's image of an axis, and reflection in the median plane are closed forms.
 * @evidence contracts/development/testing.md#distinguishing-cases Absent beside zero beside non-zero, straight beside rolled beside jointed, the original beside its twin and its pose, every finding collected.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made families without a mesh realization.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state each made input and expectation.
 */
export function test_human_conic_loft_origin(): void {
  const failures: string[] = [];
  const near = (
    what: string,
    got: readonly number[],
    want: readonly number[],
    tolerance: number,
  ): void => {
    const d: number = Math.hypot(
      ...got.map((x: number, k: number): number => x - want[k]!),
    );
    if (!(d <= tolerance))
      failures.push(
        `${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`,
      );
  };
  const same = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length &&
    a.every((x: number, k: number): boolean => Object.is(x, b[k]));
  const frames = (
    what: string,
    a: IAutoMovieViewAxis.IAxis,
    b: IAutoMovieViewAxis.IAxis,
    stations: readonly number[],
  ): void => {
    for (const s of stations) {
      const [p, q] = [a.at(s), b.at(s)];
      if (!same(p.origin, q.origin) || !same(p.u, q.u) || !same(p.v, q.v))
        failures.push(`${what}: the frame at ${s} differs`);
      const [i, j]: (IAutoMovieViewAxisJet.IJet | null | undefined)[] = [
        a.jet?.(s),
        b.jet?.(s),
      ];
      if ((i === null || i === undefined) !== (j === null || j === undefined))
        failures.push(`${what}: one jet is missing at ${s}`);
      else if (i !== null && i !== undefined && j !== null && j !== undefined)
        for (const order of ["value", "first", "second"] as const)
          if (
            !same(i[order].origin, j[order].origin) ||
            !same(i[order].u, j[order].u) ||
            !same(i[order].v, j[order].v)
          )
            failures.push(`${what}: the jet's ${order} at ${s} differs`);
    }
  };

  // The made families: ellipses 20 by 10 mm on their course.
  const rho: number = Math.SQRT2 - 1;
  const layout: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const knots: number[] = [0, 40, 80, 120, 160, 200];
  const values: number[][] = [
    20,
    0,
    0,
    10,
    -20,
    0,
    0,
    -10,
    rho,
    rho,
    rho,
    rho,
  ].map((x: number): number[] => knots.map((): number => x));
  const jointed: IAutoMovieHumanConicLoft.IFamily = {
    name: "made",
    centres: [
      [0, 0, 30],
      [0, 100, 30],
      [40, 190, 60],
    ],
    halves: [20],
    up: [1, 0, 0],
    roll: { knots: [0, 200], values: [0, 0.4] },
    layout,
    knots,
    values,
  };
  const zero: IAutoMovieHumanConicRecentre.ILine = {
    u: knots.map((): number => 0),
    v: knots.map((): number => 0),
  };
  const dense: number[] = Array.from(
    { length: 201 },
    (_: unknown, k: number): number => k,
  );

  // 1. Absent and zero.
  frames(
    "made axis with the zero line",
    H.axis(jointed),
    H.axis({ ...jointed, origin: zero }),
    dense,
  );
  const [twin, twinZero]: IAutoMovieHumanConicLoft.IFamily[] = [
    H.mirror(jointed, "twin"),
    H.mirror({ ...jointed, origin: zero }, "twin"),
  ];
  if (twin!.origin !== undefined)
    failures.push("a twin of a family without a line has one");
  if (
    twinZero!.origin === undefined ||
    !same(twinZero!.origin.u, zero.u) ||
    !same(twinZero!.origin.v, zero.v)
  )
    failures.push("a twin of a family with the zero line does not carry zeros");
  if (
    JSON.stringify({ ...twinZero, origin: undefined }) !== JSON.stringify(twin)
  )
    failures.push("the zero line changed the twin");
  frames(
    "twin axis with the zero line",
    H.axis(twin!),
    H.axis(twinZero!),
    dense,
  );
  const posedCentres: AutoMovieVector3Tuple[] = [
    [0, 0, 30],
    [0, 100, 30],
    [70, 170, 60],
  ];
  const carried = (
    _: number,
    direction: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => direction;
  const plain: IAutoMovieHumanConicLoft.IFamily = {
    ...jointed,
    roll: undefined,
  };
  const [posed, posedZero] = [
    Pose.repose(plain, posedCentres, [1, 0, 0], carried),
    Pose.repose({ ...plain, origin: zero }, posedCentres, [1, 0, 0], carried),
  ];
  if (posed.family.origin !== undefined)
    failures.push("a posed family without a line has one");
  if (
    JSON.stringify({ ...posedZero.family, origin: undefined }) !==
    JSON.stringify(posed.family)
  )
    failures.push("the zero line changed the posed family");
  frames(
    "posed axis with the zero line",
    H.axis(posed.family),
    H.axis(posedZero.family),
    dense,
  );

  // 2. A constant line on a straight course, plain and rolled a quarter turn.
  const line: IAutoMovieHumanConicRecentre.ILine = {
    u: knots.map((): number => 5),
    v: knots.map((): number => -3),
  };
  const straight: IAutoMovieHumanConicLoft.IFamily = {
    name: "straight",
    centres: [
      [1, 0, 2],
      [1, 200, 2],
    ],
    halves: [],
    up: [1, 0, 0],
    layout,
    knots,
    values,
    origin: line,
  };
  const quarter: IAutoMovieHumanConicLoft.IFamily = {
    ...straight,
    roll: { knots: [0, 200], values: [Math.PI / 2, Math.PI / 2] },
  };
  for (const s of [0, 37.5, 120, 200]) {
    const frame = H.axis(straight).at(s);
    near(`straight origin at ${s}`, frame.origin, [1 + 5, s, 2 - 3], 1e-12);
    near(`straight u at ${s}`, frame.u, [1, 0, 0], 1e-12);
    near(`straight v at ${s}`, frame.v, [0, 0, 1], 1e-12);
    near(
      `rolled origin at ${s}`,
      H.axis(quarter).at(s).origin,
      [1 + 3, s, 2 + 5],
      1e-12,
    );
  }

  // 3. The twin's origin is the reflection.
  const lined: IAutoMovieHumanConicLoft.IFamily = {
    ...jointed,
    origin: {
      u: knots.map((s: number): number => 2 + 0.01 * s),
      v: knots.map((s: number): number => -1 + 0.02 * s),
    },
  };
  const [own, mirrored]: IAutoMovieViewAxis.IAxis[] = [
    H.axis(lined),
    H.axis(H.mirror(lined, "twin")),
  ];
  for (const s of [0, 30, 95, 110, 200]) {
    const p: readonly number[] = own!.at(s).origin;
    near(
      `twin origin at ${s}`,
      mirrored!.at(s).origin,
      [p[0]!, p[1]!, -p[2]!],
      1e-9,
    );
  }

  // 4. A pose keeps the line's shifts in the posed chart.
  const bent = Pose.repose(
    { ...plain, origin: lined.origin },
    posedCentres,
    [1, 0, 0],
    carried,
  );
  if (
    bent.family.origin === undefined ||
    !same(bent.family.origin.u, lined.origin!.u) ||
    !same(bent.family.origin.v, lined.origin!.v)
  )
    failures.push("a pose changed the origin line's shifts");
  else {
    const course: IAutoMovieViewAxis.IAxis = H.axis({
      ...bent.family,
      origin: undefined,
    });
    const moved: IAutoMovieViewAxis.IAxis = H.axis(bent.family);
    bent.family.knots.forEach((s: number, k: number): void => {
      const [f, g] = [course.at(s), moved.at(s)];
      const d: number[] = [0, 1, 2].map(
        (c: number): number => g.origin[c]! - f.origin[c]!,
      );
      near(
        `posed origin shift at knot ${k}`,
        [
          d[0]! * f.u[0]! + d[1]! * f.u[1]! + d[2]! * f.u[2]!,
          d[0]! * f.v[0]! + d[1]! * f.v[1]! + d[2]! * f.v[2]!,
        ],
        [lined.origin!.u[k]!, lined.origin!.v[k]!],
        1e-9,
      );
    });
  }

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
