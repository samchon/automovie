import { AutoMovieConstructionComposedEnd } from "@automovie/engine";
import type { IAutoMovieConstructionComposedEnd } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type V3 = [number, number, number];

/**
 * `AutoMovieConstructionComposedEnd.create` composes an end from its children's
 * sections: the forks lie at the sections' crossings, each child keeps the
 * lobes of its own curve, each seam plane through the forks holds the bisector
 * of the two children's axes, and all of them move with a child's size and
 * axis.
 *
 * Fixture (millimetres): the end plane z = 0 with the normal (0, 0, 1);
 * sections A, B, C in that order, circles of radius 9 about (-14, 0), (0, 0)
 * and (14, 0), read by the angle about their centres; axes A (-sin 0.2, 0, cos
 * 0.2), B (0, 0, 1), C (sin 0.2, 0, cos 0.2); 32 samples.
 *
 * Scenarios:
 *
 * 1. Forks at the closed-form crossings: A and B cross on their radical line x =
 *    -7 at y = +-sqrt(32), B and C at x = 7; each seam's first fork is the one
 *    with y > 0, within 1e-9 mm, its phases the points' angles about both
 *    centres within 1e-9 rad.
 * 2. Lobes are each child's own arcs: A keeps one lobe from atan2(sqrt(32), 7)
 *    round to its negative, holding its extremes at pi / 2, pi and 3 pi / 2; B
 *    keeps two, holding pi / 2 and 3 pi / 2 but not 0 and pi (inside its
 *    neighbours); C one.
 * 3. Seam A-B has heading (-sin 0.1, 0, cos 0.1) and normal (cos 0.1, 0, sin 0.1);
 *    seam B-C has normal (cos 0.1, 0, -sin 0.1), within 1e-12; each plane holds
 *    its forks and its heading.
 * 4. With B of radius 11 the A-B forks move to x = (196 + 81 - 121) / 28 - 14, y =
 *    +-sqrt(81 - (x + 14)^2); a tabulated fork of the base fixture would stand
 *    1.4 mm or more off B's new section where the composed fork stands on it;
 *    with A's axis leaned 0.5 the seam normal turns to (cos 0.25, 0, sin 0.25);
 *    with B an ellipse of half axes 9 and 6 each fork satisfies both
 *    equations.
 * 5. Refusals by name: sections 20 apart ("cross 0 times"); A and C at +-6
 *    overlapping though not neighbours ("not neighbours"); axes along the
 *    forks' chord ("runs along the chord"); one section alone ("at least
 *    two").
 * 6. The outline is one closed curve of four pieces on sections A, B, C, B, each
 *    ending within 1e-9 mm where the next begins, at a fork, where the tangent
 *    turns (sine above 0.5); the first piece's middle is A's extreme (-23, 0)
 *    with derivative (0, -9 (2 pi - 2 atan2(sqrt(32), 7))).
 * 7. Distances to the outline in the end plane: its own points 0 within 1e-9; the
 *    point (0, 23) is 14 off, (+-23, 0) is 0, (-7, 8) above a valley is
 *    hypot(7, 8) - 9, the origin 9.
 */
