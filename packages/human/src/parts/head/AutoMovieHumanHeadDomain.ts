import {
  IAutoMovieSweepFrame,
  IAutoMovieSweepSurface,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";
import { sweepAutoMovieHumanHead } from "./sweepAutoMovieHumanHead";

/**
 * The head's shared source domain and local frame, in millimetres.
 *
 * The underlying sweep owns radial side masses. Facial heights act along the head's anterior axis while preserving its transverse and vertical coordinates. The layout, source guides and network corners all evaluate that same directional definition. A plane-based radial address seeds the physical anterior XY inverse; it is not itself a landmark on the featured face.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadDomain {
  /**
   * @param surface The compiled head sweep, model frame, metres
   * @param loft The sweep's planes and their spine parameters
   * @param frame The head frame
   * @param profile The guides the sections were lofted through
   */
  public constructor(
    surface: IAutoMovieSweepSurface,
    loft: sweepAutoMovieHumanHead.IOutput,
    frame: frameAutoMovieHumanHead.IFrame,
    profile: profileAutoMovieHumanHead.IProfile,
    source: { anterior: (point: IAutoMovieVector3) => number; eyeRadius: number },
  ) {
    this.surface = surface;
    this.loft = loft;
    this.frame = frame;
    this.profile = profile;
    this.anterior_ = source.anterior;
    this.eyeRadius = source.eyeRadius;
  }

  /** Supporting sphere of the generated eyeball about its joint, before the lid allowance, millimetres. */
  public readonly eyeRadius: number;

  /** Forward height source in head-frame millimetres, evaluated on the underlying loft. */
  private readonly anterior_: (point: IAutoMovieVector3) => number;

  /** The compiled head sweep, model frame, metres. */
  public readonly surface: IAutoMovieSweepSurface;

  /** The sweep's planes and their spine parameters. */
  public readonly loft: sweepAutoMovieHumanHead.IOutput;

  /** The head frame. */
  public readonly frame: frameAutoMovieHumanHead.IFrame;

  /** The guides the sections were lofted through. */
  public readonly profile: profileAutoMovieHumanHead.IProfile;

  /**
   * The directional source point, head frame, before cage fitting.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Millimetres
   */
  public point(u: number, v: number): IAutoMovieVector3 {
    const point: IAutoMovieVector3 = this.basePoint(u, v);
    return { ...point, z: point.z + this.loft.featureWeight(u) * this.anterior_(point) };
  }

  /** The underlying loft point before the forward face source is applied. */
  private basePoint(u: number, v: number): IAutoMovieVector3 {
    return this.toHead(this.surface.point(u, v));
  }

  /**
   * A head-frame point in the model frame, metres.
   *
   * @param p Head frame, millimetres
   * @returns Model frame, metres
   */
  public toModel(p: IAutoMovieVector3): IAutoMovieVector3 {
    const m: IAutoMovieVector3 = frameAutoMovieHumanHead.toModel(this.frame, p);
    return { x: m.x / 1000, y: m.y / 1000, z: m.z / 1000 };
  }

  /**
   * A model-frame point in the head frame, millimetres.
   *
   * @param p Model frame, metres
   * @returns Head frame, millimetres
   */
  public toHead(p: IAutoMovieVector3): IAutoMovieVector3 {
    return frameAutoMovieHumanHead.toLocal(
      this.frame,
      AutoMovieHumanVector.of(p.x * 1000, p.y * 1000, p.z * 1000),
    );
  }

  /**
   * The domain point over a head-frame point: the section plane through it and its turn about the spine in that plane.
   *
   * @param p Head frame, millimetres
   * @returns Domain coordinates, `v` from 0 to 1
   */
  public locate(p: IAutoMovieVector3): { u: number; v: number } {
    const q: IAutoMovieVector3 = this.toModel(p);
    const offset: (u: number) => number = (u: number): number => {
      const f: IAutoMovieSweepFrame = this.surface.frame(u);
      return AutoMovieHumanVector.dot(
        AutoMovieHumanVector.offset(q, [f.origin, -1]),
        f.normal,
      );
    };
    // the normal points down the spine, so the offset falls as u grows past the point
    let lo: number = 0;
    let hi: number = 1;
    const sign: number = Math.sign(offset(0) - offset(1)) || 1;
    for (let k: number = 0; k < 50; ++k) {
      const m: number = (lo + hi) / 2;
      if (sign * offset(m) > 0) lo = m;
      else hi = m;
    }
    const u: number = (lo + hi) / 2;
    const f: IAutoMovieSweepFrame = this.surface.frame(u);
    const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(q, [f.origin, -1]);
    const angle: number = Math.atan2(
      AutoMovieHumanVector.dot(d, f.y),
      AutoMovieHumanVector.dot(d, f.x),
    );
    return { u, v: (((angle / (2 * Math.PI)) % 1) + 1) % 1 };
  }

  /**
   * Find the anterior surface address while preserving a landmark's transverse coordinate and height.
   *
   * A radial projection changes both coordinates on the tilted sections. A safeguarded Newton iteration therefore solves the actual anterior surface's transverse and vertical coordinates to a 0.00001 mm residual. The derivative step and iteration limits control this numerical inverse only; they define no anatomical feature or placement.
   *
   * @param x Transverse coordinate in the head frame, millimetres
   * @param y Height in the head frame, millimetres
   * @returns Surface address whose head-frame position has the requested coordinates
   * @throws Error when the anterior branch cannot place the requested coordinates within the residual tolerance
   */
  public onFace(x: number, y: number): { u: number; v: number } {
    let lo: number = this.profile.lateral(y);
    let hi: number = this.profile.front(y) + Math.abs(this.profile.front(y) - this.profile.back(y));
    let at: {u: number; v: number} = this.locate({x, y, z: hi});
    let closest: number = Infinity;
    // Radial plane addresses seed the physical inverse; they do not prove it.
    // Keep the closest candidate when tilted planes have several ray roots.
    for (let seed: number = 0; seed < 48; ++seed) {
      const depth: number = (lo + hi) / 2;
      const candidate: {u: number; v: number} = this.locate({x, y, z: depth});
      const value: IAutoMovieVector3 = this.basePoint(candidate.u, candidate.v);
      const distance: number = Math.hypot(value.x - x, value.y - y);
      if (distance < closest) { at = candidate; closest = distance; }
      if (distance <= 1e-5) break;
      if (value.z > depth) lo = depth;
      else hi = depth;
    }
    // The carried section planes need not be ordered along a ray through a
    // tilted, curved spine. Invert the actual surface's XY map instead.
    const step: number = 1e-6;
    for (let iteration: number = 0; iteration < 48; ++iteration) {
      const point: IAutoMovieVector3 = this.basePoint(at.u, at.v);
      const rx: number = point.x - x;
      const ry: number = point.y - y;
      const error: number = Math.hypot(rx, ry);
      if (error <= 1e-5 && at.v >= 0.25 && at.v <= 0.75) return at;
      const ua: number = Math.max(0, at.u - step);
      const ub: number = Math.min(1, at.u + step);
      const low: IAutoMovieVector3 = this.basePoint(ua, at.v);
      const high: IAutoMovieVector3 = this.basePoint(ub, at.v);
      const left: IAutoMovieVector3 = this.basePoint(at.u, at.v - step);
      const right: IAutoMovieVector3 = this.basePoint(at.u, at.v + step);
      const ux: number = (high.x - low.x) / (ub - ua);
      const uy: number = (high.y - low.y) / (ub - ua);
      const vx: number = (right.x - left.x) / (2 * step);
      const vy: number = (right.y - left.y) / (2 * step);
      const determinant: number = ux * vy - vx * uy;
      if (!Number.isFinite(determinant) || determinant === 0) break;
      const du: number = (vy * rx - vx * ry) / determinant;
      const dv: number = (ux * ry - uy * rx) / determinant;
      let accepted: boolean = false;
      for (let line: number = 0; line < 24; ++line) {
        const scale: number = 2 ** -line;
        const next: {u: number; v: number} = {u: at.u - scale * du, v: at.v - scale * dv};
        if (next.u < 0 || next.u > 1 || next.v < 0.25 || next.v > 0.75) continue;
        const value: IAutoMovieVector3 = this.basePoint(next.u, next.v);
        if (Math.hypot(value.x - x, value.y - y) >= error) continue;
        at = next;
        accepted = true;
        break;
      }
      if (!accepted) break;
    }
    throw new Error(`Head face projection did not converge at (${x}, ${y}) mm`);
  }

  /**
   * The spine parameter of a level of the plane family, between the stations' own.
   *
   * @param level From 0 (top section) to 1 (ring)
   * @returns `u`
   */
  public u(level: number): number {
    const shares: number[] = this.loft.shares;
    const levels: number[] = this.loft.levels;
    let k: number = 0;
    while (k + 2 < levels.length && levels[k + 1]! < level) ++k;
    const t: number = Math.min(
      1,
      Math.max(0, (level - levels[k]!) / (levels[k + 1]! - levels[k]!)),
    );
    return shares[k]! + (shares[k + 1]! - shares[k]!) * t;
  }

  /**
   * The spine parameter of the plane that meets the front guide at a height.
   *
   * @param y Height on the face's midline, head frame, millimetres
   * @returns `u`
   */
  public front(y: number): number {
    const meet: (level: number) => number = (level: number): number => {
      const p: sweepAutoMovieHumanHead.IPlane = this.loft.plane(level);
      let lo: number = this.profile.chin - 60;
      let hi: number = this.profile.top;
      for (let k: number = 0; k < 50; ++k) {
        const m: number = (lo + hi) / 2;
        if (m - (p.y0 + p.slope * this.profile.front(m)) > 0) hi = m;
        else lo = m;
      }
      return (lo + hi) / 2;
    };
    let lo: number = 0;
    let hi: number = 1;
    for (let k: number = 0; k < 40; ++k) {
      const m: number = (lo + hi) / 2;
      if (meet(m) > y) lo = m;
      else hi = m;
    }
    return this.u((lo + hi) / 2);
  }
}
