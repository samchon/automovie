import {
  AutoMovieConstructionPortCurve as Curve,
  AutoMovieConstructionPortField as Field,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPort,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanHandAttachment,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanThenarContact as Contact } from "./AutoMovieHumanThenarContact";

type P2 = [number, number];
const TURN = 2 * Math.PI;

/** Attach the thumb within the measured contact on the continuing palm. */
export namespace AutoMovieHumanThenarPort {
  /** Source portions of the thumb port. */
  export interface IPort {
    /** Original palm trim in its native chart. */
    loop: IAutoMovieConstructionPortLoop;
    /** Original thumb trim in millimetres, at uniform original phases. */
    rails: number[];
    /** Mesh input span count, derived from the native first cell length. */
    rows: number;
  }

  /** Read and trim only the two original surfaces that intersect. */
  export function source(
    palm: IAutoMovieViewPart,
    thumb: IAutoMovieViewPart,
    attachment: IAutoMovieHumanHandAttachment.IConnection,
  ): IPort | string {
    const contact = Contact.prepare(palm, thumb, attachment);
    if (typeof contact === "string") return contact;
    const { host, part, span, shaft, points } = contact;
    const footprint: P2[] = points.map(
      ({ hostStation, hostPhase }): P2 => [hostStation, hostPhase],
    );
    const centre = centroid(footprint);
    if (centre === null)
      return "The thenar contact has no enclosed area on the original palm";
    const { point: origin, sense } = centre;
    // The first complete native station cell must remain between the source
    // end and every phase of the retained thumb rail. This is the least
    // common translation of the measured intersection that provides it.
    const offset: number =
      part.domain[0] + span - Math.min(...points.map(({ s }): number => s));
    const rails: number[] = points.map(({ s }): number => s + offset);
    const range: P2 = Field.periodic(rails).bounds;
    if (!(range[0] > part.domain[0] && range[1] < shaft))
      return "The thenar receiving curve exceeds the original first segment";
    const rim = points.map((p, i) => {
      const [u, v] = footprint[i]!;
      const radial: P2 = [u - origin[0], v - origin[1]];
      const h = host.jet(u, v);
      const c = part.jet(rails[i]!, p.phase);
      const square = (q: IAutoMovieSolidSurface.IJet): P3 | null =>
        Vec.unit(Vec.cross(p.tangent, Vec.cross(q.u, q.v)));
      const hs = square(h);
      const cs = square(c);
      if (hs === null || cs === null) return null;
      const speed: number = Math.abs(
        Vec.dot(
          hs,
          Vec.combine([
            [radial[0], h.u],
            [radial[1], h.v],
          ]),
        ),
      );
      const receiver: number = Math.abs(Vec.dot(cs, c.u));
      if (!(speed > 0 && receiver > 0)) return null;
      // Balance leading-order travel across the common tangent on the two
      // original sheets. The world distance comes from their exact jets.
      const scale: number = 1 + (offset * receiver) / speed;
      const edge: P2 = [radial[0] * scale, radial[1] * scale];
      return {
        edge,
        distance: Vec.norm(
          Vec.sub(c.p, host.point(origin[0] + edge[0], origin[1] + edge[1])),
        ),
      };
    });
    const regular = rim.filter((line) => line !== null);
    if (regular.length !== points.length)
      return "The contact has a vanishing transverse native tangent speed";
    const count: number = regular.length;
    const a: number = Math.max(
      ...regular.map(({ edge }): number => Math.abs(edge[0])),
    );
    const b: number = Math.max(
      ...regular.map(({ edge }): number => Math.abs(edge[1])),
    );
    if (!(a > 0 && b > 0 && b < Math.PI))
      return "The thenar contour leaves one regular palm chart";
    const chart: P2[] = regular.map(
      ({ edge }): P2 => [edge[0] / a, (sense * edge[1]) / b],
    );
    const shape: number[] | null = polar(chart);
    if (shape === null)
      return "The thenar contour does not advance around its original chart";
    const loop: IAutoMovieConstructionPortLoop = {
      centre: [origin[0] / 1000, origin[1]],
      semi: [a / 1000, b],
      sense,
      shape,
    };
    const course = Curve.curve(loop, count, TURN);
    if (typeof course === "string") return course;
    if (!(course.reach[0] > host.domain[0] && course.reach[1] < host.domain[1]))
      return "The thenar trim exceeds the original palm's station range";
    return {
      loop,
      rails,
      rows: Math.max(
        1,
        Math.ceil(
          Math.max(...regular.map(({ distance }): number => distance)) / span,
        ),
      ),
    };
  }

  /** Keep the original palm intact outside the two exact local curves. */
  export function node(
    source: IPort,
    host: IAutoMovieConstructionNode,
    hostFace: string,
    part: IAutoMovieConstructionNode,
    partFace: string,
  ): IAutoMovieConstructionPort {
    return {
      type: "port",
      name: `port.${partFace}`,
      host,
      hostFace,
      loop: source.loop,
      band: `${partFace}.thenar`,
      part,
      partFace,
      partEnd: "bottom",
      rail: source.rails[0]! / 1000,
      rails: source.rails.map((s): number => s / 1000),
      correspondence: "length",
      ribbons: "column",
      count: source.rails.length,
      rows: source.rows,
    };
  }
}

const wedge = (a: P2, b: P2): number => a[0] * b[1] - a[1] * b[0];

/** Area centroid and orientation without sensitivity to edge subdivision. */
function centroid(points: readonly P2[]): { point: P2; sense: 1 | -1 } | null {
  let weight: number = 0;
  let x: number = 0;
  let y: number = 0;
  for (const [i, a] of points.entries()) {
    const b: P2 = points[(i + 1) % points.length]!;
    const area: number = wedge(a, b);
    weight += area;
    x += (a[0] + b[0]) * area;
    y += (a[1] + b[1]) * area;
  }
  return weight === 0
    ? null
    : {
        point: [x / (3 * weight), y / (3 * weight)],
        sense: weight > 0 ? 1 : -1,
      };
}

/** Intersect each radial chart ray with the unique enclosing polygon edge. */
function polar(points: readonly P2[]): number[] | null {
  const count: number = points.length;
  const angles: number[] = [Math.atan2(points[0]![1], points[0]![0])];
  for (const [i, a] of points.entries()) {
    const b: P2 = points[(i + 1) % count]!;
    const step: number = Math.atan2(wedge(a, b), a[0] * b[0] + a[1] * b[1]);
    if (!(step > 0)) return null;
    angles.push(angles[i]! + step);
  }
  if (Math.round((angles[count]! - angles[0]!) / TURN) !== 1) return null;
  return points.map((_, k): number => {
    const clock: number = (TURN * k) / count;
    const target: number =
      ((((clock - angles[0]!) % TURN) + TURN) % TURN) + angles[0]!;
    let lo: number = 0;
    let hi: number = count;
    while (hi - lo > 1) {
      const middle: number = (lo + hi) >>> 1;
      if (angles[middle]! <= target) lo = middle;
      else hi = middle;
    }
    const a: P2 = points[lo]!;
    const b: P2 = points[(lo + 1) % count]!;
    const edge: P2 = [b[0] - a[0], b[1] - a[1]];
    return wedge(a, edge) / wedge([Math.cos(clock), Math.sin(clock)], edge);
  });
}
