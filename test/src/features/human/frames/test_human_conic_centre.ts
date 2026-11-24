import { AutoMovieViewChain } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicRecentre as Recentre,
  AutoMovieHumanConicSection as S,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewChain,
} from "@automovie/interface";

/**
 * A section's centre is its area centroid. A family re-expressed about its
 * measured centre line keeps the same wall.
 *
 * Scenarios:
 *
 * 1. The centroid of a made ellipse (semi-axes 20 and 10 mm) whose centre stands
 *    at [3, -2] in its chart is [3, -2]. A made bilateral section of two half
 *    ellipses on one breadth, 30 mm deep in front and 10 mm behind, has its
 *    centroid `4 (30 - 10) / (3 pi)` forward: a half ellipse's centroid stands
 *    `4 a / (3 pi)` from its diameter and its area is `pi a b / 2`.
 * 2. A made family of such ellipses about one constant centre has that centre as
 *    its line at every knot for any smoothing share, since a normalized average
 *    of a constant is the constant. With its centre linear along the course, [3
 *    + 0.1 s, -2 + 0.05 s], and no smoothing, the line is that centre at every
 *    knot. A made bilateral family keeps `v` exactly zero.
 * 3. The made linear family re-expressed about its own unsmoothed line: at
 *    stations on and between knots and round the section, the skin point at a
 *    base phase and the re-expressed family's point at the mapped phase on the
 *    moved course are one world point, and the re-expressed section's radius is
 *    the centred ellipse's `a b / sqrt((b cos t)^2 + (a sin t)^2)`.
 * 4. A made bilateral trunk re-expressed about its centre line: the line moves
 *    along `u` only; at every knot, every middle between knots and two further
 *    stations of each interval, at 24 phases, the original wall's skin point
 *    and the re-expressed wall's point at the mapped phase are one world point,
 *    and the point at the opposite phase is its reflection in the median plane;
 *    the new origin stands inside every section, in front of its back extreme
 *    and behind its front one, and the engine admits every one of those
 *    sections.
 * 5. The moved trunk course is twice differentiable: across every interior knot
 *    its second derivative is continuous, and at its two end knots it is zero,
 *    as a natural cubic's on a straight base course.
 * 6. The unsmoothed line of the re-expressed trunk is its original unsmoothed line
 *    less the origin's move, within numerical integration precision.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production centroid, centre line and re-expression, and reads sections through the production resolver and the engine's chain.
 * @evidence contracts/development/testing.md#independent-expectations The ellipse's centre, the half ellipse's centroid, a constant's average, the centred ellipse's polar equation, world-point equality between two representations, reflection in the median plane, the natural cubic's continuity and end conditions, and a centroid's translation are closed forms.
 * @evidence contracts/development/testing.md#distinguishing-cases An off-centre and an asymmetric section, a constant and a moving centre, smoothed and unsmoothed, and stations on and between knots in all four quadrants.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made ellipses and conic families.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state each made input and expectation.
 */
