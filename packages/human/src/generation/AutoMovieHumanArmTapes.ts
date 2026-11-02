import { AutoMovieHumanTapeProfile } from "./AutoMovieHumanTapeProfile";

/**
 * Arm size from anatomical tape sites rather than fractions of the whole arm.
 * The positive girth profile joins each adjacent pair with a quintic having
 * zero first and second derivatives at its ends. It cannot add a belly between
 * tape sites. Ellipse normalization uses the perimeter of its actual section.
 */
export namespace AutoMovieHumanArmTapes {
  /** A three-dimensional direction, normalized by the caller. */
  export type Vec3 = readonly [number, number, number];

  /** Plane metric of a cylinder sliced obliquely to its own axis. */
  export interface IPlane {
    /** Cylinder's unit longitudinal direction. */
    axis: Vec3;

    /** Unit direction of the ellipse's long semiaxis, square to axis. */
    across: Vec3;

    /** Unit normal of the measuring plane. */
    normal: Vec3;
  }

  /** One tape in millimetres of walk distance and millimetres of circumference. */
  export type IKey = AutoMovieHumanTapeProfile.IKey;

  /**
   * Circumference between ordered positive tape keys, held outside the keys.
   * Zero derivatives at extrema give one forearm belly and a level wrist end.
   */
  export function girth(keys: readonly IKey[], station: number): number {
    return AutoMovieHumanTapeProfile.evaluate(keys, station);
  }

  /**
   * Equivalent-area radius of an ellipse with a specified perimeter, mm.
   * The unit ellipse has semiaxes sqrt(aspect) and 1/sqrt(aspect). A periodic
   * trapezoidal integral of its speed gives its circumference without treating
   * it as a circle. Sixty-four samples resolve the smooth near-circular arm
   * sections, including the supported wrist aspect, far below a millimetre.
   */
  export function radius(girth: number, aspect: number, plane?: IPlane): number {
    if (!(Number.isFinite(girth) && girth > 0 && Number.isFinite(aspect) && aspect > 0))
      throw new Error("An arm ellipse needs a finite positive tape and aspect");
    let u: Vec3 = [1, 0, 0];
    let v: Vec3 = [0, 0, 1];
    if (plane !== undefined) {
      const facing: number = dot(plane.axis, plane.normal);
      if (Math.abs(facing) < 1e-8) throw new Error("An arm tape plane cannot run parallel to its axis");
      const other: Vec3 = [
        plane.axis[1] * plane.across[2] - plane.axis[2] * plane.across[1],
        plane.axis[2] * plane.across[0] - plane.axis[0] * plane.across[2],
        plane.axis[0] * plane.across[1] - plane.axis[1] * plane.across[0],
      ];
      u = project(plane.across, plane.axis, dot(plane.across, plane.normal) / facing);
      v = project(other, plane.axis, dot(other, plane.normal) / facing);
    }
    let speed: number = 0;
    for (let i: number = 0; i < SAMPLES; i++) {
      const phase: number = (2 * Math.PI * i) / SAMPLES;
      if (plane === undefined) speed += Math.sqrt(aspect * Math.sin(phase) ** 2 + Math.cos(phase) ** 2 / aspect);
      else {
        const a: number = -Math.sqrt(aspect) * Math.sin(phase);
        const b: number = Math.cos(phase) / Math.sqrt(aspect);
        speed += Math.hypot(a * u[0] + b * v[0], a * u[1] + b * v[1], a * u[2] + b * v[2]);
      }
    }
    return girth / ((2 * Math.PI * speed) / SAMPLES);
  }
}

/** Periodic quadrature samples for the ellipse's analytic speed. */
const SAMPLES: number = 64;

/** Euclidean dot product of directions in the same frame. */
function dot(a: AutoMovieHumanArmTapes.Vec3, b: AutoMovieHumanArmTapes.Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Slide a transverse direction along the cylinder axis into the tape plane. */
function project(a: AutoMovieHumanArmTapes.Vec3, axis: AutoMovieHumanArmTapes.Vec3, slide: number): AutoMovieHumanArmTapes.Vec3 {
  return [a[0] - slide * axis[0], a[1] - slide * axis[1], a[2] - slide * axis[2]];
}
