import {
  type AutoMovieConstructionRealization,
  AutoMovieConstructionSplitSeam,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A split with a curved seam (`IAutoMovieConstructionSplit.IProfile`) leaves both forks along the host's own surface: the seam is tangent to the host there, the bands' chord columns stand on it in the seam plane, ruled square to that plane, and the ribbons turn to the inward diagonal at each fork, so each band meets the host G1 at the fork where the straight chord leaves a crease.
 *
 * Fixture (`test_construction_split`'s, metres, the `DOWN` frame: stations advance along `-z`): the host `trunk` is the body of revolution of radius `r(s) = 0.025 sqrt(1 - (s / 0.08)^2)` over stations `[-0.06, 0.03]`, its top end (station 0.03, `z = -0.03`) split along `[0, pi]`, so the forks are `A = (R, 0, -30)` and `B = (-R, 0, -30)` mm with `R = 25 sqrt(1 - (30 / 80)^2)`, and the seam plane is `y = 0` (the chord along `x`, the end's outward normal `-z`). The children hang at `y = +-0.0105` with rails 0.03 m in. Profile knots `[0.008, 0.005]`, `[0.0232, 0.006]`, `[0.0383, 0.005]` m (along from `A`, depth below the end), corner `pi / 8`. Columns 32 (clock step `pi / 16`), rows 4.
 *
 * Scenarios:
 * 1. The seam alone (`AutoMovieConstructionSplitSeam.create` on the realized host): its ends are `A` and `B`; its tangent at `A` is the host's station direction out of the end read on the host's realized surface (the fixture's symmetry puts it in `y = 0`, within 0.05 of the closed form `(r'(s), 0, -1)` with `r'(0.03) = -0.025 (0.03 / 0.08^2) / sqrt(1 - (0.03 / 0.08)^2)`; the loft's derivative is its own), and at `B` the reverse of the host's there, within 1e-9; it passes through every knot (nearest of 401 shares refined by 60 golden-section steps, within 1e-6 mm); every point lies in `y = 0` within 1e-9 mm.
 * 2. No diagnostic; the faces are the host, both children and both bands.
 * 3. Arc columns outside the corner window (`2 <= k <= 14`): the band copies the host's 2-jet (point within 1e-6 mm of the host's circle, cross direction and `uu / |u|^2` within 1e-9).
 * 4. Seam columns (`17 <= k <= 31`): the point lies in `y = 0` within 1e-9 mm and on the seam (within 1e-6 mm of `seam.at` at its arclength share); outside the window (`19 <= k <= 29`) the cross direction is `(0, 1, 0)` for band a and `(0, -1, 0)` for band b within 1e-9 and the second derivative vanishes.
 * 5. Fork corners (columns 0 and 16): the cross direction is the inward diagonal, `(d + y_a) / sqrt 2` with `d` the host's realized station direction out of the end and `y_a` the ruling toward band a's arc, within 1e-9; and the band's normal agrees with the host's within 1 degree. Basis: the strip is refined so each one-sided chord at a fork deviates from its side's tangent by at most half a degree (`AutoMovieConstructionSplitBand`; unrefined, this fixture read 7.0 degrees at 11.25 degrees of ring turn per column).
 * 6. Shared ids: band a's chord column `k` is band b's `48 - k`; the skin is watertight away from the free ends.
 * 7. Refusals: a corner of `pi / 2` and a knot on the knot before it are refused by admission; a last knot at 0.05 m, beyond the 0.0463 m chord, leaves one diagnostic on the split naming the seam and no band (tessellated at 1 mm, as is the red tree, since only diagnostics and surfaces are read there).
 * 8. Red: the same fork reading on the straight chord (no profile) exceeds 20 degrees.
 * 9. A seam that runs out before it turns (knots `[0, 0.004]`, `[0.006, 0.007]`, then the fixture's last two): its first knot stands straight out of fork `A`, which the chord's parameter could not hold (refused by admission before the profile was parameterized by its own length). Matched to its children by length (`IChild.correspondence`; the loop that runs out is not star-shaped about a rail's centroid), it realizes with no diagnostic and both bands, passes within 0.01 mm of `(R, 0, -34)` mm on 4001 shares (their spacing is 0.015 mm), and over its first 3 mm of length runs less than 1 mm along the chord while it stands more than 2.5 mm out.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes split trees with `realizeAutoMovieConstruction` and reads the realized bands, host and skin, and the seam module on the realized host; it catches a seam that leaves a fork off the host's tangent plane, misses its knots or leaves its plane, chord columns off the seam or ruled wrongly, corner ribbons along either boundary, a fork crease, an unshared seam, an open skin and refusals that leave partial geometry.
 * @evidence contracts/development/testing.md#independent-expectations Fork tangents from the fixture's closed-form radius derivative, the seam plane from the fixture's symmetry, knots from the declaration, arc jets from the host's realized surface (the split does not produce it), the ruling and the diagonal from the node contract, watertightness from the manifold rule; the 1 degree fork bound is the stated prediction, and the red reading shows the same observer sees the straight chord's crease. Oracle limit: between columns the band is the strip's B-spline and is not asserted.
 * @evidence contracts/development/testing.md#distinguishing-cases Arc columns inside and outside the window, seam columns inside and outside it, both forks, three refusals and the straight-chord red reading.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_split_seam`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 9 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The seam alone (`AutoMovieConstructionSplitSeam.create` on the realized host): its ends are `A` and `B`; its tangent at `A` is the host's...).
 */
export function test_construction_split_seam(): void {
  const failures: string[] = [];
  const turn: number = 2 * Math.PI;
  const n: number = 32;
  const m: number = n / 2;
  const clock: (k: number) => number = (k: number): number => (turn * k) / n;
  const R: number = 25 * Math.sqrt(1 - (30 / 80) ** 2);
  const slope: number =
    (-0.025 * (0.03 / 0.08 ** 2)) / Math.sqrt(1 - (0.03 / 0.08) ** 2);
  const knots: [number, number][] = [
    [0.008, 0.005],
    [0.0232, 0.006],
    [0.0383, 0.005],
  ];
  const corner: number = Math.PI / 8;

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
  const leg: (name: string, y: number) => AutoMovieConstructionNode = (
    name: string,
    y: number,
  ): AutoMovieConstructionNode =>
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
  const split: (
    profile: IAutoMovieConstructionSplit.IProfile | undefined,
  ) => IAutoMovieConstructionSplit = (
    profile: IAutoMovieConstructionSplit.IProfile | undefined,
  ): IAutoMovieConstructionSplit => ({
    type: "split",
    name: "split.legs",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    seam: [0, Math.PI],
    ...(profile === undefined ? {} : { profile }),
    count: n,
    rows: 4,
    children: [
      {
        band: "band.a",
        part: leg("leg.a", 0.0105),
        partFace: "leg.a",
        partEnd: "bottom",
        rail: 0.03,
      },
      {
        band: "band.b",
        part: leg("leg.b", -0.0105),
        partFace: "leg.b",
        partEnd: "bottom",
        rail: 0.03,
      },
    ],
  });
  /** Realize a tree; `coarse` tessellates at 1 mm where only surfaces or diagnostics are read. */
  const realize: (
    root: AutoMovieConstructionNode,
    coarse?: boolean,
  ) => AutoMovieConstructionRealization.IRealization = (
    root: AutoMovieConstructionNode,
    coarse?: boolean,
  ): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction(
      { name: "made", root },
      { chord: coarse === true ? 1e-3 : 1e-4 },
    );
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
  const unit: (a: readonly number[]) => V3 = (a: readonly number[]): V3 =>
    scaled(a, 1 / len(a));
  const off: (a: readonly number[], b: readonly number[]) => number = (
    a: readonly number[],
    b: readonly number[],
  ): number => len(sub(unit(a), unit(b)));
  const cross: (a: readonly number[], b: readonly number[]) => V3 = (
    a: readonly number[],
    b: readonly number[],
  ): V3 => [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
  const degrees: (a: readonly number[], b: readonly number[]) => number = (
    a: readonly number[],
    b: readonly number[],
  ): number =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          (a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!) / (len(a) * len(b)),
        ),
      ),
    ) *
      180) /
    Math.PI;
  const bend: (j: IAutoMovieSolidSurface.IJet) => V3 = (
    j: IAutoMovieSolidSurface.IJet,
  ): V3 => scaled(j.uu, 1 / (len(j.u) * len(j.u)));
  /** The band's and the host's outward normals' angle at a fork column, degrees. */
  const fork: (
    r: AutoMovieConstructionRealization.IRealization,
    name: string,
    k: number,
    phi: number,
  ) => number = (
    r: AutoMovieConstructionRealization.IRealization,
    name: string,
    k: number,
    phi: number,
  ): number => {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(r, "trunk");
    const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
    const h: IAutoMovieSolidSurface.IJet = trunk.jet(30, phi);
    return degrees(
      scaled(cross(b.u, b.v), band.orientation),
      scaled(cross(h.u, h.v), trunk.orientation),
    );
  };

  // 2. The positive tree.
  const profile: IAutoMovieConstructionSplit.IProfile = { knots, corner };
  const real: AutoMovieConstructionRealization.IRealization = realize(
    split(profile),
  );
  if (real.diagnostics.length !== 0)
    failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  if (names !== "band.a,band.b,leg.a,leg.b,trunk")
    failures.push(`faces: ${names}`);
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");

  // 1. The seam alone, on the realized host.
  const seam: AutoMovieConstructionSplitSeam.ISeam | string =
    AutoMovieConstructionSplitSeam.create({
      host: trunk,
      station: 30,
      into: 1,
      seam: [0, Math.PI],
      normal: [0, 0, -1],
      knots: knots.map(([a, d]: [number, number]): [number, number] => [
        a * 1000,
        d * 1000,
      ]),
    });
  if (typeof seam === "string") failures.push(`seam refused: ${seam}`);
  else {
    const A: V3 = [R, 0, -30];
    const B: V3 = [-R, 0, -30];
    if (
      !(
        len(sub(seam.at(0).point, A)) <= 1e-9 &&
        len(sub(seam.at(1).point, B)) <= 1e-9
      )
    )
      failures.push(
        `seam ends ${JSON.stringify(seam.at(0).point)} ${JSON.stringify(seam.at(1).point)}`,
      );
    // The host's own station direction out of its top end at each fork, read
    // on its realized surface (the loft's, not the closed form's derivative).
    const outA: V3 = unit(trunk.jet(30, 0).u);
    const outB: V3 = unit(trunk.jet(30, Math.PI).u);
    if (
      !(
        Math.abs(outA[1]) <= 1e-12 &&
        Math.abs(outB[1]) <= 1e-12 &&
        off(outA, [slope, 0, -1]) < 0.05
      )
    )
      failures.push(
        `fixture: the host's fork directions ${JSON.stringify(outA)} ${JSON.stringify(outB)} are not the symmetric station directions`,
      );
    if (!(off(seam.at(0).tangent, outA) <= 1e-9))
      failures.push(
        `seam tangent at A ${off(seam.at(0).tangent, outA)} off the host's station direction`,
      );
    if (!(off(seam.at(1).tangent, scaled(outB, -1)) <= 1e-9))
      failures.push(
        `seam tangent at B ${off(seam.at(1).tangent, scaled(outB, -1))} off the host's station direction reversed`,
      );
    const samples: V3[] = Array.from(
      { length: 401 },
      (_: unknown, i: number): V3 => seam.at(i / 400).point,
    );
    if (!samples.every((p: V3): boolean => Math.abs(p[1]) <= 1e-9))
      failures.push("the seam leaves its plane y = 0");
    for (const [along, depth] of knots) {
      // The nearest sample, then 60 golden-section steps on the share
      // between its neighbours: the knot lies on the curve, so the least
      // distance found is the solver's, not the sampling's.
      const knot: V3 = [R - along * 1000, 0, -30 - depth * 1000];
      const distance: (t: number) => number = (t: number): number =>
        len(sub(seam.at(t).point, knot));
      let best: number = 0;
      samples.forEach((p: V3, i: number): void => {
        if (len(sub(p, knot)) < len(sub(samples[best]!, knot))) best = i;
      });
      let lo: number = Math.max(0, (best - 1) / 400);
      let hi: number = Math.min(1, (best + 1) / 400);
      const g: number = (Math.sqrt(5) - 1) / 2;
      for (let i: number = 0; i < 60; ++i) {
        const x1: number = hi - g * (hi - lo);
        const x2: number = lo + g * (hi - lo);
        if (distance(x1) < distance(x2)) hi = x2;
        else lo = x1;
      }
      const least: number = distance((lo + hi) / 2);
      if (!(least <= 1e-6))
        failures.push(
          `the seam misses its knot (${along}, ${depth}) by ${least} mm`,
        );
    }

    // 4. Seam columns of both bands.
    for (const [name, side, reversed] of [
      ["band.a", 1, true],
      ["band.b", -1, false],
    ] as const) {
      const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
      for (let k: number = m + 1; k < n; ++k) {
        const f: number = (k - m) / m;
        const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
        if (!(Math.abs(b.p[1]) <= 1e-9))
          failures.push(
            `${name} seam column ${k}: ${b.p[1]} mm off the seam plane`,
          );
        const on: number = len(sub(b.p, seam.at(reversed ? 1 - f : f).point));
        if (!(on <= 1e-6))
          failures.push(`${name} seam column ${k}: ${on} mm off the seam`);
        if (k >= m + 3 && k <= n - 3) {
          if (!(off(b.u, [0, side, 0]) <= 1e-9))
            failures.push(
              `${name} seam column ${k}: ruling ${off(b.u, [0, side, 0])} off the seam plane's normal toward its arc`,
            );
          if (!(len(b.uu) <= 1e-9))
            failures.push(
              `${name} seam column ${k}: second derivative ${len(b.uu)}`,
            );
        }
      }
    }
  }

  // 3. Arc columns outside the corner window.
  for (const [name, alpha] of [
    ["band.a", 0],
    ["band.b", Math.PI],
  ] as const) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    for (let k: number = 2; k <= m - 2; ++k) {
      const phi: number = alpha + (Math.PI * k) / m;
      const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
      const h: IAutoMovieSolidSurface.IJet = trunk.jet(30, phi);
      const gap: number = len(
        sub(b.p, [R * Math.cos(phi), R * Math.sin(phi), -30]),
      );
      if (!(gap <= 1e-6))
        failures.push(`${name} column ${k}: ${gap} mm off the host's circle`);
      if (!(off(b.u, h.u) <= 1e-9))
        failures.push(
          `${name} column ${k}: cross direction ${off(b.u, h.u)} off the host's`,
        );
      if (!(len(sub(bend(b), bend(h))) <= 1e-9))
        failures.push(
          `${name} column ${k}: cross curvature ${len(sub(bend(b), bend(h)))} mm^-1 off the host's`,
        );
    }
  }

  // 5. Fork corners of band a: the inward diagonal, and G1 with the host.
  const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, "band.a");
  const readings: string[] = [];
  for (const [k, phi] of [
    [0, 0],
    [m, Math.PI],
  ] as const) {
    // The host's own station direction out of the end at the fork plus the
    // ruling toward band a's arc, `+y`: both unit, so their sum bisects them.
    const diagonal: V3 = unit(trunk.jet(30, phi).u);
    diagonal[1] += 1;
    const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
    if (!(off(b.u, diagonal) <= 1e-9))
      failures.push(
        `band.a fork column ${k}: cross direction ${off(b.u, diagonal)} off the inward diagonal`,
      );
    const angle: number = fork(real, "band.a", k, phi);
    readings.push(`column ${k} ${angle.toFixed(4)} deg`);
    if (!(angle < 1))
      failures.push(
        `band.a fork column ${k}: ${angle} deg between the band's and the host's normals`,
      );
  }

  // 6. Shared ids and the watertight skin.
  const cycle: (face: string, kind: string) => number[] = (
    face: string,
    kind: string,
  ): number[] =>
    real.body.faces
      .find((f: { chain: string }): boolean => f.chain === face)
      ?.cycles.find((c: { kind: string }): boolean => c.kind === kind)
      ?.points ?? [];
  const startA: number[] = cycle("band.a", "start");
  const startB: number[] = cycle("band.b", "start");
  for (let k: number = m + 1; k < n; ++k)
    if (startA[k] === undefined || startA[k] !== startB[3 * m - k])
      failures.push(
        `seam column ${k}: band a point ${startA[k]} is not band b's ${startB[3 * m - k]}`,
      );
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let t: number = 0; t + 2 < ix.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free: (v: number) => boolean = (v: number): boolean =>
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
  if (open !== 0 || over !== 0)
    failures.push(
      `skin: ${open} open edges away from the free ends, ${over} edges in more than two triangles`,
    );

  // 7. Refusals.
  for (const [bad, word] of [
    [{ knots, corner: Math.PI / 2 }, "corner"],
    [
      {
        knots: [
          [0.01, 0.005],
          [0.01, 0.005],
        ] as [number, number][],
        corner,
      },
      "knot",
    ],
  ] as const) {
    try {
      realize(split(bad));
      failures.push(`a profile with a bad ${word} was admitted`);
    } catch (error: unknown) {
      if (!(error instanceof Error && error.message.includes(word)))
        failures.push(
          `a profile with a bad ${word} was refused for another reason: ${String(error)}`,
        );
    }
  }
  const beyond: AutoMovieConstructionRealization.IRealization = realize(
    split({ knots: [[0.05, 0.005]], corner }),
    true,
  );
  const kept: string = beyond.body.faces
    .map((f: { chain: string }): string => f.chain)
    .join(",");
  if (
    !beyond.diagnostics.some(
      (d: { node: string; detail: string }): boolean =>
        d.node === "split.legs" && d.detail.includes("seam"),
    ) ||
    kept.includes("band")
  )
    failures.push(
      `a knot beyond the chord left ${kept} with diagnostics ${ConstructionRead.diagnostics(beyond)}`,
    );

  // 8. Red: the straight chord's fork crease, read by the same observer.
  const straight: AutoMovieConstructionRealization.IRealization = realize(
    split(undefined),
    true,
  );
  const crease: number = fork(straight, "band.a", 0, 0);
  if (!(crease > 20))
    failures.push(
      `proof: the straight chord's fork reads ${crease} deg, not a crease`,
    );
  // 9. A seam that runs out along the host before it turns across the end.
  const outKnots: [number, number][] = [[0, 0.004], [0.006, 0.007], knots[1]!, knots[2]!];
  try {
    const lengthwise: IAutoMovieConstructionSplit = split({ knots: outKnots, corner });
    const out: AutoMovieConstructionRealization.IRealization = realize({ ...lengthwise, children: lengthwise.children.map((c: IAutoMovieConstructionSplit.IChild): IAutoMovieConstructionSplit.IChild => ({ ...c, correspondence: "length" })) as IAutoMovieConstructionSplit["children"] }, true);
    if (out.diagnostics.length !== 0) failures.push(`run-out seam: ${ConstructionRead.diagnostics(out)}`);
    if (out.body.faces.filter((f: { chain: string }): boolean => f.chain.startsWith("band.")).length !== 2) failures.push("run-out seam: not two bands");
    const ran: AutoMovieConstructionSplitSeam.ISeam | string = AutoMovieConstructionSplitSeam.create({
      host: ConstructionRead.surface(out, "trunk"),
      station: 30,
      into: 1,
      seam: [0, Math.PI],
      normal: [0, 0, -1],
      knots: outKnots.map(([a, d]: [number, number]): [number, number] => [a * 1000, d * 1000]),
    });
    if (typeof ran === "string") failures.push(`run-out seam refused: ${ran}`);
    else {
      // The plane is y = 0: `along` is R - x, the depth -(z + 30).
      let nearest: number = Infinity;
      for (let i: number = 0; i <= 4000; ++i) nearest = Math.min(nearest, len(sub(ran.at(i / 4000).point, [R, 0, -34])));
      const early: readonly number[] = ran.at(3 / ran.length).point;
      if (!(nearest <= 0.01)) failures.push(`run-out seam: misses its first knot by ${nearest} mm`);
      if (!(R - early[0]! < 1 && -(early[2]! + 30) > 2.5)) failures.push(`run-out seam: 3 mm along its length it stands ${R - early[0]!} mm along the chord and ${-(early[2]! + 30)} mm out`);
    }
  } catch (error: unknown) {
    failures.push(`run-out seam refused: ${String(error)}`);
  }

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} split seam failures (fork ${readings.join(", ")}; straight chord ${crease.toFixed(4)} deg):\n${failures.join("\n")}`,
    );
}
