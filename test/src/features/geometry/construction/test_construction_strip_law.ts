import {
  AutoMovieConstructionSplitBand,
  AutoMovieSolidBlendChain,
  AutoMovieSolidChain,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";

type V3 = [number, number, number];

/**
 * The join strip between two rings is flat between equal rings and never turns a column back once its ribbons take the monotone scale.
 *
 * Scenarios (32 columns, millimetres):
 * 1. Equal coaxial rings: circles of radius 20 at `z = 0` and `z = -30` with axial ribbons (first `(0, 0, -30)`, second zero). The strip is the cylinder between them: at every column and 11 stations across, the point lies at radius 20 within 1e-9 and at `z = -30 w`, the cross second derivative vanishes, no column folds, and `largest` keeps the chord law (factor 1).
 * 2. A turning pair: a ring of radius 40 at `z = 0` to a ring of radius 10 at `z = -10`, both ribbons straight down at the chord law's length `L = sqrt(1000)`, the start ribbon curving outward (second derivative 400 mm outward, a host bend of radius `L^2 / 400`, 2.5 mm). Per unit of the chord's square, each column's run along its chord is the quintic Hermite `g` with `g(0) = 0`, `g(1) = 1`, `g'(0) = g'(1) = 10 L / 1000 = 0.316`, `g''(0) = -30 * 400 / 1000 = -12`, `g''(1) = 0`; its derivative is `-0.05` at `w = 0.04` and `-0.16` at `w = 0.15`. Red: under the chord law the control points project non-monotonically and the sampled column turns back along its chord. Green: `largest` returns the factor below 1 at which every column's control points project monotonically (`0.0632 f >= 0.6 f^2`, so about 0.105), and the strip from the scaled ribbons neither turns back nor folds.
 *
 * A fold is an orientation reversal: adjacent samples along a column (41) whose normals `S_u x S_v` point against each other, the chart's Jacobian changing sign. Comparing every sample with the column's start normal instead counts any column turning more than 90 degrees, which a surface of revolution with a smooth meridian does without folding.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds strips with `AutoMovieSolidBlendChain.strip` and reads their surfaces; calls `AutoMovieConstructionSplitBand.largest` for the scale. It catches a strip that bulges between equal rings, a scale law that leaves a column turning back, and a scale that changes columns needing none.
 * @evidence contracts/development/testing.md#independent-expectations The cylinder is the closed form of a straight quintic Hermite between equal circles with axial ribbons; the turning pair's red is the closed-form Hermite derivative above; the control points come from the curves skill's endpoint-derivative formula, computed here, and turning back and folding are read from sampled points and normals, not from the law under test.
 * @evidence contracts/development/testing.md#distinguishing-cases An equal pair that must stay unscaled against a folding pair that must be scaled; the split and port nodes' own bands belong to their tests.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_strip_law`; it builds made strips in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Equal coaxial rings: circles of radius 20 at `z = 0` and `z = -30` with axial ribbons (first `(0, 0, -30)`, second zero). The strip is the...).
 */
export function test_construction_strip_law(): void {
  const failures: string[] = [];
  const n: number = 32;
  const turn: number = 2 * Math.PI;
  type Column = {
    start: { point: V3; first: V3; second: V3 };
    end: { point: V3; first: V3; second: V3 };
  };
  const ring: (r: number, z: number) => V3[] = (r: number, z: number): V3[] =>
    Array.from(
      { length: n },
      (_: unknown, k: number): V3 => [
        r * Math.cos((turn * k) / n),
        r * Math.sin((turn * k) / n),
        z,
      ],
    );
  const sub: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2],
  ];
  const scale: (a: V3, s: number) => V3 = (a: V3, s: number): V3 => [
    a[0] * s,
    a[1] * s,
    a[2] * s,
  ];
  const dot: (a: V3, b: V3) => number = (a: V3, b: V3): number =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const len: (a: V3) => number = (a: V3): number =>
    Math.hypot(a[0], a[1], a[2]);
  const vec: (a: readonly number[]) => V3 = (a: readonly number[]): V3 => [
    a[0]!,
    a[1]!,
    a[2]!,
  ];
  /** The quintic's six Bezier control points projected on the column's chord (curves.md, Preserve the Actual Parameter, h = 1). */
  const monotone: (c: Column, f: number) => boolean = (
    c: Column,
    f: number,
  ): boolean => {
    const a: V3 = c.start.point;
    const b: V3 = c.end.point;
    const chord: V3 = sub(b, a);
    const add: (...v: V3[]) => V3 = (...v: V3[]): V3 =>
      v.reduce(
        (x: V3, y: V3): V3 => [x[0] + y[0], x[1] + y[1], x[2] + y[2]],
        [0, 0, 0],
      );
    const controls: V3[] = [
      a,
      add(a, scale(c.start.first, f / 5)),
      add(
        a,
        scale(c.start.first, (2 * f) / 5),
        scale(c.start.second, (f * f) / 20),
      ),
      add(
        b,
        scale(c.end.first, (-2 * f) / 5),
        scale(c.end.second, (f * f) / 20),
      ),
      add(b, scale(c.end.first, -f / 5)),
      b,
    ];
    const along: number[] = controls.map((p: V3): number =>
      dot(sub(p, a), chord),
    );
    return along.every(
      (x: number, i: number): boolean => i === 0 || x >= along[i - 1]!,
    );
  };
  /** Columns with an orientation reversal: adjacent samples (41) whose normals point against each other or vanish. */
  const folds: (chain: IAutoMovieLoftChain) => number = (
    chain: IAutoMovieLoftChain,
  ): number => {
    const s: IAutoMovieSolidSurface = AutoMovieSolidChain.surface(chain)!;
    const L: number = chain.layers[1]!.y;
    let count: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const at: (w: number) => V3 = (w: number): V3 => {
        const j: IAutoMovieSolidSurface.IJet = s.jet(w * L, (turn * k) / n);
        return cross(vec(j.u), vec(j.v));
      };
      const normals: V3[] = Array.from(
        { length: 41 },
        (_: unknown, i: number): V3 => at(i / 40),
      );
      if (
        normals.some(
          (x: V3, i: number): boolean =>
            i > 0 && !(dot(x, normals[i - 1]!) > 0),
        )
      )
        ++count;
    }
    return count;
  };

  // 1. Equal coaxial rings.
  const top: V3[] = ring(20, 0);
  const bottom: V3[] = ring(20, -30);
  const equal: Column[] = top.map(
    (p: V3, k: number): Column => ({
      start: { point: p, first: [0, 0, -30], second: [0, 0, 0] },
      end: { point: bottom[k]!, first: [0, 0, -30], second: [0, 0, 0] },
    }),
  );
  const flat: { chain: IAutoMovieLoftChain; length: number } | null =
    AutoMovieSolidBlendChain.strip("equal", equal, [1, 0, 0]);
  if (flat === null) failures.push("equal rings: no strip");
  else {
    const s: IAutoMovieSolidSurface = AutoMovieSolidChain.surface(flat.chain)!;
    for (let k: number = 0; k < n; ++k)
      for (let i: number = 0; i <= 10; ++i) {
        const j: IAutoMovieSolidSurface.IJet = s.jet(
          (i / 10) * flat.length,
          (turn * k) / n,
        );
        const p: V3 = vec(j.p);
        if (
          !(
            Math.abs(Math.hypot(p[0], p[1]) - 20) <= 1e-9 &&
            Math.abs(p[2] + 3 * i) <= 1e-9
          )
        )
          failures.push(
            `equal rings column ${k} share ${i / 10}: point ${p.join(",")} off the cylinder`,
          );
        if (!(len(vec(j.uu)) <= 1e-9))
          failures.push(
            `equal rings column ${k} share ${i / 10}: cross second derivative ${len(vec(j.uu))}`,
          );
      }
    if (folds(flat.chain) !== 0)
      failures.push("equal rings: a column's normal flips");
    if (equal.some((c: Column): boolean => AutoMovieSplitLargest(c) !== 1))
      failures.push(
        "equal rings: the scale law shortened a column that needs no scale",
      );
  }

  // 2. A turning pair: a 30 mm radial run over a 10 mm drop, the start ribbon
  // heading straight down at the chord law's length and curving outward
  // (second derivative 400 mm outward), the end ribbon straight down.
  const outer: V3[] = ring(40, 0);
  const inner: V3[] = ring(10, -10);
  const folding: Column[] = outer.map((p: V3, k: number): Column => {
    const L: number = len(sub(inner[k]!, p));
    const out: V3 = [Math.cos((turn * k) / n), Math.sin((turn * k) / n), 0];
    return {
      start: { point: p, first: [0, 0, -L], second: scale(out, 400) },
      end: { point: inner[k]!, first: [0, 0, -L], second: [0, 0, 0] },
    };
  });
  /** Columns whose sampled points retreat along their own chord somewhere (51 samples). */
  const retreats: (chain: IAutoMovieLoftChain) => number = (
    chain: IAutoMovieLoftChain,
  ): number => {
    const s: IAutoMovieSolidSurface = AutoMovieSolidChain.surface(chain)!;
    const L: number = chain.layers[1]!.y;
    let count: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const a: V3 = vec(s.jet(0, (turn * k) / n).p);
      const chord: V3 = sub(vec(s.jet(L, (turn * k) / n).p), a);
      const along: number[] = Array.from(
        { length: 51 },
        (_: unknown, i: number): number =>
          dot(sub(vec(s.jet((i / 50) * L, (turn * k) / n).p), a), chord),
      );
      if (
        along.some(
          (x: number, i: number): boolean => i > 0 && x < along[i - 1]!,
        )
      )
        ++count;
    }
    return count;
  };
  if (folding.every((c: Column): boolean => monotone(c, 1)))
    failures.push(
      "proof: the folding pair's control points are monotone under the chord law",
    );
  const loose: { chain: IAutoMovieLoftChain; length: number } | null =
    AutoMovieSolidBlendChain.strip("loose", folding, [1, 0, 0]);
  if (loose === null || retreats(loose.chain) === 0)
    failures.push(
      "proof: no column of the folding pair's chord-law strip turns back",
    );
  const factor: number = Math.min(
    ...folding.map((c: Column): number => AutoMovieSplitLargest(c) ?? NaN),
  );
  if (!(factor > 0 && factor < 1))
    failures.push(`folding pair: scale ${factor}, expected in (0, 1)`);
  if (!folding.every((c: Column): boolean => monotone(c, factor)))
    failures.push(
      `folding pair: a column is not monotone at the scale ${factor}`,
    );
  const tight: { chain: IAutoMovieLoftChain; length: number } | null =
    AutoMovieSolidBlendChain.strip(
      "tight",
      folding.map(
        (c: Column): Column => ({
          start: {
            point: c.start.point,
            first: scale(c.start.first, factor),
            second: scale(c.start.second, factor * factor),
          },
          end: {
            point: c.end.point,
            first: scale(c.end.first, factor),
            second: scale(c.end.second, factor * factor),
          },
        }),
      ),
      [1, 0, 0],
    );
  if (tight === null) failures.push("folding pair: no scaled strip");
  else if (retreats(tight.chain) !== 0 || folds(tight.chain) !== 0)
    failures.push(
      `folding pair: at the scale ${factor}, ${retreats(tight.chain)} columns still turn back and ${folds(tight.chain)} flip`,
    );
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} strip law failures:\n${failures.join("\n")}`,
    );
}

/** The scale law under test, read through its public reader. */
function AutoMovieSplitLargest(column: {
  start: { point: V3; first: V3; second: V3 };
  end: { point: V3; first: V3; second: V3 };
}): number | null {
  return AutoMovieConstructionSplitBand.largest(column, 1);
}
