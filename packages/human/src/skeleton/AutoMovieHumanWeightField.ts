import { AutoMovieHumanWeightJet as J } from "./AutoMovieHumanWeightJet";

/** One arithmetic expression serves scalar export and differentiated observations. */
const { value, gradient, add, sub, mul, div, rise, ramp, clamp, norm, dot }: typeof J = J;

/** Continuous influence values and their spatial derivatives in model metres. */
export namespace AutoMovieHumanWeightField {
  /** A model-space triple. */
  export type Vector = [number, number, number];

  /** A scalar with its gradient, or a scalar-only evaluation. */
  export type Scalar = J.Scalar;

  /** One influence before the mesh's four-slot representation. */
  export interface IInfluence {
    /** Skeleton slot. */
    slot: number;
    /** Nonnegative normalized mass. */
    weight: number;
    /** Derivative per model metre. */
    gradient: Vector;
  }

  /** Isolated two-bone DQ support capacity; this does not certify joint contact. */
  export interface ISupport {
    /** Selected transition half-width, metres. */
    half: number;
    /** Half-width needed for the requested isolated stretch bound, metres. */
    required: number;
    /** Geometric support available before a neighbouring segment ends, metres. */
    available: number;
    /** Whether the selected support can meet that isolated bound. */
    supported: boolean;
    /** Isolated bound; null when no positive support is available. */
    stretchBound: number | null;
  }
  /** Capacity attributed to the anatomical gate that consumes it. */
  export interface IJointSupport extends ISupport {
    /** Clinical joint or explicitly named competition gate. */
    joint: string;
  }

  /** A compact transition plane. */
  export interface IPlane {
    /** Plane origin. */
    at: Vector;
    /** Unit direction toward the child. */
    normal: Vector;
    /** Support half-width, metres. */
    half: number;
  }

  /** The open mouth's contact curve. */
  export interface ILips {
    /** Contact heights across half the mouth. */
    contact: number[];
    /** Mouth half-width, metres. */
    width: number;
    /** Cheek transition height, metres. */
    wide: number;
  }

  /** One anatomical branch of the partition. */
  export interface ILimb {
    /** Skeleton slot. */
    slot: number;
    /** Capsule start and end. */
    from: Vector;
    /** Capsule end. */
    to: Vector;
    /** Proximal radius. */
    near: number;
    /** Distal radius. */
    far: number;
    /** Gates inherited from anatomical joints. */
    planes: IPlane[];
    /** Mouth gate, when present. */
    lips: ILips | null;
    /** Midline support width, zero for a non-leg. */
    midline: number;
    /** Distal release of the leg's midline gate. */
    clear: IPlane | null;
    /** Left +1, right -1, axial zero. */
    side: number;
    /** Nearby competing branches. */
    rivals: ILimb[];
    /** Capsules belonging to this branch. */
    own: ILimb[];
    /** Compact competition support. */
    contest: number;
    /** Child branches. */
    kids: ILimb[];
  }

  /** An arm's girdle and the skin domain it can carry. */
  export interface IArm {
    /** Shoulder girdle branch. */
    limb: ILimb;
    /** Scapular bone carrying chest-side mass, independent of the humerus. */
    carrier: number;
    /** Arm capsules. */
    own: ILimb[];
    /** Width of the arm/chest transition. */
    contest: number;
  }

  /** The prepared anatomical partition. */
  export interface ITree {
    /** Pelvic root. */
    root: ILimb;
    /** Chest slot. */
    chest: number;
    /** Left and right arm roots. */
    arms: IArm[];
    /** Explicit capacity limitations of the generated binding supports. */
    jointSupports?: IJointSupport[];
  }

