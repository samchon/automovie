import type {
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPortLoop,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionWidth,
  IAutoMovieSolidIntersection,
} from "@automovie/interface";
import { realizeAutoMovieConstruction } from "@automovie/engine";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A join that declares its loop is realized through the construction tree: the declared curve is the contact, the body is drawn as one
 * two-manifold skin, and a broken premise reaches the diagnostics by name with the host standing.
 *
 * Made inputs, metres: a post of radius 0.015 along `+z` on a beam of radius 0.03 along `+x`, as `test_construction_merge` builds them.
 * Their meeting above the beam is the Steinmetz curve; on the beam's chart (station `x + 0.1`, phase `theta` from `+z` toward `+y`) it is
 * `(x / r)^2 + (R sin(theta) / r)^2 = 1`, so the declared loop is the ellipse of semi-axes `r` and `asin(r / R)` about `[0.1, 0]` with, at
 * each column's clock, the share at which its ray meets that curve, found here by bisection on the closed form. The fold's turn at the
 * post's phase `phi` has `cos(beta) = r cos(phi)^2 / R`, between 60 and 90 degrees, so every point is on a fold arc.
 *
 * Scenarios:
 * 1. Both widths `fold` with radius 0.004 m, cap 0.006 m and reach 0.001 m: no diagnostic; the join is published with the loop's 48
 *    points on both cylinders within the section spline's bound; at the quarter clocks, where the section square to the curve cuts
 *    the cylinders in lines or in the beam's circle, both chords are the reach in quadrature with the rolling ball's closed form; in
 *    the drawn mesh no edge has more than two triangles and every edge with one lies on an open end of the beam or the post's top.
 * 2. The loop moved 1 mm along the beam: one `shared loop` diagnostic naming the join, no join published, and the mesh still drawn.
 * 3. A `station` part width on the loop: one `width` diagnostic.
 * 4. A fold reach of zero: refused at admission, before any work.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes each tree with `realizeAutoMovieConstruction` and reads its diagnostics, its published join and its mesh. It catches a declared loop that the tree ignores or traces instead, a loop read on the wrong chart, a width not read from the surfaces, a torn or doubled skin along the blend, and a refusal that is lost, misnamed or leaves a partial join.
 * @evidence contracts/development/testing.md#independent-expectations The Steinmetz curve, the turn's cosine and the ball's tangent length are closed forms of the two cylinders. The realized cylinders are periodic cubic splines through 16 points per section, so points are held to that spline's bound (`ConstructionChecks.sectionSpline`) and chords to the turn's change over it, 1e-3 of the chord. The mesh expectation is the definition of a two-manifold with boundary.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the declared Steinmetz loop. Negative: the moved loop, the station width and the zero reach. The tangent arcs, the run-out, the frames and the kernel's own refusals belong to `test_construction_operator_mixed_join`; the record's units and senses to `test_construction_operator_shared_loop`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_mixed_join`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the made cylinders, the loop's closed form and the four numbered scenarios with the behavior each pins.
 */
