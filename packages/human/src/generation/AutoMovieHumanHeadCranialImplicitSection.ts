import { AutoMovieHumanHeadCranialMeasurements as M } from "./AutoMovieHumanHeadCranialMeasurements";
import { AutoMovieHumanHeadCranialVaultField as V } from "./AutoMovieHumanHeadCranialVaultField";

/** Actual analytic derivatives of the frozen head's two-body section law. */
export namespace AutoMovieHumanHeadCranialImplicitSection {
  /** Existing head-section primitive fields; no reference identity is needed. */
  export interface Inputs {
    /** Existing physical station. */
    station: number;
    /** Existing section-plane tilt. */
    tilt: number;
    /** Existing normalized station. */
    t: number;
    /** Existing source neck/skull handover interval endpoints. */
    handed: number;
    /** Existing source full-skull boundary. */
    handover: number;
    /** Back-body centre. */
    axis: number;
    /** Face-shield anterior key. */
    front: number;
    /** Back-body posterior key. */
    back: number;
    /** Back-body lateral semi-axis. */
    width: number;
    /** Face-shield centre and full-skull back-body anterior key. */
    waist: number;
    /** Face-shield lateral semi-axis. */
    face: number;
    /** Source face-shield participation. */
    shield: number;
    /** Source back-body Lame exponent. */
    powerBack: number;
    /** Source face-shield Lame exponent. */
    powerFace: number;
    /** Source radial-union exponent, currently POWER in HeadConstruction. */
    power: number;
  }
  /** Q=0 is the actual source field, positive inside; derivatives are analytic. */
  export interface Jet {
    /** Field value. */
    value: number;
    /** Gradient in section coordinates. */
    gradient: V.Local;
    /** Symmetric Hessian xx, xz, zz. */
    hessian: [number, number, number];
  }
  /** Actual source curve data, even when its normals cannot define a convex owner. */
  export interface PolarJet {
    /** Actual skin point. */
    point: V.Local;
    /** Actual outward unit normal. */
    normal: V.Local;
    /** Signed analytic curvature, positive for a locally convex skin. */
    curvature: number;
    /** Physical arc speed in the existing polar parameter. */
    speed: number;
    /** Actual implicit residual. */
    residual: number;
  }
  /** Separate skin health and tape, retaining the quadrature disagreement. */
  export interface Health {
    /** Smallest observed signed skin curvature. */
    minimumCurvature: number;
    /** Largest observed skin curvature. */
    maximumCurvature: number;
    /** Analytic-speed quadrature of the skin perimeter. */
    skinPerimeter: number;
    /** Absolute skin-perimeter difference at the last two quadrature resolutions. */
    skinDisagreement: number;
    /** Taut convex-hull tape on the actual source skin sample. */
    tautTape: number;
    /** Absolute tape difference at the last two quadrature resolutions. */
    tapeDisagreement: number;
    /** Final full-circle tape sample count; it changes no generated geometry. */
    tapeSamples: number;
    /** Largest actual root residual seen during construction. */
    maximumResidual: number;
    /** Normal directions must increase before a unique normal parameter exists. */
    monotoneNormals: boolean;
    /** Spatial C2 of the actual primitive field at its lateral switch plane. */
    spatialC2: boolean;
  }
  /** The actual source remains observable on a rejected nonconvex section. */
  export interface Source {
    /** Actual implicit value, gradient and Hessian. */
    field: (x: number, z: number) => Jet;
    /** Actual polar skin point and differential geometry. */
    polar: (theta: number) => PolarJet;
    /** Skin and taut tape are deliberately separate. */
    health: Health;
  }
  /** A normal-parameterized section is available only for a healthy convex source. */
  export type Result =
    | { ok: true; source: Source; section: V.Section }
    | { ok: false; source?: Source; reason: string };

  /** Lightweight actual field evaluator; constructing it claims no skin health. */
  export interface Operator {
    /** Actual source differential at one physical point, optionally gradient-only. */
    evaluate: (x: number, z: number, hessian?: boolean) => Jet;
    /** Whether the primitive definition itself can have spatial C2 at its switch. */
    spatialC2: boolean;
  }

