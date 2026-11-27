import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1FacePriors as P } from "./AutoMovieHumanF1FacePriors";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
} from "@automovie/interface";

/**
 * The face's centres, frames and dividing surfaces as functions of landmarks: definitions only, with no coordinate of any person.
 *
 * Every point is given in one common frame, millimetres (the head's frame in the figure, with the median plane `z = 0`). A paired part
 * is defined on the +Z side and its twin is the reflection in the median plane. A dividing surface is returned as a signed measure in
 * millimetres, positive outside the part and zero on the surface; it is a distance for a plane and a first-order distance elsewhere, so
 * it orders points and places the surface but is no caliper. `packages/human/docs/techniques/face-one-shot.md` gives the reading behind
 * each definition.
 */
export namespace AutoMovieHumanF1FaceCentres {

  /** A plane: a point on it and its unit normal. */
  export interface IPlane {
    /** A point of the plane, mm. */
    point: AutoMovieVector3Tuple;

    /** The unit normal. */
    normal: AutoMovieVector3Tuple;

    /** The plane's station along the course it is square to, from the course's reference point, mm. */
    station: number;
  }

  /** The mouth's line with its frame. */
  export interface IMuzzle {
    /** Origin the incisors' front behind stomion; X forward, Y up, Z along the line toward +Z. */
    frame: IAutoMovieHumanSegmentFrame;

    /** The line's half length, mm: from the median plane to cheilion's station. */
    half: number;
  }

  /**
   * An eye's frame: origin the globe's centre, Z the canthal line from endocanthion to exocanthion, X the forward direction made square
   * to it, Y = Z x X. The lids' skin is star-shaped about the line through the origin along Z, and a lid's margin is a phase about it.
   */
  export function eye(globe: AutoMovieVector3Tuple, endocanthion: AutoMovieVector3Tuple, exocanthion: AutoMovieVector3Tuple, forward: AutoMovieVector3Tuple): IAutoMovieHumanSegmentFrame {
    return fromZX(globe, sub(exocanthion, endocanthion), forward);
  }
  /**
   * The mouth's line: through the incisors' front, which stands the lips' margin tissue (`LIP_MARGIN_TISSUE_MM`) behind stomion along
   * the forward direction, parallel to the lateral direction; it reaches each side to cheilion's station, where the lips' family closes.
   * A groove of a section layout cannot end between two stations (it may only narrow to a remainder), so the lips' line, which ends at
   * the mouth's corner, must end with its family: carried on to the modiolus, 14.4 mm farther, its remainder would be drawn across the
   * cheek.
   */
  export function muzzle(stomion: AutoMovieVector3Tuple, cheilion: AutoMovieVector3Tuple, forward: AutoMovieVector3Tuple, lateral: AutoMovieVector3Tuple): IMuzzle {
    const X: AutoMovieVector3Tuple = unit(forward);
    const frame: IAutoMovieHumanSegmentFrame = fromZX(along(stomion, X, -P.LIP_MARGIN_TISSUE_MM), along(lateral, X, -dot(lateral, X)), X);
    return { frame, half: dot(sub(cheilion, stomion), frame.axes[2]) };
  }
  /**
   * The ring between the neck and the head: the plane square to the course from the neck's base centre through the head's origin, through
   * the cervical point, the corner between the floor under the jaw and the neck's front. Its station is counted from the head's origin
   * along the course, negative below it.
   */
  export function ring(neckBase: AutoMovieVector3Tuple, headOrigin: AutoMovieVector3Tuple, cervical: AutoMovieVector3Tuple): IPlane {
    const normal: AutoMovieVector3Tuple = unit(sub(headOrigin, neckBase));
    const station: number = dot(sub(cervical, headOrigin), normal);
    return { point: along(headOrigin, normal, station), normal, station };
  }
  /**
   * The orbit's dividing surface: the elliptic cylinder about an eye's forward axis with semi-axes half the orbit's breadth along Z and
   * half its height along Y, ahead of the globe's centre only: the cylinder runs on through the head, and the skin behind the centre's
   * plane is never the eye's. The measure is the greater of `(rho - 1) sqrt(a b)`, `rho` the point's elliptic radius, and the distance
   * behind that plane: negative inside, where the skin is the eye's.
   */
  export function orbit(frame: IAutoMovieHumanSegmentFrame, breadth: number = P.ORBIT_BREADTH_MM, height: number = P.ORBIT_HEIGHT_MM): (p: AutoMovieVector3Tuple) => number {
    const a: number = breadth / 2;
    const b: number = height / 2;
    return (p: AutoMovieVector3Tuple): number => {
      const q: AutoMovieVector3Tuple = F.toLocal(frame, p);
      return Math.max((Math.hypot(q[2] / a, q[1] / b) - 1) * Math.sqrt(a * b), -q[0]);
    };
  }
  /**
   * The lips' dividing surface: the wedge about the mouth's line between the half plane through sublabiale and the one through subnasale,
   * closed by the planes at the line's two ends. The measure is the greatest of the arc past either half plane at the point's own radius
   * and the distance past an end: negative inside, where the skin is the lips'.
   */
  export function wedge(mouth: IMuzzle, sublabiale: AutoMovieVector3Tuple, subnasale: AutoMovieVector3Tuple): (p: AutoMovieVector3Tuple) => number {
    const phase = (p: AutoMovieVector3Tuple): [number, number, number] => {
      const q: AutoMovieVector3Tuple = F.toLocal(mouth.frame, p);
      return [Math.atan2(q[1], q[0]), Math.hypot(q[0], q[1]), q[2]];
    };
    const low: number = phase(sublabiale)[0];
    const high: number = phase(subnasale)[0];
    return (p: AutoMovieVector3Tuple): number => {
      const [phi, r, z]: [number, number, number] = phase(p);
      return Math.max(r * (phi - high), r * (low - phi), Math.abs(z) - mouth.half);
    };
  }

