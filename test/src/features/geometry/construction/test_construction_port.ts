import {
  type AutoMovieConstructionRealization,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionPort,
} from "@automovie/interface";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A port realizes its part on a known port curve of its host: the curve cut out of the host face as a hole, a band from it to the part's rail copying both sides' 2-jets, the whole skin watertight.
 *
 * Fixture (metres; the host in the `DOWN` frame: chart `u = +x`, `v = +y`, stations along `-z`): the host `trunk` is a cylinder of radius 0.02 over stations `[0, 0.1]`, open at both ends; its port curve is the chart ellipse about station 0.05 and phase 0 with semi-axes 0.01 m and 0.45 rad, sense +1. The part `arm` is a cylinder of radius 0.007 along `+x` from `(0.012, 0, -0.05)`, length 0.06, open; its rail is 0.02 m in (a knot station, `x = 0.032`). Columns 32, rows 4.
 *
 * Scenarios:
 * 1. No diagnostic; the faces are exactly the host, the part and the band; the host carries one hole cycle.
 * 2. Loop columns: the band's station-0 point is the host's point on the port curve, `(20 cos phi, 20 sin phi, -station)` mm at `(station, phi) = (50 + 10 cos c, 0.45 sin c)`, within 1e-6 mm; its cross derivative is parallel to the host's derivative along `(-10 cos c, -0.45 sin c)` and its `uu / |u|^2` equals the host's second derivative along that direction over its length squared, within 1e-9.
 * 3. Rail columns: the band's end point lies on the part's knot circle (`x = 32` mm, radius 7 mm about the part's axis), within 1e-6 mm.
 * 4. Shared identity: the band's start cycle holds exactly the host's hole points, and its end cycle exactly the part's rail cycle points.
 * 5. Watertight skin: every edge is used by two triangles except on the free ends (`z = 0`, `z = -0.1`, `x = 0.072` m).
 * 6. Refusal: a rail of 0.5 m leaves one diagnostic on the port, no band, no hole and no part face.
 * 7. Red: the loop check read against a port curve about station 0.04 fails.
 * 8. Shape: with the share `1 + 0.2 cos 2c` per column, the band's station-0 point at clock `c` is the host's point at `(50 + s 10 cos c, s 0.45 sin c)`, within 1e-6 mm, and some column stands more than 1 mm from the plain ellipse's.
 * 9. Shape admission: a shape of 3 shares for 32 columns is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes port trees with `realizeAutoMovieConstruction` and reads the band's, host's and part's surfaces, the published body's cycles and the skin. It catches a band off the port curve or the rail, a band whose cross jets are not the host's, a hole not shared with the band, an open skin and a refusal that leaves a partial cut.
 * @evidence contracts/development/testing.md#independent-expectations Port points from the cylinder's closed form on the declared chart ellipse; cross jets read on the host's realized surface along the ellipse's inward chart direction (the node contract); rail points on the part's knot circle, exact for ConstructionShapes; watertightness from the manifold edge rule.
 * @evidence contracts/development/testing.md#distinguishing-cases A positive port, a rail outside the part as the rollback case, a shifted curve as the red reading, and a shaped loop read against both its own curve and the plain ellipse; the strip's scale law belongs to `test_construction_strip_law`, the split to `test_construction_split`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_port`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 9 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: No diagnostic; the faces are exactly the host, the part and the band; the host carries one hole cycle.).
 */
export function test_construction_port(): void {
  const failures: string[] = [];
  const n: number = 32;
  const clock: (k: number) => number = (k: number): number =>
    (2 * Math.PI * k) / n;
  const host: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "trunk",
    ConstructionShapes.DOWN,
    0.02,
    0.1,
  );
  const arm: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "arm",
    {
      origin: { x: 0.012, y: 0, z: -0.05 },
      u: { x: 0, y: 0, z: 1 },
      v: { x: 0, y: 1, z: 0 },
    },
    0.007,
    0.06,
    7,
  );
  const port: (rail: number) => IAutoMovieConstructionPort = (
    rail: number,
  ): IAutoMovieConstructionPort => ({
    type: "port",
    name: "port.arm",
    host,
    hostFace: "trunk",
    loop: { centre: [0.05, 0], semi: [0.01, 0.45], sense: 1 },
    band: "band.port",
    part: arm,
    partFace: "arm",
    partEnd: "bottom",
    rail,
    count: n,
    rows: 4,
  });
  const realize: (
    root: AutoMovieConstructionNode,
  ) => AutoMovieConstructionRealization.IRealization = (
    root: AutoMovieConstructionNode,
  ): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const sub: (a: readonly number[], b: readonly number[]) => V3 = (
    a: readonly number[],
    b: readonly number[],
  ): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const len: (a: readonly number[]) => number = (
    a: readonly number[],
  ): number => Math.hypot(a[0]!, a[1]!, a[2]!);
  const scaled: (a: readonly number[], k: number) => V3 = (
    a: readonly number[],
    k: number,
  ): V3 => [a[0]! * k, a[1]! * k, a[2]! * k];
  const angle: (a: readonly number[], b: readonly number[]) => number = (
    a: readonly number[],
    b: readonly number[],
  ): number => len(sub(scaled(a, 1 / len(a)), scaled(b, 1 / len(b))));

  // 1. The positive tree.
  const real: AutoMovieConstructionRealization.IRealization = realize(
    port(0.02),
  );
  if (real.diagnostics.length !== 0)
    failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  if (names !== "arm,band.port,trunk") failures.push(`faces: ${names}`);
  const cycle: (face: string, kind: string) => number[] = (
    face: string,
    kind: string,
  ): number[] =>
    real.body.faces
      .find((f: { chain: string }): boolean => f.chain === face)
      ?.cycles.find((c: { kind: string }): boolean => c.kind === kind)
      ?.points ?? [];
  if (cycle("trunk", "hole").length !== n)
    failures.push(
      `the host's hole has ${cycle("trunk", "hole").length} points`,
    );

  // 2-3. Every column.
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const loopCheck: (centre: number) => string[] = (
    centre: number,
  ): string[] => {
    const out: string[] = [];
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(
      real,
      "band.port",
    );
    for (let k: number = 0; k < n; ++k) {
      const c: number = clock(k);
      const station: number = centre + 10 * Math.cos(c);
      const phi: number = 0.45 * Math.sin(c);
      const b: IAutoMovieSolidSurface.IJet = band.jet(0, c);
      const gap: number = len(
        sub(b.p, [20 * Math.cos(phi), 20 * Math.sin(phi), -station]),
      );
      if (!(gap <= 1e-6))
        out.push(
          `loop column ${k}: ${gap} mm off the port curve about station ${centre}`,
        );
      const h: IAutoMovieSolidSurface.IJet = trunk.jet(station, phi);
      const [du, dv]: [number, number] = [
        -10 * Math.cos(c),
        -0.45 * Math.sin(c),
      ];
      const first: V3 = [
        h.u[0] * du + h.v[0] * dv,
        h.u[1] * du + h.v[1] * dv,
        h.u[2] * du + h.v[2] * dv,
      ];
      const second: V3 = [0, 1, 2].map(
        (i: number): number =>
          h.uu[i]! * du * du + 2 * h.uv[i]! * du * dv + h.vv[i]! * dv * dv,
      ) as V3;
      if (!(angle(b.u, first) <= 1e-9))
        out.push(
          `loop column ${k}: cross direction ${angle(b.u, first)} off the host's`,
        );
      const bend: number = len(
        sub(
          scaled(b.uu, 1 / (len(b.u) * len(b.u))),
          scaled(second, 1 / (len(first) * len(first))),
        ),
      );
      if (!(bend <= 1e-9))
        out.push(
          `loop column ${k}: cross curvature ${bend} mm^-1 off the host's`,
        );
    }
    return out;
  };
  failures.push(...loopCheck(50));
  const band: IAutoMovieSolidSurface = ConstructionRead.surface(
    real,
    "band.port",
  );
  const L: number =
    real.chains.find((c: { name: string }): boolean => c.name === "band.port")
      ?.layers[1]?.y ?? NaN;
  for (let k: number = 0; k < n; ++k) {
    const p: readonly number[] = band.jet(L, clock(k)).p;
    const gap: number = Math.max(
      Math.abs(p[0]! - 32),
      Math.abs(Math.hypot(p[1]!, p[2]! + 50) - 7),
    );
    if (!(gap <= 1e-6))
      failures.push(`rail column ${k}: ${gap} mm off the part's knot circle`);
  }

  // 4. Shared identity.
  const same: (a: number[], b: number[]) => boolean = (
    a: number[],
    b: number[],
  ): boolean =>
    a.length === b.length &&
    [...a].sort((x: number, z: number): number => x - z).join() ===
      [...b].sort((x: number, z: number): number => x - z).join();
  if (!same(cycle("band.port", "start"), cycle("trunk", "hole")))
    failures.push("the band's start cycle is not the host's hole");
  if (!same(cycle("band.port", "end"), cycle("arm", "start")))
    failures.push("the band's end cycle is not the part's rail cycle");

  // 5. Watertight skin.
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let t: number = 0; t + 2 < ix.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free: (v: number) => boolean = (v: number): boolean => {
    const x: number = real.mesh.positions[3 * v]!;
    const z: number = real.mesh.positions[3 * v + 2]!;
    return (
      Math.abs(z) < 1e-7 ||
      Math.abs(z + 0.1) < 1e-7 ||
      Math.abs(x - 0.072) < 1e-7
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
  if (open !== 0 || over !== 0)
    failures.push(
      `skin: ${open} open edges away from the free ends, ${over} edges in more than two triangles`,
    );

  // 6. Refusal.
  const deep: AutoMovieConstructionRealization.IRealization = realize(
    port(0.5),
  );
  const kept: string = deep.body.faces
    .map((f: { chain: string }): string => f.chain)
    .join(",");
  if (
    !deep.diagnostics.some(
      (d: { node: string }): boolean => d.node === "port.arm",
    ) ||
    kept !== "trunk" ||
    deep.body.faces[0]!.cycles.length !== 0
  )
    failures.push(
      `a rail outside the part left ${kept} with ${deep.body.faces[0]?.cycles.length} host cycles: ${ConstructionRead.diagnostics(deep)}`,
    );

  // 7. Red.
  if (loopCheck(40).length === 0)
    failures.push(
      "proof: the band's loop reads equal to a port curve about station 40 mm",
    );

  // 8. A shaped loop: each column's share of the ellipse's distance from the centre.
  const share: (k: number) => number = (k: number): number =>
    1 + 0.2 * Math.cos(2 * clock(k));
  const shaped: AutoMovieConstructionRealization.IRealization = realize({
    ...port(0.02),
    loop: {
      ...port(0.02).loop,
      shape: Array.from({ length: n }, (_: unknown, k: number): number =>
        share(k),
      ),
    },
  });
  if (shaped.diagnostics.length !== 0)
    failures.push(`shape: ${ConstructionRead.diagnostics(shaped)}`);
  else {
    const bent: IAutoMovieSolidSurface = ConstructionRead.surface(
      shaped,
      "band.port",
    );
    let plain: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const c: number = clock(k);
      const at: (s: number) => V3 = (s: number): V3 => {
        const phi: number = s * 0.45 * Math.sin(c);
        return [
          20 * Math.cos(phi),
          20 * Math.sin(phi),
          -(50 + s * 10 * Math.cos(c)),
        ];
      };
      const p: readonly number[] = bent.jet(0, c).p;
      const gap: number = len(sub(p, at(share(k))));
      if (!(gap <= 1e-6))
        failures.push(
          `shaped loop column ${k}: ${gap} mm off the ellipse's point scaled by ${share(k)}`,
        );
      plain = Math.max(plain, len(sub(p, at(1))));
    }
    if (!(plain > 1))
      failures.push(
        `shape: the shaped loop stands only ${plain} mm from the plain ellipse, so the shares are not told apart`,
      );
  }

  // 9. A shape of another length than the columns.
  let refused: boolean = false;
  try {
    realize({
      ...port(0.02),
      loop: { ...port(0.02).loop, shape: [1, 1, 1] },
    });
  } catch {
    refused = true;
  }
  if (!refused)
    failures.push("a loop shape of 3 shares was admitted for 32 columns");

  // 10. A curved rail: 20 and 30 mm in, alternating at the part phases 0, pi/2, pi and 3 pi/2, h = pi/2 apart. The periodic cubic's
  // curvatures solve M[j-1] + 4 M[j] + M[j+1] = 6 (y[j+1] - 2 y[j] + y[j-1]) / h^2; by symmetry they alternate, +c at the 20 mm knots
  // and -c at the 30 mm ones, so 2 c = 6 (30 - 40 + 30) / h^2 and c = 6 (30 - 20) / h^2.
  const h: number = Math.PI / 2;
  const c0: number = (6 * (30 - 20)) / (h * h);
  const expected = (psi: number): number => {
    const x: number = ((psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const j: number = Math.min(3, Math.floor(x / h));
    const t: number = x - j * h;
    const [y0, y1]: [number, number] = j % 2 === 0 ? [20, 30] : [30, 20];
    const [m0, m1]: [number, number] = j % 2 === 0 ? [c0, -c0] : [-c0, c0];
    // The cubic on the span with those end values and end curvatures.
    return (
      y0 +
      t * ((y1 - y0) / h - (h * (2 * m0 + m1)) / 6) +
      (m0 * t * t) / 2 +
      ((m1 - m0) * t * t * t) / (6 * h)
    );
  };
  const curved: AutoMovieConstructionRealization.IRealization = realize({
    ...port(0.02),
    rails: [0.02, 0.03, 0.02, 0.03],
  });
  if (curved.diagnostics.length !== 0)
    failures.push(`curved rail: ${ConstructionRead.diagnostics(curved)}`);
  else {
    const strip: IAutoMovieSolidSurface = ConstructionRead.surface(
      curved,
      "band.port",
    );
    const span: number =
      curved.chains.find(
        (c: { name: string }): boolean => c.name === "band.port",
      )?.layers[1]?.y ?? NaN;
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let k: number = 0; k < n; ++k) {
      const p: readonly number[] = strip.jet(span, clock(k)).p;
      // The part's chart: u = +z about z = -50 mm, v = +y; its stations run along +x from x = 12 mm.
      const psi: number = Math.atan2(p[1]!, p[2]! + 50);
      const gap: number = Math.max(
        Math.abs(Math.hypot(p[1]!, p[2]! + 50) - 7),
        Math.abs(p[0]! - 12 - expected(psi)),
      );
      if (!(gap <= 1e-6))
        failures.push(
          `curved rail column ${k}: ${gap} mm off the part at the rail curve's station ${12 + expected(psi)} mm`,
        );
      low = Math.min(low, p[0]!);
      high = Math.max(high, p[0]!);
    }
    if (!(low < 33 && high > 41))
      failures.push(
        `curved rail: the ring spans ${low} to ${high} mm forward, not the curve's 32 to 42`,
      );
    const shared: (face: string, kind: string) => number[] = (
      face: string,
      kind: string,
    ): number[] =>
      curved.body.faces
        .find((f: { chain: string }): boolean => f.chain === face)
        ?.cycles.find((cy: { kind: string }): boolean => cy.kind === kind)
        ?.points ?? [];
    if (!same(shared("band.port", "end"), shared("arm", "start")))
      failures.push("curved rail: the band's end cycle is not the part's rail cycle");
    const edges: Map<string, number> = new Map();
    const cx: number[] = curved.mesh.indices;
    for (let t: number = 0; t + 2 < cx.length; t += 3)
      for (let e: number = 0; e < 3; ++e) {
        const a: number = cx[t + e]!;
        const b: number = cx[t + ((e + 1) % 3)]!;
        const key: string = a < b ? `${a},${b}` : `${b},${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    const loose = (v: number): boolean => {
      const x: number = curved.mesh.positions[3 * v]!;
      const z: number = curved.mesh.positions[3 * v + 2]!;
      return Math.abs(z) < 1e-7 || Math.abs(z + 0.1) < 1e-7 || Math.abs(x - 0.072) < 1e-7;
    };
    let gaps: number = 0;
    for (const [key, count] of edges)
      if (count > 2 || (count === 1 && !key.split(",").every((v: string): boolean => loose(Number(v))))) ++gaps;
    if (gaps !== 0) failures.push(`curved rail: ${gaps} edges not shared by exactly two triangles`);
  }

  // 11. A curved rail of 2 distances is refused.
  let short: boolean = false;
  try {
    realize({ ...port(0.02), rails: [0.02, 0.03] });
  } catch {
    short = true;
  }
  if (!short) failures.push("a curved rail of 2 distances was admitted");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} port failures:\n${failures.join("\n")}`,
    );
}
