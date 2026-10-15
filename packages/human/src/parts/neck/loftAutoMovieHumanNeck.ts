import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "../../junction/AUTOMOVIE_HUMAN_NECK_COLUMN";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { sectionAutoMovieHumanNeck } from "./sectionAutoMovieHumanNeck";

/**
 * Loft the neck: one sweep from the neck-base ring to the neck-top ring through its measured mid section and the throat under the jaw.
 *
 * Four stations, each a smooth closed curve in its own plane:
 *
 * 1. The neck-base ring's limit curve, in the oblique plane from the jugular notch to cervicale.
 * 2. The mid section, perpendicular to the neck bone where the neck circumference is measured, scaled until the subdivided neck has that circumference.
 * 3. The throat, just under the jaw and parallel to the mandibular plane: the neck column alone, the egg of the neck circumference's mean radius {@link AUTOMOVIE_HUMAN_NECK_COLUMN} gives the neck-top ring behind and beside the jaw.
 * 4. The neck-top ring's limit curve in the mandibular plane, which in front is the jawline.
 *
 * Between the throat and the top ring the front widens from the column to the jawline within a few millimetres, so the submental surface runs forward under the chin and the throat rises upright below it, the cervicomental angle ("canopied in front by the chin", Bridgman 1920, Constructive Anatomy, p. 104). The sweep is one patch of twelve columns, so each ring's twelve vertices close it, pinned to the shared shapes.
 *
 * @param props The neck's sections and its two ring shapes, and the mid section's scale about the neck bone
 * @returns The neck cage, model frame, millimetres
 */
