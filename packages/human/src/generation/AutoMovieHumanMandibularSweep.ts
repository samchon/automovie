import { AutoMovieHumanMandibularBorder as Border } from "./AutoMovieHumanMandibularBorder";

/** Actual arch-based placement and triangulation of the mandibular turn. */
export namespace AutoMovieHumanMandibularSweep {
  /** Existing geometric mandible fields; no person identity or input targets. */
  export interface IMandible {
    /** Front of the circular chin arc. */
    front: number;
    /** Gonion's anterior coordinate. */
    gonion: number;
    /** Gonion's height. */
    gonionY: number;
    /** Half-width of the gonial ellipse. */
    width: number;
    /** Posterior semi-axis of that ellipse. */
    back: number;
    /** Radius of the chin arc in plan. */
    radius: number;
    /** Source origin of the arch's radial construction. */
    origin: number;
    /** Straight side's outward plan normal. */
    side: [number, number];
    /** Side's tangent point on the gonial ellipse. */
    start: [number, number];
    /** Side's tangent point on the chin arc. */
    end: [number, number];
    /** Existing transverse growth per millimetre over the border. */
    spread: number;
    /** Source mandibular plane's anterior anchor. */
    chin: number;
    /** Source mandibular plane's anchor height. */
    menton: number;
    /** Rise of the mandibular plane toward the back. */
    slope: number;
    /** Cosine of that plane's angle. */
    cos: number;
    /** Existing ramus-plane cosine and sine. */
    lean: [number, number];
    /** Existing body height before its top cap. */
    height: number;
    /** Existing underside fall per inward millimetre. */
    draft: number;
    /** Existing physical soft-tissue radius used by the new intrinsic law. */
    round: number;
    /** Existing gonial rounding multiplier, retained for the body/ramus join. */
    taper: number;
  }

  /** A construction failure that cannot be hidden by relocating a landmark. */
  export interface IFailure {
    /** Failed geometric condition. */
    kind: "nonfinite" | "border-root" | "top-cap" | "normal-frame" | "degenerate-triangle";
    /** Arch sample index, or triangle index for mesh degeneracy. */
    index: number;
    /** Physical or dimensionless observed residual. */
    residual: number;
  }

  /** Actual arch station and the emitted normal-section curve it owns. */
  export interface IStation {
    /** Source polar angle; its ends are the actual gonions. */
    angle: number;
    /** Unrounded side/underside sheet intersection, millimetres. */
    origin: Border.Point;
    /** Derivative of that intersection curve with respect to polar angle. */
    tangent: Border.Point;
    /** Actual physical side-sheet unit normal. */
    sideNormal: Border.Point;
    /** Actual physical underside-sheet unit normal. */
    underNormal: Border.Point;
    /** Side-normal derivative with respect to the source polar angle. */
    sideNormalDerivative: Border.Point;
    /** Underside-normal derivative with respect to the source polar angle. */
    underNormalDerivative: Border.Point;
    /** Generated physical curve and its section frame. */
    curve: Border.ICurve;
  }

  /** A single analytic sample before its neighbouring normal jets are read. */
  type IBaseStation = Omit<IStation, "sideNormalDerivative" | "underNormalDerivative">;

  /** Mesh plus owned boundaries and the physical midline observation plane. */
  export interface IOutput {
    /** Physical patch vertices in body millimetres. */
    vertices: Border.Point[];
    /** Connected triangles referencing those physical vertices. */
    triangles: [number, number, number][];
    /** Side and underside boundary curves, which neighbours must copy. */
    boundaries: {
      /** Rounded patch's side-sheet boundary, ordered along the actual arch. */
      side: Border.Point[];
      /** Rounded patch's underside-sheet boundary in the same arch order. */
      underside: Border.Point[];
      /** Right and left gonial end curves, each ordered from side to underside. */
      gonions: [Border.Point[], Border.Point[]];
    };
    /** Actual arch stations and normal-section curves. */
    stations: IStation[];
    /** Physical ridge carried across the arch by the emitted profile law. */
    ridge: Border.Point[];
    /** Generative address, for association rather than oracle measurement. */
    midlineAddress: Border.IAddress;
    /** Independent final-mesh reader intersects this actual normal section. */
    midlineSection: {
      /** Actual unrounded median sheet intersection in body millimetres. */
      origin: Border.Point;
      /** Unit normal to the physical median observation plane. */
      normal: Border.Point;
    };
    /** Every observed construction failure; no reference dimensions are changed. */
    failures: IFailure[];
  }

