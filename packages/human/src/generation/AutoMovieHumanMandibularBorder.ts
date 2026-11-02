/** Intrinsic mandibular turns between two physically owned tangent sheets. */
export namespace AutoMovieHumanMandibularBorder {
  /** Position or direction in the body's millimetre coordinate system. */
  export type Point = [number, number, number];

  /** Physical normal section of the mandibular arch at one station. */
  export interface IFrame {
    /** Intersection of the unrounded side and underside sheets. */
    origin: Point;
    /** Outward normal of the unrounded side sheet. */
    outward: Point;
    /** Unit direction toward the underside within the normal section. */
    below: Point;
  }

  /** One sampled jet in arc-length parameter normalized to the whole turn. */
  interface INode {
    /** Normal-section coordinates, millimetres. */
    point: [number, number];
    /** Derivative with respect to the normalized whole-turn parameter. */
    first: [number, number];
    /** Second derivative with respect to that parameter. */
    second: [number, number];
  }

  /** Reusable profile; its dimensions belong to the generated curve. */
  export interface IProfile {
    /** Minimum physical radius of curvature, millimetres. */
    radius: number;
    /** Turn of the outward normal from side to underside, radians. */
    angle: number;
    /** Physical curve length derived from the curvature law, millimetres. */
    length: number;
    /** Endpoint jets for a C2 interpolation of the integrated curve. */
    nodes: INode[];
  }

  /** Curve plus its actual physical embedding, ready for a section consumer. */
  export interface ICurve {
    /** Geometry shared by all placements of this profile. */
    profile: IProfile;
    /** Anatomical normal section, independent of the world's orientation. */
    frame: IFrame;
  }

  /** Anatomical address supported by an actual generating curve. */
  export interface IAddress {
    /** Geometric rule, never a clinical correspondence claim. */
    kind: "intrinsic-curvature-maximum";
    /** Emitted normal section carrying this feature. */
    curve: ICurve;
    /** Unique stationary point derived from the tangent law. */
    parameter: number;
    /** Physical point on that curve, not an expected input measurement. */
    point: Point;
  }

  /** Quintic step with zero first and second derivatives at both endpoints. */
  function step(t: number): number {
    return t * t * t * (10 + t * (-15 + 6 * t));
  }

  /** Angle derivative; its unique interior maximum is 15/8 at one half. */
  function speed(t: number): number {
    return 30 * t * t * (1 - t) * (1 - t);
  }

  /** Unit tangent in the normal section, pointing from side to underside. */
  function tangent(angle: number, t: number): [number, number] {
    const a: number = angle * step(t);
    return [-Math.sin(a), Math.cos(a)];
  }

  /**
   * Build one curve rather than rounding unrelated fields. Simpson integration
   * uses 128 numerical intervals; it introduces no anatomical station or gain.
   * The derivative of the tangent angle is 15/8 at its unique maximum, hence
   * length = (15/8) radius angle gives exactly the requested minimum radius.
   */
  export function create(radius: number, angle: number): IProfile {
    if (!(Number.isFinite(radius) && radius > 0 && angle > 0 && angle < Math.PI))
      throw new Error("A mandibular turn needs a positive radius and a normal turn in (0, pi).");

    const length: number = (15 / 8) * radius * angle;
    const count: number = 128;
    const nodes: INode[] = [];
    let x: number = 0;
    let y: number = 0;
    for (let i: number = 0; i <= count; i++) {
      const t: number = i / count;
      if (i > 0) {
        const a: [number, number] = tangent(angle, (i - 1) / count);
        const b: [number, number] = tangent(angle, (i - 0.5) / count);
        const c: [number, number] = tangent(angle, t);
        x += length * (a[0] + 4 * b[0] + c[0]) / (6 * count);
        y += length * (a[1] + 4 * b[1] + c[1]) / (6 * count);
      }

      const a: number = angle * step(t);
      const da: number = angle * speed(t);
      nodes.push({
        point: [x, y],
        first: [-length * Math.sin(a), length * Math.cos(a)],
        second: [-length * Math.cos(a) * da, -length * Math.sin(a) * da],
      });
    }

    // Both straight neighbours pass through the original sheet intersection.
    // Translating along the side sheet leaves its x=0 boundary unchanged.
    const end: INode = nodes[count]!;
    const shift: number = -(Math.cos(angle) * end.point[0] + Math.sin(angle) * end.point[1]) / Math.sin(angle);
    for (const node of nodes) node.point[1] += shift;
    return { radius, angle, length, nodes };
  }

  /** C2 quintic Hermite value from the two independently integrated jets. */
  function interpolate(a: INode, b: INode, u: number, h: number): [number, number] {
    const result: [number, number] = [0, 0];
    for (let j: number = 0; j < 2; j++) {
      const p: number = a.point[j]!;
      const v: number = a.first[j]! * h;
      const q: number = a.second[j]! * h * h / 2;
      const d: number = b.point[j]! - p - v - q;
      const e: number = b.first[j]! * h - v - 2 * q;
      const f: number = b.second[j]! * h * h - 2 * q;
      const c3: number = 10 * d - 4 * e + f / 2;
      const c4: number = -15 * d + 7 * e - f;
      const c5: number = 6 * d - 3 * e + f / 2;
      result[j] = p + u * (v + u * (q + u * (c3 + u * (c4 + u * c5))));
    }
    return result;
  }

