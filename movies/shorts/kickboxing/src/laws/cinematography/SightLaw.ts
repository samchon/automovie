import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The finish's visibility law: the camera keeps the striking surface, the
 * struck region and the descending path in an unoccluded line of sight. The
 * view is taken from the open side, the side of the attacker–receiver line
 * where the contact lies, so neither body stands between the lens and the
 * blow; when something still blocks the side-on view the lens turns and
 * rises by the smallest step until every watched point is clear. A point is
 * clear when the sightline from the lens to the edge of its contact
 * neighbourhood keeps a positive separation from every body that does not
 * carry the point itself.
 *
 * ```ts
 * const open = SightLaw.open(attacker, receiver, contact);
 * const views = SightLaw.views(open, base, step); // nearest the open side first
 * SightLaw.clearance(eye, scene); // > 0 when nothing hides the blow
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#law At the finish the camera holds the blow from the open side, unoccluded.
 * @evidence docs/research/cinematography/fight-coverage.md#targets The finishing strike's surface, contact and descending path are unoccluded from the delivered camera.
 * @evidence docs/body/settings/cinematography/ring-coverage.md#finish The finish view holds the kick.
 */
export namespace SightLaw {
  /** One watched point and the bodies that carry it, which never hide it. */
  export interface IWatched {
    /** World point, metres. */
    point: IAutoMovieVector3;

    /** Film seconds at which the point is watched. */
    seconds: number;

    /** Occluder ids that carry the point: the weapon's segments or the struck region's. */
    carriers: readonly string[];
  }

  /** What must stay visible at the finish and how the bodies around it block a sightline. */
  export interface IScene {
    /** The struck region's world point at contact. */
    contact: IAutoMovieVector3;

    /** The attacker's and receiver's floor points at contact. */
    attacker: { x: number; z: number };

    /** The receiver's floor point at contact. */
    receiver: { x: number; z: number };

    /** Film seconds of the contact. */
    seconds: number;

    /** The watched points: the striking surface along its descending path and the struck region. */
    watched: readonly IWatched[];

    /** Radius of the contact neighbourhood around a watched point, metres: the receiver's head radius, the size of the struck region. */
    neighbourhood: number;

    /**
     * Least signed separation between a sightline and every occluder except the carriers.
     *
     * @param from Lens point.
     * @param to The sightline's end.
     * @param seconds Film seconds of the bodies.
     * @param carriers Occluder ids ignored.
     * @returns Metres; positive is clear.
     */
    separation(
      from: IAutoMovieVector3,
      to: IAutoMovieVector3,
      seconds: number,
      carriers: readonly string[],
    ): number;
  }

  /** A candidate view. */
  export interface IView {
    /** Bearing from the framed centre to the lens, radians from +Z toward +X. */
    bearing: number;

    /** Elevation of the lens above the framed centre, radians. */
    elevation: number;
  }

  /**
   * The open side's bearing: perpendicular to the attacker–receiver line, on the side the contact lies.
   *
   * @param attacker The attacker's floor point.
   * @param receiver The receiver's floor point.
   * @param contact The struck region's point.
   * @returns Bearing from the line's centre, radians from +Z toward +X.
   * @evidence docs/research/cinematography/fight-coverage.md#law The open side of the blow.
   */
  export function open(
    attacker: { x: number; z: number },
    receiver: { x: number; z: number },
    contact: { x: number; z: number },
  ): number {
    const dx: number = receiver.x - attacker.x;
    const dz: number = receiver.z - attacker.z;
    const cx: number = (attacker.x + receiver.x) / 2;
    const cz: number = (attacker.z + receiver.z) / 2;
    const side: number =
      (contact.x - cx) * -dz + (contact.z - cz) * dx >= 0 ? 1 : -1;
    return Math.atan2(-dz * side, dx * side);
  }

  /**
   * Candidate views ordered by their angular distance from the open side's
   * side-on view, turning by `step` either way within the open half and
   * rising by `step` up to `highest`.
   *
   * @param open The open side's bearing.
   * @param elevation The coverage law's elevation.
   * @param step The smallest turn, radians: one frame of the coverage law's orbit.
   * @param highest The highest elevation the lens may take, radians.
   * @returns Views, nearest the open side-on view first.
   * @evidence docs/research/cinematography/fight-coverage.md#law Side-on first; the least turn or rise that clears the blow.
   */
  export function views(
    open: number,
    elevation: number,
    step: number,
    highest: number,
  ): IView[] {
    const out: { view: IView; distance: number }[] = [];
    const turns: number = Math.floor(Math.PI / 2 / step);
    for (let rise: number = 0; elevation + rise * step <= highest; rise++)
      for (let turn: number = -turns; turn <= turns; turn++)
        out.push({
          view: {
            bearing: open + turn * step,
            elevation: elevation + rise * step,
          },
          distance: Math.hypot(turn, rise),
        });
    return out
      .sort((p, q) => p.distance - q.distance)
      .map((entry) => entry.view);
  }

  /**
   * The view's clearance: the least separation of the sightlines from the
   * lens to every watched point's neighbourhood edge.
   *
   * @param eye The lens point.
   * @param scene The finish scene.
   * @returns Metres; positive means the blow is unoccluded.
   * @evidence docs/research/cinematography/fight-coverage.md#targets Unoccluded surface, contact and path.
   */
  export function clearance(eye: IAutoMovieVector3, scene: IScene): number {
    let least: number = Infinity;
    for (const w of scene.watched) {
      const end: IAutoMovieVector3 = edge(eye, w.point, scene.neighbourhood);
      least = Math.min(
        least,
        scene.separation(eye, end, w.seconds, w.carriers),
      );
    }
    return least;
  }

  /**
   * Separation between a segment and a capsule, metres; negative inside.
   *
   * @param from Segment start.
   * @param to Segment end.
   * @param a Capsule axis start.
   * @param b Capsule axis end.
   * @param radius Capsule radius.
   * @returns Signed separation.
   */
  export function capsule(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    radius: number,
  ): number {
    return segments(from, to, a, b) - radius;
  }

  /** The sightline's end at the edge of the point's contact neighbourhood. */
  function edge(
    eye: IAutoMovieVector3,
    point: IAutoMovieVector3,
    neighbourhood: number,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = sub(eye, point);
    const length: number = Math.hypot(d.x, d.y, d.z);
    const s: number = Math.min(1, neighbourhood / (length || 1));
    return {
      x: point.x + d.x * s,
      y: point.y + d.y * s,
      z: point.z + d.z * s,
    };
  }

  /** Least distance between two segments (Ericson, Real-Time Collision Detection, 5.1.9). */
  function segments(
    p1: IAutoMovieVector3,
    q1: IAutoMovieVector3,
    p2: IAutoMovieVector3,
    q2: IAutoMovieVector3,
  ): number {
    const d1: IAutoMovieVector3 = sub(q1, p1);
    const d2: IAutoMovieVector3 = sub(q2, p2);
    const r: IAutoMovieVector3 = sub(p1, p2);
    const a: number = dot(d1, d1);
    const e: number = dot(d2, d2);
    const f: number = dot(d2, r);
    let s: number;
    let t: number;
    if (a <= Number.EPSILON && e <= Number.EPSILON) {
      s = 0;
      t = 0;
    } else if (a <= Number.EPSILON) {
      s = 0;
      t = clamp(f / e);
    } else {
      const c: number = dot(d1, r);
      if (e <= Number.EPSILON) {
        t = 0;
        s = clamp(-c / a);
      } else {
        const b: number = dot(d1, d2);
        const denom: number = a * e - b * b;
        s = denom > 0 ? clamp((b * f - c * e) / denom) : 0;
        t = (b * s + f) / e;
        if (t < 0) {
          t = 0;
          s = clamp(-c / a);
        } else if (t > 1) {
          t = 1;
          s = clamp((b - c) / a);
        }
      }
    }
    const c1: IAutoMovieVector3 = {
      x: p1.x + d1.x * s,
      y: p1.y + d1.y * s,
      z: p1.z + d1.z * s,
    };
    const c2: IAutoMovieVector3 = {
      x: p2.x + d2.x * t,
      y: p2.y + d2.y * t,
      z: p2.z + d2.z * t,
    };
    const g: IAutoMovieVector3 = sub(c1, c2);
    return Math.hypot(g.x, g.y, g.z);
  }

  function sub(p: IAutoMovieVector3, q: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: p.x - q.x, y: p.y - q.y, z: p.z - q.z };
  }

  function dot(p: IAutoMovieVector3, q: IAutoMovieVector3): number {
    return p.x * q.x + p.y * q.y + p.z * q.z;
  }

  function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
  }
}
