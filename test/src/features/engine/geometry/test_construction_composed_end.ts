import type { IAutoMovieConstructionComposedEnd } from "@automovie/interface";
import { AutoMovieConstructionComposedEnd } from "@automovie/engine";

type V3 = [number, number, number];

/**
 * An end composed of its children's sections has its forks at the sections' crossings, each child's lobes on its own curve and each seam plane through the forks holding the bisector of the two children's axes, and all of them move with a child's size and axis.
 *
 * Fixture (millimetres): the end plane `z = 0` with the normal `(0, 0, 1)`; sections `A`, `B`, `C` in that order, circles of radius 9 about `(-14, 0)`, `(0, 0)` and `(14, 0)`, read by the angle about their centres; axes `A (-sin 0.2, 0, cos 0.2)`, `B (0, 0, 1)`, `C (sin 0.2, 0, cos 0.2)`; 32 samples.
 *
 * Scenarios:
 * 1. Forks at the closed-form crossings: `A` and `B` cross on their radical line `x = -7` at `y = +-sqrt(32)`, `B` and `C` at `x = 7`; each seam's first fork is the one on the left of the direction to the next section (`y > 0`), within 1e-9 mm, and its phases are the points' angles about both centres within 1e-9 rad.
 * 2. Lobes are each child's own arcs: `A` keeps one lobe from `atan2(sqrt(32), 7)` round to its negative, which holds its extremes at phases `pi / 2`, `pi` and `3 pi / 2`; `B` keeps two, each holding one of its extremes at `pi / 2` and `3 pi / 2` and neither its points at 0 and `pi`, which lie inside its neighbours; `C` one; bounds within 1e-9 rad.
 * 3. Seam planes hold the bisectors: seam `A-B`'s heading is `(-sin 0.1, 0, cos 0.1)` and its normal `(cos 0.1, 0, sin 0.1)`, from `A` toward `B`; seam `B-C`'s normal `(cos 0.1, 0, -sin 0.1)`; within 1e-12. Each plane holds both its forks and its heading.
 * 4. A function of the children: with `B` of radius 11 the forks `A-B` move to `x = (196 + 81 - 121) / 28 - 14` and `y = +-sqrt(81 - (x + 14)^2)`; with `A`'s axis leaned 0.5 the seam's normal turns to `(cos 0.25, 0, sin 0.25)`; with `B` an ellipse of half axes 9 and 6 each fork satisfies both the circle's and the ellipse's equation within 1e-9.
 * 5. Refusals by name: sections 20 apart (`cross 0 times`); `A` and `C` moved to `+-6` so that they overlap although not neighbours (`not neighbours`); axes that lie along the forks' chord (`runs along the chord`); one section alone.
 * 6. Red control, a tabulated fork: the forks of the base fixture, kept while `B` grows to radius 11, stand 1.4 mm or more off `B`'s new section, where the composition's own stand on both sections within 1e-9.
 * 7. The outline is one closed curve: four pieces on sections `A`, `B`, `C`, `B`, each ending within 1e-9 mm where the next begins, at a fork, where the tangent turns (a sine above 0.5); the first piece's middle is `A`'s extreme `(-23, 0)` with the derivative `(0, -9 (2 pi - 2 atan2(sqrt(32), 7)))`.
 * 8. Distances to the outline in the end plane: its own points stand within 1e-9 mm; the circle of radius 23 stands 14 off at `(0, 23)` and 0 at `(+-23, 0)`; the point `(-7, 8)` above a valley stands `hypot(7, 8) - 9` off; the origin 9; within 1e-9 mm.
 * 9. One search returns the same scalar distance with its actual interior, fork or tied witnesses. A translated two-circle pair distinguishes the two directional derivatives at the tie.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieConstructionComposedEnd.create` on made sections and reads its forks, lobes and seams. It catches a fork off either curve, forks in the wrong order, a lobe that includes a covered arc, a seam plane that ignores an axis and a composition admitted on sections that do not meet or that overlap out of order.
 * @evidence contracts/development/testing.md#independent-expectations Radical lines of two circles, angles by `atan2`, the bisector of two unit vectors by its half angle, and the ellipse's implicit equation, all written here; none reads the operator's polygons.
 * @evidence contracts/development/testing.md#distinguishing-cases An outer section against the middle one with two lobes; a changed size against a changed axis; a circle against an ellipse; four refusals with distinct causes; stale forks against derived ones.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_composed_end`; it evaluates made closed forms in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 9 numbered scenarios it runs, each naming its input, its closed form and its bound.
 */