  /** Actual integrated point in the arch's physical normal section. */
  export function local(profile: IProfile, t: number): [number, number] {
    if (!(t >= 0 && t <= 1)) throw new Error("Curve parameter must lie in [0,1].");
    const count: number = profile.nodes.length - 1;
    const i: number = Math.min(count - 1, Math.floor(t * count));
    return interpolate(profile.nodes[i]!, profile.nodes[i + 1]!, t * count - i, 1 / count);
  }

  /** Bind a shared profile to orthonormal anatomical axes. */
  export function place(profile: IProfile, frame: IFrame): ICurve {
    const dot: number = frame.outward.reduce((sum: number, n: number, i: number): number => sum + n * frame.below[i]!, 0);
    if (frame.origin.some((v: number): boolean => !Number.isFinite(v)) || Math.abs(Math.hypot(...frame.outward) - 1) > 1e-10 || Math.abs(Math.hypot(...frame.below) - 1) > 1e-10 || Math.abs(dot) > 1e-10)
      throw new Error("Mandibular curve placement needs finite orthonormal physical axes.");
    return { profile, frame };
  }

  /** Actual skin curve in body millimetres; no expected landmark is returned. */
  export function point(curve: ICurve, t: number): Point {
    const p: [number, number] = local(curve.profile, t);
    return curve.frame.origin.map((n: number, i: number): number => n + p[0] * curve.frame.outward[i]! + p[1] * curve.frame.below[i]!) as Point;
  }

  /** Emit the physical section whose curvature an independent reader observes. */
  export function emit(curve: ICurve, count: number): Point[] {
    if (!(Number.isInteger(count) && count >= 2)) throw new Error("A curve needs at least two sampling intervals.");
    return Array.from({ length: count + 1 }, (_: unknown, i: number): Point => point(curve, i / count));
  }

  /**
   * Publish the actual owned feature. Final-skin readers independently locate
   * the curvature maximum in the emitted normal section; they do not consume
   * this parameter as their observed landmark. A later union that hides this
   * curve invalidates the address and must fail the composition check.
   */
  export function ridge(curve: ICurve): IAddress {
    return { kind: "intrinsic-curvature-maximum", curve, parameter: 0.5, point: point(curve, 0.5) };
  }

  /**
   * Evaluate from physical signed distances to the two unrounded sheets.
   * Their normal angle is profile.angle; transforming their metric avoids
   * treating nonorthogonal plane distances as Euclidean normal coordinates.
   */
  export function fromSheetDistances(profile: IProfile, side: number, underside: number): number {
    return field(profile, side, (underside - Math.cos(profile.angle) * side) / Math.sin(profile.angle));
  }

  /**
   * First-order signed field, negative inside. Outside the rounded interval the
   * exact neighbouring planes apply. Within it, binary table lookup and four
   * bounded Newton steps locate the same-plan curve point; its physical
   * normal supplies the distance to first order. The zero set is the emitted
   * curve, and its joins retain the two shared planes and zero curvature.
   * This is not advertised as an exact distance far from the skin.
   */
  export function field(profile: IProfile, plan: number, below: number): number {
    const first: INode = profile.nodes[0]!;
    const last: INode = profile.nodes[profile.nodes.length - 1]!;
    const underside: number = Math.cos(profile.angle) * plan + Math.sin(profile.angle) * below;
    if (plan >= first.point[0]) return Math.max(plan, underside);
    if (plan <= last.point[0]) return Math.max(plan, underside);

    let lo: number = 0;
    let hi: number = profile.nodes.length - 1;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >>> 1;
      if (profile.nodes[mid]!.point[0] > plan) lo = mid;
      else hi = mid;
    }

    const count: number = profile.nodes.length - 1;
    const lower: number = lo / count;
    const upper: number = hi / count;
    let t: number = lower + (upper - lower) * (plan - profile.nodes[lo]!.point[0]) / (profile.nodes[hi]!.point[0] - profile.nodes[lo]!.point[0]);
    for (let i: number = 0; i < 4; i++) {
      const p: [number, number] = local(profile, t);
      const dx: number = -profile.length * Math.sin(profile.angle * step(t));
      if (Math.abs(dx) < 1e-12) break;
      t = Math.max(lower, Math.min(upper, t - (p[0] - plan) / dx));
    }

    const p: [number, number] = local(profile, t);
    const angle: number = profile.angle * step(t);
    const distance: number = (plan - p[0]) * Math.cos(angle) + (below - p[1]) * Math.sin(angle);
    return Math.max(plan, underside, distance);
  }
}