  /**
   * The nose's dividing surface: the plane through both alar bases (the +Z one given, its twin its reflection in `z = 0`) parallel to the
   * line from subnasale to nasion, between the levels of subnasale and nasion along that line. The measure is the greatest of the
   * distance behind the plane and the distance past either level: negative inside, where the skin is the nose's. Two planes through
   * nasion and subnasale, one through each alar base, were read on a reference first and kept the cheek and the lower lid in front of
   * them, 578 vertices of the eye's own.
   */
  export function nasal(nasion: AutoMovieVector3Tuple, subnasale: AutoMovieVector3Tuple, alarBase: AutoMovieVector3Tuple): (p: AutoMovieVector3Tuple) => number {
    const axis: AutoMovieVector3Tuple = unit(sub(nasion, subnasale));
    const length: number = dot(sub(nasion, subnasale), axis);
    const raw: AutoMovieVector3Tuple = unit(cross(axis, [0, 0, 1]));

    // The plane's normal faces subnasale, which stands ahead of the alar bases.
    const front: AutoMovieVector3Tuple = dot(sub(subnasale, alarBase), raw) > 0 ? raw : [-raw[0], -raw[1], -raw[2]];
    return (p: AutoMovieVector3Tuple): number => {
      const t: number = dot(sub(p, subnasale), axis);
      return Math.max(-dot(sub(p, alarBase), front), t - length, -t);
    };
  }

  const sub = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

  const dot = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const cross = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  const along = (o: AutoMovieVector3Tuple, d: AutoMovieVector3Tuple, t: number): AutoMovieVector3Tuple => [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];

  const unit = (a: AutoMovieVector3Tuple): AutoMovieVector3Tuple => {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  };

  /*
   * A frame from an exact Z and a hint for X: X is the hint made square to Z, Y = Z x X.
   */
  function fromZX(origin: AutoMovieVector3Tuple, z: AutoMovieVector3Tuple, x: AutoMovieVector3Tuple): IAutoMovieHumanSegmentFrame {
    const Z: AutoMovieVector3Tuple = unit(z);
    const X: AutoMovieVector3Tuple = unit(along(x, Z, -dot(x, Z)));
    return { origin, axes: [X, cross(Z, X), Z] };
  }
}
