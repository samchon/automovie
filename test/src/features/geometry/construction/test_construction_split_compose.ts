import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitCompose,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { AutoMovieConstructionSplitCompose, AutoMovieConstructionViews, AutoMovieLoftFrame, AutoMovieViewLoft, realizeAutoMovieConstruction } from "@automovie/engine";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A split whose end is composed of its children (`IAutoMovieConstructionSplit.compose`) takes its forks, its seams' planes and valleys and every child's rail from the children's own skins, shares each seam between its two bands at every clock, and a child's declared `cut` lands its band on the skin's curve in that surface instead of on a station ring.
 *
 * Fixture (metres, the `DOWN` frame, stations advancing along `-z`): cylinders of radius 0.009 over stations `[-0.012, 0.06]` cross the plane `z = -0.03` at their station 0: `f.0` about `(0.015, 0, -0.03)` leaning by `b` toward `+x` (axis `(sin b, 0, -cos b)`), `f.1` about `(0, 0, -0.03)` straight down, `f.2` the mirror of `f.0`; `b = 0.3`. Closed forms in millimetres: in the end plane `f.0`'s section is `((x - 15) cos b)^2 + y^2 = 81` and `f.1`'s `x^2 + y^2 = 81`, which cross at `x* = 15 cos b / (1 + cos b)`, `y* = +-sqrt(81 - x*^2)`; the seam plane between them holds the `y` direction and the bisector `(sin(b / 2), 0, -cos(b / 2))`, so its normal from `f.0` toward `f.1` is `N = (-cos(b / 2), 0, -sin(b / 2))`; `f.1`'s skin meets that plane on its own cylinder, deepest at `(9 - x*) / tan(b / 2)` below the end plane; a child's rail planes are the end plane and its seam planes moved 6 mm along the child's axis. The host `trunk` has elliptic sections over stations `[-0.06, 0.03]` whose open top end, in the plane `z = -0.03`, has the half extents 24.5 mm and `y* / sqrt(1 - (x* / 24.5)^2)`, so its ring passes through the four forks and stands within the rail's 6 mm of the composed outline. The authored seams are placeholders, `[-1, 1]` and `[-2.4, 2.4]`; composed rails 0.006 with rounding 0.001, authored station rails 0.018 from each child's facing end (the same 6 mm past the end plane), 32 columns, 4 rows.
 *
 * Scenarios:
 * 1. Composed, no diagnostic: the faces are the host, the three children and the three bands, and the skin is watertight away from the four free ends.
 * 2. Forks follow the children: `band.f.0`'s two forks stand at `x = x*`, `z = -30` and `band.f.2`'s at `x = -x*`, within 1e-6 mm, although the authored phases put them elsewhere. Red control, the same tree without `compose`: `band.f.0`'s first fork stands more than 0.3 mm off `x*`.
 * 3. Seams are the children's valleys in the bisector planes: `band.f.0`'s and `band.f.2`'s seam columns lie in their seam planes within 1e-6 mm, leave along the planes' normals away from the middle child (`(+-cos(b / 2), 0, sin(b / 2))`) within 1e-9, stand within 0.3 mm of `f.1`'s cylinder (the seam's spline between its seven valley knots) and reach more than 0.9 of the valley's depth. Red control without `compose`: the seam is the chord in the end plane, depth 0, up to more than 1 mm inside the cylinder, ruled more than 0.1 off the normal.
 * 4. One seam, two bands: at the eight mid-column shares of seam 0, `band.f.0`'s and `band.f.1`'s loop points agree within 1e-9 mm and their clock derivatives are opposite within 1e-9 of their length. Red control, an authored curved seam without `compose` (one knot 6 mm deep, 12 mm along the chord), on the roomier host of half extents 27.8 and 12.5 mm that the authored trees stand on: the two bands' own interpolations stand apart there by more than 1e-7 mm.
 * 5. Rails are the children's skins cut by the moved planes: at every column and midway between columns the end edge of `band.f.1` lies on the cylinder `x^2 + y^2 = 81` and on the zero set of the smooth minimum of its three plane distances, and `band.f.0`'s on that of its two, each evaluated here from the closed forms, within 1e-7 mm. Red control without `compose`: `band.f.1`'s station ring leaves that zero set by more than 1 mm.
 * 6. A hard-edged derived rail: the same tree without `round` realizes with no diagnostic and `band.f.1`'s end edge lies on the zero set of the plain minimum of its three plane distances within 1e-7 mm at columns and between them.
 * 7. A function of the children's frames: with `b = 0.45`, the host's ring through the new forks and the plane written in the tree's frame, the forks stand at the new `x*`, within 1e-6 mm.
 * 8. A profile under `compose` carries the ribbons only: with `{ knots: [], corner: 0.3 }` the tree realizes with no diagnostic; with a knot, and with a heading, it is refused at admission as a conflict.
 * 9. Refusals by name, each one diagnostic that leaves the host alone: children 20 mm apart (`cross 0 times`); children whose stations start past the end plane (`not admitted in the end plane`); children that do not lean, so their skins never part (`never enters`); a host whose ring, of half extents 34 and 16 mm, stands farther from the outline than the rail (`from the composed outline`).
 * 10. A split in two under `compose`: `f.0` and `f.2` about `(+-0.0075, 0, -0.03)` on a host of half extents 17 mm and `sqrt(81 - (7.5 cos b)^2)`; no diagnostic; both forks stand at `x = 0`; the seam's columns lie in the plane `x = 0` within 1e-6 mm, within 0.3 mm of `f.0`'s skin there (`y^2 + (d sin b + 7.5 cos b)^2 = 81` at the depth `d`) and reach 0.9 of its depth `(9 - 7.5 cos b) / sin b`; `band.f.0`'s end edge lies on the zero set of the smooth minimum of its end plane and seam plane distances within 1e-7 mm.
 * 12. A composed split whose host is a composed split's child, as a palm that parts from a wrist and is itself parted into fingers: the split in two of scenario 10 with `f.0` carrying a second composed split at its far end, 60 mm along its axis, into `g.0` and `g.1`, cylinders of radius 7 about the points 3.5 mm either side of `f.0`'s axis along its first section axis, leaning 0.3 rad apart from it either way. No diagnostic; the faces hold both splits' bands; the outer forks still stand at `x = 0`; the two sections `((U -+ 3.5) cos 0.3)^2 + V^2 = 49` cross in `f.0`'s end plane on the line `U = 0`, so the inner seam plane is that line's plane through `f.0`'s axis and the inner forks stand where it meets `f.0`'s end ring, on the axis in the first section axis and 9 mm either side along the second, within 1e-6 mm.
 * 11. A declared `cut` without `compose`: `f.1`'s rail cut by the plane through its facing end frame's point `(0, 0, 0.018)` with the normal `(0.3, 0, 1)` in that frame (third axis into the child) puts `band.f.1`'s end edge on that plane within 1e-7 mm at columns and between them. Red control, the station rail of the same tree: the end edge stands more than 2 mm off the plane.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes made trees with `realizeAutoMovieConstruction` and reads the bands' realized surfaces, the skin mesh and the diagnostics. It catches forks left at their authored phases, a seam left on its chord or ruled in the end plane, a seam each band interpolates for itself, a rail left on a station ring or interpolated between columns, a composition that ignores a child's frame, a host ring spanned silently and a refused composition that leaves a partial split.
 * @evidence contracts/development/testing.md#independent-expectations The crossing of a leaning cylinder's section with a circle, the bisector of two axes by its half angle, a cylinder's cut by a plane, the planes moved along an axis and their minimum are written here from the fixture's closed forms; watertightness is the manifold rule. Oracle limit: between its valley knots the seam is the spline through them, so its distance from the cylinder is bounded, not zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Composed against authored on one tree; an outer child against the middle one; rounded against hard-edged rails; three children against two; two lean angles and both plane frames; four refusals with distinct causes and two conflicts; a cut rail against a station rail.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_split_compose`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 12 numbered scenarios it runs, each naming its input, its closed form and its bound.
 */
