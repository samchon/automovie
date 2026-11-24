import { realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

/**
 * A `split` whose end is composed of its children (`compose`) takes its forks,
 * its seams' planes and valleys and every child's rail from the children's own
 * skins, shares each seam between its two bands at every clock, and a child's
 * declared `cut` lands its band on the skin's curve in that surface instead of
 * on a station ring.
 *
 * Fixture (metres, the `DOWN` frame, stations advancing along -z): cylinders of
 * radius 0.009 over the stations [-0.012, 0.06] cross the plane z = -0.03 at
 * their station 0: `f.0` about (0.015, 0, -0.03) leaning by b toward +x (axis
 * (sin b, 0, -cos b)), `f.1` straight down about (0, 0, -0.03), `f.2` the
 * mirror of `f.0`; b = 0.3. In millimetres, the end plane sections `((x - 15)
 * cos b)^2 + y^2 = 81` and `x^2 + y^2 = 81` cross at x* = 15 cos b / (1 + cos
 * b), y* = +-sqrt(81 - x*^2); the seam plane between them holds the y direction
 * and the bisector (sin(b / 2), 0, -cos(b / 2)), its normal from f.0 toward f.1
 * (-cos(b / 2), 0, -sin(b / 2)); `f.1`'s skin meets it deepest at (9 - x*) /
 * tan(b / 2) below the end plane; a child's rail planes are the end plane and
 * its seam planes moved 6 mm along the child's axis. The host `trunk` has
 * elliptic sections whose open top end has the half extents 24.5 mm and y* /
 * sqrt(1 - (x* / 24.5)^2), so its ring passes through the four forks. Authored
 * seams are placeholders, [-1, 1] and [-2.4, 2.4]; composed rails 0.006 with
 * rounding 0.001; 32 columns, 4 rows.
 *
 * Scenarios:
 *
 * 1. Composed, no diagnostic: the faces are the host, the three children and the
 *    three bands, and the skin is watertight away from the four free ends.
 * 2. Forks follow the children: `band.f.0`'s forks stand at x = x*, z = -30 and
 *    `band.f.2`'s at x = -x*, within 1e-6 mm. Without `compose`, `band.f.0`'s
 *    first fork stands more than 0.3 mm off x*.
 * 3. Seams are the children's valleys in the bisector planes: the seam columns lie
 *    in the planes within 1e-6 mm, leave along the planes' normals within 1e-9,
 *    stand within 0.3 mm of `f.1`'s cylinder and reach more than 0.9 of the
 *    valley's depth. Without `compose` the seam is the chord in the end plane:
 *    depth 0, more than 1 mm inside the cylinder, ruled more than 0.1 off the
 *    normal.
 * 4. One seam, two bands: at the eight mid-column shares of seam 0 the bands' loop
 *    points agree within 1e-9 mm and their clock derivatives are opposite; an
 *    authored curved seam without `compose` does not (apart by more than
 *    1e-7).
 * 5. At every column and between columns `band.f.1`'s end edge lies on the
 *    cylinder x^2 + y^2 = 81 and on the zero set of the smooth minimum of its
 *    three plane distances, `band.f.0`'s on that of its two, within 1e-7 mm;
 *    the station ring without `compose` leaves that zero set by more than 1
 *    mm.
 * 6. Without `round`, `band.f.1`'s end edge lies on the zero set of the plain
 *    minimum of its three plane distances within 1e-7 mm.
 * 7. With b = 0.45 and the plane written in the tree's frame the forks stand at
 *    the new x* within 1e-6 mm.
 * 8. A profile with no knots under `compose` is admitted; one with a knot, and one
 *    with a heading, are refused naming the conflict.
 * 9. Refusals by name, one diagnostic each, leaving only the host: children 20 mm
 *    apart ("cross 0 times"), children starting past the end plane ("not
 *    admitted in the end plane"), children that do not lean ("never enters"), a
 *    host ring of half extents 34 and 16 mm ("from the composed outline").
 * 10. A split in two (f.0 and f.2 about x = +-0.0075 on a host of half extents 17
 *     and sqrt(81 - (7.5 cos b)^2) mm): no diagnostic, both forks at x = 0, the
 *     seam columns in the plane x = 0 within 1e-6 mm and within 0.3 mm of
 *     `f.0`'s skin, reaching 0.9 of its depth (9 - 7.5 cos b) / sin b, and
 *     `band.f.0`'s end edge on the zero set of the smooth minimum of its end
 *     plane and seam plane.
 * 11. A declared `cut` without `compose`, the plane through (0, 0, 0.018) with
 *     normal (0.3, 0, 1) in `f.1`'s facing frame, puts `band.f.1`'s end edge on
 *     that plane within 1e-7 mm; the station rail stands more than 2 mm off
 *     it.
 * 12. A composed split whose host is a composed split's child (a palm parted into
 *     fingers): no diagnostic, faces for both splits' bands and children, outer
 *     forks at x = 0, and the inner forks where the seam plane U = 0 meets the
 *     host's end ring, 9 mm either side.
 */
export function test_unit_engine_geometry_construction_split_compose(): void {
  type V3 = [number, number, number];
  const n: number = 32;
  const turn: number = 2 * Math.PI;
  const RAIL: number = 6;
  const check = (label: string, ok: boolean): void =>
    TestValidator.predicate(label, ok);
  const fork = (lean: number): number =>
    (15 * Math.cos(lean)) / (1 + Math.cos(lean));
  const trunk = (rx: number, ry: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      "trunk",
      ConstructionShapes.DOWN,
      ConstructionShapes.uniform(-0.06, 0.03, 13),
      (s: number): [number, number, number, number] => {
        const q: number =
          Math.sqrt(1 - (s / 0.08) ** 2) /
          Math.sqrt(1 - (0.03 / 0.08) ** 2) /
          1000;
        return [rx * q, ry * q, rx * q, ry * q];
      },
      "open",
    );
  const through = (lean: number): IAutoMovieConstructionNode =>
    trunk(
      24.5,
      Math.sqrt(81 - fork(lean) ** 2) / Math.sqrt(1 - (fork(lean) / 24.5) ** 2),
    );
  const finger = (
    name: string,
    x: number,
    lean: number,
    from: number,
  ): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      {
        origin: { x, y: 0, z: -0.03 },
        u: { x: Math.cos(lean), y: 0, z: Math.sin(lean) },
        v: { x: 0, y: 1, z: 0 },
      },
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
    const child = (
      name: string,
      x: number,
      lean: number,
    ): IAutoMovieConstructionSplit.IChild => ({
      band: "band." + name,
      part: finger(name, x, lean, o.from ?? -0.012),
      partFace: name,
      partEnd: "bottom",
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
      children:
        o.two === true
          ? [child("f.0", spacing, o.lean), child("f.2", -spacing, -o.lean)]
          : [
              child("f.0", spacing, o.lean),
              child("f.1", 0, 0),
              child("f.2", -spacing, -o.lean),
            ],
      ...(o.compose === null
        ? {}
        : {
            compose: o.compose ?? {
              frame: "host",
              plane: { point: [0, 0, 0], normal: [0, 0, 1] },
              round: 0.001,
            },
          }),
    };
  };
  const realize = (
    root: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const dot = (a: readonly number[], c: readonly number[]): number =>
    a[0]! * c[0]! + a[1]! * c[1]! + a[2]! * c[2]!;
  const minimum = (
    planes: [V3, V3][],
    axis: V3,
    p: readonly number[],
    smooth: boolean,
  ): number => {
    const g: number[] = planes.map(([q, normal]: [V3, V3]): number =>
      dot(normal, [
        p[0]! - q[0] - RAIL * axis[0],
        p[1]! - q[1] - RAIL * axis[1],
        p[2]! - q[2] - RAIL * axis[2],
      ]),
    );
    return smooth
      ? -Math.log(
          g.reduce((sum: number, x: number): number => sum + Math.exp(-x), 0),
        )
      : Math.min(...g);
  };
  const residual = (
    which: 0 | 1,
    lean: number,
    p: readonly number[],
    smooth: boolean = true,
  ): number => {
    const [c2, s2]: [number, number] = [Math.cos(lean / 2), Math.sin(lean / 2)];
    const end: [V3, V3] = [
      [0, 0, -30],
      [0, 0, -1],
    ];
    return which === 0
      ? minimum(
          [
            end,
            [
              [fork(lean), 0, -30],
              [c2, 0, s2],
            ],
          ],
          [Math.sin(lean), 0, -Math.cos(lean)],
          p,
          smooth,
        )
      : minimum(
          [
            end,
            [
              [fork(lean), 0, -30],
              [-c2, 0, -s2],
            ],
            [
              [-fork(lean), 0, -30],
              [c2, 0, -s2],
            ],
          ],
          [0, 0, -1],
          p,
          smooth,
        );
  };
  const clocks: number[] = Array.from(
    { length: 2 * n },
    (_: unknown, k: number): number => (turn * k) / (2 * n),
  );
  const end = (
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    c: number,
  ): readonly number[] => {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    return band.jet(band.domain![1], c).p;
  };
  const loop = (
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    k: number,
  ): IAutoMovieSolidSurface.IJet =>
    ConstructionRead.surface(r, name).jet(0, (turn * k) / n);
  const b: number = 0.3;
  const [c2, s2]: [number, number] = [Math.cos(b / 2), Math.sin(b / 2)];
  const apex: number = (9 - fork(b)) / Math.tan(b / 2);

  // 1.
  const real: IAutoMovieConstructionRealization.IRealization = realize(
    split({ lean: b }),
  );
  const roomy: IAutoMovieConstructionNode = trunk(27.8, 12.5);
  const plain: IAutoMovieConstructionRealization.IRealization = realize(
    split({ lean: b, compose: null, host: roomy }),
  );
  TestValidator.equals("plain diagnostics", plain.diagnostics.length, 0);
  TestValidator.equals("composed diagnostics", real.diagnostics.length, 0);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  TestValidator.equals(
    "faces",
    names,
    "band.f.0,band.f.1,band.f.2,f.0,f.1,f.2,trunk",
  );
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let i: number = 0; i + 2 < ix.length; i += 3)
    for (let e: number = 0; e < 3; ++e) {
      const p: number = ix[i + e]!;
      const q: number = ix[i + ((e + 1) % 3)]!;
      const key: string = p < q ? `${p},${q}` : `${q},${p}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const leans: [number, number][] = [
    [15, b],
    [0, 0],
    [-15, -b],
  ];
  const free = (v: number): boolean => {
    const p: number[] = [0, 1, 2].map(
      (a: number): number => 1000 * real.mesh.positions[3 * v + a]!,
    );
    return (
      Math.abs(p[2]! - 60) < 1e-4 ||
      leans.some(
        ([x, lean]: [number, number]): boolean =>
          Math.abs(
            dot(
              [Math.sin(lean), 0, -Math.cos(lean)],
              [p[0]! - x, p[1]!, p[2]! + 30],
            ) - 60,
          ) < 1e-4,
      )
    );
  };
  let open: number = 0;
  let over: number = 0;
  for (const [key, count] of uses) {
    if (count > 2) ++over;
    if (
      count === 1 &&
      !key.split(",").every((v: string): boolean => free(Number(v)))
    )
      ++open;
  }
  TestValidator.equals("open edges", open, 0);
  TestValidator.equals("over-used edges", over, 0);

  // 2-3.
  const seam = (
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    sign: number,
  ) => {
    const out = { plane: 0, ruling: 0, skin: 0, depth: 0 };
    for (let k: number = (3 * n) / 4 + 1; k < n; ++k) {
      const j: IAutoMovieSolidSurface.IJet = loop(r, name, k);
      const length: number = Math.hypot(j.u[0], j.u[1], j.u[2]);
      out.plane = Math.max(
        out.plane,
        Math.abs(
          dot(
            [-sign * c2, 0, -s2],
            [j.p[0] - sign * fork(b), j.p[1], j.p[2] + 30],
          ),
        ),
      );
      out.ruling = Math.max(
        out.ruling,
        Math.hypot(
          j.u[0] / length - sign * c2,
          j.u[1] / length,
          j.u[2] / length - s2,
        ),
      );
      out.skin = Math.max(out.skin, Math.abs(Math.hypot(j.p[0], j.p[1]) - 9));
      out.depth = Math.max(out.depth, -(j.p[2] + 30));
    }
    return out;
  };
  const sides: [string, number][] = [
    ["band.f.0", 1],
    ["band.f.2", -1],
  ];
  for (const [name, sign] of sides) {
    for (const k of [0, (3 * n) / 4]) {
      const p: readonly number[] = loop(real, name, k).p;
      check(`${name} fork x ${k}`, Math.abs(p[0]! - sign * fork(b)) <= 1e-6);
      check(`${name} fork z ${k}`, Math.abs(p[2]! + 30) <= 1e-6);
    }
    const s = seam(real, name, sign);
    check(`${name} seam plane`, s.plane <= 1e-6);
    check(`${name} seam ruling`, s.ruling <= 1e-9);
    check(`${name} seam on the cylinder`, s.skin <= 0.3);
    check(`${name} seam depth`, s.depth > 0.9 * apex);
  }
  const chordSeam = seam(plain, "band.f.0", 1);
  check(
    "plain fork is off",
    Math.abs(loop(plain, "band.f.0", 0).p[0]! - fork(b)) > 0.3,
  );
  check("plain seam ruling", chordSeam.ruling > 0.1);
  check("plain seam depth", chordSeam.depth < 1e-6);
  check("plain seam inside the cylinder", chordSeam.skin > 1);

  // 4.
  const apart = (
    r: IAutoMovieConstructionRealization.IRealization,
  ): { point: number; tangent: number } => {
    const outer: IAutoMovieSolidSurface = ConstructionRead.surface(
      r,
      "band.f.0",
    );
    const inner: IAutoMovieSolidSurface = ConstructionRead.surface(
      r,
      "band.f.1",
    );
    const out = { point: 0, tangent: 0 };
    for (let i: number = 0; i < n / 4; ++i) {
      const share: number = (i + 0.5) / (n / 4);
      const p: IAutoMovieSolidSurface.IJet = outer.jet(
        0,
        (turn * (n - (n / 4) * share)) / n,
      );
      const q: IAutoMovieSolidSurface.IJet = inner.jet(
        0,
        (turn * (n / 4 + (n / 4) * share)) / n,
      );
      out.point = Math.max(
        out.point,
        Math.hypot(p.p[0] - q.p[0], p.p[1] - q.p[1], p.p[2] - q.p[2]),
      );
      out.tangent = Math.max(
        out.tangent,
        Math.hypot(p.v[0] + q.v[0], p.v[1] + q.v[1], p.v[2] + q.v[2]) /
          Math.hypot(q.v[0], q.v[1], q.v[2]),
      );
    }
    return out;
  };
  const shared = apart(real);
  check("shared seam points", shared.point <= 1e-9);
  check("shared seam tangents", shared.tangent <= 1e-9);
  const authored: IAutoMovieConstructionRealization.IRealization = realize(
    split({
      lean: b,
      compose: null,
      host: roomy,
      profile: { knots: [[0.012, 0.006]], corner: 0.3 },
    }),
  );
  TestValidator.equals("authored diagnostics", authored.diagnostics.length, 0);
  check("authored seam bands disagree", apart(authored).point > 1e-7);

  // 5.
  let middle: number = 0;
  let outer: number = 0;
  let radius: number = 0;
  for (const c of clocks) {
    const p: readonly number[] = end(real, "band.f.1", c);
    middle = Math.max(middle, Math.abs(residual(1, b, p)));
    radius = Math.max(radius, Math.abs(Math.hypot(p[0]!, p[1]!) - 9));
    outer = Math.max(outer, Math.abs(residual(0, b, end(real, "band.f.0", c))));
  }
  check("middle rail", middle <= 1e-7);
  check("outer rail", outer <= 1e-7);
  check("rail on the cylinder", radius <= 1e-7);
  check(
    "station ring is off the cut",
    Math.max(
      ...clocks.map((c: number): number =>
        Math.abs(residual(1, b, end(plain, "band.f.1", c))),
      ),
    ) > 1,
  );

  // 6.
  const hard: IAutoMovieConstructionRealization.IRealization = realize(
    split({
      lean: b,
      compose: {
        frame: "host",
        plane: { point: [0, 0, 0], normal: [0, 0, 1] },
      },
    }),
  );
  TestValidator.equals("hard diagnostics", hard.diagnostics.length, 0);
  check(
    "hard rail",
    Math.max(
      ...clocks.map((c: number): number =>
        Math.abs(residual(1, b, end(hard, "band.f.1", c), false)),
      ),
    ) <= 1e-7,
  );

  // 7.
  const wide: IAutoMovieConstructionRealization.IRealization = realize(
    split({
      lean: 0.45,
      compose: {
        frame: "tree",
        plane: { point: [0, 0, -0.03], normal: [0, 0, -1] },
        round: 0.001,
      },
    }),
  );
  TestValidator.equals("lean 0.45 diagnostics", wide.diagnostics.length, 0);
  for (const [name, sign] of sides)
    check(
      `lean 0.45 ${name}`,
      Math.abs(loop(wide, name, 0).p[0]! - sign * fork(0.45)) <= 1e-6,
    );

  // 8.
  const turned: IAutoMovieConstructionRealization.IRealization = realize(
    split({ lean: b, profile: { knots: [], corner: 0.3 } }),
  );
  TestValidator.equals(
    "empty profile diagnostics",
    turned.diagnostics.length,
    0,
  );
  const chordHalf: number = Math.sqrt(81 - fork(b) ** 2);
  const conflicts: [string, IAutoMovieConstructionSplit.IProfile][] = [
    ["a knot", { knots: [[chordHalf / 1000, 0.006]], corner: 0.3 }],
    ["a heading", { knots: [], corner: 0.3, heading: [0, 0, -1] }],
  ];
  for (const [what, profile] of conflicts) {
    let message: string = "admitted";
    try {
      realize(split({ lean: b, profile }));
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : "refused";
    }
    check(`profile with ${what}`, message.includes("conflict"));
  }

  // 9.
  const refused = (o: IOptions, word: string, why: string): void => {
    const r: IAutoMovieConstructionRealization.IRealization = realize(split(o));
    TestValidator.equals(`${why} count`, r.diagnostics.length, 1);
    check(`${why} names it`, ConstructionRead.diagnostics(r).includes(word));
    check(
      `${why} leaves the host`,
      r.body.faces.every(
        (f: { chain: string }): boolean => f.chain === "trunk",
      ),
    );
  };
  refused({ lean: b, spacing: 0.02 }, "cross 0 times", "children apart");
  refused(
    { lean: b, from: 0.002 },
    "not admitted in the end plane",
    "children past the end plane",
  );
  refused(
    { lean: 0, host: through(b) },
    "never enters",
    "children that never part",
  );
  refused(
    { lean: b, host: trunk(34, 16) },
    "from the composed outline",
    "a host ring off the outline",
  );

  // 10.
  const pair: IAutoMovieConstructionRealization.IRealization = realize(
    split({
      lean: b,
      two: true,
      host: trunk(17, Math.sqrt(81 - (7.5 * Math.cos(b)) ** 2)),
    }),
  );
  TestValidator.equals("pair diagnostics", pair.diagnostics.length, 0);
  const deep: number = (9 - 7.5 * Math.cos(b)) / Math.sin(b);
  let plane: number = 0;
  let skin: number = 0;
  let depth: number = 0;
  let rail: number = 0;
  for (const k of [0, n / 2])
    plane = Math.max(plane, Math.abs(loop(pair, "band.f.0", k).p[0]!));
  for (let k: number = n / 2 + 1; k < n; ++k) {
    const p: readonly number[] = loop(pair, "band.f.0", k).p;
    const d: number = -(p[2]! + 30);
    plane = Math.max(plane, Math.abs(p[0]!));
    skin = Math.max(
      skin,
      Math.abs(Math.hypot(p[1]!, d * Math.sin(b) + 7.5 * Math.cos(b)) - 9),
    );
    depth = Math.max(depth, d);
  }
  for (const c of clocks)
    rail = Math.max(
      rail,
      Math.abs(
        minimum(
          [
            [
              [0, 0, -30],
              [0, 0, -1],
            ],
            [
              [0, 0, -30],
              [1, 0, 0],
            ],
          ],
          [Math.sin(b), 0, -Math.cos(b)],
          end(pair, "band.f.0", c),
          true,
        ),
      ),
    );
  check("pair seam plane", plane <= 1e-6);
  check("pair seam on the skin", skin <= 0.3);
  check("pair seam depth", depth > 0.9 * deep);
  check("pair rail", rail <= 1e-7);

  // 12.
  const tip: V3 = [0.0075 + 0.06 * Math.sin(b), 0, -0.03 - 0.06 * Math.cos(b)];
  const twig = (name: string, side: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      {
        origin: {
          x: tip[0] + side * 0.0035 * Math.cos(b),
          y: 0,
          z: tip[2] + side * 0.0035 * Math.sin(b),
        },
        u: { x: Math.cos(b + side * 0.3), y: 0, z: Math.sin(b + side * 0.3) },
        v: { x: 0, y: 1, z: 0 },
      },
      ConstructionShapes.uniform(-0.012, 0.04, 8),
      (): [number, number, number, number] => [0.007, 0.007, 0.007, 0.007],
      "open",
    );
  const palm: IAutoMovieConstructionSplit = split({
    lean: b,
    two: true,
    host: trunk(17, Math.sqrt(81 - (7.5 * Math.cos(b)) ** 2)),
  });
  const inner: IAutoMovieConstructionSplit = {
    type: "split",
    name: "split.inner",
    host: palm.children[0].part,
    hostFace: "f.0",
    hostEnd: "top",
    seam: [-1, 1],
    count: n,
    rows: 4,
    children: [
      {
        band: "band.g.0",
        part: twig("g.0", 1),
        partFace: "g.0",
        partEnd: "bottom",
        rail: RAIL / 1000,
        correspondence: "length",
      },
      {
        band: "band.g.1",
        part: twig("g.1", -1),
        partFace: "g.1",
        partEnd: "bottom",
        rail: RAIL / 1000,
        correspondence: "length",
      },
    ],
    compose: {
      frame: "host",
      plane: { point: [0, 0, 0], normal: [0, 0, 1] },
      round: 0.001,
    },
  };
  const nested: IAutoMovieConstructionRealization.IRealization = realize({
    ...palm,
    children: [{ ...palm.children[0], part: inner }, palm.children[1]],
  });
  TestValidator.equals("nested diagnostics", nested.diagnostics.length, 0);
  const faces: string[] = nested.body.faces.map(
    (f: { chain: string }): string => f.chain,
  );
  for (const name of [
    "band.f.0",
    "band.f.2",
    "band.g.0",
    "band.g.1",
    "g.0",
    "g.1",
    "f.0",
    "f.2",
    "trunk",
  ])
    check(`nested face ${name}`, faces.includes(name));
  let nestedPlane: number = 0;
  for (const k of [0, n / 2])
    nestedPlane = Math.max(
      nestedPlane,
      Math.abs(loop(nested, "band.f.0", k).p[0]!),
    );
  check("nested outer forks", nestedPlane <= 1e-6);
  for (const k of [0, n / 2]) {
    const p: readonly number[] = loop(nested, "band.g.0", k).p;
    check(
      `inner fork ${k}`,
      Math.hypot(
        p[0]! - 1000 * tip[0],
        Math.abs(p[1]!) - 9,
        p[2]! - 1000 * tip[2],
      ) <= 1e-6,
    );
  }

  // 11.
  const declared: IAutoMovieConstructionSplit.ICut = {
    frame: "part",
    planes: [{ point: [0, 0, 0.018], normal: [0.3, 0, 1] }],
  };
  const cut: IAutoMovieConstructionRealization.IRealization = realize(
    split({ lean: b, compose: null, host: roomy, cut: declared }),
  );
  const away = (p: readonly number[]): number =>
    Math.abs(dot([0.3, 0, -1], [p[0]!, p[1]!, p[2]! + 36])) /
    Math.hypot(0.3, 1);
  TestValidator.equals("cut diagnostics", cut.diagnostics.length, 0);
  check(
    "cut rail",
    Math.max(
      ...clocks.map((c: number): number => away(end(cut, "band.f.1", c))),
    ) <= 1e-7,
  );
  check(
    "station rail is off the cut",
    Math.max(
      ...clocks.map((c: number): number => away(end(plain, "band.f.1", c))),
    ) > 2,
  );
}
