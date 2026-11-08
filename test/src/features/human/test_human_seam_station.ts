import { AutoMovieLoftChain, AutoMovieSeamStation, type AutoMovieLoftFrame, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanSeam } from "../../../../packages/human/src/lofting/AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "../../../../packages/human/src/lofting/IAutoMovieHumanSeam";
import { HumanSeamObserver } from "../../../../packages/human/src/inspection/HumanSeamObserver";

/**
 * Along a chain the shared station rule leaves no curvature step at any
 * layer, a shared layer copied from its owner joins the two chains G2 in
 * either station direction, and a reflected seam jet keeps its outward side.
 *
 * @evidence contracts/testing.md#behavioral-verification Lofts surfaces of revolution `r(y) U(t)` whose section `U` is the uniform B-spline through the unit circle at its 16 knots, reads every layer and every shared ring with `HumanSeamObserver.surface` from `AutoMovieLoftChain.ring` points in the plane normal to the ring, and runs `AutoMovieSeamStation.continuous`, `copy` and `AutoMovieHumanSeam.reflect`. It catches three-point station slopes that step in curvature at every layer, a solve that leaves a step, a copied layer whose point, slope or curvature differs from the owner's, a copy signed into the wrong station direction, and a reflection that turns the skin inside out. Any chain passes whose layers meet C2 and whose shared rings carry the owner's jet.
 * @evidence contracts/testing.md#independent-expectations At a knot phase the plane normal to the ring holds the meridian `(r(y), y)`, so the readings are closed forms of r: the cubic Hermite's curvature step at a layer is `r''(y+) - r''(y-)` from its end values and slopes, read as `Delta r'' / (1 + r'^2)^(3/2)`; a copied point moved by 0.5 mm reads 0.5 mm, a slope moved by 0.05 reads `atan(r' + 0.05) - atan(r')`, a curvature moved by 0.004 /mm reads `0.004 / (1 + r'^2)^(3/2)`, a copy into the opposite direction signed as the same flips both the slope and the plane's motion, so the neighbour runs back over the owner and reads a fold of pi. The reflection is checked against central differences of the mirrored surface `mirror(S(y, -tau))`, and its normal against the mirrored outward normal. Limits are `HumanSeamObserver.exact(200, 0.05)`, a hundred times the observer's rounding at that magnitude and step (the pieces bend over tens of mm, so truncation stays below it), plus a millionth of the expected reading for the closed forms. Oracle limit: the readings at knot phases rely on the B-spline circle's symmetry about each knot's radius, which the control points `6 / (4 + 2 cos h)` on the circle give exactly.
 * @evidence contracts/testing.md#distinguishing-cases Green: the solved chain at all four interior layers, copies in the same and the opposite station direction. Red: three-point slopes at every interior layer, each of the three made copy defects alone, the wrong-signed copy, a reflection without the along flip. A solve keeps every layer's values. Refused: a kept layer without curvatures, a copy from an owner without jets. Section guides own `test_human_seam_section`, surface ribbons `test_human_seam_ribbon`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_seam_station`; it builds analytic chains in process and starts no host, browser or GPU.
 */
