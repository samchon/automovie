import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The four landmarks of the thumb's root on the reference's skin, by rule on joint centres.
 *
 * The thumb leaves the hand's side, so its root is a landmark surface about its metacarpophalangeal centre, as the armscye's is about
 * the shoulder's (`AutoMovieHumanLandmarkSurface`; `packages/human/docs/techniques/joints-one-shot.md`, The thumb on the hand's side).
 * The rules:
 * - radial and the two side points: in the plane through that centre square to the thumb's proximal phalanx, the skin's first point
 *   from the centre straight away from the index finger's knuckle, and to either side of that line;
 * - the first web's floor: in the plane the two proximal phalanges' directions span, on the line through the midpoint of the two
 *   knuckle centres along those directions' bisector, the skin's crossing nearest that midpoint (the midpoint stands in the air
 *   between a spread thumb and the index finger, and in the flesh between two fingers).
 *
 * The fit clips the hand and the thumb by the surface through these points, and the Human package stores them in the thumb
 * metacarpal's frame for the figure's join.
 */
export namespace FamilyConicThumbRoot {
  type V = [number, number, number];

  /**
   * The landmarks with what the surface is built about.
   *
   * @evidence contracts/development/design.md#principled-representation The centre the surface stands about, its far side's direction, and each landmark with the ray it was read on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the fit's registry and by the landmark reading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A landmark whose ray meets no skin is null, never a guessed point.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface IRoot {
    /** The thumb's metacarpophalangeal centre, mm. */
    centre: V;

    /** The thumb's next joint centre, on the surface's far side, mm. */
    toward: V;

    /** The midpoint of the thumb's and the index finger's knuckle centres, mm. */
    middle: V;

    /** Each landmark by name with its point on the skin, mm, or null where its ray met none. */
    landmarks: [string, V | null][];
  }

  /**
   * Read the landmarks on the reference.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each landmark is the first crossing of a ray with the skin's cut by the ray's own plane, found on the cut's segments in closed form.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two planes, five rays, one ray-segment formula.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No landmark is typed in or moved; a missing joint is refused by name.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two cuts of the skin and a pass over their segments a ray.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each plane's cut serves its rays.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns points; the cuts die with the call.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace text states each rule.
   */
  export function read(source: R.ISource): IRoot {
    const joint = (name: string): V => {
      const p: readonly number[] | undefined = source.joints.get(name);
      if (p === undefined) throw new Error("thumb root: the reference has no joint " + name);
      return [p[0]!, p[1]!, p[2]!];
    };
    const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const unit = (a: V): V => {
      const l: number = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const without = (a: V, along: V): V => [0, 1, 2].map((k: number): number => a[k]! - dot(a, along) * along[k]!) as V;
    const [centre, toward, knuckle, beyond]: V[] = [joint("thumb_02_r"), joint("thumb_03_r"), joint("index_01_r"), joint("index_02_r")];
    const axis: V = unit(sub(toward!, centre!));
    const across: V = sub(knuckle!, centre!);
    const index: V = unit(without(across, axis));
    const beside: V = cross(axis, index);
    // The skin's first point from `origin` along the chart's direction `[du, dv]`, in the plane `origin + s u + t v`.
    const first = (chains: { points: [number, number][]; closed: boolean }[], origin: V, u: V, v: V, du: number, dv: number): V | null => {
      let best: number = Infinity;
      for (const chain of chains)
        for (let i: number = 0; i + (chain.closed ? 0 : 1) < chain.points.length; ++i) {
          const [p, q]: [number, number][] = [chain.points[i]!, chain.points[(i + 1) % chain.points.length]!];
          const e: [number, number] = [q[0] - p[0], q[1] - p[1]];
          const den: number = du * e[1] - dv * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const t: number = (p[0] * e[1] - p[1] * e[0]) / den;
          const w: number = (p[0] * dv - p[1] * du) / den;
          if (t > 1e-9 && w >= 0 && w <= 1 && t < best) best = t;
        }
      return Number.isFinite(best) ? ([0, 1, 2].map((k: number): number => origin[k]! + best * (du * u[k]! + dv * v[k]!)) as V) : null;
    };
    const cut = (origin: V, u: V, v: V): { points: [number, number][]; closed: boolean }[] => R.chains(source.all, { origin, u, v } as Parameters<typeof R.chains>[1]) as { points: [number, number][]; closed: boolean }[];
    const ring = cut(centre!, index, beside);
    const bisector: V = unit([0, 1, 2].map((k: number): number => axis[k]! + unit(sub(beyond!, knuckle!))[k]!) as V);
    const span: V = unit(without(across, bisector));
    const middle: V = [0, 1, 2].map((k: number): number => (centre![k]! + knuckle![k]!) / 2) as V;
    const web = cut(middle, span, bisector);
    const crossings: V[] = [first(web, middle, span, bisector, 0, 1), first(web, middle, span, bisector, 0, -1)].filter((p: V | null): p is V => p !== null);
    const floor: V | null = crossings.length === 0 ? null : crossings.reduce((best: V, p: V): V => (Math.hypot(...sub(p, middle)) < Math.hypot(...sub(best, middle)) ? p : best));
    return {
      centre: centre!,
      toward: toward!,
      middle,
      landmarks: [
        ["radial", first(ring, centre!, index, beside, -1, 0)],
        ["beside, toward axis x index", first(ring, centre!, index, beside, 0, 1)],
        ["beside, the other way", first(ring, centre!, index, beside, 0, -1)],
        ["web floor", floor],
      ],
    };
  }
}