export function loftAutoMovieHumanNeck(props: {
  sections: sectionAutoMovieHumanNeck.IOutput;
  base: IAutoMovieHumanRingShape;
  top: IAutoMovieHumanRingShape;
  scale: number;
  mean: number;
}): IAutoMovieHumanCage {
  const { sections, base, top } = props;
  const up: IAutoMovieVector3 = sections.axis;
  const limit = (ring: IAutoMovieVector3[]): IAutoMovieVector3[] =>
    ring.map(
      (p: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(
          AutoMovieHumanVector.of(0, 0, 0),
          [ring[(k + ring.length - 1) % ring.length]!, 1 / 6],
          [p, 4 / 6],
          [ring[(k + 1) % ring.length]!, 1 / 6],
        ),
    );
  // the throat: the top ring's plane moved down into the neck, the column shape about the moved origin
  const topNormal: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    top.frame.normal,
  );
  const toward: IAutoMovieVector3 =
    AutoMovieHumanVector.dot(topNormal, up) >= 0
      ? topNormal
      : AutoMovieHumanVector.of(-topNormal.x, -topNormal.y, -topNormal.z);
  const throatOrigin: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    top.frame.origin,
    [toward, -THROAT * props.mean],
  );
  const tilt: number = Math.max(
    0.5,
    Math.abs(AutoMovieHumanVector.dot(toward, up)),
  );
  const column = {
    across: AUTOMOVIE_HUMAN_NECK_COLUMN.across * props.mean,
    front: AUTOMOVIE_HUMAN_NECK_COLUMN.front * props.mean,
    back: (AUTOMOVIE_HUMAN_NECK_COLUMN.back * props.mean) / tilt,
  };
  const mid: IAutoMovieVector3[] = sections.mid.map((p: IAutoMovieVector3) =>
    AutoMovieHumanVector.offset(sections.centre, [
      AutoMovieHumanVector.offset(p, [sections.centre, -1]),
      props.scale,
    ]),
  );
  const stations: IStation[] = [
    plane(
      base.frame.origin,
      base.frame.normal,
      up,
      sections.base.length ? limit(sections.base) : [],
    ),
    plane(sections.centre, up, up, mid),
    planeOf(
      throatOrigin,
      toward,
      up,
      (c: number, s: number): number =>
        1 /
        Math.sqrt(
          (c * c) / (c >= 0 ? column.front : column.back) ** 2 +
            (s * s) / column.across ** 2,
        ),
    ),
    plane(top.frame.origin, toward, up, limit(sections.top)),
  ];
  const origins: IAutoMovieVector3[] = stations.map((s: IStation) => s.origin);
  const shares: number[] = chordShares(origins);
  const sweep: IAutoMovieSweep = {
    spine: { points: origins.map(toMetres), normal: stations[0]!.x },
    stations: stations.map(
      (s: IStation, k: number): IAutoMovieSweep.IStation => ({
        at: shares[k]!,
        section: s.section,
        rotation: quaternionOf(
          s.x,
          AutoMovieHumanVector.cross(s.normal, s.x),
          s.normal,
        ),
      }),
    ),
  };
  const n: number = base.count;
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(sweep);
  // ring vertex k sits on the sweep's column nearest it: the turn and direction bringing the ring's positions closest to the columns
  const columns = (shape: IAutoMovieHumanRingShape, u: number): number[] => {
    const at: IAutoMovieVector3[] = Array.from(
      { length: n },
      (_: unknown, c: number): IAutoMovieVector3 => {
        const p: IAutoMovieVector3 = surface.point(u, c / n);
        return AutoMovieHumanVector.of(p.x * 1000, p.y * 1000, p.z * 1000);
      },
    );
    let best: { order: number[]; cost: number } = { order: [], cost: Infinity };
    for (const sign of [1, -1])
      for (let first: number = 0; first < n; ++first) {
        const order: number[] = Array.from(
          { length: n },
          (_: unknown, k: number): number => (((first + sign * k) % n) + n) % n,
        );
        const cost: number = order.reduce(
          (sum: number, c: number, k: number): number =>
            sum +
            AutoMovieHumanVector.distance(at[c]!, shape.positions[k]!) ** 2,
          0,
        );
        if (cost < best.cost) best = { order, cost };
      }
    return best.order;
  };
  const loop = (order: number[], u: number): IAutoMovieSurfaceNetwork.IEdge[] =>
    order.map((c: number, k: number): IAutoMovieSurfaceNetwork.ISweepEdge => {
      const next: number = order[(k + 1) % n]!;
      const forward: boolean = (next - c + n) % n === 1;
      return {
        type: "sweep",
        sweep: "neck",
        from: { u, v: c / n },
        to: { u, v: forward ? (c + 1) / n : (c - 1) / n },
        segments: fixed(1),
      };
    });
  const network: IAutoMovieSurfaceNetwork = {
    sweeps: { neck: sweep },
    patches: [
      {
        type: "sweep",
        name: "neck",
        sweep: "neck",
        u: [0, 1],
        v: [0, 1],
        rows: fixed(ROWS),
        columns: fixed(n),
      },
    ],
    rings: [
      {
        name: "neckBase",
        edges: loop(columns(base, 0), 0),
        positions: base.positions.map(toMetres),
      },
      {
        name: "neckTop",
        edges: loop(columns(top, 1), 1),
        positions: top.positions.map(toMetres),
      },
    ],
  };
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
  });
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < sampled.cage.positions.length; k += 3)
    vertices.push({
      position: AutoMovieHumanVector.of(
        sampled.cage.positions[k]! * 1000,
        sampled.cage.positions[k + 1]! * 1000,
        sampled.cage.positions[k + 2]! * 1000,
      ),
    });
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): IAutoMovieHumanCage.IFace => {
      const corners: IAutoMovieHumanSurfaceCoordinate.IOn<"neck">[] =
        sampled.corners[f]!.map(
          (
            c: IAutoMovieSurfaceCoordinate,
          ): IAutoMovieHumanSurfaceCoordinate.IOn<"neck"> => ({
            part: "neck",
            side: null,
            u: c.t,
            v: c.s,
          }),
        );
      return {
        vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
        coordinates: corners as IAutoMovieHumanCage.IFace["coordinates"],
      };
    },
  );
  const ring = (
    name: string,
    shape: IAutoMovieHumanRingShape,
  ): IAutoMovieHumanCage["rings"][number] => ({
    site: shape.site,
    side: shape.side,
    vertices: sampled.rings[name]!,
    start: shape.start,
    frame: shape.frame,
  });
  return {
    vertices,
    faces,
    creases: [],
    rings: [ring("neckBase", base), ring("neckTop", top)],
    construction: IAutoMovieHumanCage.inModel(network),
  };
}

interface IStation {
  origin: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  x: IAutoMovieVector3;
  section: IAutoMovieSweepSection;
}

/** Rows of the neck between its rings. */
const ROWS: number = 6;

/** Depth of the throat's section under the mandibular plane, over the neck circumference's mean radius. Conventional. */
const THROAT: number = 0.2;

const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

