import {
  AutoMovieConstructionSplitRealize,
  AutoMovieSolidBody,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionState,
  IAutoMovieLoftChain,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidBody,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { ConstructionSplitFan } from "../../internal/construction/ConstructionSplitFan";

/**
 * A `split` node realizes one open end of its host as two children's loops
 * along a shared seam chord, each spanned to its child's rail by a band that
 * copies both sides' 2-jets, the whole skin watertight.
 *
 * Fixture (metres, the `DOWN` frame: chart u = +x, v = +y, stations advancing
 * along -z): the host `trunk` is the body of revolution whose radius is 0.025
 * times sqrt(1 - (s / 0.08)^2) over the stations [-0.06, 0.03], open at both
 * ends; its top end (station 0.03, z = -0.03) is split along the seam [0, pi],
 * the chord on y = 0. The children `leg.a` and `leg.b` hang from z = -0.03 with
 * axes at y = 0.0105 and y = -0.0105, radius 0.008 + 0.002 (2 s / 0.08 - 1)^2
 * over [0, 0.08]; each rail is 0.03 m into its child. Columns 32, rows 4.
 *
 * Scenarios:
 *
 * 1. No diagnostic; the body's faces are exactly the host, both children and both
 *    bands (five).
 * 2. Host arc (columns 0 to 16 of each band): the band's station-0 point is the
 *    host's knot circle at the column's host phase, (R cos phi, R sin phi, -30)
 *    mm with R = 25 sqrt(1 - (30 / 80)^2), within 1e-6 mm, and its cross
 *    direction and curvature equal the host's within 1e-9.
 * 3. Chord (columns 17 to 31): the station-0 point is on the straight chord
 *    between the arc's end points at the column's share, within 1e-6 mm; the
 *    station derivative points (0, 1, 0) for band a (arc on y > 0) and (0, -1,
 *    0) for band b, and the second derivative vanishes.
 * 4. Child rail (station L, every column): the band's point lies on the child's
 *    knot circle at 30 mm (z = -60 mm, radius 8.125 mm about its axis) within
 *    1e-6 mm, with the child's cross direction and curvature within 1e-9.
 * 5. Shared boundary identity: the chord's inner points are the same ids in both
 *    bands' start cycles (a's column k is b's 48 - k), each arc's end corner is
 *    the other band's start corner, the host's end cycle holds exactly both
 *    arcs' points, and each child's rail cycle exactly its band's end-cycle
 *    points.
 * 6. The skin is watertight: every edge in exactly two triangles except those on
 *    the free ends (z = 0.06 and z = -0.11 m), and none in more.
 * 7. A crease window [pi/4, pi/2] with transition pi/8 on band a: the band arrives
 *    along its column chord at column 6 (more than 0.01 rad from the child's
 *    direction) and with the child's own 2-jet at columns 0, 1 and 11 to 16.
 * 8. Refusals: a seam [pi, 0] is refused naming the seam; a rail of 0.5 m outside
 *    the child leaves one diagnostic on the split and only the host with no
 *    cycle; a child whose rail ring's centroid lies outside its loop (both on y
 *    = +0.0105) is refused with the loop's turn.
 * 9. Reading the arc against the host's station 0 instead does not agree, so the
 *    check of scenario 2 is not vacuous.
 * 10. An interior plane oblique to the host's stations gives both binary and
 *     multiway splits varying native boundary addresses, exact arc points and
 *     derivatives between columns, and common indexed edges.
 * 11. An unsupported plane and a refused child after a successful cut both leave
 *     the original host's skin and cycles whole.
 * 12. An interior cut replaces a distal pole that the station-end split refuses.
 */
export function test_engine_geometry_construction_split(): void {
  type V3 = [number, number, number];
  const turn: number = 2 * Math.PI;
  const n: number = 32;
  const m: number = n / 2;
  const clock = (k: number): number => (turn * k) / n;
  const R: number = 25 * Math.sqrt(1 - (30 / 80) ** 2);

  const host: IAutoMovieConstructionNode = ConstructionShapes.part(
    "trunk",
    ConstructionShapes.DOWN,
    ConstructionShapes.uniform(-0.06, 0.03, 13),
    (s: number): [number, number, number, number] => {
      const r: number = 0.025 * Math.sqrt(1 - (s / 0.08) ** 2);
      return [r, r, r, r];
    },
    "open",
  );
  const leg = (name: string, y: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      { ...ConstructionShapes.DOWN, origin: { x: 0, y, z: -0.03 } },
      ConstructionShapes.uniform(0, 0.08, 9),
      (s: number): [number, number, number, number] => {
        const r: number = 0.008 + 0.002 * (2 * (s / 0.08) - 1) ** 2;
        return [r, r, r, r];
      },
      "open",
    );
  interface IOptions {
    seam?: [number, number];
    rail?: number;
    yb?: number;
    crease?: IAutoMovieConstructionSplit.ICrease;
  }
  const split = (options: IOptions): IAutoMovieConstructionSplit => ({
    type: "split",
    name: "split.legs",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    seam: options.seam ?? [0, Math.PI],
    count: n,
    rows: 4,
    children: [
      {
        band: "band.a",
        part: leg("leg.a", 0.0105),
        partFace: "leg.a",
        partEnd: "bottom",
        rail: options.rail ?? 0.03,
        ...(options.crease === undefined ? {} : { crease: options.crease }),
      },
      {
        band: "band.b",
        part: leg("leg.b", options.yb ?? -0.0105),
        partFace: "leg.b",
        partEnd: "bottom",
        rail: options.rail ?? 0.03,
      },
    ],
  });
  const realize = (
    root: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  /** Retain the split's actual cycles to exercise its native atlas crossing. */
  const atlas = (root: IAutoMovieConstructionSplit): IAutoMovieSolidAtlas => {
    const body: IAutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
      root.name,
      [],
    );
    const state: IAutoMovieConstructionState.IState = {
      faces: new Map(),
      chains: new Map(),
      chainList: [],
      chainSurfaces: [],
      blendSurfaces: [],
      joins: [],
      trims: [],
      diagnostics: [],
      overrides: new Map(),
    };
    const walk = (node: IAutoMovieConstructionNode): void => {
      const leaf = realizeAutoMovieConstruction(
        { name: node.name, root: node },
        { chord: 1e-4, skin: false },
      );
      const chain: IAutoMovieLoftChain = leaf.chains[0]!;
      const surface: IAutoMovieSolidSurface = leaf.surfaces[0]!;
      state.faces.set(node.name, body.faces.length);
      state.chains.set(node.name, chain);
      state.chainList.push(chain);
      state.chainSurfaces.push(surface);
      body.faces.push({
        surface,
        stations: chain.layers.map(({ y }) => y),
        phases: Array.from(
          { length: chain.samples },
          (_, i) => (turn * i) / chain.samples,
        ),
        cycles: [],
      });
    };
    AutoMovieConstructionSplitRealize(
      root,
      body,
      state,
      walk,
      (node, contract, detail) => {
        throw new Error(`${node} ${contract}: ${detail}`);
      },
    );
    return AutoMovieSolidBody.atlas(body).atlas;
  };
  const sub = (a: readonly number[], b: readonly number[]): V3 => [
    a[0]! - b[0]!,
    a[1]! - b[1]!,
    a[2]! - b[2]!,
  ];
  const len = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);
  const scaled = (a: readonly number[], k: number): V3 => [
    a[0]! * k,
    a[1]! * k,
    a[2]! * k,
  ];
  const angle = (a: readonly number[], b: readonly number[]): number =>
    len(sub(scaled(a, 1 / len(a)), scaled(b, 1 / len(b))));
  const bend = (j: IAutoMovieSolidSurface.IJet): V3 =>
    scaled(j.uu, 1 / (len(j.u) * len(j.u)));

  // 1.
  const real: IAutoMovieConstructionRealization.IRealization = realize(
    split({}),
  );
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  TestValidator.equals("faces", names, "band.a,band.b,leg.a,leg.b,trunk");

  // 2.
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const bands: [string, number][] = [
    ["band.a", 0],
    ["band.b", Math.PI],
  ];
  const arcGaps = (station: number): number => {
    let worst: number = 0;
    for (const [name, alpha] of bands) {
      const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
      for (let k: number = 0; k <= m; ++k) {
        const phi: number = alpha + (Math.PI * k) / m;
        const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
        const h: IAutoMovieSolidSurface.IJet = trunk.jet(station, phi);
        worst = Math.max(
          worst,
          len(sub(b.p, [R * Math.cos(phi), R * Math.sin(phi), -station])),
          angle(b.u, h.u) * 1e6,
          len(sub(bend(b), bend(h))) * 1e6,
        );
      }
    }
    return worst;
  };
  TestValidator.predicate("arc", arcGaps(30) <= 1e-6);

  // 3.
  const chords: [string, number][] = [
    ["band.a", -R],
    ["band.b", R],
  ];
  for (const [name, x0] of chords) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    for (let k: number = m + 1; k < n; ++k) {
      const t: number = (k - m) / m;
      const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
      TestValidator.predicate(
        `${name} chord ${k}`,
        len(sub(b.p, [x0 - 2 * x0 * t, 0, -30])) <= 1e-6,
      );
      const side: V3 = name === "band.a" ? [0, 1, 0] : [0, -1, 0];
      TestValidator.predicate(`${name} ruling ${k}`, angle(b.u, side) <= 1e-9);
      TestValidator.predicate(`${name} second ${k}`, len(b.uu) <= 1e-9);
    }
  }

  // 4.
  const rail = (
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    child: string,
    y: number,
    k: number,
  ) => {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    const L: number = r.chains.find(
      (c: { name: string }): boolean => c.name === name,
    )!.layers[1]!.y;
    const b: IAutoMovieSolidSurface.IJet = band.jet(L, clock(k));
    const radial: number = Math.hypot(b.p[0], b.p[1] - y);
    const c: IAutoMovieSolidSurface.IJet = ConstructionRead.surface(
      r,
      child,
    ).jet(30, Math.atan2(b.p[1] - y, b.p[0]));
    return {
      gap: Math.max(
        Math.abs(radial - 8.125),
        Math.abs(b.p[2] + 60),
        len(sub(b.p, c.p)),
      ),
      turn: angle(b.u, c.u),
      bend: len(sub(bend(b), bend(c))),
      chord: angle(b.u, sub(b.p, band.jet(0, clock(k)).p)),
    };
  };
  const children: [string, string, number][] = [
    ["band.a", "leg.a", 0.0105 * 1000],
    ["band.b", "leg.b", -0.0105 * 1000],
  ];
  for (const [name, child, y] of children)
    for (let k: number = 0; k < n; ++k) {
      const at = rail(real, name, child, y, k);
      TestValidator.predicate(`${name} rail ${k} gap`, at.gap <= 1e-6);
      TestValidator.predicate(
        `${name} rail ${k} jet`,
        at.turn <= 1e-9 && at.bend <= 1e-9,
      );
    }

  // 5.
  const cycle = (face: string, kind: string): number[] =>
    real.body.faces
      .find((f: { chain: string }): boolean => f.chain === face)
      ?.cycles.find((c: { kind: string }): boolean => c.kind === kind)
      ?.points ?? [];
  const startA: number[] = cycle("band.a", "start");
  const startB: number[] = cycle("band.b", "start");
  for (let k: number = m + 1; k < n; ++k)
    TestValidator.equals(`shared chord ${k}`, startA[k], startB[3 * m - k]);
  TestValidator.equals("corner a", startA[m], startB[0]);
  TestValidator.equals("corner b", startB[m], startA[0]);
  const sorted = (a: number[]): number[] =>
    [...a].sort((x: number, z: number): number => x - z);
  TestValidator.equals(
    "host end",
    sorted(cycle("trunk", "end")),
    sorted([...startA.slice(0, m), ...startB.slice(0, m)]),
  );
  TestValidator.equals(
    "leg a rail",
    sorted(cycle("leg.a", "start")),
    sorted(cycle("band.a", "end")),
  );
  TestValidator.equals(
    "leg b rail",
    sorted(cycle("leg.b", "start")),
    sorted(cycle("band.b", "end")),
  );

  // 6.
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let t: number = 0; t + 2 < ix.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free = (v: number): boolean =>
    [0.06, -0.11].some(
      (z: number): boolean =>
        Math.abs(real.mesh.positions[3 * v + 2]! - z) < 1e-7,
    );
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

  // 7.
  const creased: IAutoMovieConstructionRealization.IRealization = realize(
    split({
      crease: { start: Math.PI / 4, end: Math.PI / 2, transition: Math.PI / 8 },
    }),
  );
  TestValidator.equals("crease diagnostics", creased.diagnostics.length, 0);
  const inside = rail(creased, "band.a", "leg.a", 10.5, 6);
  TestValidator.predicate(
    "crease arrives along the chord",
    inside.chord <= 1e-9,
  );
  TestValidator.predicate("crease leaves the child", inside.turn > 0.01);
  const outsideColumns: number[] = [0, 1, 11, 12, 13, 14, 15, 16];
  for (const k of outsideColumns) {
    const outside = rail(creased, "band.a", "leg.a", 10.5, k);
    TestValidator.predicate(
      `crease outside ${k}`,
      outside.turn <= 1e-9 && outside.bend <= 1e-9,
    );
  }

  // 8.
  let reversed: string = "admitted";
  try {
    realize(split({ seam: [Math.PI, 0] }));
  } catch (error: unknown) {
    reversed = error instanceof Error ? error.message : "refused";
  }
  TestValidator.predicate("seam [pi, 0]", reversed.includes("seam"));
  const deep: IAutoMovieConstructionRealization.IRealization = realize(
    split({ rail: 0.5 }),
  );
  TestValidator.predicate(
    "deep diagnostic",
    deep.diagnostics.some(
      (d: { node: string }): boolean => d.node === "split.legs",
    ),
  );
  TestValidator.equals(
    "deep faces",
    deep.body.faces.map((f: { chain: string }): string => f.chain).join(","),
    "trunk",
  );
  TestValidator.equals(
    "deep host cycles",
    deep.body.faces[0]!.cycles.length,
    0,
  );
  const astray: IAutoMovieConstructionRealization.IRealization = realize(
    split({ yb: 0.0105 }),
  );
  TestValidator.predicate(
    "astray",
    astray.diagnostics.some(
      (d: { node: string; detail: string }): boolean =>
        d.node === "split.legs" &&
        d.detail.includes("round the child's rail centroid"),
    ),
  );

  // 9.
  TestValidator.predicate("arc at the wrong station", arcGaps(0) > 1e-6);

  // 10. The native chart varies on the plane z + 0.12 x = -26 mm.
  const hostCut: IAutoMovieConstructionSplit.IHostCut = {
    frame: "tree",
    plane: { point: [0, 0, -0.026], normal: [0.12, 0, 1] },
  };
  const planeComponent = (p: readonly number[]): number => 0.12 * p[0]! + p[2]!;
  for (const root of [
    split({}),
    ConstructionSplitFan.split({ outer: ConstructionSplitFan.OUTER }),
  ]) {
    const made: IAutoMovieConstructionRealization.IRealization = realize({
      ...root,
      hostCut,
    });
    TestValidator.equals(
      root.name + " oblique diagnostics",
      made.diagnostics,
      [],
    );
    const parent = made.body.faces.find((f) => f.chain === root.hostFace)!;
    const rim = parent.cycles.find((c) => c.kind === "end")!;
    const h = ConstructionRead.surface(made, root.hostFace);
    const stations: number[] = rim.chart.map(([s, phi]) => {
      const p: V3 = h.jet(s, phi).p;
      TestValidator.predicate(
        "native chart is on the plane",
        Math.abs(planeComponent(p) + 26) < 1e-9,
      );
      return s;
    });
    TestValidator.predicate(
      "varying station",
      Math.max(...stations) - Math.min(...stations) > 5,
    );
    const joined: IAutoMovieSolidAtlas = atlas({ ...root, hostCut });
    const hostIndex: number = joined.faces.findIndex(
      ({ name }) => name === root.hostFace,
    );

    const uses: Map<string, number> = new Map();
    for (let i: number = 0; i < made.mesh.indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = made.mesh.indices[i + j]!;
        const b: number = made.mesh.indices[i + ((j + 1) % 3)]!;
        const key: string = `${Math.min(a, b)},${Math.max(a, b)}`;
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }
    const indexed: Map<number, number> = new Map();
    for (let i: number = 0; i < made.mesh.coordinates.length / 3; ++i) {
      const [owner, s, phi] = made.mesh.coordinates.slice(3 * i, 3 * i + 3);
      if (made.mesh.owners[owner!] !== root.hostFace) continue;
      TestValidator.predicate(
        "native mesh vertex lies in the retained halfspace",
        planeComponent(made.mesh.positions.slice(3 * i, 3 * i + 3)) + 0.026 >=
          -1e-12,
      );
      const found: number = rim.chart.findIndex(
        ([u, v]) =>
          Math.abs(u - s!) < 1e-9 &&
          Math.abs(Math.atan2(Math.sin(v - phi!), Math.cos(v - phi!))) < 1e-9,
      );
      if (found !== -1) indexed.set(rim.points[found]!, i);
    }
    rim.points.forEach((a, k) => {
      const b: number = rim.points[(k + 1) % rim.points.length]!;
      const ai: number = indexed.get(a)!;
      const bi: number = indexed.get(b)!;
      TestValidator.equals(
        "surface pair uses the same edge",
        uses.get(`${Math.min(ai, bi)},${Math.max(ai, bi)}`),
        2,
      );
    });

    // Each consecutive pair of parent indices on a band defines one exact arc segment.
    const addresses: Map<number, [number, number]> = new Map(
      rim.points.map((point, i) => [point, rim.chart[i]!]),
    );
    for (const child of root.children) {
      const start = made.body.faces.find((f) => f.chain === child.band)!
        .cycles[0]!;
      const band = ConstructionRead.surface(made, child.band);
      const bandIndex: number = joined.faces.findIndex(
        ({ name }) => name === child.band,
      );
      for (const [k, id] of start.points.entries()) {
        const next: number = (k + 1) % start.points.length;
        const from: [number, number] | undefined = addresses.get(id);
        const to: [number, number] | undefined = addresses.get(
          start.points[next]!,
        );
        if (from === undefined || to === undefined) continue;
        const step: number = to[1] - from[1];
        const span: number = step < 0 ? step + turn : step;
        if (span >= Math.PI) continue;
        const phase: number = from[1] + span / 2;
        const j = band.jet(0, clock(k + 0.5));
        let u: number = (from[0] + to[0]) / 2;
        for (let i: number = 0; i < 6; ++i) {
          const guess = h.jet(u, phase);
          u -= (planeComponent(guess.p) + 26) / planeComponent(guess.u);
        }
        const native = h.jet(u, phase);
        const slope: number =
          -planeComponent(native.v) / planeComponent(native.u);
        const bend: V3 = native.vv.map(
          (v, i) => v + 2 * slope * native.uv[i]! + slope ** 2 * native.uu[i]!,
        ) as V3;
        const curvature: number =
          -planeComponent(bend) / planeComponent(native.u);
        const rate: number = span / clock(1);
        const tangent: V3 = native.v.map(
          (v, i) => rate * (v + slope * native.u[i]!),
        ) as V3;
        TestValidator.predicate(
          "between-column native point",
          len(sub(j.p, native.p)) < 1e-9,
        );
        TestValidator.predicate(
          "between-column native derivative",
          len(sub(j.v, tangent)) < 1e-9,
        );
        const second: V3 = bend.map(
          (v, i) => rate ** 2 * (v + curvature * native.u[i]!),
        ) as V3;
        TestValidator.predicate(
          "between-column native second derivative",
          len(sub(j.vv, second)) < 1e-9,
        );
        TestValidator.predicate(
          "kept side follows the plane",
          joined.kept(hostIndex, u - 1e-6, phase) &&
            !joined.kept(hostIndex, u + 1e-6, phase),
        );
        const across = joined.across(hostIndex, u + 1e-6, phase + turn);
        const back = joined.across(bandIndex, -1e-6, clock(k + 0.5));
        TestValidator.predicate(
          "native host to band",
          across?.face === bandIndex &&
            across.u === 0 &&
            Math.abs(across.v - clock(k + 0.5)) < 1e-9,
        );
        TestValidator.predicate(
          "band to native host",
          back?.face === hostIndex &&
            Math.abs(back.u - u) < 1e-9 &&
            Math.abs(
              Math.atan2(Math.sin(back.v - phase), Math.cos(back.v - phase)),
            ) < 1e-9,
        );
        TestValidator.predicate(
          "native transverse derivative at the column",
          angle(band.jet(0, clock(k)).u, h.jet(from[0], from[1]).u) < 1e-9,
        );
      }
    }
    for (const child of root.children) {
      const band: number = joined.faces.findIndex(
        ({ name }) => name === child.band,
      );
      const face: IAutoMovieSolidSurface = joined.faces[band]!;
      for (let k: number = 0; k < n; ++k) {
        const v: number = clock(k + 0.5);
        const opposite = joined.across(band, -1e-6, v);
        if (opposite === null || opposite.face === hostIndex) continue;
        const a = face.jet(0, v);
        const b = joined.faces[opposite.face]!.jet(opposite.u, opposite.v);
        TestValidator.predicate(
          "two bands read the same seam point",
          len(sub(a.p, b.p)) < 1e-9,
        );
        TestValidator.predicate(
          "two bands traverse the shared seam oppositely",
          len(sub(a.v, scaled(b.v, -1))) < 1e-9,
        );
      }
    }
  }

  // 11. Both a failed bracket and a later child refusal restore the host.
  const original: IAutoMovieConstructionRealization.IRealization =
    realize(host);
  for (const failed of [
    {
      ...split({}),
      hostCut: {
        ...hostCut,
        plane: { ...hostCut.plane, point: [0, 0, -0.1] as V3 },
      },
    },
    { ...split({ rail: 0.5 }), hostCut },
  ]) {
    const refused: IAutoMovieConstructionRealization.IRealization =
      realize(failed);
    TestValidator.equals(
      "cut rollback diagnostics",
      refused.diagnostics.map(({ node }) => node),
      ["split.legs"],
    );
    TestValidator.equals("cut rollback body", refused.body, original.body);
    TestValidator.equals("cut rollback mesh", refused.mesh, original.mesh);
  }

  // 12.
  const capped: IAutoMovieConstructionSplit = {
    ...split({}),
    host: ConstructionShapes.ellipsoid(
      "trunk",
      ConstructionShapes.DOWN,
      0.025,
      0.025,
      0.08,
    ),
  };
  TestValidator.predicate(
    "the nominal end is a pole",
    realize(capped).diagnostics.some(({ detail }) =>
      detail.includes("end closes in a pole"),
    ),
  );
  TestValidator.equals(
    "an interior cut replaces the distal pole",
    realize({ ...capped, hostCut }).diagnostics,
    [],
  );
}