  /** Dot product of physical vectors. */
  function dot(a: Border.Point, b: Border.Point): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** Physical cross product. */
  function cross(a: Border.Point, b: Border.Point): Border.Point { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  /** Unit direction; undefined means actual geometry has no supported frame. */
  function unit(a: Border.Point): Border.Point | undefined {
    const n: number = Math.hypot(...a);
    return n > 1e-12 && Number.isFinite(n) ? [a[0] / n, a[1] / n, a[2] / n] : undefined;
  }

  /** Existing analytic arch exit, preserving its tangent pieces exactly. */
  function exit(m: IMandible, ux: number, uz: number): [number, number, number] {
    const [sx, sz] = m.side;
    const along: number = ux * sx + uz * sz;
    if (along > 1e-12) {
      const t: number = ((m.start[0] - m.origin) * sx + m.start[1] * sz) / along;
      const qx: number = m.origin + t * ux;
      const qz: number = t * uz;
      const ex: number = m.end[0] - m.start[0];
      const ez: number = m.end[1] - m.start[1];
      const f: number = ((qx - m.start[0]) * ex + (qz - m.start[1]) * ez) / (ex * ex + ez * ez);
      if (f >= 0 && f <= 1) return [t, sx, sz];
    }

    const centre: number = m.front - m.radius;
    const w: number = m.origin - centre;
    const b: number = w * ux;
    const root: number = b * b - (w * w - m.radius * m.radius);
    if (root >= 0) {
      const t: number = -b + Math.sqrt(root);
      const nx: number = (m.origin + t * ux - centre) / m.radius;
      if (t > 0 && nx >= sx) return [t, nx, t * uz / m.radius];
    }

    const g: number = m.origin - m.gonion;
    const a2: number = (ux / m.back) ** 2 + (uz / m.width) ** 2;
    const b2: number = 2 * g * ux / m.back ** 2;
    const c2: number = (g / m.back) ** 2 - 1;
    const t: number = (-b2 + Math.sqrt(Math.max(0, b2 * b2 - 4 * a2 * c2))) / (2 * a2);
    const gx: number = (m.origin + t * ux - m.gonion) / m.back ** 2;
    const gz: number = t * uz / m.width ** 2;
    const n: number = Math.hypot(gx, gz);
    return [t, gx / n, gz / n];
  }

  /** Existing rounded body/ramus intersection and its actual gradient. */
  function border(m: IMandible, x: number, y: number): {
    /** Existing rounded body/ramus field, millimetres; negative inside. */
    value: number;
    /** Physical spatial derivative of that field in the body frame. */
    gradient: Border.Point;
  } {
    const a: number = (m.menton + (m.chin - x) * m.slope - y) * m.cos;
    const b: number = (m.gonion - x) * m.lean[0] - (y - m.gonionY) * m.lean[1];
    const r: number = m.round * m.taper;
    const pa: number = Math.max(a + r, 0);
    const pb: number = Math.max(b + r, 0);
    const n: number = Math.hypot(pa, pb);
    const wa: number = n > 0 ? pa / n : a >= b ? 1 : 0;
    const wb: number = n > 0 ? pb / n : a < b ? 1 : 0;
    return { value: Math.min(-r, Math.max(a, b)) + n, gradient: [-wa * m.slope * m.cos - wb * m.lean[0], -wa * m.cos - wb * m.lean[1], 0] };
  }

  /** Build the actual sheet intersection and normal jets at a source ray. */
  function sample(m: IMandible, theta: number): IBaseStation | undefined {
    const sign: number = theta < 0 ? -1 : 1;
    const ux: number = Math.cos(theta);
    const uz: number = Math.abs(Math.sin(theta));
    const [reach, nx, nz] = exit(m, ux, uz);
    const x: number = m.origin + reach * ux;
    const pz: number = reach * uz;
    const line: number = m.menton + (m.chin - x) * m.slope;

    // The original planes are monotone in y throughout their supported range.
    // Their actual top cap supplies the upper bracket, not a fitted height.
    let low: number = line - m.round;
    let high: number = line + m.height;
    if (!(border(m, x, low).value >= 0 && border(m, x, high).value <= 0)) return undefined;
    for (let i: number = 0; i < 64; i++) {
      const mid: number = (low + high) / 2;
      if (border(m, x, mid).value > 0) low = mid;
      else high = mid;
    }

    const y: number = (low + high) / 2;
    const h: number = (y - line) * m.cos;
    const over: number = (Math.hypot(h, m.round) + h - m.round) / 2;
    const rawScale: number = 1 + m.spread * over;
    const scale: number = Math.max(0.5, rawScale);
    const ds: number = rawScale > 0.5 ? m.spread * (h / Math.hypot(h, m.round) + 1) / 2 : 0;
    const z: number = sign * scale * pz;
    const gx: number = nx - nz * pz * ds * m.slope * m.cos / scale;
    const gy: number = -nz * pz * ds * m.cos / scale;
    const gz: number = sign * nz / scale;
    const sideGradient: Border.Point = [gx, gy, gz];
    const sideNormal: Border.Point | undefined = unit(sideGradient);
    const b: {
      /** Rounded body/ramus field at the solved source boundary, millimetres. */
      value: number;
      /** Physical gradient used to construct the shared underside tangent. */
      gradient: Border.Point;
    } = border(m, x, y);
    const sourceMetric: number = Math.hypot(nx, nz / scale);
    const underNormal: Border.Point | undefined = unit(sideGradient.map((v: number, i: number): number => v / sourceMetric + m.draft * b.gradient[i]!) as Border.Point);
    if (sideNormal === undefined || underNormal === undefined) return undefined;

    const cosine: number = Math.max(-1, Math.min(1, dot(sideNormal, underNormal)));
    const angle: number = Math.acos(cosine);
    const below: Border.Point | undefined = unit(underNormal.map((v: number, i: number): number => v - cosine * sideNormal[i]!) as Border.Point);
    if (below === undefined || !(angle > 0 && angle < Math.PI)) return undefined;

    const radialNormal: number = ux * nx + uz * nz;
    const derivativeReach: number = -reach * (-Math.sin(Math.abs(theta)) * nx + Math.cos(theta) * nz) / radialNormal;
    const dx: number = sign * (derivativeReach * ux - reach * uz);
    const dpz: number = sign * (derivativeReach * uz + reach * ux);
    const dy: number = -b.gradient[0] * dx / b.gradient[1];
    const dh: number = (dy + m.slope * dx) * m.cos;
    const dz: number = sign * (scale * dpz + pz * ds * dh);
    const tangent: Border.Point = [dx, dy, dz];
    const origin: Border.Point = [x, y, z];
    const curve: Border.ICurve = Border.place(Border.create(m.round, angle), { origin, outward: sideNormal, below });
    return { angle: theta, origin, tangent, sideNormal, underNormal, curve };
  }

  /**
   * Actual source boundary station with normal jets. Central differences use
   * the cube-root machine-epsilon step for numerical differentiation, never a
   * dimension-dependent anatomical offset. Unsupported neighbouring sheets
   * leave the station unavailable instead of supplying invented derivatives.
   */
  export function station(m: IMandible, theta: number): IStation | undefined {
    const center: IBaseStation | undefined = sample(m, theta);
    const h: number = Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(theta));
    const left: IBaseStation | undefined = sample(m, theta - h);
    const right: IBaseStation | undefined = sample(m, theta + h);
    if (center === undefined || left === undefined || right === undefined) return undefined;
    return {
      ...center,
      sideNormalDerivative: right.sideNormal.map((v: number, i: number): number => (v - left.sideNormal[i]!) / (2 * h)) as Border.Point,
      underNormalDerivative: right.underNormal.map((v: number, i: number): number => (v - left.underNormal[i]!) / (2 * h)) as Border.Point,
    };
  }