export function test_construction_mixed_join(): void {
  const failures: string[] = [];
  const R: number = 0.03;
  const r: number = 0.015;
  const count: number = 48;
  const semi: [number, number] = [r, Math.asin(r / R)];

  /** The share along a clock's ray at which it meets the Steinmetz curve on the beam's chart. */
  const share = (c: number): number => {
    let lo: number = 0;
    let hi: number = 2;
    for (let i: number = 0; i < 200; ++i) {
      const mid: number = (lo + hi) / 2;
      if (((mid * semi[0] * Math.cos(c)) / r) ** 2 + ((R * Math.sin(mid * semi[1] * Math.sin(c))) / r) ** 2 < 1) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const loop = (centre: number): IAutoMovieConstructionPortLoop => ({
    centre: [centre, 0],
    semi,
    sense: 1,
    shape: Array.from({ length: count }, (_: unknown, k: number): number => share((2 * Math.PI * k) / count)),
  });
  const fold = (reach: number): IAutoMovieConstructionWidth => ({ type: "fold", radius: 0.004, cap: 0.006, reach });
  const tree = (declared: IAutoMovieConstructionPortLoop, part: IAutoMovieConstructionWidth, host: IAutoMovieConstructionWidth): IAutoMovieConstructionJoin => {
    const beam: IAutoMovieConstructionNode = ConstructionShapes.cylinder("beam", { origin: { x: -0.1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } }, R, 0.2);
    const post: IAutoMovieConstructionNode = ConstructionShapes.cylinder("post", { origin: { x: 0, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 } }, r, 0.08);
    return {
      type: "join",
      kind: "merge",
      name: "blend.post",
      host: beam,
      part: post,
      seed: { type: "point", partFace: "post", hostFace: "beam", part: [R, Math.PI / 2], host: [0.1 + r, 0] },
      parameter: { type: "phase" },
      partWidth: part,
      hostWidth: host,
      continuity: "G2",
      count,
      rows: 4,
      tolerance: 3e-5,
      grazing: 0.05,
      loop: declared,
    };
  };
  const realize = (root: IAutoMovieConstructionJoin): IAutoMovieConstructionRealization.IRealization => realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });

  /** The drawn mesh as a two-manifold whose free edges lie on the beam's two ends or the post's top. */
  const skin = (label: string, real: IAutoMovieConstructionRealization.IRealization): void => {
    const p: number[] = real.mesh.positions;
    let far: number = 0;
    let top: number = 0;
    for (let i: number = 0; i < p.length; i += 3) [far, top] = [Math.max(far, Math.abs(p[i]!)), Math.max(top, p[i + 2]!)];
    const open = (v: number): boolean => Math.abs(Math.abs(p[3 * v]!) - far) <= 1e-6 * far || Math.abs(p[3 * v + 2]! - top) <= 1e-6 * top;
    const edges: Map<string, number> = new Map();
    const indices: number[] = real.mesh.indices;
    for (let i: number = 0; i < indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = indices[i + k]!;
        const b: number = indices[i + ((k + 1) % 3)]!;
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    let crowded: number = 0;
    let free: number = 0;
    for (const [key, uses] of edges) {
      const [a, b]: number[] = key.split(":").map(Number);
      if (uses > 2) ++crowded;
      else if (uses === 1 && !(open(a!) && open(b!))) ++free;
    }
    if (indices.length === 0) failures.push(`${label}: nothing was drawn`);
    if (crowded !== 0) failures.push(`${label}: ${crowded} edges of the drawn mesh carry more than two triangles`);
    if (free !== 0) failures.push(`${label}: ${free} free edges of the drawn mesh lie off the open ends`);
  };

  // 1. The declared Steinmetz loop.
  const real: IAutoMovieConstructionRealization.IRealization = realize(tree(loop(0.1), fold(0.001), fold(0.001)));
  if (real.diagnostics.length !== 0) failures.push(`declared loop: diagnostics: ${ConstructionRead.diagnostics(real)}`);
  if (real.joins.length !== 1) failures.push(`declared loop: ${real.joins.length} joins published, expected one`);
  else {
    const joined: IAutoMovieConstructionRealization.IJoin = real.joins[0]!;
    const bound: number = ConstructionChecks.sectionSpline(R, 16);
    if (joined.join.curve.points.length !== count) failures.push(`declared loop: ${joined.join.curve.points.length} points, expected ${count}`);
    for (const q of joined.join.curve.points as IAutoMovieSolidIntersection.IPoint[]) {
      const [x, y, z]: number[] = q.point.map((v: number): number => v / 1000);
      const post: number = Math.abs(Math.hypot(x!, y!) - r);
      const beam: number = Math.abs(Math.hypot(y!, z!) - R);
      if (post > 2 * bound || beam > bound) failures.push(`declared loop: the point at clock ${q.t} stands ${post} m off the post and ${beam} m off the beam`);
      const law: { host: number; part: number | null } = joined.join.widths(q.t);
      if (!(law.host > 0) || law.part === null || !(law.part > 0)) failures.push(`declared loop: a chord is not positive at clock ${q.t}: host ${law.host} mm, part ${law.part} mm`);
    }

    // The chords at the quarter clocks, millimetres. At clocks 0 and pi the section square to the curve cuts both cylinders along
    // generators, a wedge of a quarter turn, so both chords are the ball's tangent length 4 tan(pi / 4). At pi / 2 and 3 pi / 2 it cuts
    // the post along a generator and the beam in its circle of radius 30: the ball's centre stands 19 from the beam's axis plane and 34
    // from the axis, the post's contact level with it and the beam's on the line to the axis.
    const up: number = Math.sqrt(34 * 34 - 19 * 19);
    const edge: number = Math.sqrt(30 * 30 - 15 * 15);
    const curved: { host: number; part: number } = {
      host: Math.hypot(1, Math.hypot((30 * 19) / 34 - 15, (30 * up) / 34 - edge)),
      part: Math.hypot(1, up - edge),
    };
    const flat: { host: number; part: number } = { host: Math.hypot(1, 4), part: Math.hypot(1, 4) };
    [flat, curved, flat, curved].forEach((want: { host: number; part: number }, quarter: number): void => {
      const law: { host: number; part: number | null } = joined.join.widths((Math.PI * quarter) / 2);
      if (Math.abs(law.host - want.host) > 1e-3 * want.host || law.part === null || Math.abs(law.part - want.part) > 1e-3 * want.part)
        failures.push(`declared loop: chords at clock ${(Math.PI * quarter) / 2}: host ${law.host} mm, part ${law.part} mm, expected ${want.host} mm and ${want.part} mm`);
    });
  }
  skin("declared loop", real);

  // 2 and 3. Refusals that reach the diagnostics, with the host standing.
  for (const [label, contract, root] of [
    ["moved loop", "shared loop", tree(loop(0.101), fold(0.001), fold(0.001))],
    ["station width", "width", tree(loop(0.1), { type: "station", value: 0.04 }, fold(0.001))],
  ] as [string, string, IAutoMovieConstructionJoin][]) {
    const refused: IAutoMovieConstructionRealization.IRealization = realize(root);
    if (refused.joins.length !== 0) failures.push(`${label}: a join was published`);
    if (!(refused.diagnostics.length === 1 && refused.diagnostics[0]!.node === "blend.post" && refused.diagnostics[0]!.contract === contract))
      failures.push(`${label}: expected one ${contract} diagnostic of blend.post, got ${ConstructionRead.diagnostics(refused) || "none"}`);
    skin(label, refused);
  }

  // 4. A reach of zero is refused at admission.
  let thrown: string = "";
  try {
    realize(tree(loop(0.1), fold(0), fold(0.001)));
  } catch (error: unknown) {
    thrown = error instanceof Error ? error.message : String(error);
  }
  if (!thrown.includes("fold reach")) failures.push(`zero reach: expected the admission's fold reach refusal, got "${thrown}"`);
  if (failures.length !== 0) throw new Error(`${failures.length} tree mixed join failures:\n${failures.join("\n")}`);
}