export function test_construction_composed_end(): void {
  const failures: string[] = [];
  const turn: number = 2 * Math.PI;
  const ellipse = (name: string, x: number, a: number, b: number, axis: V3): IAutoMovieConstructionComposedEnd.ISection => ({
    name,
    axis,
    at: (psi: number): { point: V3; first: V3 } => ({
      point: [x + a * Math.cos(psi), b * Math.sin(psi), 0],
      first: [-a * Math.sin(psi), b * Math.cos(psi), 0],
    }),
  });
  const lean = (angle: number): V3 => [Math.sin(angle), 0, Math.cos(angle)];
  const compose = (sections: IAutoMovieConstructionComposedEnd.ISection[]): IAutoMovieConstructionComposedEnd.IComposition | string =>
    AutoMovieConstructionComposedEnd.create({ point: [0, 0, 0], normal: [0, 0, 1], sections, samples: 32 });
  const base = (): IAutoMovieConstructionComposedEnd.ISection[] => [
    ellipse("A", -14, 9, 9, lean(-0.2)),
    ellipse("B", 0, 9, 9, lean(0)),
    ellipse("C", 14, 9, 9, lean(0.2)),
  ];
  const wrap = (x: number): number => ((x % turn) + turn) % turn;
  const near = (x: number, y: number): number => Math.abs(((x - y + Math.PI) % turn + turn) % turn - Math.PI);
  const off = (p: readonly number[], q: readonly number[]): number => Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);

  const made: IAutoMovieConstructionComposedEnd.IComposition | string = compose(base());
  const y: number = Math.sqrt(32);
  if (typeof made === "string") failures.push(`base: ${made}`);
  else {
    // 1. Forks.
    for (const [j, x] of [[0, -7], [1, 7]] as const) {
      const [first, second] = made.seams[j]!.forks;
      const centres: [number, number] = j === 0 ? [-14, 0] : [0, 14];
      if (!(off(first.point, [x, y, 0]) <= 1e-9 && off(second.point, [x, -y, 0]) <= 1e-9)) failures.push(`forks ${j}: (${first.point.join(", ")}) and (${second.point.join(", ")}), not (${x}, +-${y}, 0)`);
      for (const [fork, side] of [[first, 1], [second, -1]] as const)
        for (const s of [0, 1] as const)
          if (!(near(fork.phases[s], Math.atan2(side * y, x - centres[s]!)) <= 1e-9)) failures.push(`forks ${j}: phase ${fork.phases[s]} on section ${s} is not the angle of (${x}, ${side * y})`);
    }

    // 2. Lobes.
    const t: number = Math.atan2(y, 7);
    const expected: [number, number][][] = [[[t, turn - t]], [[t, Math.PI - t], [Math.PI + t, turn - t]], [[Math.PI + t, turn + Math.PI - t]]];
    expected.forEach((lobes: [number, number][], i: number): void => {
      const got: [number, number][] = made.lobes[i]!;
      if (got.length !== lobes.length) return void failures.push(`lobes ${i}: ${got.length}, not ${lobes.length}`);
      lobes.forEach((lobe: [number, number], k: number): void => {
        if (!(Math.abs(got[k]![0] - lobe[0]) <= 1e-9 && Math.abs(got[k]![1] - lobe[1]) <= 1e-9)) failures.push(`lobes ${i}.${k}: [${got[k]!.join(", ")}], not [${lobe.join(", ")}]`);
      });
    });
    const holds = (i: number, psi: number): boolean => made.lobes[i]!.some(([from, to]: [number, number]): boolean => wrap(psi - from) <= to - from);
    if (![Math.PI / 2, Math.PI, (3 * Math.PI) / 2].every((psi: number): boolean => holds(0, psi))) failures.push("lobes: A's lobe misses one of its own extremes");
    if (!(holds(1, Math.PI / 2) && holds(1, (3 * Math.PI) / 2) && !holds(1, 0) && !holds(1, Math.PI))) failures.push("lobes: B's lobes do not hold exactly its two free extremes");

    // 3. Seam planes.
    const planes: [V3, V3][] = [[[Math.cos(0.1), 0, Math.sin(0.1)], [-Math.sin(0.1), 0, Math.cos(0.1)]], [[Math.cos(0.1), 0, -Math.sin(0.1)], [Math.sin(0.1), 0, Math.cos(0.1)]]];
    planes.forEach(([normal, heading]: [V3, V3], j: number): void => {
      const seam: IAutoMovieConstructionComposedEnd.ISeam = made.seams[j]!;
      if (!(off(seam.normal, normal) <= 1e-12 && off(seam.heading, heading) <= 1e-12)) failures.push(`seam ${j}: normal (${seam.normal.join(", ")}), heading (${seam.heading.join(", ")})`);
      const chord: number[] = [0, 1, 2].map((a: number): number => seam.forks[1].point[a]! - seam.forks[0].point[a]!);
      const dot = (p: readonly number[], q: readonly number[]): number => p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!;
      if (!(Math.abs(dot(seam.normal, chord)) <= 1e-9 && Math.abs(dot(seam.normal, seam.heading)) <= 1e-12)) failures.push(`seam ${j}: its plane does not hold its forks and its heading`);
    });
  }

  // 4. A function of the children, and 6. the red control of a tabulated fork.
  const grown: IAutoMovieConstructionComposedEnd.IComposition | string = compose([ellipse("A", -14, 9, 9, lean(-0.2)), ellipse("B", 0, 11, 11, lean(0)), ellipse("C", 14, 9, 9, lean(0.2))]);
  if (typeof grown === "string") failures.push(`grown: ${grown}`);
  else {
    const x: number = (196 + 81 - 121) / 28 - 14;
    const h: number = Math.sqrt(81 - (x + 14) ** 2);
    if (!(off(grown.seams[0]!.forks[0].point, [x, h, 0]) <= 1e-9 && off(grown.seams[0]!.forks[1].point, [x, -h, 0]) <= 1e-9)) failures.push(`grown: forks (${grown.seams[0]!.forks[0].point.join(", ")}), not (${x}, +-${h}, 0)`);
    const stale: number = Math.abs(Math.hypot(-7, y) - 11);
    const own: number = Math.abs(Math.hypot(grown.seams[0]!.forks[0].point[0], grown.seams[0]!.forks[0].point[1]) - 11);
    if (!(stale >= 1.4 && own <= 1e-9)) failures.push(`red control: the tabulated fork stands ${stale} mm off B's grown section, the composed one ${own}`);
  }
  const leaned: IAutoMovieConstructionComposedEnd.IComposition | string = compose([ellipse("A", -14, 9, 9, lean(-0.5)), ellipse("B", 0, 9, 9, lean(0)), ellipse("C", 14, 9, 9, lean(0.2))]);
  if (typeof leaned === "string") failures.push(`leaned: ${leaned}`);
  else if (!(off(leaned.seams[0]!.normal, [Math.cos(0.25), 0, Math.sin(0.25)]) <= 1e-12)) failures.push(`leaned: seam normal (${leaned.seams[0]!.normal.join(", ")})`);
  const oval: IAutoMovieConstructionComposedEnd.IComposition | string = compose([ellipse("A", -14, 9, 9, lean(-0.2)), ellipse("B", 0, 9, 6, lean(0)), ellipse("C", 14, 9, 9, lean(0.2))]);
  if (typeof oval === "string") failures.push(`oval: ${oval}`);
  else
    for (const seam of oval.seams)
      for (const fork of seam.forks) {
        const [px, py]: [number, number] = [fork.point[0], fork.point[1]];
        const centre: number = px < 0 ? -14 : 14;
        const residual: number = Math.max(Math.abs(Math.hypot(px - centre, py) - 9), Math.abs((px / 9) ** 2 + (py / 6) ** 2 - 1));
        if (!(residual <= 1e-9)) failures.push(`oval: the fork (${px}, ${py}) misses a section by ${residual}`);
      }

  // 5. Refusals by name.
  const refused = (sections: IAutoMovieConstructionComposedEnd.ISection[], word: string, why: string): void => {
    const result: IAutoMovieConstructionComposedEnd.IComposition | string = compose(sections);
    if (typeof result !== "string" || !result.includes(word)) failures.push(`${why}: ${typeof result === "string" ? result : "admitted"}`);
  };
  refused([ellipse("A", -20, 9, 9, lean(0)), ellipse("B", 0, 9, 9, lean(0)), ellipse("C", 20, 9, 9, lean(0))], "cross 0 times", "sections apart");
  refused([ellipse("A", -6, 9, 9, lean(0)), ellipse("B", 0, 9, 9, lean(0)), ellipse("C", 6, 9, 9, lean(0))], "not neighbours", "outer sections overlapping");
  refused([ellipse("A", -14, 9, 9, [0, 1, 0]), ellipse("B", 0, 9, 9, [0, 1, 0])], "runs along the chord", "axes along the chord");
  refused([ellipse("A", -14, 9, 9, lean(0))], "at least two", "one section");

  // 7-8. The outline as one closed curve, and distances to it.
  if (typeof made !== "string") {
    const { pieces, at, distance }: IAutoMovieConstructionComposedEnd.IOutline = made.outline;
    if (pieces.map((p: IAutoMovieConstructionComposedEnd.IPiece): number => p.section).join("") !== "0121") failures.push(`outline: pieces on sections ${pieces.map((p: IAutoMovieConstructionComposedEnd.IPiece): number => p.section).join(", ")}, not 0, 1, 2, 1`);
    let [gap, corner]: [number, number] = [0, Infinity];
    for (let i: number = 0; i < pieces.length; ++i) {
      const [here, next]: [{ point: V3; first: V3 }, { point: V3; first: V3 }] = [at(i + 1 - 1e-13), at((i + 1) % pieces.length)];
      gap = Math.max(gap, off(here.point, next.point));
      // The tangent turns at a fork: the sine of the angle between the two pieces' tangents there.
      const cross: number = here.first[0] * next.first[1] - here.first[1] * next.first[0];
      corner = Math.min(corner, Math.abs(cross) / (Math.hypot(here.first[0], here.first[1]) * Math.hypot(next.first[0], next.first[1])));
      if (!([y, -y].some((side: number): boolean => off(next.point, [-7, side, 0]) <= 1e-9 || off(next.point, [7, side, 0]) <= 1e-9))) failures.push(`outline: piece ${i} ends at (${next.point.join(", ")}), not at a fork`);
    }
    if (!(gap <= 1e-9 && corner > 0.5)) failures.push(`outline: pieces stand ${gap} mm apart at the forks and turn by a sine of only ${corner}`);
    const middle: { point: V3; first: V3; second?: V3 } = at(0.5);
    if (!(off(middle.point, [-23, 0, 0]) <= 1e-9 && off(middle.first, [0, -9 * (turn - 2 * Math.atan2(y, 7)), 0]) <= 1e-9)) failures.push(`outline: the first piece's middle is (${middle.point.join(", ")}) with the derivative (${middle.first.join(", ")})`);
    let own: number = 0;
    for (let k: number = 0; k < 97; ++k) own = Math.max(own, distance(at((4 * (k + 0.37)) / 97).point));
    if (!(own <= 1e-9)) failures.push(`outline: its own points stand ${own} mm off it`);
    // A circle of radius 23 about the origin stands 23 - 9 off B's lobe at the phase pi / 2 and touches A's and C's extremes; a point
    // above the valley stands hypot(7, 8) - 9 off A's lobe, not its distance to the covered arc of either circle.
    const cases: [V3, number][] = [[[0, 23, 0], 14], [[23, 0, 0], 0], [[-23, 0, 0], 0], [[-7, 8, 0], Math.hypot(7, 8) - 9], [[0, 0, 0], 9]];
    for (const [point, expected] of cases)
      if (!(Math.abs(distance(point) - expected) <= 1e-9)) failures.push(`outline: (${point.join(", ")}) stands ${distance(point)} mm off, not ${expected}`);
  }

  const pair = compose([ellipse("left", -7, 9, 9, lean(0)), ellipse("right", 7, 9, 9, lean(0))]);
  if (typeof pair === "string") failures.push("two-circle distance witness: " + pair);
  else {
    const listen = (point: V3) => {
      let sites: readonly IAutoMovieConstructionComposedEnd.IOutlineDistanceSite[] = [];
      const observed: number = pair.outline.distance(point, (rows): void => { sites = rows; });
      if (observed !== pair.outline.distance(point)) failures.push("requesting distance witnesses changed the actual distance");
      return { observed, sites };
    };
    const interior = listen([-19, 0, 0]);
    if (Math.abs(interior.observed - 3) > 1e-9 || !interior.sites.some((site): boolean =>
        site.settled && site.share > 0 && site.share < 1 &&
        off(pair.outline.at(site.piece + site.share).point, [-16, 0, 0]) <= 1e-9))
      failures.push("the known left-circle interior foot was not witnessed");
    const corner = listen([0, 1, 0]);
    if (Math.abs(corner.observed - (y - 1)) > 1e-9 || !corner.sites.some((site): boolean =>
        (site.share === 0 || site.share === 1) && site.forks[site.share] === 0))
      failures.push("the known upper shared fork was not witnessed");
    const equal = listen([0, 12, 0]);
    if (Math.abs(equal.observed - (Math.hypot(7, 12) - 9)) > 1e-9 ||
        new Set(equal.sites.map((site): number => pair.outline.pieces[site.piece]!.section)).size !== 2)
      failures.push("the equal nearest branches lost one of their distinct child identities");
    const step: number = 1e-5, slope: number = -7 / Math.hypot(7, 12);
    const winner = equal.sites[0];
    if (winner !== undefined) {
      const witness: number = pair.outline.pieces[winner.piece]!.section === 0 ? slope : 0;
      for (const sign of [-1, 1]) {
        const moved = compose([ellipse("left", -7 + step * sign, 9, 9, lean(0)), ellipse("right", 7, 9, 9, lean(0))]);
        if (typeof moved === "string") failures.push("tied outline lost its two regular crossings");
        else {
          const direction: number = (moved.outline.distance([0, 12, 0]) - equal.observed) / step;
          if (Math.abs(direction - Math.min(sign * slope, 0)) > 1e-5 || direction > sign * witness + 1e-5)
            failures.push("the tied distance's directional response escaped its fixed-branch witness");
        }
      }
    }
  }

  if (failures.length !== 0) throw new Error("test_construction_composed_end:\n" + failures.join("\n"));
}