  /**
   * Sweep only the actual gonion-to-gonion mandibular body. Both counts are
   * even so that emitted median and curvature-ridge rows have actual vertices;
   * these are numerical sampling choices, not anatomical proportions.
   */
  export function generate(m: IMandible, archIntervals: number, turnIntervals: number): IOutput {
    if (!(archIntervals >= 2 && turnIntervals >= 2 && archIntervals % 2 === 0 && turnIntervals % 2 === 0))
      throw new Error("Even positive sampling intervals are required for explicit median and ridge rows.");
    const failures: IFailure[] = [];
    const stations: IStation[] = [];
    const angle: number = Math.atan2(m.width, m.gonion - m.origin);
    for (let i: number = 0; i <= archIntervals; i++) {
      const at: IStation | undefined = station(m, -angle + 2 * angle * i / archIntervals);
      if (at === undefined) {
        failures.push({ kind: "border-root", index: i, residual: NaN });
        continue;
      }
      stations.push(at);
      const orthogonality: number = Math.abs(dot(at.tangent, at.sideNormal)) + Math.abs(dot(at.tangent, at.underNormal));
      if (!(Number.isFinite(orthogonality) && orthogonality < 1e-7 * Math.max(1, Math.hypot(...at.tangent)))) failures.push({ kind: "normal-frame", index: i, residual: orthogonality });
    }
    if (stations.length !== archIntervals + 1) throw new Error(`Mandibular body has unsupported stations: ${JSON.stringify(failures)}`);

    const vertices: Border.Point[] = stations.flatMap((at: IStation): Border.Point[] => Border.emit(at.curve, turnIntervals));
    const triangles: [number, number, number][] = [];
    const stride: number = turnIntervals + 1;
    for (let a: number = 0; a < archIntervals; a++)
      for (let t: number = 0; t < turnIntervals; t++) {
        const i: number = a * stride + t;
        triangles.push([i, i + stride, i + 1], [i + 1, i + stride, i + stride + 1]);
      }

    for (let i: number = 0; i < vertices.length; i++) {
      const p: Border.Point = vertices[i]!;
      if (p.some((v: number): boolean => !Number.isFinite(v))) failures.push({ kind: "nonfinite", index: i, residual: NaN });
      const over: number = (p[1] - m.menton - (m.chin - p[0]) * m.slope - m.height) * m.cos;
      if (over > 0) failures.push({ kind: "top-cap", index: Math.floor(i / stride), residual: over });
    }
    for (let i: number = 0; i < triangles.length; i++) {
      const indices: [number, number, number] = triangles[i]!;
      const a: Border.Point = vertices[indices[0]]!;
      const b: Border.Point = vertices[indices[1]]!;
      const c: Border.Point = vertices[indices[2]]!;
      const area: number = Math.hypot(...cross(b.map((n: number, j: number): number => n - a[j]!) as Border.Point, c.map((n: number, j: number): number => n - a[j]!) as Border.Point));
      if (!(area > 0 && Number.isFinite(area))) failures.push({ kind: "degenerate-triangle", index: i, residual: area });
    }

    const median: IStation = stations[archIntervals / 2]!;
    const normal: Border.Point | undefined = unit(cross(median.sideNormal, median.underNormal));
    if (normal === undefined) throw new Error("The actual median section has no supported plane.");
    return {
      vertices, triangles, stations,
      boundaries: {
        side: stations.map((at: IStation): Border.Point => Border.point(at.curve, 0)),
        underside: stations.map((at: IStation): Border.Point => Border.point(at.curve, 1)),
        gonions: [Border.emit(stations[0]!.curve, turnIntervals), Border.emit(stations[archIntervals]!.curve, turnIntervals)],
      },
      ridge: stations.map((at: IStation): Border.Point => Border.ridge(at.curve).point),
      midlineAddress: Border.ridge(median.curve),
      midlineSection: { origin: median.origin, normal },
      failures,
    };
  }
}
