/** A C2 vault-wide tape degree of freedom on existing physical section owners. */
export namespace AutoMovieHumanHeadCranialVaultField {
  /** Physical three-dimensional head coordinates in millimetres. */
  export type Point = [number, number, number];
  /** Physical coordinates within an existing tilted section, forward and left. */
  export type Local = [number, number];
  /** The actual existing analytic course, indexed by its outward normal. */
  export interface Section {
    /** Existing head station, the plane's intercept on the vertical axis. */
    station: number;
    /** Existing section tilt in radians. */
    tilt: number;
    /** Actual source skin point at a specified outward normal. */
    point: (normal: number) => Local;
    /** Actual taut perimeter of this strictly convex source course. */
    perimeter: number;
    /** A positive lower bound on this source curve's physical curvature radius. */
    minimumRadius: number;
  }
  /** Existing source boundaries plus the independent tape dimension. */
  export interface Inputs {
    /** Existing full skull handover boundary, in physical station units. */
    lower: number;
    /** Existing upper shared course: the crown-ring/cap join, or an actual point cap. */
    upper: number;
    /** Existing spline spans expressed in physical station units. */
    knots: readonly number[];
    /** Actual section owner; no reference dimensions may be returned as observations. */
    section: (station: number) => Section;
    /** Desired maximum tape across these physical upper-head sections. */
    circumference: number;
  }
  /** Frame derived from the existing course and its actual axis extrema. */
  export interface Frame {
    /** Midpoint of the actual forward/backward supports. */
    origin: Point;
    /** Existing section's forward direction. */
    forward: Point;
    /** Existing head's canonical left direction. */
    left: Point;
    /** Existing section's unit plane normal. */
    normal: Point;
    /** Physical coordinate of the course centre in its existing section chart. */
    centreXi: number;
    /** Existing head station. */
    station: number;
  }
  /** Geometry and its independently selectable physical tape variable. */
  export interface Field {
    /** Single physical coefficient; length, breadth and face keys are separate. */
    coefficient: number;
    /** Complete admissible interval from the source curvature bounds. */
    coefficientInterval: [number, number];
    /** Actual maximum-tape section's physical frame. */
    course: Frame;
    /** Existing plane and centre at any physical station. */
    frame: (station: number) => Frame;
    /** Actual deformed skin in the existing section chart. */
    local: (station: number, normal: number) => Local;
    /** Actual deformed skin in the existing physical head frame. */
    point: (station: number, normal: number) => Point;
    /** Existing section-ray consumer; theta runs forward-to-back over the left side. */
    radial: (station: number, originXi: number, theta: number) => { radius: number; point: Point };
    /** Physical coefficient at this station, zero outside the owned part. */
    coefficientAt: (station: number) => number;
  }
  /** A failed family or boundary constraint never changes the requested tape. */
  export type Result = { ok: true; field: Field } | { ok: false; reason: string; interval?: [number, number] };