  /**
   * Evaluate one immutable field, with optional forward-mode differentiation.
   * Scalar-only mesh export follows the identical expression without gradient
   * allocations. Hard capsule ownership is replaced by a compact C1 minimum;
   * endpoint clamps have zero derivative, matching the transition profile.
   */
  export function evaluate(p: Vector, tree: ITree, derivatives: boolean): IInfluence[] {
    if (p.length !== 3 || !p.every(Number.isFinite)) throw new Error("A weight field needs a finite model-space triple");
    const q: Scalar[] = p.map((value: number, axis: number): Scalar => derivatives
      ? { value, gradient: [axis === 0 ? 1 : 0, axis === 1 ? 1 : 0, axis === 2 ? 1 : 0] }
      : value);
    const pulls: Map<number, Scalar> = new Map();
    const takes: Scalar[] = tree.arms.map((arm: IArm): Scalar => {
      const mine: Scalar = nearest(q, arm.own);
      const theirs: Scalar = nearest(q, arm.limb.rivals);
      const side: Scalar = rise(div(mul(q[2]!, arm.limb.side), Math.abs(arm.limb.to[2])));
      return mul(side, ramp(div(sub(theirs, mine), arm.contest)));
    });

    // Independent left/right gates form a partition even when supports overlap.
    // The former subtraction could make the trunk negative at two broad arms.
    for (let i: number = 0; i < tree.arms.length; i++) {
      const arm: IArm = tree.arms[i]!;
      const other: Scalar = takes[1 - i] ?? 0;
      const taken: Scalar = mul(takes[i]!, sub(1, mul(other, 0.5)));
      const onward: Scalar = mul(taken, cut(arm.limb, q));
      addPull(pulls, arm.carrier, sub(taken, onward));
      spread(arm.limb, onward, q, pulls);
    }
    spread(tree.root, takes.reduce((s: Scalar, take: Scalar): Scalar => mul(s, sub(1, take)), 1), q, pulls);
    return [...pulls].filter(([, w]: [number, Scalar]): boolean => value(w) > 0)
      .map(([slot, w]: [number, Scalar]): IInfluence => ({ slot, weight: value(w), gradient: gradient(w) }));
  }

  /** Report feasibility instead of silently claiming a capped width is safe. */
  export function support(radius: number, radians: number, available: number, strain: number): ISupport {
    if (!(radius >= 0) || !Number.isFinite(radius) || !Number.isFinite(radians) || !(available >= 0) || !Number.isFinite(available) || !(strain >= 1) || !Number.isFinite(strain))
      throw new Error("A binding support needs finite geometry and an excess-stretch budget of at least one");
    // Equal-weight DQ has d(angle)/dw = 4 tan(theta/4), and the cubic
    // profile on [-h,h] has max derivative 3/(4h). This is an isolated
    // two-bone cylinder bound for an excess-stretch budget >= 1. Smaller
    // budgets can peak away from the middle and are not certified here.
    // Overlapping ramps and anatomical contact need the actual pose audit.
    const numerator: number = 3 * radius * Math.tan(Math.min(Math.PI, Math.abs(radians)) / 4);
    const required: number = numerator / strain;
    const half: number = Math.min(available, required);
    return { half, required, available, supported: required <= available, stretchBound: half > 0 ? 1 + numerator / half : required === 0 ? 1 : null };
  }

  /** Selected width only; support() additionally reports insufficient capacity. */
  export function halfWidth(radius: number, radians: number, available: number, strain: number): number {
    return support(radius, radians, available, strain).half;
  }

  /** Signed height above a tapered capsule. */
  function height(p: Scalar[], limb: ILimb): Scalar {
    const d: Vector = [limb.to[0] - limb.from[0], limb.to[1] - limb.from[1], limb.to[2] - limb.from[2]];
    const e: Scalar[] = p.map((x: Scalar, i: number): Scalar => sub(x, limb.from[i]!));
    const length: number = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
    const f: Scalar = length === 0 ? 0 : clamp(div(dot(e, d), length));
    return sub(norm(e.map((x: Scalar, i: number): Scalar => sub(x, mul(f, d[i]!)))), add(limb.near, mul(limb.far - limb.near, rise(f))));
  }