  /**
   * Compile the actual source law for generation-time point evaluation. The
   * complete inspection in `create` remains separate: an evaluator cannot
   * certify convexity, root accuracy, a tape, or a clinical landmark.
   */
  export function operator(input: Inputs): Operator {
    const raw: number = Math.min(1, Math.max(0, (input.handover - input.t) / (input.handover - input.handed)));
    const neck: number = raw * raw * (3 - 2 * raw);
    const anterior: number = neck * (input.axis - input.back) + (1 - neck) * (input.waist - input.axis);
    const spatialC2: boolean = input.powerBack >= 2 && (input.shield === 0 || input.powerFace >= 2) && (input.powerBack > 2 || Math.max(1, anterior) === Math.max(1, input.axis - input.back));
    const evaluate = (x: number, z: number, hessian: boolean = true): Jet => {
      const back: Jet = term(x - input.axis, z, Math.max(1, x < input.axis ? input.axis - input.back : anterior), input.width, input.powerBack, -input.power / input.powerBack, hessian);
      const face: Jet = input.shield === 0 ? { value: 0, gradient: [0, 0], hessian: [0, 0, 0] } : term(x - input.waist, z, Math.max(1, input.front - input.waist), input.face, input.powerFace, -input.power / input.powerFace, hessian);
      return { value: back.value + input.shield * face.value - 1, gradient: [back.gradient[0] + input.shield * face.gradient[0], back.gradient[1] + input.shield * face.gradient[1]], hessian: [back.hessian[0] + input.shield * face.hessian[0], back.hessian[1] + input.shield * face.hessian[1], back.hessian[2] + input.shield * face.hessian[2]] };
    };
    return { evaluate, spatialC2 };
  }

  /**
   * Read a point already produced by the real source radius callback. This
   * performs no curve inspection or second radius solve. The supplied jet
   * must belong to that same source surface; its residual remains observable.
   */
  export function differential(point: V.Local, jet: Jet, originXi: number, theta: number): PolarJet {
    const gx: number = jet.gradient[0];
    const gz: number = jet.gradient[1];
    const norm: number = Math.hypot(gx, gz);
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const r: number = Math.hypot(point[0] - originXi, point[1]);
    const rp: number = -r * (-gx * n + gz * c) / (gx * c + gz * n);
    const curvature: number = -(jet.hessian[0] * gz * gz - 2 * jet.hessian[1] * gx * gz + jet.hessian[2] * gx * gx) / norm ** 3;
    return { point, normal: [-gx / norm, -gz / norm], curvature, speed: Math.hypot(r, rp), residual: Math.abs(jet.value) };
  }