  /**
   * Add delta*w(s)*sin(2phi)^2 to the source support, with
   * w(s)=[4u(1-u)]^3 on the existing handover-to-crown interval. The factor 64
   * normalizes this symmetric polynomial's peak to one. Its value and first
   * two station derivatives vanish at both actual source boundaries. All four
   * axis points remain fixed because the angular term and its derivative are
   * zero there. Existing face controls remain in the source owner.
   *
   * At each station C(s,delta)=C_source(s)+pi*delta*w(s). The largest delta
   * satisfying every C(s,delta)<=C_target is the minimum over stations of
   * (C_target-C_source(s))/(pi*w(s)); at its minimizer equality holds. Thus the
   * physical course is derived from the actual source, not a target-dependent
   * forehead-width search window or newly chosen anatomical station.
   */
  export function create(input: Inputs): Result {
    if (!(Number.isFinite(input.lower) && Number.isFinite(input.upper) && input.upper > input.lower && Number.isFinite(input.circumference) && input.circumference > 0))
      return { ok: false, reason: "The actual skull handover, upper shared course and requested tape must be finite and ordered." };
    const weight = (s: number): number => {
      const u: number = (s - input.lower) / (input.upper - input.lower);
      return u <= 0 || u >= 1 ? 0 : (4 * u * (1 - u)) ** 3;
    };
    let source: Map<number, Section> | undefined = new Map();
    let lastStation: number = NaN;
    let lastSection: Section | undefined;
    let invalidSource: string | undefined;
    const section = (s: number): Section => {
      let cached: Section | undefined = source === undefined ? lastStation === s ? lastSection : undefined : source.get(s);
      if (cached === undefined) {
        cached = input.section(s);
        if (!(Number.isFinite(cached.perimeter) && cached.perimeter >= 0 && Number.isFinite(cached.tilt) && Number.isFinite(cached.minimumRadius) && cached.minimumRadius >= 0 && (s <= input.lower || s >= input.upper || cached.minimumRadius > 0)))
          invalidSource = "The source course has unavailable tape, tilt or strict-convexity evidence; it cannot certify a deformation.";
        if (source !== undefined) source.set(s, cached);
        else { lastStation = s; lastSection = cached; }
      }
      return cached;
    };
    for (const s of [input.lower, input.upper]) {
      if (section(s).perimeter > input.circumference)
        return { ok: false, reason: "An unchanged anatomical boundary already exceeds the requested tape; changing its span or hiding the residual is forbidden." };
    }
    const knots: number[] = [input.lower, ...input.knots.filter((s: number): boolean => s > input.lower && s < input.upper), input.upper].sort((a: number, b: number): number => a - b);
    const ratio = (s: number): number => {
      const w: number = weight(s);
      return w === 0 ? Infinity : (input.circumference - section(s).perimeter) / (Math.PI * w);
    };
    const solution: { value: number; station: number } = minimum(ratio, knots);
    const delta: number = solution.value;
    if (invalidSource !== undefined) return { ok: false, reason: invalidSource };
    if (!Number.isFinite(delta)) return { ok: false, reason: "No interior physical skull course can answer the requested tape." };
    const radiusRatio = (s: number): number => {
      const w: number = weight(s);
      return w === 0 ? Infinity : section(s).minimumRadius / w;
    };
    const radiusBound: number = minimum(radiusRatio, knots).value;
    if (invalidSource !== undefined) return { ok: false, reason: invalidSource };
    const interval: [number, number] = [-radiusBound / 8, radiusBound / 7];
    if (!(delta > interval[0] && delta < interval[1]))
      return { ok: false, reason: "This tape would violate the supplied source curvature bound inside the owned vault; no dimension was scaled.", interval };

    const local = (s: number, phi: number): Local => {
      const p: Local = section(s).point(phi);
      const d: number = delta * weight(s);
      const f: number = Math.sin(2 * phi) ** 2;
      const df: number = 2 * Math.sin(4 * phi);
      return [p[0] + d * (f * Math.cos(phi) - df * Math.sin(phi)), p[1] + d * (f * Math.sin(phi) + df * Math.cos(phi))];
    };
    const physical = (s: number, p: Local): Point => {
      const tilt: number = section(s).tilt;
      return [p[0] * Math.cos(tilt), s + p[0] * Math.sin(tilt), p[1]];
    };
    const point = (s: number, phi: number): Point => physical(s, local(s, phi));
    const frame = (s: number): Frame => {
      const base: Section = section(s);
      const centreXi: number = (base.point(0)[0] + base.point(Math.PI)[0]) / 2;
      const cos: number = Math.cos(base.tilt);
      const sin: number = Math.sin(base.tilt);
      return { origin: physical(s, [centreXi, 0]), forward: [cos, sin, 0], left: [0, 0, 1], normal: [-sin, cos, 0], centreXi, station: s };
    };
    const radial = (s: number, originXi: number, theta: number): { radius: number; point: Point } => {
      let lo: number = 0;
      let hi: number = Math.PI;
      for (let i: number = 0; i < 52; i++) {
        const middle: number = (lo + hi) / 2;
        const p: Local = local(s, middle);
        if (Math.atan2(p[1], p[0] - originXi) < theta) lo = middle;
        else hi = middle;
      }
      const p: Local = local(s, (lo + hi) / 2);
      return { radius: Math.hypot(p[0] - originXi, p[1]), point: physical(s, p) };
    };

    // Optimization samples are construction-local; retaining them would keep
    // thousands of source closures alive after this person's solve completes.
    source = undefined;
    return { ok: true, field: { coefficient: delta, coefficientInterval: interval, course: frame(solution.station), frame, local, point, radial, coefficientAt: (s: number): number => delta * weight(s) } };
  }

  /** Resolve every sampled local basin inside the source's declared spline spans. */
  function minimum(fn: (s: number) => number, knots: readonly number[]): { value: number; station: number } {
    let best: number = Infinity;
    let station: number = NaN;
    const count: number = 16;
    const candidates: number[] = [];
    for (let span: number = 1; span < knots.length; span++) {
      const from: number = knots[span - 1]!;
      const to: number = knots[span]!;
      for (let i: number = 0; i < count; i++) candidates.push(from + (to - from) * i / count);
    }
    candidates.push(knots[knots.length - 1]!);
    for (let i: number = 0; i < candidates.length; i++) {
      const s: number = candidates[i]!;
      const current: number = fn(s);
      if (current < best) { best = current; station = s; }
      if (i === 0 || i + 1 === candidates.length || current > fn(candidates[i - 1]!) || current > fn(candidates[i + 1]!)) continue;
      let lo: number = candidates[i - 1]!;
      let hi: number = candidates[i + 1]!;
      for (let j: number = 0; j < 64; j++) {
        const left: number = lo + (hi - lo) / 3;
        const right: number = hi - (hi - lo) / 3;
        if (fn(left) < fn(right)) hi = right;
        else lo = left;
      }
      const refined: number = (lo + hi) / 2;
      const value: number = fn(refined);
      if (value < best) { best = value; station = refined; }
    }
    return { value: best, station };
  }
}
