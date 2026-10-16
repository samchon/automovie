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
 * The head sweep's domain and the head frame side by side: where a point of the head lies over the domain, and what the sweep is at a domain point, in the head frame's millimetres.
 *
 * The layout places the head's quads by anatomy in the head frame and hands the network domain points, so it needs both directions: a landmark's domain point, found by the section plane through it and its turn in that plane, and the surface at a domain point.
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
  ) {
    this.surface = surface;
    this.loft = loft;
    this.frame = frame;
    this.profile = profile;
  }

  /** The compiled head sweep, model frame, metres. */
  public readonly surface: IAutoMovieSweepSurface;

  /** The sweep's planes and their spine parameters. */
  public readonly loft: sweepAutoMovieHumanHead.IOutput;

  /** The head frame. */
  public readonly frame: frameAutoMovieHumanHead.IFrame;

  /** The guides the sections were lofted through. */
  public readonly profile: profileAutoMovieHumanHead.IProfile;

  /**
   * The sweep's point, head frame.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Millimetres
   */
  public point(u: number, v: number): IAutoMovieVector3 {
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
   * A radial address of a point in front of the face changes both coordinates when evaluated on the sweep. Bisect its depth between the lateral guide and a head depth beyond the anterior guide until both coordinate residuals are within 0.00001 mm, instead of using that radial projection as the landmark itself.
   *
   * @param x Transverse coordinate in the head frame, millimetres
   * @param y Height in the head frame, millimetres
   * @returns Surface address whose head-frame position has the requested coordinates
   * @throws Error when the anterior branch cannot place the requested coordinates within the residual tolerance
   */
  public onFace(x: number, y: number): { u: number; v: number } {
    let lo: number = this.profile.lateral(y);
    let hi: number =
      this.profile.front(y) +
      Math.abs(this.profile.front(y) - this.profile.back(y));
    for (let k: number = 0; k < 48; ++k) {
      const depth: number = (lo + hi) / 2;
      const at: { u: number; v: number } = this.locate({ x, y, z: depth });
      const p: IAutoMovieVector3 = this.point(at.u, at.v);
      if (Math.hypot(p.x - x, p.y - y) <= 1e-5) {
        if (at.v < 0.25 || at.v > 0.75)
          throw new Error(
            `Head face projection reached the posterior branch at (${x}, ${y}) mm`,
          );
        return at;
      }
      if (p.z > depth) lo = depth;
      else hi = depth;
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