export const test_human_seam_station: () => void = (): void => {
  const failures: string[] = [];
  const N: number = 16;
  const tolerance: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(200, 0.05);
  const step: number = 0.05;
  const rho: number = 6 / (4 + 2 * Math.cos((2 * Math.PI) / N));
  const U: number[] = [
    ...Array.from({ length: N }, (_: unknown, i: number): number => rho * Math.cos((2 * Math.PI * i) / N)),
    ...Array.from({ length: N }, (_: unknown, i: number): number => rho * Math.sin((2 * Math.PI * i) / N)),
  ];
  const times: (k: number) => number[] = (k: number): number[] => U.map((v: number): number => k * v);
  const r: (y: number) => number = (y: number): number => 40 + 10 * Math.sin(y / 40);
  const horizontal: (y: number) => AutoMovieLoftFrame.IFrame = (y: number): AutoMovieLoftFrame.IFrame => ({
    origin: [0, y, 0],
    u: [1, 0, 0],
    v: [0, 0, 1],
  });
  const chain: (name: string, layers: IAutoMovieLoftChain.ILayer[]) => IAutoMovieLoftChain = (
    name: string,
    layers: IAutoMovieLoftChain.ILayer[],
  ): IAutoMovieLoftChain => ({
    name,
    basis: "spline",
    order: N,
    rule: "polar",
    samples: 64,
    layers,
  });
  const ring: (c: IAutoMovieLoftChain, s: number, a: number) => number[] = (
    c: IAutoMovieLoftChain,
    s: number,
    a: number,
  ): number[] => AutoMovieLoftChain.ring(c, s, [a / 40])[0]!;
  const read: (
    name: string,
    below: IAutoMovieLoftChain,
    sb: number,
    db: number,
    above: IAutoMovieLoftChain,
    sa: number,
    da: number,
    i: number,
  ) => HumanSeamObserver.IReading = (
    name: string,
    below: IAutoMovieLoftChain,
    sb: number,
    db: number,
    above: IAutoMovieLoftChain,
    sa: number,
    da: number,
    i: number,
  ): HumanSeamObserver.IReading =>
    HumanSeamObserver.surface(
      name,
      `knot ${i}`,
      (a: number, s: number): number[] => ring(below, sb + db * s, a),
      (a: number, s: number): number[] => ring(above, sa + da * s, a),
      (40 * 2 * Math.PI * i) / N,
      step,
    );
  const knotsRead: number[] = [1, 6, 11];

  // Three-point slopes along a chain on uneven layers: a curvature step at
  // every interior layer, from the cubic Hermite's end second derivatives.
  const ys: number[] = [0, 30, 70, 100, 160, 200];
  const three: number[] = ys.map((y: number, k: number): number => {
    if (k === 0) return (r(ys[1]!) - r(y)) / (ys[1]! - y);
    if (k === ys.length - 1) return (r(y) - r(ys[k - 1]!)) / (y - ys[k - 1]!);
    const h0: number = y - ys[k - 1]!;
    const h1: number = ys[k + 1]! - y;
    return (h0 * h0 * (r(ys[k + 1]!) - r(y)) + h1 * h1 * (r(y) - r(ys[k - 1]!))) / (h0 * h1 * (h0 + h1));
  });
  const cubic: IAutoMovieLoftChain = chain(
    "three-point",
    ys.map((y: number, k: number): IAutoMovieLoftChain.ILayer => ({ y, coefficients: times(r(y)), slopes: times(three[k]!) })),
  );
  for (let k: number = 1; k < ys.length - 1; k++) {
    const H0: number = ys[k]! - ys[k - 1]!;
    const H1: number = ys[k + 1]! - ys[k]!;
    const left: number = (-6 * (r(ys[k]!) - r(ys[k - 1]!)) / H0 + 2 * three[k - 1]! + 4 * three[k]!) / H0;
    const right: number = (6 * (r(ys[k + 1]!) - r(ys[k]!)) / H1 - 4 * three[k]! - 2 * three[k + 1]!) / H1;
    const want: number = Math.abs(right - left) / (1 + three[k]! ** 2) ** 1.5;
    for (const i of knotsRead) {
      const got: HumanSeamObserver.IReading = read("three-point layer", cubic, ys[k]!, -1, cubic, ys[k]!, 1, i);
      if (!(Math.abs(got.curvature - want) <= tolerance.curvature + 1e-6 * want))
        failures.push(`three-point layer ${k} knot ${i}: curvature step ${got.curvature}, expected ${want}`);
    }
  }

  // The shared rule: C2 at every layer, every value kept.
  const solved: IAutoMovieLoftChain = AutoMovieSeamStation.continuous(cubic);
  solved.layers.forEach((l: IAutoMovieLoftChain.ILayer, k: number): void => {
    if (l.coefficients.some((v: number, c: number): boolean => v !== cubic.layers[k]!.coefficients[c]))
      failures.push(`solve moved layer ${k}`);
  });
  for (let k: number = 1; k < ys.length - 1; k++)
    failures.push(
      ...HumanSeamObserver.audit(
        knotsRead.map((i: number): HumanSeamObserver.IReading => read(`solved layer ${k}`, solved, ys[k]!, -1, solved, ys[k]!, 1, i)),
        "G2",
        tolerance,
      ),
    );

  // A shared ring: owner A below, neighbour B above copying A's top layer.
  const framed: (y: number, s?: number) => IAutoMovieLoftChain.ILayer = (
    y: number,
    s: number = y,
  ): IAutoMovieLoftChain.ILayer => ({
    y: s,
    frame: horizontal(y),
    coefficients: times(r(y)),
    slopes: times(0),
  });
  const A: IAutoMovieLoftChain = AutoMovieSeamStation.continuous(
    chain("A", [0, 40, 100].map((y: number): IAutoMovieLoftChain.ILayer => framed(y))),
  );
  const top: IAutoMovieLoftChain.ILayer = A.layers[A.layers.length - 1]!;
  const rp: number = top.slopes[0]! / U[0]!;
  const share: (
    c: AutoMovieSeamStation.ICopy,
    y: number,
    edit?: (c: AutoMovieSeamStation.ICopy) => AutoMovieSeamStation.ICopy,
  ) => IAutoMovieLoftChain.ILayer = (
    c: AutoMovieSeamStation.ICopy,
    y: number,
    edit: (c: AutoMovieSeamStation.ICopy) => AutoMovieSeamStation.ICopy = (
      x: AutoMovieSeamStation.ICopy,
    ): AutoMovieSeamStation.ICopy => x,
  ): IAutoMovieLoftChain.ILayer => {
    const e: AutoMovieSeamStation.ICopy = edit(c);
    return {
      y,
      frame: AutoMovieSeamStation.unflat(e.plane),
      coefficients: e.coefficients,
      slopes: e.slopes,
      curvatures: e.curvatures,
      frameSlopes: AutoMovieSeamStation.unflat(e.frameSlopes),
      frameCurvatures: AutoMovieSeamStation.unflat(e.frameCurvatures),
    };
  };
  const above: (edit?: (c: AutoMovieSeamStation.ICopy) => AutoMovieSeamStation.ICopy) => IAutoMovieLoftChain = (
    edit?: (c: AutoMovieSeamStation.ICopy) => AutoMovieSeamStation.ICopy,
  ): IAutoMovieLoftChain =>
    AutoMovieSeamStation.continuous(
      chain("B", [share(AutoMovieSeamStation.copy(top, 1), 100, edit), framed(150), framed(200)]),
      [0],
    );
  const B: IAutoMovieLoftChain = above();
  failures.push(
    ...HumanSeamObserver.audit(
      knotsRead.map((i: number): HumanSeamObserver.IReading => read("A | B", A, 100, -1, B, 100, 1, i)),
      "G2",
      tolerance,
    ),
  );

  // Made defects in the copy, each read against its closed form.
  const expect: (
    label: string,
    c: IAutoMovieLoftChain,
    pick: (x: HumanSeamObserver.IReading) => number,
    want: number,
  ) => void = (
    label: string,
    c: IAutoMovieLoftChain,
    pick: (x: HumanSeamObserver.IReading) => number,
    want: number,
  ): void => {
    for (const i of knotsRead) {
      const got: number = pick(read(label, A, 100, -1, c, 100, 1, i));
      if (!(Math.abs(got - want) <= 1e-7 + 1e-6 * want)) failures.push(`${label} knot ${i}: read ${got}, expected ${want}`);
    }
  };
  const add: (x: number[], k: number) => number[] = (x: number[], k: number): number[] =>
    x.map((v: number, c: number): number => v + k * U[c]!);
  expect(
    "copy point moved 0.5 mm",
    above((c: AutoMovieSeamStation.ICopy): AutoMovieSeamStation.ICopy => ({ ...c, coefficients: add(c.coefficients, 0.5) })),
    (x: HumanSeamObserver.IReading): number => x.gap,
    0.5,
  );
  expect(
    "copy slope moved 0.05",
    above((c: AutoMovieSeamStation.ICopy): AutoMovieSeamStation.ICopy => ({ ...c, slopes: add(c.slopes, 0.05) })),
    (x: HumanSeamObserver.IReading): number => x.angle,
    Math.atan(rp + 0.05) - Math.atan(rp),
  );
  expect(
    "copy curvature moved 0.004",
    above((c: AutoMovieSeamStation.ICopy): AutoMovieSeamStation.ICopy => ({ ...c, curvatures: add(c.curvatures, 0.004) })),
    (x: HumanSeamObserver.IReading): number => x.curvature,
    0.004 / (1 + rp * rp) ** 1.5,
  );

  // The opposite direction: B' runs down from y = 200 to its top at y = 100.
  const down: (factor: number) => IAutoMovieLoftChain = (factor: number): IAutoMovieLoftChain =>
    AutoMovieSeamStation.continuous(
      chain("B'", [framed(200, 0), framed(150, 50), share(AutoMovieSeamStation.copy(top, factor), 100)]),
      [2],
    );
  failures.push(
    ...HumanSeamObserver.audit(
      knotsRead.map((i: number): HumanSeamObserver.IReading => read("A | B'", A, 100, -1, down(-1), 100, -1, i)),
      "G2",
      tolerance,
    ),
  );
  for (const i of knotsRead) {
    const got: number = read("A | B' unsigned", A, 100, -1, down(1), 100, -1, i).angle;
    const want: number = Math.PI;
    if (!(Math.abs(got - want) <= 1e-7 + 1e-6 * want)) failures.push(`unsigned copy knot ${i}: angle ${got}, expected ${want}`);
  }

  // J6: the mirrored jet is the mirrored surface's, its outward side kept.
  const S: (y: number, t: number) => number[] = (y: number, t: number): number[] => [r(y) * Math.cos(t), y, r(y) * Math.sin(t)];
  const Q: (y: number, tau: number) => number[] = (y: number, tau: number): number[] => {
    const p: number[] = S(y, -tau);
    return [p[0]!, p[1]!, -p[2]!];
  };
  const jetOf: (
    F: (y: number, t: number) => number[],
    y: number,
    t: number,
  ) => IAutoMovieHumanSeam.ISurfaceJet = (
    F: (y: number, t: number) => number[],
    y: number,
    t: number,
  ): IAutoMovieHumanSeam.ISurfaceJet => {
    const e: number = 1e-3;
    const at: (dy: number, dt: number) => number[] = (dy: number, dt: number): number[] => F(y + dy * e, t + dt * e);
    const lin: (terms: [number, number[]][]) => number[] = (terms: [number, number[]][]): number[] =>
      [0, 1, 2].map((k: number): number => terms.reduce((s: number, [w, v]: [number, number[]]): number => s + w * v[k]!, 0));
    return {
      point: at(0, 0),
      along: lin([[1 / (2 * e), at(0, 1)], [-1 / (2 * e), at(0, -1)]]),
      alongSecond: lin([[1 / (e * e), at(0, 1)], [-2 / (e * e), at(0, 0)], [1 / (e * e), at(0, -1)]]),
      across: lin([[1 / (2 * e), at(1, 0)], [-1 / (2 * e), at(-1, 0)]]),
      acrossSecond: lin([[1 / (e * e), at(1, 0)], [-2 / (e * e), at(0, 0)], [1 / (e * e), at(-1, 0)]]),
      twist: lin([[1 / (4 * e * e), at(1, 1)], [-1 / (4 * e * e), at(1, -1)], [-1 / (4 * e * e), at(-1, 1)], [1 / (4 * e * e), at(-1, -1)]]),
    };
  };
  const canonical: IAutoMovieHumanSeam.ISurfaceJet = jetOf(S, 80, 0.7);
  const mirrored: IAutoMovieHumanSeam.ISurfaceJet = AutoMovieHumanSeam.reflect(canonical);
  const reference: IAutoMovieHumanSeam.ISurfaceJet = jetOf(Q, 80, -0.7);
  for (const key of ["point", "along", "alongSecond", "across", "acrossSecond", "twist"] as const) {
    const d: number = Math.hypot(...mirrored[key].map((v: number, k: number): number => v - reference[key][k]!));
    if (!(d <= 1e-4)) failures.push(`reflected ${key} differs from the mirrored surface's by ${d}`);
  }
  const normal: (j: IAutoMovieHumanSeam.ISurfaceJet) => number[] = (j: IAutoMovieHumanSeam.ISurfaceJet): number[] => {
    const a: number[] = j.along;
    const c: number[] = j.across;
    const n: number[] = [a[1]! * c[2]! - a[2]! * c[1]!, a[2]! * c[0]! - a[0]! * c[2]!, a[0]! * c[1]! - a[1]! * c[0]!];
    const l: number = Math.hypot(...n);
    return n.map((v: number): number => v / l);
  };
  const nc: number[] = normal(canonical);
  const want: number[] = [nc[0]!, nc[1]!, -nc[2]!];
  const cosine: (n: number[]) => number = (n: number[]): number =>
    n.reduce((s: number, v: number, k: number): number => s + v * want[k]!, 0);
  if (!(cosine(normal(mirrored)) > 1 - 1e-9)) failures.push("reflection turned the outward side inward");
  if (!(cosine(normal({ ...mirrored, along: mirrored.along.map((v: number): number => -v) })) < -1 + 1e-9))
    failures.push("a reflection without the along flip kept the outward side; the flip would be untested");

  // Refusals.
  const refuses: (label: string, run: () => unknown) => void = (label: string, run: () => unknown): void => {
    try {
      run();
      failures.push(`${label} was accepted`);
    } catch {
      // Expected.
    }
  };
  refuses("a kept layer without curvatures", (): IAutoMovieLoftChain => AutoMovieSeamStation.continuous(cubic, [0]));
  refuses("a copy from an owner without jets", (): AutoMovieSeamStation.ICopy => AutoMovieSeamStation.copy(cubic.layers[2]!, 1));

  if (failures.length) throw new Error(`${failures.length} station seam failures:\n${failures.join("\n")}`);
};