  /** Compact C1 union, exact outside the local radius-sized overlap. */
  function nearest(p: Scalar[], limbs: readonly ILimb[]): Scalar {
    let best: Scalar = Infinity;
    for (const limb of limbs) {
      const next: Scalar = height(p, limb);
      if (!Number.isFinite(value(best))) { best = next; continue; }
      const width: number = Math.min(limb.near, limb.far);
      if (width <= 0 || Math.abs(value(best) - value(next)) >= width) {
        if (value(next) < value(best)) best = next;
        continue;
      }
      const h: Scalar = clamp(add(0.5, mul(div(sub(next, best), width), 0.5)));
      best = sub(add(next, mul(sub(best, next), h)), mul(width, mul(h, sub(1, h))));
    }
    return best;
  }

  /** Accumulate an influence without losing its derivative. */
  function addPull(pulls: Map<number, Scalar>, slot: number, amount: Scalar): void {
    pulls.set(slot, add(pulls.get(slot) ?? 0, amount));
  }

  /** Pass mass through a partition of a branch's child gates. */
  function spread(limb: ILimb, mass: Scalar, p: Scalar[], pulls: Map<number, Scalar>): void {
    if (value(mass) <= 0) return;
    const gates: Scalar[] = limb.kids.map((kid: ILimb): Scalar => share(kid, p));
    const total: Scalar = gates.reduce((s: Scalar, x: Scalar): Scalar => add(s, x), 0);
    if (value(total) <= 0) { addPull(pulls, limb.slot, mass); return; }
    const retained: Scalar = gates.reduce((s: Scalar, x: Scalar): Scalar => mul(s, sub(1, x)), 1);
    const handed: Scalar = sub(1, retained);
    let remaining: Scalar = mass;
    for (let i: number = 0; i < limb.kids.length; i++) {
      const given: Scalar = div(mul(mul(mass, handed), gates[i]!), total);
      remaining = sub(remaining, given);
      spread(limb.kids[i]!, given, p, pulls);
    }
    addPull(pulls, limb.slot, remaining);
  }

  /** Anatomical child gate, with a fixed pelvic midline. */
  function share(limb: ILimb, p: Scalar[]): Scalar {
    let out: Scalar = cut(limb, p);
    if (limb.midline > 0) {
      const side: Scalar = mul(p[2]!, limb.side);
      if (value(side) <= 0) return 0;
      const release: Scalar = plane(limb.clear!, p);
      const width: Scalar = mul(limb.midline, sub(1, release));

      // Release narrows the midline support after the thighs separate. Adding
      // release to a midline gate instead left nonzero leg mass at z -> 0+.
      out = mul(out, value(width) <= 0 ? 1 : rise(div(side, width)));
    }
    if (limb.rivals.length !== 0)
      out = mul(out, ramp(div(sub(nearest(p, limb.rivals), nearest(p, limb.own)), limb.contest)));
    return out;
  }

  /** A compact plane's value and jet. */
  function plane(gate: IPlane, p: Scalar[]): Scalar {
    return ramp(div(dot(p.map((x: Scalar, i: number): Scalar => sub(x, gate.at[i]!)), gate.normal), gate.half));
  }

  /** Cut planes and the open lips' separated domains. */
  function cut(limb: ILimb, p: Scalar[]): Scalar {
    let out: Scalar = limb.planes.reduce((s: Scalar, gate: IPlane): Scalar => mul(s, plane(gate, p)), 1);
    const lips: ILips | null = limb.lips;
    if (lips === null) return out;
    const z: Scalar = value(p[2]!) < 0 ? mul(p[2]!, -1) : p[2]!;
    const u: Scalar = div(z, lips.width);
    const k: Scalar = mul(clamp(u), lips.contact.length - 1);
    const i: number = Math.min(lips.contact.length - 2, Math.floor(value(k)));
    const contact: Scalar = add(lips.contact[i]!, mul(sub(k, i), lips.contact[i + 1]! - lips.contact[i]!));
    const v: Scalar = sub(p[1]!, contact);
    const distance: Scalar = value(v) < 0 ? mul(v, -1) : v;
    const crossing: Scalar = mul(0.5, mul(rise(div(sub(u, 0.5), 0.5)), sub(1, rise(div(distance, lips.wide)))));
    out = mul(out, value(v) >= 0 ? crossing : sub(1, crossing));
    return out;
  }
}