  /**
   * Differentiate exactly the existing field's g^-POWER+shield*f^-POWER=1
   * level set. Its gradient supplies normals and its Hessian supplies signed
   * curvature. A convex hull is used only for tape observation; it never
   * replaces the source skin or certifies that skin's continuity/convexity.
   * Nonconvex or nonmonotone source normals retain their observations and fail
   * the separate normal-owner contract without moving a dimension or limit.
   */
  export function create(input: Inputs): Result {
    if (![input.station, input.tilt, input.t, input.axis, input.front, input.back, input.width, input.waist, input.face, input.shield, input.powerBack, input.powerFace, input.power, input.handed, input.handover].every(Number.isFinite) || !(input.width > 0 && input.face > 0 && input.front > input.waist && input.axis > input.back && input.powerBack > 1 && input.powerFace > 1 && input.power > 0 && input.shield >= 0 && input.handover > input.handed))
      return { ok: false, reason: "Unavailable or invalid source primitive dimensions." };
    const prepared: Operator = operator(input);
    const spatialC2: boolean = prepared.spatialC2;
    const origin: number = (input.front + input.back) / 2;
    const evaluate: Operator["evaluate"] = prepared.evaluate;
    const field = (x: number, z: number): Jet => evaluate(x, z, true);
    if (field(origin, 0).value < 0) return { ok: false, reason: "The existing section-ray origin is outside its source skin." };
    let maximumResidual: number = 0;
    let constructionCache: Map<number, PolarJet> | undefined = new Map();
    const polar = (theta: number): PolarJet => {
      const cached: PolarJet | undefined = constructionCache?.get(theta);
      if (cached !== undefined) return cached;
      const c: number = Math.cos(theta);
      const n: number = Math.sin(theta);
      let lo: number = 0;
      let hi: number = 4 * Math.max(input.front - input.back, input.width, input.face);
      let r: number = hi / 2;
      let jet: Jet = evaluate(origin + r * c, r * n, false);
      for (let i: number = 0; i < 64; i++) {
        if (Math.abs(jet.value) < 1e-12) break;
        if (jet.value > 0) lo = r;
        else hi = r;
        const derivative: number = jet.gradient[0] * c + jet.gradient[1] * n;
        const next: number = r - jet.value / derivative;
        r = next > lo && next < hi && Number.isFinite(next) ? next : (lo + hi) / 2;
        jet = evaluate(origin + r * c, r * n, false);
      }
      
      // Root finding needs the gradient only. Curvature needs one Hessian at
      // the converged physical skin point, not at every rejected root step.
      jet = evaluate(origin + r * c, r * n, true);
      maximumResidual = Math.max(maximumResidual, Math.abs(jet.value));
      const result: PolarJet = differential([origin + r * c, r * n], jet, origin, theta);
      constructionCache?.set(theta, result);
      return result;
    };
    const count: number = 256;
    const half: PolarJet[] = Array.from({ length: count + 1 }, (_: unknown, i: number): PolarJet => polar(Math.PI * i / count));
    const phases: number[] = half.map((p: PolarJet): number => Math.atan2(Math.max(0, p.normal[1]), p.normal[0]));
    const monotoneNormals: boolean = phases.every((phi: number, i: number): boolean => i === 0 || phi > phases[i - 1]!);
    const curvature = (theta: number): number => polar(theta).curvature;
    const minimumCurvature: number = extremum(curvature, false);
    const maximumCurvature: number = extremum(curvature, true);
    let skinPerimeter: number = NaN;
    let previousSkin: number = NaN;
    let skinDisagreement: number = Infinity;
    let tapeSamples: number = 512;
    let previousTape: number = NaN;
    let tautTape: number = NaN;
    let tapeDisagreement: number = Infinity;
    do {
      previousTape = tautTape;
      previousSkin = skinPerimeter;
      const measured: PolarJet[] = Array.from({ length: tapeSamples }, (_: unknown, i: number): PolarJet => polar(2 * Math.PI * i / tapeSamples));
      tautTape = M.read(measured.map((p: PolarJet): M.Point => p.point)).circumference;
      skinPerimeter = measured.reduce((sum: number, p: PolarJet): number => sum + p.speed, 0) * Math.PI * 2 / tapeSamples;
      if (Number.isFinite(previousTape)) tapeDisagreement = Math.abs(tautTape - previousTape);
      if (Number.isFinite(previousSkin)) skinDisagreement = Math.abs(skinPerimeter - previousSkin);
      if ((tapeDisagreement <= 0.0001 && skinDisagreement <= 0.0001) || tapeSamples >= 8192) break;
      tapeSamples *= 2;
    } while (true);
    const health: Health = { minimumCurvature, maximumCurvature, skinPerimeter, skinDisagreement, tautTape, tapeDisagreement, tapeSamples, maximumResidual, monotoneNormals, spatialC2 };
    const source: Source = { field, polar, health };
    
    // Reuse repeated quadrature/extremum nodes only during this construction.
    // The returned source does not retain thousands of sampled skin points.
    constructionCache = undefined;
    if (!(Number.isFinite(minimumCurvature) && minimumCurvature > 0 && Number.isFinite(maximumCurvature) && monotoneNormals && spatialC2 && maximumResidual < 1e-8 && tapeDisagreement <= 0.0001 && skinDisagreement <= 0.0001))
      return { ok: false, source, reason: "The actual source skin is nonconvex, lacks a C2 unique-normal owner, or failed its root/quadrature. Its taut hull tape remains separately observed; no hull replaced that skin." };

    const point = (phi: number): V.Local => {
      const sign: number = Math.sin(phi) < 0 ? -1 : 1;
      const target: number = Math.atan2(Math.abs(Math.sin(phi)), Math.cos(phi));
      let index: number = Math.min(count - 1, Math.max(0, Math.floor(target * count / Math.PI)));
      while (index > 0 && phases[index]! > target) index--;
      while (index + 1 < count && phases[index + 1]! < target) index++;
      let lo: number = Math.PI * index / count;
      let hi: number = Math.PI * (index + 1) / count;
      let theta: number = (lo + hi) / 2;
      let p: PolarJet = polar(theta);
      for (let i: number = 0; i < 48; i++) {
        const actual: number = Math.atan2(Math.max(0, p.normal[1]), p.normal[0]);
        const error: number = actual - target;
        if (Math.abs(error) < 1e-12) break;
        if (error < 0) lo = theta;
        else hi = theta;
        const next: number = theta - error / (p.curvature * p.speed);
        theta = next > lo && next < hi && Number.isFinite(next) ? next : (lo + hi) / 2;
        p = polar(theta);
      }
      return [p.point[0], sign * p.point[1]];
    };
    return { ok: true, source, section: { station: input.station, tilt: input.tilt, point, perimeter: skinPerimeter, minimumRadius: 1 / maximumCurvature } };
  }

