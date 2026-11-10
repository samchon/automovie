import { AutoMovieConstructionKnownPort, type IAutoMovieConstructionKnownPortSource, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The trunk's shoulder ports as known-port parent sides on S00's own chart
 * (station mm, the arclength of the section planes' course, equal to the
 * world height below the neck turn; phase = polar angle in the section
 * plane from +u anterior toward +v right, rad), for the engine's band
 * operator (`AutoMovieConstructionKnownPort`): each port is a closed curve
 * on that chart, the parent field is the S00 surface itself (wall and mounds,
 * `AutoMovieSolidChain.surface`), and the parent map carries the band
 * rectangle (clock `c`, transverse `v` in [0, 1]) into the chart, `v = 0` on
 * the port curve and `v = 1` at the region's centre, so the trimmed region
 * inside the port is the parent's strip of the band.
 *
 * Each port curve is an ellipse in the chart, `station = y0 + (1 - v) a cos c`,
 * `phase = p0 + s (1 - v) b sin c`, with `c = 0` at its top, increasing toward
 * the anterior side (`s` = -1 on the right, +1 on the left, so both sides run
 * top, front, bottom, back), period 2 pi. The map is polynomial in `(1 - v)`
 * and trigonometric in `c`, so its total2 is exact. Each shoulder port is
 * centred on the lateral guide (phase +-pi/2) at the station midway between
 * the axilla and acromion heights (ANSUR II; inside the neck turn a height is
 * the station whose plane origin stands there), its half height half their
 * station difference; its phase half-width is set by bisection so the port's
 * world perimeter on S00 equals the child's root girth, the axillary arm
 * circumference (ANSUR 1988, the arm root profile's tape).
 *
 * The hips are not ports: S00 ends open at the crotch and each leg continues
 * from half of that end plus the medial seam (`AutoMovieHumanTrunkPelvisSplit`).
 * A closing bowl with two thigh-girth ports was tried twice and failed (the
 * ports crossed; the bowl under the pole could not carry a thigh-girth loop).
 *
 * The builder that placed these ports on a generated S00 surface was removed
 * with the dense f1 trunk dumps it replayed; the port record, its elliptic
 * chart map and the band operator remain for the compact reconstruction.
 */
export namespace AutoMovieHumanTrunkPorts {
  /** One port's parent side. */
  export interface IPort {
    /** `shoulder.left` or `shoulder.right`. */
    name: string;

    /** Chart centre `[station mm, phase rad]`. */
    centre: [number, number];

    /** Chart half extents `[station mm, phase rad]`. */
    semi: [number, number];

    /** +1 or -1: the phase sense of increasing clock at `c = pi / 2` (toward anterior). */
    sense: 1 | -1;

    /** The child root girth the port's perimeter was sized to, mm. */
    girth: number;

    /** The port curve's world perimeter on S00, mm (128-gon). */
    perimeter: number;

    /** The S00 surface (parent field), chart (station, phase). */
    field: IAutoMovieSolidSurface;

    /** The parent map from the band rectangle (clock, transverse) into that chart. */
    map: IAutoMovieConstructionKnownPortSource.IMap;

    /** World point of the port curve at clock `c`. */
    curve(c: number): Vec3;

    /**
     * The world total2 of the band rectangle on S00 at clock `c` and
     * transverse `v` (0 on the port curve, 1 at the region's centre): `u` per
     * radian of clock along the loop, `v` per unit of transverse into the
     * trunk's region, by the chain rule of the S00 field's jet over the
     * parent map's exact jet. A child starts its root's lines from `jet(c, 0)`.
     */
    jet(c: number, v?: number): IAutoMovieSolidSurface.IJet;

    /**
     * The port's declared frame in the world: origin at the loop's centroid
     * (128-gon), axis 0 the loop plane's normal by Newell's method pointing
     * out of the trunk (away from the section course), axis 1 the world up
     * made orthogonal to it, axis 2 their cross product (forward on the right
     * port, backward on the left), the child's root frame before its own
     * relative transform.
     */
    frame: { origin: Vec3; axes: [Vec3, Vec3, Vec3] };

    /** Basis of the placement and size. */
    basis: string;
  }

  /** The parent chart map of an elliptic port: exact total2 in (clock, transverse). */
  export function ellipse(centre: [number, number], semi: [number, number], sense: 1 | -1): IAutoMovieConstructionKnownPortSource.IMap {
    const [a, b]: [number, number] = semi;
    const s: number = sense * b;
    return {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (c: number, v: number): [number, number] => [centre[0] + (1 - v) * a * Math.cos(c), centre[1] + (1 - v) * s * Math.sin(c)],
      jet: (c: number, v: number): IAutoMovieConstructionKnownPortSource.IJet => {
        const w: number = 1 - v;
        const cos: number = Math.cos(c);
        const sin: number = Math.sin(c);
        return {
          p: [centre[0] + w * a * cos, centre[1] + w * s * sin],
          u: [-w * a * sin, w * s * cos],
          v: [-a * cos, -s * sin],
          uu: [-w * a * cos, -w * s * sin],
          uv: [a * sin, -s * cos],
          vv: [0, 0],
        };
      },
    };
  }

  /**
   * The band between a trunk port and a limb's root: the engine's known-port
   * operator over the S00 field with this port's map (parent) and the limb's
   * own field and map (child, owned by its region), period 2 pi.
   */
  export function band(port: IPort, child: { field: IAutoMovieSolidSurface; map: IAutoMovieConstructionKnownPortSource.IMap; boundary: string }, orientation: 1 | -1): AutoMovieConstructionKnownPort.IPrepared {
    return AutoMovieConstructionKnownPort({
      definition: {
        name: `band.${port.name}`,
        domain: [0, 2 * Math.PI],
        period: 2 * Math.PI,
        orientation,
        parent: { field: "trunk", map: port.name, boundary: `trunk.port.${port.name}`, material: "trunk", binding: "trunk" },
        child: { field: "child", map: `${port.name}.child`, boundary: child.boundary, material: child.boundary, binding: child.boundary },
      },
      fields: new Map([
        ["trunk", port.field],
        ["child", child.field],
      ]),
      maps: new Map([
        [port.name, port.map],
        [`${port.name}.child`, child.map],
      ]),
    });
  }
}
