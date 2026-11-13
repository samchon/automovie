import {
  type AutoMovieConstructionRealization,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A split with further seams (`IAutoMovieConstructionSplit.outer`) realizes one open end of its host as three children's loops side by side, each spanned to its child's rail by a band, every seam shared by the two bands beside it, the whole skin watertight.
 *
 * Fixture (metres, the `DOWN` frame: chart `u = +x`, `v = +y`, stations advancing along `-z`): the host `trunk` is the body of revolution of radius `0.025 sqrt(1 - (s / 0.08)^2)` over stations `[-0.06, 0.03]`, open at both ends, its top end at `z = -0.03` a circle of radius `R = 25 sqrt(1 - (30 / 80)^2)` mm. Seam 0 is the chord `x = +8` mm, host phases `[-t, t]` with `t = acos(8 / R)`; seam 1 the chord `x = -8` mm, phases `[t - pi, pi - t]`, enclosing it. Child `f.0` (the cap `x > 8`) hangs from `z = -0.03` at `x = +0.0165`, `f.1` (the strip between the chords) at `x = 0`, `f.2` (the cap `x < -8`) at `x = -0.0165`, each of radius 0.007 over `[0, 0.06]`; each rail is 0.02 m into its child. Columns 32, rows 4.
 *
 * Scenarios:
 * 1. No diagnostic; the body's faces are exactly the host, the three children and the three bands.
 * 2. Loops: every band's station-0 point on an arc lies on the host's end circle and on a seam on its chord (`x = +8` or `x = -8` mm), within 1e-6 mm; the middle band has points on both chords and on both arcs, `y > 0` and `y < 0`.
 * 3. G1 across each seam: on a seam's inner columns the two bands beside it leave the shared point along opposite directions square to the chord in the end plane, `(+1, 0, 0)` for the band on the side `x` grows and `(-1, 0, 0)` for the other, within 1e-9.
 * 4. The skin is watertight: every edge is used by exactly two triangles except the edges on the four free ends (`z = 0.06` and `z = -0.09` m), and none by more.
 * 5. Refusals: an outer seam that does not enclose seam 0 and a split with two children for two seams are refused by admission.
 * 6. Red: without its further seams the same tree realizes two bands, not three.
 * 7. Correspondence by length (`IChild.correspondence`): the same tree with every child matched by arclength share realizes with no diagnostic.
 * 8. Heading (`IProfile.heading`): seam 0 curved with one knot 4 mm deep at its middle and the heading `(0.6, 0, -0.8)` stands in the plane through its chord that holds the heading, its points within 1e-6 mm of it, and leaves the plane `x = 8` mm that the end normal alone would give by more than 1 mm.
 * 9. Correspondence by length starts where the loop and the rail stand closest: with child `f.0` hung 4 mm aside (`y = 0.004`), its band's loop and rail points, each about its own centroid and read in the rail's plane `z = const`, turn by less than 3 degrees on average (anchored by its first point's angle about the rail's centroid, 6.6 degrees).
 * 10. Rows as fine as the loop's columns at the loop: every band's mesh has a row of its own vertices no farther from its loop, along its station, than its loop's columns stand apart on average, and short of a quarter of its span (on rows `length / rows` apart the first stood 5.4 to 5.9 mm off against columns 3.1 to 3.7 mm apart).
 * 11. Reach (`IProfile.reach`): the headed tree of scenario 8 on 96 columns folds, read every 1/384 turn and 1/40 of each band's span where a normal flips from its neighbour's, in 77 clocks with its ribbons at their whole length; with them kept at a quarter at each fork, in fewer than a quarter as many (8). A reach of 0 is refused by admission.
 * 12. Square (`IProfile.square`): on a host with a shrinking elliptic section, whose station lines lean along its ring, the outer bands' arc columns away from the forks leave the loop leaning along it (a cosine of 0.046 with the ring's tangent) on the station line, and square to it (within 1e-6) with `square`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the tree with `realizeAutoMovieConstruction` and reads the bands' realized surfaces and the skin mesh. It catches a loop that leaves the host's ring or a seam, a seam read twice instead of shared (an open skin), a band ruled across a seam in the wrong direction and a split that ignores its further seams; any band whose loop is its arcs and its seams and that shares every seam passes.
 * @evidence contracts/development/testing.md#independent-expectations Points come from the fixture's closed forms at the host's knot station, where the view loft's section is the exact circle (ConstructionShapes), and from the chords' equations; the ruling from the node contract (the seam plane's normal toward the band, square to the chord in the end plane); watertightness from the manifold rule. Oracle limit: between columns the band is the strip's B-spline and is not asserted here.
 * @evidence contracts/development/testing.md#distinguishing-cases The middle child, the only one with two arcs and two seams, against the outer ones; two refusals at admission and a red reading without the further seam; a child hung aside against centred ones, and a band's rows near its loop against those near its rail.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_split_fan`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 12 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: No diagnostic; the body's faces are exactly the host, the three children and the three bands.).
 */
