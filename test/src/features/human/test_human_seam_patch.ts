import { AutoMovieHumanSeamPatch } from "../../../../packages/human/src/lofting/AutoMovieHumanSeamPatch";
import type { IAutoMovieHumanSeam } from "../../../../packages/human/src/lofting/IAutoMovieHumanSeam";
import { HumanSeamObserver } from "../internal/HumanSeamObserver";

/**
 * A transfinite patch over four published ribbons reproduces an analytic
 * surface exactly, meets every neighbour with its declared continuity even
 * where the owners' twists disagree, and moves by exactly a made defect of a
 * boundary jet.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds 40 mm patches with `AutoMovieHumanSeamPatch.side`, `create` and `evaluate` over four sides published from analytic owner surfaces `A(x, y) = (x, y, z(x, y))`, z of degree two in each coordinate, and reads every side with `HumanSeamObserver.surface` from points in the plane normal to the side. It catches a boolean sum that misses an interior point, a side that leaves its owner's tangent plane or normal curvature, a twist disagreement that tears or creases a side, and corner bookkeeping that misreports the owners' mixed derivatives. Any patch passes that reproduces each side's ribbon to its declared order.
 * @evidence contracts/testing.md#independent-expectations The Hermite boolean sum of order r reproduces any surface of degree at most `2 r + 1` in v from its sides (Coons 1967), so the quintic and the cubic patch must both equal A, point and derivatives, wherever the owners agree. Owners that differ by `delta x y (L - x)(L - y) / L^2` along z share every boundary point and tangent but differ in twist by `delta` per mm^2, so the corner report must read `delta L^2` in chart units at all four corners. A published second cross derivative moved by e along z reads `e (z . n) / |A_y perp|^2` against the true owner, a cross derivative moved by e along the unit normal `atan(e / |A_y perp|)`. Interior limits are 1e-6 mm and 1e-5 for derivatives, above the 1e-7 the five-point stencils of the corner entries leave at this size; side readings take `HumanSeamObserver.exact(50, 0.01)` plus a millionth of the expected reading. Oracle limit: interior shape is checked only where an analytic surface exists, and the Gregory corner itself, a removable singularity of second derivatives, is not read.
 * @evidence contracts/testing.md#distinguishing-cases Green: compatible owners at G2 and at G1, all four sides; incompatible twists, and owners disagreeing in a side's second derivative at the corners, all four sides at G2 (a Gregory weight flat only to first order, `p = r`, fails the latter). Red: a bent and a tilted published side. Refused: sides that do not meet at a corner, a G0 side, a ribbon with no positive cross share. Two-piece seams, ribbons and station joins are owned by `test_human_seam_ribbon` and `test_human_seam_station`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_seam_patch`; it builds analytic surfaces in process and starts no host, browser or GPU.
 */