export function test_construction_split_compose(): void {
  const failures: string[] = [];
  const n: number = 32;
  const turn: number = 2 * Math.PI;
  const RAIL: number = 6;
  const fork = (lean: number): number => (15 * Math.cos(lean)) / (1 + Math.cos(lean));
  /** A host whose top end, at station 0.03, is the ellipse of the given half extents, mm. */
  const trunk = (rx: number, ry: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      "trunk",
      ConstructionShapes.DOWN,
      ConstructionShapes.uniform(-0.06, 0.03, 13),
      (s: number): [number, number, number, number] => {
        const q: number = Math.sqrt(1 - (s / 0.08) ** 2) / Math.sqrt(1 - (0.03 / 0.08) ** 2) / 1000;
        return [rx * q, ry * q, rx * q, ry * q];
      },
      "open",
    );
  /** The host through the three-way composition's forks. */
  const through = (lean: number): IAutoMovieConstructionNode => trunk(24.5, Math.sqrt(81 - fork(lean) ** 2) / Math.sqrt(1 - (fork(lean) / 24.5) ** 2));
  const finger = (name: string, x: number, lean: number, from: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      { origin: { x, y: 0, z: -0.03 }, u: { x: Math.cos(lean), y: 0, z: Math.sin(lean) }, v: { x: 0, y: 1, z: 0 } },
      ConstructionShapes.uniform(from, 0.06, 10),
      (): [number, number, number, number] => [0.009, 0.009, 0.009, 0.009],
      "open",
    );
  interface IOptions {
    lean: number;
    spacing?: number;
    from?: number;
    host?: IAutoMovieConstructionNode;
    two?: boolean;
    compose?: IAutoMovieConstructionSplit.ICompose | null;
    profile?: IAutoMovieConstructionSplit.IProfile;
    cut?: IAutoMovieConstructionSplit.ICut;
  }
  const split = (o: IOptions): IAutoMovieConstructionSplit => {
    const spacing: number = o.spacing ?? (o.two === true ? 0.0075 : 0.015);
    const child = (name: string, x: number, lean: number): IAutoMovieConstructionSplit.IChild => ({
      band: "band." + name,
      part: finger(name, x, lean, o.from ?? -0.012),
      partFace: name,
      partEnd: "bottom",
      // Composed, the rail planes stand 6 mm along the child from the end plane; authored, the station ring stands 18 mm from the
      // child's facing end, the same 6 mm past the end plane.
      rail: (o.compose === null ? 12 + RAIL : RAIL) / 1000,
      correspondence: "length",
      ...(o.cut !== undefined && name === "f.1" ? { cut: o.cut } : {}),
    });
    return {
      type: "split",
      name: "split.composed",
      host: o.host ?? through(o.lean),
      hostFace: "trunk",
      hostEnd: "top",
      seam: [-1, 1],
      ...(o.profile === undefined ? {} : { profile: o.profile }),
      ...(o.two === true ? {} : { outer: [{ seam: [-2.4, 2.4] }] }),
      count: n,
      rows: 4,
      children: o.two === true ? [child("f.0", spacing, o.lean), child("f.2", -spacing, -o.lean)] : [child("f.0", spacing, o.lean), child("f.1", 0, 0), child("f.2", -spacing, -o.lean)],
      ...(o.compose === null ? {} : { compose: o.compose ?? { frame: "host", plane: { point: [0, 0, 0], normal: [0, 0, 1] }, round: 0.001 } }),
    };
  };
  const realize = (root: IAutoMovieConstructionNode): IAutoMovieConstructionRealization.IRealization => realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  /** The minimum, smooth with the rounding 1 mm or plain, of plane distances at a point; each plane a point and a kept normal, moved RAIL along an axis. */
  const minimum = (planes: [V3, V3][], axis: V3, p: readonly number[], smooth: boolean): number => {
    const g: number[] = planes.map(([q, normal]: [V3, V3]): number => dot(normal, [p[0]! - q[0] - RAIL * axis[0], p[1]! - q[1] - RAIL * axis[1], p[2]! - q[2] - RAIL * axis[2]]));
    return smooth ? -Math.log(g.reduce((sum: number, x: number): number => sum + Math.exp(-x), 0)) : Math.min(...g);
  };
  /** A child's residual in the three-way composition: `f.0` (0) or `f.1` (1). */
  const residual = (which: 0 | 1, lean: number, p: readonly number[], smooth: boolean = true): number => {
    const [c2, s2]: [number, number] = [Math.cos(lean / 2), Math.sin(lean / 2)];
    const end: [V3, V3] = [[0, 0, -30], [0, 0, -1]];
    return which === 0
      ? minimum([end, [[fork(lean), 0, -30], [c2, 0, s2]]], [Math.sin(lean), 0, -Math.cos(lean)], p, smooth)
      : minimum([end, [[fork(lean), 0, -30], [-c2, 0, -s2]], [[-fork(lean), 0, -30], [c2, 0, -s2]]], [0, 0, -1], p, smooth);
  };
  const clocks: number[] = Array.from({ length: 2 * n }, (_: unknown, k: number): number => (turn * k) / (2 * n));
  const end = (r: IAutoMovieConstructionRealization.IRealization, name: string, c: number): readonly number[] => {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    return band.jet(band.domain![1], c).p;
  };
  const loop = (r: IAutoMovieConstructionRealization.IRealization, name: string, k: number): IAutoMovieSolidSurface.IJet => ConstructionRead.surface(r, name).jet(0, (turn * k) / n);
  const b: number = 0.3;
  const [c2, s2]: [number, number] = [Math.cos(b / 2), Math.sin(b / 2)];
  const apex: number = (9 - fork(b)) / Math.tan(b / 2);

  // The engine keeps the child intersection and the host ring crossing as different owned coordinates on one seam plane.
  const childY = Math.sqrt(81 - fork(b) ** 2), hostY = childY * 1.02;
  const separated = split({ lean: b, host: trunk(24.5, hostY / Math.sqrt(1 - (fork(b) / 24.5) ** 2)) });
  const physical = (node: IAutoMovieConstructionNode, top: boolean, sign: 1 | -1) => {
    if (node.type !== "view") throw new Error("the made fixture lost its original view");
    const view = AutoMovieConstructionViews.part(node);
    if (typeof view === "string") throw new Error(view);
    const { chain, surface, diagnostics } = AutoMovieViewLoft.create(view);
    if (chain === null || surface?.domain === undefined)
      throw new Error(diagnostics.map((row) => row.detail).join(", "));
    const layer = chain.layers[top ? chain.layers.length - 1 : 0]!;
    const basis = AutoMovieConstructionSplitCompose.basis(layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y), sign);
    if (basis === null) throw new Error("the made split lost its physical plane");
    return { surface, station: layer.y, basis, stations: chain.layers.map((row) => row.y) };
  };
  const host = physical(separated.host, true, 1), compose = separated.compose!;
  const children = separated.children.map((row): IAutoMovieConstructionSplitCompose.IChild =>
    ({ ...physical(row.part, false, 1), name: row.partFace, into: 1, rail: 1000 * row.rail }));
  const plane = AutoMovieConstructionSplitCompose.plane(compose.plane, host.basis)!;
  const prepared = children.map((child) => {
    const out = AutoMovieConstructionSplitCompose.section(plane, child, separated.count);
    if (typeof out === "string") throw new Error(out);
    return out;
  });
  const input = { compose, host, children, count: separated.count };
  const distinct = AutoMovieConstructionSplitCompose.derive(input, prepared);
  if (typeof distinct === "string") failures.push(distinct);
  else {
    const child = distinct.composition.seams[0]!.forks.map((f) => f.point);
    const parent = distinct.seams[0]!.map((angle) => host.surface.jet(host.station, angle).p);
    if (child.some((p) => Math.abs(Math.abs(p[1]) - childY) > 1e-6 || Math.abs(p[0] - fork(b)) > 1e-6) ||
        parent.some((p) => Math.abs(Math.abs(p[1]) - hostY) > 1e-6 || Math.abs(p[0] - fork(b)) > 1e-6))
      failures.push("the same physical seam plane lost one of its distinct original fork coordinates");
  }
  if (typeof AutoMovieConstructionSplitCompose.derive(input, [...prepared].reverse()) !== "string")
    failures.push("prepared sections from different ordered wall identities were reused");

  // 1. The composed tree.
  const real: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b }));
  // The authored trees stand on a roomier host, of half extents 27.8 and 12.5 mm, which holds the children's station rings.
  const roomy: IAutoMovieConstructionNode = trunk(27.8, 12.5);
  const plain: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b, compose: null, host: roomy }));
  if (plain.diagnostics.length !== 0) failures.push(`without compose: ${ConstructionRead.diagnostics(plain)}`);
  if (real.diagnostics.length !== 0) failures.push(`composed: ${ConstructionRead.diagnostics(real)}`);
  else {
    const names: string = real.body.faces
      .map((f: { chain: string }): string => f.chain)
      .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
      .join(",");
    if (names !== "band.f.0,band.f.1,band.f.2,f.0,f.1,f.2,trunk") failures.push(`faces: ${names}`);
    const uses: Map<string, number> = new Map();
    const ix: number[] = real.mesh.indices;
    for (let i: number = 0; i + 2 < ix.length; i += 3)
      for (let e: number = 0; e < 3; ++e) {
        const [p, q]: [number, number] = [ix[i + e]!, ix[i + ((e + 1) % 3)]!];
        const key: string = p < q ? `${p},${q}` : `${q},${p}`;
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }
    // The free ends: the host's bottom at z = 0.06 and each child's far end, 60 mm along its axis from the end plane.
    const free = (v: number): boolean => {
      const p: number[] = [0, 1, 2].map((a: number): number => 1000 * real.mesh.positions[3 * v + a]!);
      return Math.abs(p[2]! - 60) < 1e-4 || [[15, b], [0, 0], [-15, -b]].some(([x, lean]: number[]): boolean => Math.abs(dot([Math.sin(lean!), 0, -Math.cos(lean!)], [p[0]! - x!, p[1]!, p[2]! + 30]) - 60) < 1e-4);
    };
    let [open, over]: [number, number] = [0, 0];
    for (const [key, count] of uses) {
      if (count > 2) ++over;
      if (count === 1 && !key.split(",").every((v: string): boolean => free(Number(v)))) ++open;
    }
    if (open !== 0 || over !== 0) failures.push(`skin: ${open} open edges away from the free ends, ${over} edges in more than two triangles`);
  }

  // 2-3. Forks, seam planes, rulings and valleys, composed against authored.
  /** A band's seam columns: the greatest distance off the seam plane, off the normal's ruling and inside `f.1`'s cylinder, and the greatest depth. */
  const seam = (r: IAutoMovieConstructionRealization.IRealization, name: string, sign: number): { plane: number; ruling: number; skin: number; depth: number } => {
    const out: { plane: number; ruling: number; skin: number; depth: number } = { plane: 0, ruling: 0, skin: 0, depth: 0 };
    for (let k: number = (3 * n) / 4 + 1; k < n; ++k) {
      const j: IAutoMovieSolidSurface.IJet = loop(r, name, k);
      const length: number = Math.hypot(j.u[0], j.u[1], j.u[2]);
      out.plane = Math.max(out.plane, Math.abs(dot([-sign * c2, 0, -s2], [j.p[0] - sign * fork(b), j.p[1], j.p[2] + 30])));
      out.ruling = Math.max(out.ruling, Math.hypot(j.u[0] / length - sign * c2, j.u[1] / length, j.u[2] / length - s2));
      out.skin = Math.max(out.skin, Math.abs(Math.hypot(j.p[0], j.p[1]) - 9));
      out.depth = Math.max(out.depth, -(j.p[2] + 30));
    }
    return out;
  };
  if (real.diagnostics.length === 0)
    for (const [name, sign] of [["band.f.0", 1], ["band.f.2", -1]] as const) {
      for (const k of [0, (3 * n) / 4]) {
        const p: readonly number[] = loop(real, name, k).p;
        if (!(Math.abs(p[0]! - sign * fork(b)) <= 1e-6 && Math.abs(p[2]! + 30) <= 1e-6)) failures.push(`${name} column ${k}: its fork (${p.join(", ")}) mm is not at x = ${sign * fork(b)}, z = -30`);
      }
      const s: { plane: number; ruling: number; skin: number; depth: number } = seam(real, name, sign);
      if (!(s.plane <= 1e-6 && s.ruling <= 1e-9 && s.skin <= 0.3 && s.depth > 0.9 * apex)) failures.push(`${name}: its seam stands ${s.plane} mm off the bisector plane, is ruled ${s.ruling} off its normal, stands ${s.skin} mm off f.1's cylinder and reaches ${s.depth} of ${apex} mm`);
    }
  if (plain.diagnostics.length === 0) {
    const s: { plane: number; ruling: number; skin: number; depth: number } = seam(plain, "band.f.0", 1);
    const first: number = Math.abs(loop(plain, "band.f.0", 0).p[0] - fork(b));
    if (!(first > 0.3 && s.ruling > 0.1 && s.depth < 1e-6 && s.skin > 1)) failures.push(`red control: without compose the fork stands ${first} mm off x*, the seam is ruled ${s.ruling} off the normal, reaches ${s.depth} mm and stands ${s.skin} mm off the cylinder`);
  }

  // 4. One seam, two bands: band.f.0 reads seam 0 on its columns 24 to 32 from its far fork back, band.f.1 on its columns 8 to 16 forward.
  const apart = (r: IAutoMovieConstructionRealization.IRealization): { point: number; tangent: number } => {
    const [outer, inner]: [IAutoMovieSolidSurface, IAutoMovieSolidSurface] = [ConstructionRead.surface(r, "band.f.0"), ConstructionRead.surface(r, "band.f.1")];
    const out: { point: number; tangent: number } = { point: 0, tangent: 0 };
    for (let i: number = 0; i < n / 4; ++i) {
      const share: number = (i + 0.5) / (n / 4);
      const [p, q]: [IAutoMovieSolidSurface.IJet, IAutoMovieSolidSurface.IJet] = [outer.jet(0, (turn * (n - (n / 4) * share)) / n), inner.jet(0, (turn * (n / 4 + (n / 4) * share)) / n)];
      out.point = Math.max(out.point, Math.hypot(p.p[0] - q.p[0], p.p[1] - q.p[1], p.p[2] - q.p[2]));
      out.tangent = Math.max(out.tangent, Math.hypot(p.v[0] + q.v[0], p.v[1] + q.v[1], p.v[2] + q.v[2]) / Math.hypot(q.v[0], q.v[1], q.v[2]));
    }
    return out;
  };
  if (real.diagnostics.length === 0) {
    const shared: { point: number; tangent: number } = apart(real);
    if (!(shared.point <= 1e-9 && shared.tangent <= 1e-9)) failures.push(`shared seam: between columns the two bands stand ${shared.point} mm apart and their tangents differ by ${shared.tangent}`);
  }
  const chordHalf: number = Math.sqrt(81 - fork(b) ** 2);
  const authored: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b, compose: null, host: roomy, profile: { knots: [[0.012, 0.006]], corner: 0.3 } }));
  if (authored.diagnostics.length !== 0) failures.push(`authored curved seam: ${ConstructionRead.diagnostics(authored)}`);
  else if (!(apart(authored).point > 1e-7)) failures.push(`red control: each band's own interpolation of an authored seam stands only ${apart(authored).point} mm apart between columns`);

  // 5. Rails on the children's cut skins, at columns and between them.
  if (real.diagnostics.length === 0) {
    let [middle, outer, radius]: [number, number, number] = [0, 0, 0];
    for (const c of clocks) {
      const p: readonly number[] = end(real, "band.f.1", c);
      middle = Math.max(middle, Math.abs(residual(1, b, p)));
      radius = Math.max(radius, Math.abs(Math.hypot(p[0]!, p[1]!) - 9));
      outer = Math.max(outer, Math.abs(residual(0, b, end(real, "band.f.0", c))));
    }
    if (!(middle <= 1e-7 && outer <= 1e-7 && radius <= 1e-7)) failures.push(`rails: band.f.1's end edge leaves its cut by ${middle} mm and its cylinder by ${radius}, band.f.0's its cut by ${outer}`);
  }
  if (plain.diagnostics.length === 0) {
    const ring: number = Math.max(...clocks.map((c: number): number => Math.abs(residual(1, b, end(plain, "band.f.1", c)))));
    if (!(ring > 1)) failures.push(`red control: the station ring leaves the cut by only ${ring} mm`);
  }

  // 6. A hard-edged derived rail.
  const hard: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b, compose: { frame: "host", plane: { point: [0, 0, 0], normal: [0, 0, 1] } } }));
  if (hard.diagnostics.length !== 0) failures.push(`hard-edged rail: ${ConstructionRead.diagnostics(hard)}`);
  else {
    const off: number = Math.max(...clocks.map((c: number): number => Math.abs(residual(1, b, end(hard, "band.f.1", c), false))));
    if (!(off <= 1e-7)) failures.push(`hard-edged rail: band.f.1's end edge leaves the plain minimum's zero set by ${off} mm`);
  }

  // 7. A function of the children's frames, the plane in the tree's frame.
  const wide: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: 0.45, compose: { frame: "tree", plane: { point: [0, 0, -0.03], normal: [0, 0, -1] }, round: 0.001 } }));
  if (wide.diagnostics.length !== 0) failures.push(`lean 0.45: ${ConstructionRead.diagnostics(wide)}`);
  else
    for (const [name, sign] of [["band.f.0", 1], ["band.f.2", -1]] as const) {
      const x: number = loop(wide, name, 0).p[0];
      if (!(Math.abs(x - sign * fork(0.45)) <= 1e-6)) failures.push(`lean 0.45: ${name}'s fork stands at x = ${x}, not ${sign * fork(0.45)}`);
    }

  // 8. A profile under compose carries the ribbons only.
  const turned: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b, profile: { knots: [], corner: 0.3 } }));
  if (turned.diagnostics.length !== 0) failures.push(`profile without knots: ${ConstructionRead.diagnostics(turned)}`);
  for (const [what, profile] of [["a knot", { knots: [[chordHalf / 1000, 0.006]], corner: 0.3 }], ["a heading", { knots: [], corner: 0.3, heading: [0, 0, -1] }]] as [string, IAutoMovieConstructionSplit.IProfile][])
    try {
      realize(split({ lean: b, profile }));
      failures.push(`a profile with ${what} under compose was admitted`);
    } catch (error: unknown) {
      if (!(error instanceof Error && error.message.includes("conflict"))) failures.push(`a profile with ${what} under compose was refused without naming the conflict: ${String(error)}`);
    }

  // 9. Refusals by name.
  const refused = (o: IOptions, word: string, why: string): void => {
    const r: IAutoMovieConstructionRealization.IRealization = realize(split(o));
    const text: string = ConstructionRead.diagnostics(r);
    if (!(r.diagnostics.length === 1 && text.includes(word))) failures.push(`${why}: ${r.diagnostics.length} diagnostics: ${text}`);
    if (r.body.faces.some((f: { chain: string }): boolean => f.chain !== "trunk")) failures.push(`${why}: the refused split left faces beside the host`);
  };
  refused({ lean: b, spacing: 0.02 }, "cross 0 times", "children apart");
  refused({ lean: b, from: 0.002 }, "not admitted in the end plane", "children past the end plane");
  refused({ lean: 0, host: through(b) }, "never enters", "children that never part");
  refused({ lean: b, host: trunk(34, 16) }, "from the composed outline", "a host ring off the outline");

  // 10. A split in two under compose: the seam plane is x = 0 and f.0's skin meets it where y^2 + (d sin b + 7.5 cos b)^2 = 81.
  const pair: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b, two: true, host: trunk(17, Math.sqrt(81 - (7.5 * Math.cos(b)) ** 2)) }));
  if (pair.diagnostics.length !== 0) failures.push(`split in two: ${ConstructionRead.diagnostics(pair)}`);
  else {
    const deep: number = (9 - 7.5 * Math.cos(b)) / Math.sin(b);
    let [plane, skin, depth, rail]: [number, number, number, number] = [0, 0, 0, 0];
    for (const k of [0, n / 2]) plane = Math.max(plane, Math.abs(loop(pair, "band.f.0", k).p[0]));
    for (let k: number = n / 2 + 1; k < n; ++k) {
      const p: readonly number[] = loop(pair, "band.f.0", k).p;
      const d: number = -(p[2]! + 30);
      plane = Math.max(plane, Math.abs(p[0]!));
      skin = Math.max(skin, Math.abs(Math.hypot(p[1]!, d * Math.sin(b) + 7.5 * Math.cos(b)) - 9));
      depth = Math.max(depth, d);
    }
    for (const c of clocks) rail = Math.max(rail, Math.abs(minimum([[[0, 0, -30], [0, 0, -1]], [[0, 0, -30], [1, 0, 0]]], [Math.sin(b), 0, -Math.cos(b)], end(pair, "band.f.0", c), true)));
    if (!(plane <= 1e-6 && skin <= 0.3 && depth > 0.9 * deep && rail <= 1e-7)) failures.push(`split in two: forks and seam ${plane} mm off x = 0, the seam ${skin} mm off f.0's skin reaching ${depth} of ${deep} mm, the rail ${rail} mm off its cut`);
  }

  // 12. A composed split whose host is a composed split's child.
  const tip: V3 = [0.0075 + 0.06 * Math.sin(b), 0, -0.03 - 0.06 * Math.cos(b)];
  const twig = (name: string, side: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      { origin: { x: tip[0] + side * 0.0035 * Math.cos(b), y: 0, z: tip[2] + side * 0.0035 * Math.sin(b) }, u: { x: Math.cos(b + side * 0.3), y: 0, z: Math.sin(b + side * 0.3) }, v: { x: 0, y: 1, z: 0 } },
      ConstructionShapes.uniform(-0.012, 0.04, 8),
      (): [number, number, number, number] => [0.007, 0.007, 0.007, 0.007],
      "open",
    );
  const outer: IAutoMovieConstructionSplit = split({ lean: b, two: true, host: trunk(17, Math.sqrt(81 - (7.5 * Math.cos(b)) ** 2)) });
  const inner: IAutoMovieConstructionSplit = {
    type: "split",
    name: "split.inner",
    host: outer.children[0].part,
    hostFace: "f.0",
    hostEnd: "top",
    seam: [-1, 1],
    count: n,
    rows: 4,
    children: [
      { band: "band.g.0", part: twig("g.0", 1), partFace: "g.0", partEnd: "bottom", rail: RAIL / 1000, correspondence: "length" },
      { band: "band.g.1", part: twig("g.1", -1), partFace: "g.1", partEnd: "bottom", rail: RAIL / 1000, correspondence: "length" },
    ],
    compose: { frame: "host", plane: { point: [0, 0, 0], normal: [0, 0, 1] }, round: 0.001 },
  };
  const nested: IAutoMovieConstructionRealization.IRealization = realize({ ...outer, children: [{ ...outer.children[0], part: inner }, outer.children[1]] });
  if (nested.diagnostics.length !== 0) failures.push(`nested split: ${ConstructionRead.diagnostics(nested)}`);
  else {
    const faces: string[] = nested.body.faces.map((f: { chain: string }): string => f.chain);
    for (const name of ["band.f.0", "band.f.2", "band.g.0", "band.g.1", "g.0", "g.1", "f.0", "f.2", "trunk"]) if (!faces.includes(name)) failures.push(`nested split: no face ${name}`);
    let plane: number = 0;
    for (const k of [0, n / 2]) plane = Math.max(plane, Math.abs(loop(nested, "band.f.0", k).p[0]));
    if (!(plane <= 1e-6)) failures.push(`nested split: the outer forks stand ${plane} mm off x = 0`);
    if (faces.includes("band.g.0")) {
      // The sections cross at U = 0, so the seam plane is f.0's own plane U = 0 and meets f.0's end ring, of radius 9, at V = +-9.
      const cross: number = 9;
      for (const k of [0, n / 2]) {
        const p: readonly number[] = loop(nested, "band.g.0", k).p;
        const off: number = Math.hypot(p[0]! - 1000 * tip[0], Math.abs(p[1]!) - cross, p[2]! - 1000 * tip[2]);
        if (!(off <= 1e-6)) failures.push(`nested split: band.g.0's fork at column ${k} (${p.join(", ")}) mm stands ${off} mm off the seam plane's crossing of the host's ring`);
      }
    }
  }

  // 11. A declared cut without compose.
  const declared: IAutoMovieConstructionSplit.ICut = { frame: "part", planes: [{ point: [0, 0, 0.018], normal: [0.3, 0, 1] }] };
  const cut: IAutoMovieConstructionRealization.IRealization = realize(split({ lean: b, compose: null, host: roomy, cut: declared }));
  // In the kernel's millimetres: f.1's facing end stands 12 mm above the end plane, at z = -18, its third axis -z, so the plane passes
  // through (0, 0, -36) with the normal (0.3, 0, -1) / |.|.
  const away = (p: readonly number[]): number => Math.abs(dot([0.3, 0, -1], [p[0]!, p[1]!, p[2]! + 36])) / Math.hypot(0.3, 1);
  if (cut.diagnostics.length !== 0) failures.push(`cut: ${ConstructionRead.diagnostics(cut)}`);
  else {
    const off: number = Math.max(...clocks.map((c: number): number => away(end(cut, "band.f.1", c))));
    if (!(off <= 1e-7)) failures.push(`cut: band.f.1's end edge stands ${off} mm off the declared plane`);
  }
  if (plain.diagnostics.length === 0) {
    const off: number = Math.max(...clocks.map((c: number): number => away(end(plain, "band.f.1", c))));
    if (!(off > 2)) failures.push(`red control: the station rail stands only ${off} mm off the declared plane`);
  }

  if (failures.length !== 0) throw new Error("test_construction_split_compose:\n" + failures.join("\n"));
}