  /** Differentiate one actual source A^k term in local physical coordinates. */
  function term(x: number, z: number, a: number, b: number, p: number, k: number, hessian: boolean): Jet {
    const u: number = x / a;
    const v: number = z / b;
    const sum: number = Math.abs(u) ** p + Math.abs(v) ** p;
    if (sum === 0) return { value: Infinity, gradient: [0, 0], hessian: [0, 0, 0] };
    const dx: number = p * Math.sign(u) * Math.abs(u) ** (p - 1) / a;
    const dz: number = p * Math.sign(v) * Math.abs(v) ** (p - 1) / b;
    const first: number = k * sum ** (k - 1);
    if (!hessian) return { value: sum ** k, gradient: [first * dx, first * dz], hessian: [0, 0, 0] };
    const dxx: number = p * (p - 1) * Math.abs(u) ** (p - 2) / (a * a);
    const dzz: number = p * (p - 1) * Math.abs(v) ** (p - 2) / (b * b);
    const second: number = k * (k - 1) * sum ** (k - 2);
    return { value: sum ** k, gradient: [first * dx, first * dz], hessian: [second * dx * dx + first * dxx, second * dx * dz, second * dz * dz + first * dzz] };
  }

  /** Resolve every curvature basin in the source's half-course without smoothing it. */
  function extremum(fn: (x: number) => number, maximum: boolean): number {
    const count: number = 256;
    const sign: number = maximum ? -1 : 1;
    const value = (theta: number): number => sign * fn(theta);
    let best: number = Infinity;
    for (let i: number = 0; i <= count; i++) {
      const theta: number = Math.PI * i / count;
      const current: number = value(theta);
      best = Math.min(best, current);
      if (i === 0 || i === count || current > value(Math.PI * (i - 1) / count) || current > value(Math.PI * (i + 1) / count)) continue;
      let lo: number = Math.PI * (i - 1) / count;
      let hi: number = Math.PI * (i + 1) / count;
      for (let j: number = 0; j < 48; j++) {
        const left: number = lo + (hi - lo) / 3;
        const right: number = hi - (hi - lo) / 3;
        if (value(left) < value(right)) hi = right;
        else lo = left;
      }
      best = Math.min(best, value((lo + hi) / 2));
    }
    return sign * best;
  }
}