export function test_human_conic_centre(): void {
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
  const rho: number = Math.SQRT2 - 1;
  const world = (
    course: IAutoMovieViewAxis.IAxis,
    knots: readonly number[],
    values: readonly (readonly number[])[],
    layout: IAutoMovieHumanConicSection.ILayout,
    s: number,
    t: number,
  ): number[] => {
    const frame = course.at(s);
    const r: number = AutoMovieViewChain.radius(
      S.chain(
        H.reader({ knots: knots as number[], values: values as number[][] })(s),
        layout,
      ),
      t,
    );
    return [0, 1, 2].map(
      (k: number): number =>
        frame.origin[k]! +
        r * (Math.cos(t) * frame.u[k]! + Math.sin(t) * frame.v[k]!),
    );
  };

  // 1. Centroids.
  const [a, b]: [number, number] = [20, 10];
  const limb: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const ellipse = (e: readonly [number, number]): number[] => [
    e[0] + a,
    e[1],
    e[0],
    e[1] + b,
    e[0] - a,
    e[1],
    e[0],
    e[1] - b,
    rho,
    rho,
    rho,
    rho,
  ];
  near(
    "centroid of an off-centre ellipse",
    Recentre.centroid(S.chain(ellipse([3, -2]), limb)),
    [3, -2],
    1e-6,
  );
  const bilateral: IAutoMovieHumanConicSection.ILayout = S.bilateral(0);
  near(
    "centroid of two half ellipses",
    Recentre.centroid(S.chain([30, 0, 15, -10, rho, rho], bilateral)),
    [(4 * (30 - 10)) / (3 * Math.PI), 0],
    1e-6,
  );

  // 2. Centre lines of made families.
  const knots: number[] = [0, 10, 20, 30];
  const family = (
    layout: IAutoMovieHumanConicSection.ILayout,
    section: (s: number) => number[],
  ): IAutoMovieHumanConicLoft.IFamily => {
    const sections: number[][] = knots.map(section);
    return {
      name: "made",
      centres: [
        [1, 2, 3],
        [1, 42, 3],
      ],
      halves: [],
      up: [1, 0, 0],
      layout,
      knots,
      values: sections[0]!.map((_: number, f: number): number[] =>
        sections.map((values: number[]): number => values[f]!),
      ),
    };
  };
  const still: IAutoMovieHumanConicLoft.IFamily = family(limb, (): number[] =>
    ellipse([3, -2]),
  );
  for (const share of [0, 0.5, 2]) {
    const line: IAutoMovieHumanConicRecentre.ILine = Recentre.centreLine(
      still,
      share,
    );
    knots.forEach((s: number, k: number): void =>
      near(
        `constant centre at station ${s}, share ${share}`,
        [line.u[k]!, line.v[k]!],
        [3, -2],
        1e-9,
      ),
    );
  }
  const centre = (s: number): [number, number] => [3 + 0.1 * s, -2 + 0.05 * s];
  const moving: IAutoMovieHumanConicLoft.IFamily = family(
    limb,
    (s: number): number[] => ellipse(centre(s)),
  );
  const own: IAutoMovieHumanConicRecentre.ILine = Recentre.centreLine(
    moving,
    0,
  );
  knots.forEach((s: number, k: number): void =>
    near(
      `moving centre at station ${s}`,
      [own.u[k]!, own.v[k]!],
      centre(s),
      1e-9,
    ),
  );
  const half: IAutoMovieHumanConicRecentre.ILine = Recentre.centreLine(
    family(bilateral, (s: number): number[] => [
      30 + 0.1 * s,
      0,
      15,
      -10,
      rho,
      rho,
    ]),
    0.5,
  );
  if (!half.v.every((x: number): boolean => x === 0))
    failures.push("a bilateral family's line left the median line");

  // 3. The made family about its own line.
  const express = (
    source: IAutoMovieHumanConicLoft.IFamily,
    line: IAutoMovieHumanConicRecentre.ILine,
  ) => ({
    line,
    values: Recentre.shift(source, line),
    axis: Recentre.axis(H.axis(source), source.knots, line),
  });
  const made = express(moving, own);
  const base: IAutoMovieViewAxis.IAxis = H.axis(moving);
  for (const s of [0, 5, 12.5, 20, 30])
    for (let j: number = 0; j < 16; ++j) {
      const t: number = (2 * Math.PI * j) / 16 + 0.05;
      const mapped: number = Recentre.phase(moving, own, s, t);
      near(
        `made skin point at station ${s}, phase ${j}/16`,
        world(made.axis, knots, made.values, limb, s, mapped),
        world(base, knots, moving.values, limb, s, t),
        1e-9,
      );
      const r: number = AutoMovieViewChain.radius(
        S.chain(H.reader({ knots, values: made.values })(s), limb),
        mapped,
      );
      near(
        `centred ellipse radius at station ${s}, phase ${j}/16`,
        [r],
        [(a * b) / Math.hypot(b * Math.cos(mapped), a * Math.sin(mapped))],
        1e-9,
      );
    }

  // 4. A bilateral trunk with a smooth changing anterior extent.
  const trunk: IAutoMovieHumanConicLoft.IFamily = {
    ...family(bilateral, (s: number): number[] => [
      30 + (s - 15) ** 2 / 45,
      0,
      15,
      -10,
      rho,
      rho,
    ]),
    centres: [
      [1, 2, 0],
      [1, 42, 0],
    ],
  };
  const centred = express(trunk, Recentre.centreLine(trunk, 0.6));
  if (!centred.line.v.every((x: number): boolean => x === 0))
    failures.push("the trunk's centre line leaves the median line");
  const course: IAutoMovieViewAxis.IAxis = H.axis(trunk);
  const stations: number[] = trunk.knots.flatMap(
    (s: number, m: number): number[] =>
      m === 0
        ? [s]
        : [0.25, 0.5, 0.75, 1].map(
            (x: number): number =>
              trunk.knots[m - 1]! + x * (s - trunk.knots[m - 1]!),
          ),
  );
  const read: (s: number) => number[] = H.reader({
    knots: trunk.knots,
    values: centred.values,
  });
  for (const s of stations) {
    const section: IAutoMovieViewChain.ISection = S.chain(
      read(s),
      trunk.layout,
    );
    if (section.fault !== null) {
      failures.push(
        `the re-expressed trunk section at ${s} is refused: ${section.fault}`,
      );
      continue;
    }
    const [front, back]: number[] = [0, Math.PI].map(
      (t: number): number => AutoMovieViewChain.read(section, t)!.point[0],
    );
    if (!(front! > 0 && back! < 0))
      failures.push(
        `the trunk's centre line leaves its section at ${s}: front ${front}, back ${back}`,
      );
    for (let j: number = 0; j < 24; ++j) {
      const t: number = (2 * Math.PI * (j + 0.3)) / 24;
      const mapped: number = Recentre.phase(trunk, centred.line, s, t);
      const p: number[] = world(
        centred.axis,
        trunk.knots,
        centred.values,
        trunk.layout,
        s,
        mapped,
      );
      near(
        `trunk skin point at station ${s}, phase ${j}/24`,
        p,
        world(course, trunk.knots, trunk.values, trunk.layout, s, t),
        1e-9,
      );
      const q: number[] = world(
        centred.axis,
        trunk.knots,
        centred.values,
        trunk.layout,
        s,
        2 * Math.PI - mapped,
      );
      near(
        `trunk mirror point at station ${s}, phase ${j}/24`,
        q,
        [p[0]!, p[1]!, -p[2]!],
        1e-9,
      );
    }
  }

  // 5. The moved course is twice differentiable.
  const jet = (s: number): IAutoMovieViewAxisJet.IJet => {
    const j: IAutoMovieViewAxisJet.IJet | null | undefined =
      centred.axis.jet?.(s);
    if (j === null || j === undefined)
      throw new Error(`the moved trunk course has no jet at ${s}`);
    return j;
  };
  trunk.knots
    .slice(1, -1)
    .forEach((s: number): void =>
      near(
        `moved course bend across knot ${s}`,
        jet(s - 1e-6).second.origin,
        jet(s + 1e-6).second.origin,
        1e-6,
      ),
    );
  for (const s of [trunk.knots[0]!, trunk.knots.at(-1)!])
    near(
      `moved course bend at end knot ${s}`,
      jet(s).second.origin,
      [0, 0, 0],
      1e-12,
    );

  // 6. A centroid moves with its region.
  const [before, after]: IAutoMovieHumanConicRecentre.ILine[] = [
    Recentre.centreLine(trunk, 0),
    Recentre.centreLine({ ...trunk, values: centred.values }, 0),
  ];
  trunk.knots.forEach((s: number, k: number): void =>
    near(
      `trunk centroid about the new origin at ${s}`,
      [after!.u[k]!],
      [before!.u[k]! - centred.line.u[k]!],
      1e-6,
    ),
  );

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