export function test_construction_split_fan(): void {
  const failures: string[] = [];
  const n: number = 32;
  const turn: number = 2 * Math.PI;
  const R: number = 25 * Math.sqrt(1 - (30 / 80) ** 2);
  const t: number = Math.acos(8 / R);
  const host: AutoMovieConstructionNode = ConstructionShapes.part(
    "trunk",
    ConstructionShapes.DOWN,
    ConstructionShapes.uniform(-0.06, 0.03, 13),
    (s: number): [number, number, number, number] => {
      const r: number = 0.025 * Math.sqrt(1 - (s / 0.08) ** 2);
      return [r, r, r, r];
    },
    "open",
  );
  const finger = (name: string, x: number): AutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      { ...ConstructionShapes.DOWN, origin: { x, y: 0, z: -0.03 } },
      ConstructionShapes.uniform(0, 0.06, 7),
      (): [number, number, number, number] => [0.007, 0.007, 0.007, 0.007],
      "open",
    );
  const child = (name: string, x: number): IAutoMovieConstructionSplit.IChild => ({
    band: "band." + name,
    part: finger(name, x),
    partFace: name,
    partEnd: "bottom",
    rail: 0.02,
  });
  const split = (options: { outer?: IAutoMovieConstructionSplit.ISeam[]; children?: IAutoMovieConstructionSplit.IChild[] }): IAutoMovieConstructionSplit => ({
    type: "split",
    name: "split.fan",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    seam: [-t, t],
    ...(options.outer === undefined ? {} : { outer: options.outer }),
    count: n,
    rows: 4,
    children: (options.children ?? [child("f.0", 0.0165), child("f.1", 0), child("f.2", -0.0165)]) as IAutoMovieConstructionSplit["children"],
  });
  const realize = (root: AutoMovieConstructionNode): AutoMovieConstructionRealization.IRealization => realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const outer: IAutoMovieConstructionSplit.ISeam[] = [{ seam: [t - Math.PI, Math.PI - t] }];

  // 1. The positive tree.
  const real: AutoMovieConstructionRealization.IRealization = realize(split({ outer }));
  if (real.diagnostics.length !== 0) failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  if (names !== "band.f.0,band.f.1,band.f.2,f.0,f.1,f.2,trunk") failures.push(`faces: ${names}`);

  // 2-3. Every band's loop and its ruling on the seams.
  if (real.diagnostics.length === 0)
    for (const name of ["band.f.0", "band.f.1", "band.f.2"]) {
      const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
      const sides: Set<string> = new Set();
      for (let k: number = 0; k < n; ++k) {
        const j: IAutoMovieSolidSurface.IJet = band.jet(0, (turn * k) / n);
        const [x, y, z] = [j.p[0]!, j.p[1]!, j.p[2]!];
        const onCircle: boolean = Math.abs(Math.hypot(x, y) - R) <= 1e-6 && Math.abs(z + 30) <= 1e-6;
        const onChord: number = Math.abs(x - 8) <= 1e-6 ? 1 : Math.abs(x + 8) <= 1e-6 ? -1 : 0;
        if (!onCircle && onChord === 0) failures.push(`${name} column ${k}: (${x}, ${y}, ${z}) mm is on neither the host's ring nor a seam`);
        if (onCircle) sides.add(y > 1e-6 ? "arc+" : y < -1e-6 ? "arc-" : "arc0");
        if (onChord !== 0 && !onCircle) {
          sides.add("seam" + onChord);
          // The ruling: square to the chord in the end plane, toward the band's own side of the seam.
          const length: number = Math.hypot(j.u[0]!, j.u[1]!, j.u[2]!);
          const own: number = name === "band.f.0" ? 1 : name === "band.f.2" ? -1 : -onChord;
          const off: number = Math.hypot(j.u[0]! / length - own, j.u[1]! / length, j.u[2]! / length);
          if (!(off <= 1e-9)) failures.push(`${name} column ${k}: its ruling across seam x = ${8 * onChord} mm stands ${off} off (${own}, 0, 0)`);
        }
      }
      if (name === "band.f.1" && !["arc+", "arc-", "seam1", "seam-1"].every((s: string): boolean => sides.has(s))) failures.push(`band.f.1's loop holds only ${[...sides].join(", ")}`);
    }

  // 4. Watertight skin.
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let i: number = 0; i + 2 < ix.length; i += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[i + e]!;
      const b: number = ix[i + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free = (v: number): boolean => [0.06, -0.09].some((z: number): boolean => Math.abs(real.mesh.positions[3 * v + 2]! - z) < 1e-7);
  let open: number = 0;
  let over: number = 0;
  for (const [key, count] of uses) {
    if (count > 2) ++over;
    if (count === 1 && !key.split(",").every((v: string): boolean => free(Number(v)))) ++open;
  }
  if (open !== 0 || over !== 0) failures.push(`skin: ${open} open edges away from the free ends, ${over} edges in more than two triangles`);

  // 5. Refusals at admission.
  const refused = (root: IAutoMovieConstructionSplit, why: string): void => {
    try {
      realize(root);
      failures.push(`${why} was admitted`);
    } catch {
      // refused as expected
    }
  };
  refused(split({ outer: [{ seam: [-t / 2, Math.PI - t] }] }), "an outer seam inside seam 0");
  refused(split({ outer, children: [child("f.0", 0.0165), child("f.2", -0.0165)] }), "two children for two seams");

  // 7. Correspondence by length: every child matched by arclength share realizes with no diagnostic.
  const lengthwise: AutoMovieConstructionRealization.IRealization = realize(split({ outer, children: [child("f.0", 0.0165), child("f.1", 0), child("f.2", -0.0165)].map((c: IAutoMovieConstructionSplit.IChild): IAutoMovieConstructionSplit.IChild => ({ ...c, correspondence: "length" })) }));
  if (lengthwise.diagnostics.length !== 0) failures.push(`length correspondence: ${ConstructionRead.diagnostics(lengthwise)}`);

  // 8. Heading: seam 0 curved in the plane that holds the chord and the heading (0.6, 0, -0.8), whose normal is (-0.8, 0, -0.6).
  const half: number = Math.sqrt(R * R - 64);
  const headed: AutoMovieConstructionRealization.IRealization = realize({
    ...split({ outer, children: [child("f.0", 0.0165), child("f.1", 0), child("f.2", -0.0165)].map((c: IAutoMovieConstructionSplit.IChild): IAutoMovieConstructionSplit.IChild => ({ ...c, correspondence: "length" })) }),
    profile: { knots: [[half / 1000, 0.004]], corner: 0.3, heading: [0.6, 0, -0.8] },
  });
  if (headed.diagnostics.length !== 0) failures.push(`heading: ${ConstructionRead.diagnostics(headed)}`);
  else {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(headed, "band.f.0");
    let off: number = 0;
    let lean: number = 0;
    for (let k: number = (3 * n) / 4 + 1; k < n; ++k) {
      const p: readonly number[] = band.jet(0, (turn * k) / n).p;
      // Band f.0's last quarter of columns runs on seam 0: distance from the plane through the fork (8, -half, -30) with that normal.
      off = Math.max(off, Math.abs(-0.8 * (p[0]! - 8) - 0.6 * (p[2]! + 30)));
      lean = Math.max(lean, p[0]! - 8);
    }
    if (!(off <= 1e-6)) failures.push(`heading: the seam stands ${off} mm off its plane`);
    if (!(lean > 1)) failures.push(`heading: the seam leaves the chord's plane x = 8 mm by only ${lean} mm`);
  }

  // 9. Correspondence by length starts where the loop and the rail stand closest: with child f.0 hung 4 mm aside, its band's loop and
  // rail points, each about its own centroid and projected on the rail's plane, turn by less than 3 degrees on average.
  const aside: AutoMovieConstructionRealization.IRealization = realize(split({ outer, children: [{ ...child("f.0", 0.0165), part: ConstructionShapes.part("f.0", { ...ConstructionShapes.DOWN, origin: { x: 0.0165, y: 0.004, z: -0.03 } }, ConstructionShapes.uniform(0, 0.06, 7), (): [number, number, number, number] => [0.007, 0.007, 0.007, 0.007], "open"), correspondence: "length" }, child("f.1", 0), child("f.2", -0.0165)] }));
  if (aside.diagnostics.length !== 0) failures.push(`aside: ${ConstructionRead.diagnostics(aside)}`);
  else {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(aside, "band.f.0");
    const length: number = band.domain![1];
    const loop: number[][] = Array.from({ length: n }, (_: unknown, k: number): number[] => [...band.jet(0, (turn * k) / n).p]);
    const rail: number[][] = Array.from({ length: n }, (_: unknown, k: number): number[] => [...band.jet(length, (turn * k) / n).p]);
    const centre = (q: number[][]): number[] => [0, 1, 2].map((a: number): number => q.reduce((s: number, p: number[]): number => s + p[a]!, 0) / q.length);
    const [cl, cr] = [centre(loop), centre(rail)];
    // The rail lies in the plane z = -30 - 20 mm, so its plane's normal is z and the angle is read in x and y.
    let sum: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const [ux, uy] = [loop[k]![0]! - cl[0]!, loop[k]![1]! - cl[1]!];
      const [vx, vy] = [rail[k]![0]! - cr[0]!, rail[k]![1]! - cr[1]!];
      sum += (Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy) * 180) / Math.PI;
    }
    if (!(Math.abs(sum / n) < 3)) failures.push(`aside: band.f.0 turns ${(sum / n).toFixed(2)} degrees on average between its loop and its rail`);
  }

  // 10. Rows as fine as the loop's columns at the loop: in the positive tree, every band's mesh has vertices of its own off its loop no
  // farther from the loop, along its station, than the loop's columns stand apart on average, and its rows grow toward the rail.
  for (const name of ["band.f.0", "band.f.1", "band.f.2"]) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    const owner: number = real.mesh.owners.indexOf(name);
    let perimeter: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const [p, q] = [band.jet(0, (turn * k) / n).p, band.jet(0, (turn * (k + 1)) / n).p];
      perimeter += Math.hypot(q[0]! - p[0]!, q[1]! - p[1]!, q[2]! - p[2]!);
    }
    const rows: number[] = [];
    for (let v: number = 0; 3 * v < real.mesh.coordinates.length; ++v) if (real.mesh.coordinates[3 * v] === owner && real.mesh.coordinates[3 * v + 1]! > 1e-9) rows.push(real.mesh.coordinates[3 * v + 1]!);
    const first: number = Math.min(...rows);
    if (!(first <= (1 + 1e-9) * (perimeter / n) && first < band.domain![1] / 4)) failures.push(`${name}: its first row stands ${first.toFixed(3)} mm from its loop, its columns ${(perimeter / n).toFixed(3)} mm apart`);
  }
  // 11. Reach: the headed tree's bands, their ribbons kept at a quarter of their length at each fork, fold in fewer clocks than with
  // their whole length, read every 1/384 turn and 1/40 of each band's span where the normal flips from its neighbour's.
  const folds = (r: AutoMovieConstructionRealization.IRealization): number => {
    let count: number = 0;
    const normal = (s: IAutoMovieSolidSurface, w: number, c: number): number[] => {
      const j: IAutoMovieSolidSurface.IJet = s.jet(w, c);
      return [j.u[1]! * j.v[2]! - j.u[2]! * j.v[1]!, j.u[2]! * j.v[0]! - j.u[0]! * j.v[2]!, j.u[0]! * j.v[1]! - j.u[1]! * j.v[0]!];
    };
    const dot = (a: number[], b: number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    for (const name of ["band.f.0", "band.f.1", "band.f.2"]) {
      const s: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
      const L: number = s.domain![1];
      for (let k: number = 0; k < 384; ++k) {
        const c: number = (turn * k) / 384;
        let before: number[] = normal(s, 0.001 * L, c);
        for (let i: number = 0; i < 40; ++i) {
          const here: number[] = normal(s, (L * (i + 0.5)) / 40, c);
          if (dot(here, before) < 0 || dot(here, normal(s, (L * (i + 0.5)) / 40, c + turn / 1536)) < 0) {
            ++count;
            break;
          }
          before = here;
        }
      }
    }
    return count;
  };
  const fine: AutoMovieConstructionRealization.IRealization = realize({
    ...split({ outer, children: [child("f.0", 0.0165), child("f.1", 0), child("f.2", -0.0165)].map((c: IAutoMovieConstructionSplit.IChild): IAutoMovieConstructionSplit.IChild => ({ ...c, correspondence: "length" })) }),
    count: 96,
    profile: { knots: [[half / 1000, 0.004]], corner: 0.3, heading: [0.6, 0, -0.8] },
  });
  const reached: AutoMovieConstructionRealization.IRealization = realize({
    ...split({ outer, children: [child("f.0", 0.0165), child("f.1", 0), child("f.2", -0.0165)].map((c: IAutoMovieConstructionSplit.IChild): IAutoMovieConstructionSplit.IChild => ({ ...c, correspondence: "length" })) }),
    count: 96,
    profile: { knots: [[half / 1000, 0.004]], corner: 0.3, heading: [0.6, 0, -0.8], reach: 0.25 },
  });
  if (reached.diagnostics.length !== 0) failures.push(`reach: ${ConstructionRead.diagnostics(reached)}`);
  else {
    const [whole, quarter] = [folds(fine), folds(reached)];
    if (!(whole > 0 && quarter * 4 < whole)) failures.push(`reach: ${whole} folded clocks at the whole length, ${quarter} at a quarter`);
  }
  refused({ ...split({ outer }), profile: { knots: [[half / 1000, 0.004]], corner: 0.3, reach: 0 } }, "a reach of 0");

  // 12. Square (`IProfile.square`): on a host whose elliptic section (half extents r and 0.6 r) shrinks along its course, a point at a
  // fixed polar phase moves radially, which on an ellipse is not square to its ring, so the station line leans along the ring. Without
  // `square` the outer bands' arc columns away from the forks leave the loop leaning along it (the cosine between a column's start and
  // the ring exceeds 0.02 somewhere: 0.046); with it every such column leaves square to the loop (within 1e-6).
  const oval: AutoMovieConstructionNode = ConstructionShapes.part("trunk", ConstructionShapes.DOWN, ConstructionShapes.uniform(-0.06, 0.03, 13), (s: number): [number, number, number, number] => {
    const r: number = 0.025 * Math.sqrt(1 - (s / 0.08) ** 2);
    return [r, 0.6 * r, r, 0.6 * r];
  }, "open");
  const lean = (square: boolean): number | string => {
    const made: AutoMovieConstructionRealization.IRealization = realize({ ...split({ outer }), host: oval, profile: { knots: [[0.002, 0.002]], corner: 0.3, ...(square ? { square } : {}) } });
    if (made.diagnostics.length !== 0) return ConstructionRead.diagnostics(made);
    let most: number = 0;
    const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(made, "trunk");
    for (const [name, from] of [["band.f.0", -t], ["band.f.2", Math.PI - t]] as const) {
      const band: IAutoMovieSolidSurface = ConstructionRead.surface(made, name);
      // Arc columns 3 to 21 of 32 stand at least 0.59 rad of clock from either fork, outside the corner turn's 0.3. The arc's 24
      // columns stand at equal steps of host phase over its 2 t, and the ring's tangent there is the host's own phase derivative.
      for (let k: number = 3; k <= 21; ++k) {
        const u: readonly number[] = band.jet(0, (turn * k) / n).u;
        const v: readonly number[] = trunk.jet(30, from + (2 * t * k) / 24).v;
        const cosine: number = (u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!) / (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(v[0]!, v[1]!, v[2]!));
        most = Math.max(most, Math.abs(cosine));
      }
    }
    return most;
  };
  const [leaning, squared] = [lean(false), lean(true)];
  if (typeof leaning === "string" || typeof squared === "string") failures.push(`square: ${String(leaning)} / ${String(squared)}`);
  else if (!(leaning > 0.02 && squared <= 1e-6)) failures.push(`square: arc columns lean along the loop by a cosine of ${leaning} on the station line and ${squared} square to the ring`);
  // 6. Red: without its further seam the tree has two bands.
  const red: AutoMovieConstructionRealization.IRealization = realize(split({ children: [child("f.0", 0.0165), child("f.2", -0.0165)] }));
  if (red.body.faces.filter((f: { chain: string }): boolean => f.chain.startsWith("band.")).length !== 2) failures.push("red: a two-way split did not realize two bands");

  if (failures.length !== 0) throw new Error("test_construction_split_fan:\n" + failures.join("\n"));
}