export const test_human_seam_patch: () => void = (): void => {
  const failures: string[] = [];
  const L: number = 40;
  const step: number = 0.01;
  const tolerance: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(50, step);
  const c: number[] = [0.004, 0.002, -0.003, 2e-5, -3e-5];

  // An owner surface, z plus an optional twist term, with its exact partials.
  const owner: (delta: number, kappa?: number) => IOwner = (delta: number, kappa: number = 0): IOwner => {
    const z: (x: number, y: number) => number[] = (x: number, y: number): number[] => {
      const g: number = (x * y * (L - x) * (L - y)) / (L * L);
      const gx: number = (y * (L - y) * (L - 2 * x)) / (L * L);
      const gy: number = (x * (L - x) * (L - 2 * y)) / (L * L);
      return [
        c[0]! * x * x + c[1]! * x * y + c[2]! * y * y + c[3]! * x * x * y + c[4]! * x * y * y + delta * g + (kappa * x * x * (L - x) ** 2) / (L * L),
        2 * c[0]! * x + c[1]! * y + 2 * c[3]! * x * y + c[4]! * y * y + delta * gx + (2 * kappa * x * (L - x) * (L - 2 * x)) / (L * L),
        c[1]! * x + 2 * c[2]! * y + c[3]! * x * x + 2 * c[4]! * x * y + delta * gy,
        2 * c[0]! + 2 * c[3]! * y - (2 * delta * y * (L - y)) / (L * L) + (2 * kappa * (L * L - 6 * L * x + 6 * x * x)) / (L * L),
        c[1]! + 2 * c[3]! * x + 2 * c[4]! * y + (delta * (L - 2 * x) * (L - 2 * y)) / (L * L),
        2 * c[2]! + 2 * c[4]! * x - (2 * delta * x * (L - x)) / (L * L),
      ];
    };
    return {
      p: (x: number, y: number): number[] => [x, y, z(x, y)[0]!],
      jet: (x: number, y: number): IPartials => {
        const f: number[] = z(x, y);
        return { x: [1, 0, f[1]!], y: [0, 1, f[2]!], xx: [0, 0, f[3]!], xy: [0, 0, f[4]!], yy: [0, 0, f[5]!] };
      },
    };
  };
  const negate: (v: number[]) => number[] = (v: number[]): number[] => v.map((x: number): number => -x);

  // The four published sides: bottom and top run along x, left and right along y, across into the square.
  const sides: (
    horizontal: IOwner,
    vertical: IOwner,
    edit?: (j: IAutoMovieHumanSeam.ISurfaceJet) => IAutoMovieHumanSeam.ISurfaceJet,
  ) => Sides = (
    horizontal: IOwner,
    vertical: IOwner,
    edit: (j: IAutoMovieHumanSeam.ISurfaceJet) => IAutoMovieHumanSeam.ISurfaceJet = (
      j: IAutoMovieHumanSeam.ISurfaceJet,
    ): IAutoMovieHumanSeam.ISurfaceJet => j,
  ): Sides => {
    const along: (o: IOwner, y: number, sign: number) => (a: number) => IAutoMovieHumanSeam.ISurfaceJet =
      (o: IOwner, y: number, sign: number): ((a: number) => IAutoMovieHumanSeam.ISurfaceJet) =>
      (a: number): IAutoMovieHumanSeam.ISurfaceJet => {
        const j: IPartials = o.jet(a, y);
        return {
          point: o.p(a, y),
          along: j.x,
          alongSecond: j.xx,
          across: sign > 0 ? j.y : negate(j.y),
          acrossSecond: j.yy,
          twist: sign > 0 ? j.xy : negate(j.xy),
        };
      };
    const up: (o: IOwner, x: number, sign: number) => (a: number) => IAutoMovieHumanSeam.ISurfaceJet =
      (o: IOwner, x: number, sign: number): ((a: number) => IAutoMovieHumanSeam.ISurfaceJet) =>
      (a: number): IAutoMovieHumanSeam.ISurfaceJet => {
        const j: IPartials = o.jet(x, a);
        return {
          point: o.p(x, a),
          along: j.y,
          alongSecond: j.yy,
          across: sign > 0 ? j.x : negate(j.x),
          acrossSecond: j.xx,
          twist: sign > 0 ? j.xy : negate(j.xy),
        };
      };
    return [
      AutoMovieHumanSeamPatch.side((a: number): IAutoMovieHumanSeam.ISurfaceJet => edit(along(horizontal, 0, 1)(a)), 0, L, L, 0),
      AutoMovieHumanSeamPatch.side(up(vertical, L, -1), 0, L, L, 0),
      AutoMovieHumanSeamPatch.side(along(horizontal, L, -1), 0, L, L, 0),
      AutoMovieHumanSeamPatch.side(up(vertical, 0, 1), 0, L, L, 0),
    ];
  };
  const read: (
    name: string,
    patch: AutoMovieHumanSeamPatch.IPatch,
    horizontal: IOwner,
    vertical: IOwner,
  ) => HumanSeamObserver.IReading[] = (
    name: string,
    patch: AutoMovieHumanSeamPatch.IPatch,
    horizontal: IOwner,
    vertical: IOwner,
  ): HumanSeamObserver.IReading[] => {
    const at: (u: number, v: number) => number[] = (u: number, v: number): number[] =>
      AutoMovieHumanSeamPatch.evaluate(patch, u, v).p;
    return [0.2, 0.5, 0.8].flatMap((f: number): HumanSeamObserver.IReading[] => [
      HumanSeamObserver.surface(
        `${name} bottom`,
        `${f}`,
        (a: number, s: number): number[] => horizontal.p(a, -s),
        (a: number, s: number): number[] => at(a / L, s / L),
        f * L,
        step,
      ),
      HumanSeamObserver.surface(
        `${name} top`,
        `${f}`,
        (a: number, s: number): number[] => horizontal.p(a, L + s),
        (a: number, s: number): number[] => at(a / L, 1 - s / L),
        f * L,
        step,
      ),
      HumanSeamObserver.surface(
        `${name} left`,
        `${f}`,
        (a: number, s: number): number[] => vertical.p(-s, a),
        (a: number, s: number): number[] => at(s / L, a / L),
        f * L,
        step,
      ),
      HumanSeamObserver.surface(
        `${name} right`,
        `${f}`,
        (a: number, s: number): number[] => vertical.p(L + s, a),
        (a: number, s: number): number[] => at(1 - s / L, a / L),
        f * L,
        step,
      ),
    ]);
  };
  const distance: (a: number[], b: number[]) => number = (a: number[], b: number[]): number =>
    Math.hypot(...a.map((v: number, k: number): number => v - b[k]!));

  // Compatible owners: the patch is A itself, quintic and cubic.
  const A: IOwner = owner(0);
  for (const order of ["G2", "G1"] as const) {
    const patch: AutoMovieHumanSeamPatch.IPatch = AutoMovieHumanSeamPatch.create(`exact ${order}`, sides(A, A), [order, order, order, order]);
    let point: number = 0;
    let slope: number = 0;
    for (let i: number = 1; i < 10; i++)
      for (let k: number = 1; k < 10; k++) {
        const u: number = i / 10;
        const v: number = k / 10;
        const e: AutoMovieHumanSeamPatch.IJet = AutoMovieHumanSeamPatch.evaluate(patch, u, v);
        const j: IPartials = A.jet(L * u, L * v);
        point = Math.max(point, distance(e.p, A.p(L * u, L * v)));
        slope = Math.max(
          slope,
          distance(e.u, j.x.map((x: number): number => L * x)) / L,
          distance(e.v, j.y.map((x: number): number => L * x)) / L,
          distance(e.uu, j.xx.map((x: number): number => L * L * x)) / L,
          distance(e.uv, j.xy.map((x: number): number => L * L * x)) / L,
          distance(e.vv, j.yy.map((x: number): number => L * L * x)) / L,
        );
      }
    if (!(point <= 1e-6)) failures.push(`${order} patch misses A by ${point} mm`);
    if (!(slope <= 1e-5)) failures.push(`${order} patch derivatives miss A's by ${slope}`);
    if (patch.corners.some((k: AutoMovieHumanSeamPatch.ICorner): boolean => k.mismatch > 1e-5))
      failures.push(
        `${order} compatible corners read a mismatch ${Math.max(...patch.corners.map((k: AutoMovieHumanSeamPatch.ICorner): number => k.mismatch))}`,
      );
    failures.push(...HumanSeamObserver.audit(read(`exact ${order}`, patch, A, A), order, tolerance));
  }

  // Owners disagreeing in twist by delta: every side still met G2, the
  // corners report the disagreement in chart units.
  const delta: number = 2e-4;
  const B: IOwner = owner(delta);
  const gregory: AutoMovieHumanSeamPatch.IPatch = AutoMovieHumanSeamPatch.create("gregory", sides(A, B), ["G2", "G2", "G2", "G2"]);
  gregory.corners.forEach((k: AutoMovieHumanSeamPatch.ICorner, index: number): void => {
    if (!(Math.abs(k.twist - delta * L * L) <= 1e-6 * delta * L * L))
      failures.push(`gregory corner ${index} reads twist ${k.twist}, expected ${delta * L * L}`);
    if (!(k.first <= 1e-9 * L)) failures.push(`gregory corner ${index} reads a first-order mismatch ${k.first}`);
  });
  failures.push(...HumanSeamObserver.audit(read("gregory", gregory, A, B), "G2", tolerance));

  // Owners disagreeing in the second derivative along a side at the corners
  // (kappa x^2 (L - x)^2 / L^2, zero with its slope on both vertical sides):
  // the pure entry (2, 0) reads 2 kappa L^2, and the sides still meet G2
  // only because the Gregory weight is flat to second order across a side.
  const kappa: number = 3e-3;
  const C: IOwner = owner(0, kappa);
  const bend: AutoMovieHumanSeamPatch.IPatch = AutoMovieHumanSeamPatch.create("second order", sides(A, C), ["G2", "G2", "G2", "G2"]);
  bend.corners.forEach((k: AutoMovieHumanSeamPatch.ICorner, index: number): void => {
    if (!(Math.abs(k.mismatch - 2 * kappa * L * L) <= 1e-6 * kappa * L * L))
      failures.push(`second-order corner ${index} reads ${k.mismatch}, expected ${2 * kappa * L * L}`);
  });
  failures.push(...HumanSeamObserver.audit(read("second order", bend, A, C), "G2", tolerance));

  // Made defects of the bottom side's published jet, read against the true A.
  const e: number = 0.002;
  const unit: (a: number) => number[] = (a: number): number[] => {
    const j: IPartials = A.jet(a, 0);
    const n: number[] = [j.x[1]! * j.y[2]! - j.x[2]! * j.y[1]!, j.x[2]! * j.y[0]! - j.x[0]! * j.y[2]!, j.x[0]! * j.y[1]! - j.x[1]! * j.y[0]!];
    const l: number = Math.hypot(...n);
    return n.map((x: number): number => x / l);
  };
  const perp: (a: number) => number = (a: number): number => {
    const j: IPartials = A.jet(a, 0);
    const T: number[] = j.x.map((x: number): number => x / Math.hypot(...j.x));
    const lean: number = j.y.reduce((s: number, x: number, k: number): number => s + x * T[k]!, 0);
    return Math.hypot(...j.y.map((x: number, k: number): number => x - lean * T[k]!));
  };
  const bent: AutoMovieHumanSeamPatch.IPatch = AutoMovieHumanSeamPatch.create(
    "bent",
    sides(
      A,
      A,
      (j: IAutoMovieHumanSeam.ISurfaceJet): IAutoMovieHumanSeam.ISurfaceJet => ({
        ...j,
        acrossSecond: j.acrossSecond.map((x: number, k: number): number => x + (k === 2 ? e : 0)),
      }),
    ),
    ["G2", "G2", "G2", "G2"],
  );
  const tilted: AutoMovieHumanSeamPatch.IPatch = AutoMovieHumanSeamPatch.create(
    "tilted",
    sides(
      A,
      A,
      (j: IAutoMovieHumanSeam.ISurfaceJet): IAutoMovieHumanSeam.ISurfaceJet => ({
        ...j,
        across: j.across.map((x: number, k: number): number => x + e * unit(j.point[0]!)[k]!),
      }),
    ),
    ["G2", "G2", "G2", "G2"],
  );
  for (const f of [0.2, 0.5, 0.8]) {
    const a: number = f * L;
    const at: (patch: AutoMovieHumanSeamPatch.IPatch) => (x: number, s: number) => number[] =
      (patch: AutoMovieHumanSeamPatch.IPatch): ((x: number, s: number) => number[]) =>
      (x: number, s: number): number[] =>
        AutoMovieHumanSeamPatch.evaluate(patch, x / L, s / L).p;
    const b: HumanSeamObserver.IReading = HumanSeamObserver.surface(
      "bent bottom",
      `${f}`,
      (x: number, s: number): number[] => A.p(x, -s),
      at(bent),
      a,
      step,
    );
    const want: number = (e * unit(a)[2]!) / perp(a) ** 2;
    if (!(Math.abs(b.curvature - want) <= tolerance.curvature + 1e-6 * want)) failures.push(`bent side at ${f}: ${b.curvature}, expected ${want}`);
    const t: HumanSeamObserver.IReading = HumanSeamObserver.surface(
      "tilted bottom",
      `${f}`,
      (x: number, s: number): number[] => A.p(x, -s),
      at(tilted),
      a,
      step,
    );
    const tilt: number = Math.atan(e / perp(a));
    if (!(Math.abs(t.angle - tilt) <= tolerance.angle + 1e-6 * tilt)) failures.push(`tilted side at ${f}: ${t.angle}, expected ${tilt}`);
  }

  // Refusals.
  const refuses: (label: string, run: () => unknown) => void = (label: string, run: () => unknown): void => {
    try {
      run();
      failures.push(`${label} was accepted`);
    } catch {
      // Expected.
    }
  };
  const shifted: Sides = sides(A, A);
  const top: AutoMovieHumanSeamPatch.Side = shifted[2];
  shifted[2] = (w: number): IAutoMovieHumanSeam.ISurfaceJet => ({
    ...top(w),
    point: top(w).point.map((x: number, k: number): number => x + (k === 2 ? 1 : 0)),
  });
  refuses("sides that miss at a corner", (): AutoMovieHumanSeamPatch.IPatch => AutoMovieHumanSeamPatch.create("shifted", shifted, ["G2", "G2", "G2", "G2"]));
  refuses("a G0 side", (): AutoMovieHumanSeamPatch.IPatch => AutoMovieHumanSeamPatch.create("g0", sides(A, A), ["G0", "G2", "G2", "G2"]));
  refuses("a ribbon with no cross share", (): AutoMovieHumanSeamPatch.Side =>
    AutoMovieHumanSeamPatch.side((a: number): IAutoMovieHumanSeam.ISurfaceJet => sides(A, A)[0](a / L), 0, L, 0, 0),
  );

  if (failures.length) throw new Error(`${failures.length} patch seam failures:\n${failures.join("\n")}`);
};

/** An analytic owner surface `(x, y, z(x, y))` with its exact partials at a chart point. */
interface IOwner {
  /** Surface point. */
  p: (x: number, y: number) => number[];

  /** Partials of the surface at a chart point. */
  jet: (x: number, y: number) => IPartials;
}

/** The first and second partials of an owner surface in its chart. */
interface IPartials {
  /** First partial in x. */
  x: number[];

  /** First partial in y. */
  y: number[];

  /** Second partial in x. */
  xx: number[];

  /** Mixed partial. */
  xy: number[];

  /** Second partial in y. */
  yy: number[];
}

/** A patch's four sides: bottom, right, top, left. */
type Sides = [AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side];