const toMetres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** A plane whose first axis is the anterior direction within it, the spine running up the neck. */
const axesOf = (
  origin: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  up: IAutoMovieVector3,
): {
  origin: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  x: IAutoMovieVector3;
  y: IAutoMovieVector3;
} => {
  const n0: IAutoMovieVector3 = AutoMovieHumanVector.normalize(normal);
  const n: IAutoMovieVector3 =
    AutoMovieHumanVector.dot(n0, up) >= 0
      ? n0
      : AutoMovieHumanVector.of(-n0.x, -n0.y, -n0.z);
  const forward: IAutoMovieVector3 = AutoMovieHumanVector.of(0, 0, 1);
  const x: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(forward, [
      n,
      -AutoMovieHumanVector.dot(forward, n),
    ]),
  );
  return { origin, normal: n, x, y: AutoMovieHumanVector.cross(n, x) };
};

/** A station through points, its section the closed curve through them about the origin. */
const plane = (
  origin: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  up: IAutoMovieVector3,
  points: IAutoMovieVector3[],
): IStation => {
  const ax = axesOf(origin, normal, up);
  const flat: Array<{ x: number; y: number }> = points.map(
    (p: IAutoMovieVector3) => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [origin, -1]);
      return {
        x: AutoMovieHumanVector.dot(d, ax.x) / 1000,
        y: AutoMovieHumanVector.dot(d, ax.y) / 1000,
      };
    },
  );
  return { origin, normal: ax.normal, x: ax.x, section: closedCurve(flat) };
};

/** A station whose section is a radius by the cosine and sine of the direction from its anterior axis. */
const planeOf = (
  origin: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  up: IAutoMovieVector3,
  radius: (c: number, s: number) => number,
): IStation => {
  const ax = axesOf(origin, normal, up);
  const radii: number[] = Array.from(
    { length: 72 },
    (_: unknown, k: number): number => {
      const a: number = (2 * Math.PI * k) / 72;
      return radius(Math.cos(a), Math.sin(a)) / 1000;
    },
  );
  return {
    origin,
    normal: ax.normal,
    x: ax.x,
    section: { type: "radial", radii },
  };
};

/** Each point's share of the polyline's chord length. */
const chordShares = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(
      lengths[k - 1]! +
        AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

/** A closed polygon sampled from the uniform Catmull-Rom curve through points, eight samples per span, counterclockwise. */
const closedCurve = (
  points: Array<{ x: number; y: number }>,
): IAutoMovieSweepSection => {
  const n: number = points.length;
  const out: Array<{ x: number; y: number }> = [];
  for (let k: number = 0; k < n; ++k) {
    const p0 = points[(k + n - 1) % n]!;
    const p1 = points[k]!;
    const p2 = points[(k + 1) % n]!;
    const p3 = points[(k + 2) % n]!;
    for (let i: number = 0; i < 8; ++i) {
      const t: number = i / 8;
      const t2: number = t * t;
      const t3: number = t2 * t;
      const w0: number = -0.5 * t3 + t2 - 0.5 * t;
      const w1: number = 1.5 * t3 - 2.5 * t2 + 1;
      const w2: number = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const w3: number = 0.5 * t3 - 0.5 * t2;
      out.push({
        x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
        y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
      });
    }
  }
  let area: number = 0;
  for (let k: number = 0; k < out.length; ++k) {
    const a = out[k]!;
    const b = out[(k + 1) % out.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return { type: "polygon", points: area >= 0 ? out : out.reverse() };
};

/** The unit quaternion of the rotation whose matrix columns are `x`, `y`, `z`. */
const quaternionOf = (
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const trace: number = x.x + y.y + z.z;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return {
      w: s / 4,
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
    };
  }
  if (x.x > y.y && x.x > z.z) {
    const s: number = Math.sqrt(1 + x.x - y.y - z.z) * 2;
    return {
      w: (y.z - z.y) / s,
      x: s / 4,
      y: (y.x + x.y) / s,
      z: (z.x + x.z) / s,
    };
  }
  if (y.y > z.z) {
    const s: number = Math.sqrt(1 + y.y - x.x - z.z) * 2;
    return {
      w: (z.x - x.z) / s,
      x: (y.x + x.y) / s,
      y: s / 4,
      z: (z.y + y.z) / s,
    };
  }
  const s: number = Math.sqrt(1 + z.z - x.x - y.y) * 2;
  return {
    w: (x.y - y.x) / s,
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: s / 4,
  };
};