export function test_unit_engine_geometry_composed_end(): void {
  const turn: number = 2 * Math.PI;
  const ellipse = (
    name: string,
    x: number,
    a: number,
    b: number,
    axis: V3,
  ): IAutoMovieConstructionComposedEnd.ISection => ({
    name,
    axis,
    at: (psi: number): { point: V3; first: V3 } => ({
      point: [x + a * Math.cos(psi), b * Math.sin(psi), 0],
      first: [-a * Math.sin(psi), b * Math.cos(psi), 0],
    }),
  });
  const lean = (angle: number): V3 => [Math.sin(angle), 0, Math.cos(angle)];
  const compose = (
    sections: IAutoMovieConstructionComposedEnd.ISection[],
  ): IAutoMovieConstructionComposedEnd.IComposition | string =>
    AutoMovieConstructionComposedEnd.create({
      point: [0, 0, 0],
      normal: [0, 0, 1],
      sections,
      samples: 32,
    });
  const base = (): IAutoMovieConstructionComposedEnd.ISection[] => [
    ellipse("A", -14, 9, 9, lean(-0.2)),
    ellipse("B", 0, 9, 9, lean(0)),
    ellipse("C", 14, 9, 9, lean(0.2)),
  ];
  const wrap = (x: number): number => ((x % turn) + turn) % turn;
  const near = (x: number, y: number): number =>
    Math.abs(((((x - y + Math.PI) % turn) + turn) % turn) - Math.PI);
  const off = (p: readonly number[], q: readonly number[]): number =>
    Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);
  const dot = (p: readonly number[], q: readonly number[]): number =>
    p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!;

  const made = compose(base());
  if (typeof made === "string") throw new Error(`base: ${made}`);
  const y: number = Math.sqrt(32);

  // 1.
  const crossings: [number, number][] = [
    [0, -7],
    [1, 7],
  ];
  const phaseSides: (0 | 1)[] = [0, 1];
  for (const [j, x] of crossings) {
    const [first, second] = made.seams[j]!.forks;
    const centres: [number, number] = j === 0 ? [-14, 0] : [0, 14];
    TestValidator.predicate(
      `fork ${j} upper`,
      off(first.point, [x, y, 0]) <= 1e-9,
    );
    TestValidator.predicate(
      `fork ${j} lower`,
      off(second.point, [x, -y, 0]) <= 1e-9,
    );
    const forkSides: [typeof first, number][] = [
      [first, 1],
      [second, -1],
    ];
    for (const [fork, side] of forkSides)
      for (const s of phaseSides)
        TestValidator.predicate(
          `fork ${j} phase ${s}`,
          near(fork.phases[s], Math.atan2(side * y, x - centres[s]!)) <= 1e-9,
        );
  }

  // 2.
  const t: number = Math.atan2(y, 7);
  const expected: [number, number][][] = [
    [[t, turn - t]],
    [
      [t, Math.PI - t],
      [Math.PI + t, turn - t],
    ],
    [[Math.PI + t, turn + Math.PI - t]],
  ];
  expected.forEach((lobes: [number, number][], i: number): void => {
    TestValidator.equals(
      `lobes ${i} count`,
      made.lobes[i]!.length,
      lobes.length,
    );
    lobes.forEach((lobe: [number, number], k: number): void => {
      TestValidator.predicate(
        `lobe ${i}.${k} start`,
        Math.abs(made.lobes[i]![k]![0] - lobe[0]) <= 1e-9,
      );
      TestValidator.predicate(
        `lobe ${i}.${k} end`,
        Math.abs(made.lobes[i]![k]![1] - lobe[1]) <= 1e-9,
      );
    });
  });
  const holds = (i: number, psi: number): boolean =>
    made.lobes[i]!.some(
      ([from, to]: [number, number]): boolean => wrap(psi - from) <= to - from,
    );
  for (const psi of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
    TestValidator.equals(`A holds ${psi}`, holds(0, psi), true);
  TestValidator.equals("B holds pi/2", holds(1, Math.PI / 2), true);
  TestValidator.equals("B holds 3pi/2", holds(1, (3 * Math.PI) / 2), true);
  TestValidator.equals("B drops 0", holds(1, 0), false);
  TestValidator.equals("B drops pi", holds(1, Math.PI), false);

  // 3.
  const planes: [V3, V3][] = [
    [
      [Math.cos(0.1), 0, Math.sin(0.1)],
      [-Math.sin(0.1), 0, Math.cos(0.1)],
    ],
    [
      [Math.cos(0.1), 0, -Math.sin(0.1)],
      [Math.sin(0.1), 0, Math.cos(0.1)],
    ],
  ];
  planes.forEach(([normal, heading]: [V3, V3], j: number): void => {
    const seam: IAutoMovieConstructionComposedEnd.ISeam = made.seams[j]!;
    TestValidator.predicate(
      `seam ${j} normal`,
      off(seam.normal, normal) <= 1e-12,
    );
    TestValidator.predicate(
      `seam ${j} heading`,
      off(seam.heading, heading) <= 1e-12,
    );
    const chord: number[] = [0, 1, 2].map(
      (a: number): number => seam.forks[1].point[a]! - seam.forks[0].point[a]!,
    );
    TestValidator.predicate(
      `seam ${j} holds forks`,
      Math.abs(dot(seam.normal, chord)) <= 1e-9,
    );
    TestValidator.predicate(
      `seam ${j} holds heading`,
      Math.abs(dot(seam.normal, seam.heading)) <= 1e-12,
    );
  });

  // 4.
  const grown = compose([
    ellipse("A", -14, 9, 9, lean(-0.2)),
    ellipse("B", 0, 11, 11, lean(0)),
    ellipse("C", 14, 9, 9, lean(0.2)),
  ]);
  if (typeof grown === "string") throw new Error(`grown: ${grown}`);
  const gx: number = (196 + 81 - 121) / 28 - 14;
  const gy: number = Math.sqrt(81 - (gx + 14) ** 2);
  TestValidator.predicate(
    "grown upper fork",
    off(grown.seams[0]!.forks[0].point, [gx, gy, 0]) <= 1e-9,
  );
  TestValidator.predicate(
    "grown lower fork",
    off(grown.seams[0]!.forks[1].point, [gx, -gy, 0]) <= 1e-9,
  );
  const stale: number = Math.abs(Math.hypot(-7, y) - 11);
  const own: number = Math.abs(
    Math.hypot(
      grown.seams[0]!.forks[0].point[0],
      grown.seams[0]!.forks[0].point[1],
    ) - 11,
  );
  TestValidator.predicate("tabulated fork is off", stale >= 1.4);
  TestValidator.predicate("composed fork is on", own <= 1e-9);
  const leaned = compose([
    ellipse("A", -14, 9, 9, lean(-0.5)),
    ellipse("B", 0, 9, 9, lean(0)),
    ellipse("C", 14, 9, 9, lean(0.2)),
  ]);
  if (typeof leaned === "string") throw new Error(`leaned: ${leaned}`);
  TestValidator.predicate(
    "leaned normal",
    off(leaned.seams[0]!.normal, [Math.cos(0.25), 0, Math.sin(0.25)]) <= 1e-12,
  );
  const oval = compose([
    ellipse("A", -14, 9, 9, lean(-0.2)),
    ellipse("B", 0, 9, 6, lean(0)),
    ellipse("C", 14, 9, 9, lean(0.2)),
  ]);
  if (typeof oval === "string") throw new Error(`oval: ${oval}`);
  for (const seam of oval.seams)
    for (const fork of seam.forks) {
      const px: number = fork.point[0];
      const py: number = fork.point[1];
      const centre: number = px < 0 ? -14 : 14;
      TestValidator.predicate(
        `oval circle (${px}, ${py})`,
        Math.abs(Math.hypot(px - centre, py) - 9) <= 1e-9,
      );
      TestValidator.predicate(
        `oval ellipse (${px}, ${py})`,
        Math.abs((px / 9) ** 2 + (py / 6) ** 2 - 1) <= 1e-9,
      );
    }

  // 5.
  const refuses = (
    sections: IAutoMovieConstructionComposedEnd.ISection[],
    word: string,
  ): void => {
    const result = compose(sections);
    TestValidator.predicate(
      `refused ${word}`,
      typeof result === "string" && result.includes(word),
    );
  };
  refuses(
    [
      ellipse("A", -20, 9, 9, lean(0)),
      ellipse("B", 0, 9, 9, lean(0)),
      ellipse("C", 20, 9, 9, lean(0)),
    ],
    "cross 0 times",
  );
  refuses(
    [
      ellipse("A", -6, 9, 9, lean(0)),
      ellipse("B", 0, 9, 9, lean(0)),
      ellipse("C", 6, 9, 9, lean(0)),
    ],
    "not neighbours",
  );
  refuses(
    [ellipse("A", -14, 9, 9, [0, 1, 0]), ellipse("B", 0, 9, 9, [0, 1, 0])],
    "runs along the chord",
  );
  refuses([ellipse("A", -14, 9, 9, lean(0))], "at least two");

  // 6.
  const { pieces, at, distance }: IAutoMovieConstructionComposedEnd.IOutline =
    made.outline;
  TestValidator.equals(
    "pieces on sections",
    pieces
      .map((p: IAutoMovieConstructionComposedEnd.IPiece): number => p.section)
      .join(""),
    "0121",
  );
  let gap: number = 0;
  let corner: number = Infinity;
  for (let i: number = 0; i < pieces.length; ++i) {
    const here = at(i + 1 - 1e-13);
    const next = at((i + 1) % pieces.length);
    gap = Math.max(gap, off(here.point, next.point));
    const cross: number =
      here.first[0] * next.first[1] - here.first[1] * next.first[0];
    corner = Math.min(
      corner,
      Math.abs(cross) /
        (Math.hypot(here.first[0], here.first[1]) *
          Math.hypot(next.first[0], next.first[1])),
    );
    TestValidator.predicate(
      `piece ${i} ends at a fork`,
      [y, -y].some(
        (side: number): boolean =>
          off(next.point, [-7, side, 0]) <= 1e-9 ||
          off(next.point, [7, side, 0]) <= 1e-9,
      ),
    );
  }
  TestValidator.predicate("pieces meet", gap <= 1e-9);
  TestValidator.predicate("tangent turns", corner > 0.5);
  const middle = at(0.5);
  TestValidator.predicate(
    "middle point",
    off(middle.point, [-23, 0, 0]) <= 1e-9,
  );
  TestValidator.predicate(
    "middle derivative",
    off(middle.first, [0, -9 * (turn - 2 * Math.atan2(y, 7)), 0]) <= 1e-9,
  );

  // 7.
  let worst: number = 0;
  for (let k: number = 0; k < 97; ++k)
    worst = Math.max(worst, distance(at((4 * (k + 0.37)) / 97).point));
  TestValidator.predicate("own points", worst <= 1e-9);
  const cases: [V3, number][] = [
    [[0, 23, 0], 14],
    [[23, 0, 0], 0],
    [[-23, 0, 0], 0],
    [[-7, 8, 0], Math.hypot(7, 8) - 9],
    [[0, 0, 0], 9],
  ];
  for (const [point, distanceExpected] of cases)
    TestValidator.predicate(
      `distance (${point.join(", ")})`,
      Math.abs(distance(point) - distanceExpected) <= 1e-9,
    );
}
