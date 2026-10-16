import {
  IAutoMovieSurfaceCage, IAutoMovieSurfaceCoordinate, IAutoMovieSurfaceNetwork,
  IAutoMovieSweep, IAutoMovieSweepSection, IAutoMovieSweepSurface,
  compileAutoMovieSweep, layoutAutoMovieSurfaceTransition, sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { planAutoMovieHumanNeckCut } from "../../junction/planAutoMovieHumanNeckCut";
import { sweepAutoMovieHumanNeckCollar } from "../../junction/sweepAutoMovieHumanNeckCollar";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";

/**
 * Continue the oblique neck base into the shared perpendicular collar.
 *
 * Six semantic rows retain the published chart and column transitions. The
 * first five span the base-to-support source; the last uses an independent
 * straight collar. Its pinned raw controls are the shared cut translated by
 * the same support distance as on the head, with opposite sign. The physical
 * circumference proxy plane lies above this part and is fitted by the head.
 * Coons edges share source nodes across the two sweeps at the support row.
 *
 * @param props Shared base, cut and its geometric partition plan
 * @returns The sampled cage and construction, model millimetres
 */
export function loftAutoMovieHumanNeck(props: {
  base: IAutoMovieHumanRingShape;
  top: IAutoMovieHumanRingShape;
  plan: ReturnType<typeof planAutoMovieHumanNeckCut>;
}): IAutoMovieHumanCage {
  const {base, top, plan}: { base: IAutoMovieHumanRingShape; top: IAutoMovieHumanRingShape; plan: ReturnType<typeof planAutoMovieHumanNeckCut>; } = props;
  const support: IAutoMovieVector3[] = top.positions.map(
    (p: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieHumanVector.offset(p, [plan.axis, -plan.support]),
  );
  const supportOrigin: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    top.frame.origin, [plan.axis, -plan.support]);
  const stations: IStation[] = [
    plane(base.frame.origin, base.frame.normal, plan.axis, base.positions),
    plane(supportOrigin, plan.axis, plan.axis, support),
  ];
  const shares: number[] = chordShares(stations.map((s: IStation): IAutoMovieVector3 => s.origin));
  const sweep: IAutoMovieSweep = {
    spine: {points: stations.map((s: IStation): IAutoMovieVector3 => toMetres(s.origin)), normal: stations[0]!.x},
    stations: stations.map((s: IStation, i: number): IAutoMovieSweep.IStation => ({
      at: shares[i]!, section: s.section,
      rotation: quaternionFromAutoMovieBasis(s.x, AutoMovieHumanVector.cross(s.normal, s.x), s.normal),
    })),
  };
  const collar: IAutoMovieSweep = sweepAutoMovieHumanNeckCollar({ring: top, plan, side: "neck"});
  const surfaces: Record<string, IAutoMovieSweepSurface> = {
    neck: compileAutoMovieSweep(sweep), neckCollar: compileAutoMovieSweep(collar),
  };
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const rings: IAutoMovieSurfaceNetwork.IRing[] = [];
  const network: IAutoMovieSurfaceNetwork = {
    sweeps: {neck: sweep, neckCollar: collar}, nodes, curves, patches, rings,
  };
  // Addresses name source samples, not absolute skin coordinates. The same
  // declared row corner is reused by its incident neck bands and ring.
  const point: (sweep: "neck" | "neckCollar", u: number, v: number, domain: { u: number; v: number; }) => IPoint = (sweep: "neck" | "neckCollar", u: number, v: number,
    domain: {u: number; v: number}): IPoint => {
    const wrapped: number = ((v % 1) + 1) % 1;
    const key: string = `${sweep}.${u.toFixed(9)}.${wrapped.toFixed(9)}`;
    nodes[key] ??= {type: "sweep", sweep, u, v: wrapped};
    return {key, sweep, u, v: wrapped, domain};
  };
  const edge: (a: IPoint, b: IPoint) => IAutoMovieSurfaceNetwork.IEdge = (a: IPoint, b: IPoint): IAutoMovieSurfaceNetwork.IEdge => {
    const from: string = `${a.key}>${b.key}`;
    const reverse: string = `${b.key}>${a.key}`;
    if (curves[reverse] !== undefined) return {type: "curve", curve: reverse, reverse: true};
    curves[from] ??= {from: a.key, to: b.key, segments: ONE};
    return {type: "curve", curve: from};
  };
  const rows: IPoint[][] = Array.from(
    {length: ROWS + 1}, (_: unknown, r: number): IPoint[] => {
      const count: number = r === 0 ? base.count : r === 1 ? MIDDLE : top.count;
      return Array.from({length: count}, (_: unknown, j: number): IPoint =>
        point(r < ROWS - 1 ? "neck" : "neckCollar",
          r < ROWS - 1 ? r / (ROWS - 1) : r - (ROWS - 1), j / count, {u: r / ROWS, v: j / count}));
    },
  );
  const domains: Array<Array<{u: number; v: number}>> = [];
  const quad: (points: IPoint[]) => void = (points: IPoint[]): void => {
    const v0: number = points[0]!.domain.v;
    const uv: Array<{u: number; v: number}> = points.map((p: IPoint): {u: number; v: number} =>
      ({u: p.domain.u, v: p.domain.v + Math.round(v0 - p.domain.v)}));
    const turn: number = Math.floor(Math.min(...uv.map((p: {u: number; v: number}): number => p.v)));
    for (const point of uv) point.v -= turn;
    let area: number = 0;
    for (let k: number = 0; k < 4; ++k) area += uv[k]!.v * uv[(k+1)%4]!.u - uv[(k+1)%4]!.v * uv[k]!.u;
    const order: number[] = area >= 0 ? [0,1,2,3] : [0,3,2,1];
    const corners: IPoint[] = order.map((i: number): IPoint => points[i]!);
    patches.push({type: "coons", name: `neck.${patches.length}`, sides: [
      edge(corners[0]!, corners[1]!), edge(corners[1]!, corners[2]!),
      edge(corners[2]!, corners[3]!), edge(corners[3]!, corners[0]!),
    ]});
    domains.push(order.map((i: number): {u: number; v: number} => uv[i]!));
  };
  for (let r: number = 0; r < ROWS; ++r) {
    const a: IPoint[] = rows[r]!;
    const b: IPoint[] = rows[r+1]!;
    if (a.length === b.length)
      for (let k: number = 0; k < a.length; ++k)
        quad([a[k]!, a[(k+1)%a.length]!, b[(k+1)%b.length]!, b[k]!]);
    else {
      const corner: (c: { s: number; t: number; }) => IPoint = (c: {s: number; t: number}): IPoint => {
        if (c.t === 0) return a[Math.round(c.s * a.length) % a.length]!;
        if (c.t === 1) return b[Math.round(c.s * b.length) % b.length]!;
        return point("neck", (r+c.t)/(ROWS-1), c.s, {u:(r+c.t)/ROWS,v:c.s});
      };
      for (const q of layoutAutoMovieSurfaceTransition(a.length,b.length,1))
        quad(q.map(corner));
    }
  }
  // Ring order is the shared definition's order, chosen by a cyclic isometry.
  const ring: (name: string, row: number, positions: IAutoMovieVector3[]) => void = (name: string, row: number, positions: IAutoMovieVector3[]): void => {
    const loop: IPoint[] = rows[row]!;
    const at: IAutoMovieVector3[] = loop.map((p: IPoint): IAutoMovieVector3 => {
      const q: IAutoMovieVector3 = surfaces[p.sweep ?? "neck"]!.point(p.u,p.v);
      return AutoMovieHumanVector.of(q.x*1000,q.y*1000,q.z*1000);
    });
    let best: {order: number[]; cost: number} = {order:[],cost:Infinity};
    for (const sign of [1,-1]) for(let first: number = 0; first < loop.length; ++first) {
      const order: number[] = loop.map((_: IPoint,k: number): number => ((first+sign*k)%loop.length+loop.length)%loop.length);
      const cost: number = order.reduce((sum: number,index: number,k: number): number => sum+AutoMovieHumanVector.distance(at[index]!,positions[k]!)**2,0);
      if(cost < best.cost) best={order,cost};
    }
    const ordered: IPoint[] = best.order.map((k: number): IPoint => loop[k]!);
    rings.push({name, edges: ordered.map((p: IPoint, k: number): IAutoMovieSurfaceNetwork.IEdge =>
      edge(p, ordered[(k + 1) % ordered.length]!)), positions: positions.map(toMetres)});
  };
  ring("neckBase",0,base.positions);
  ring("neckTopCollar",ROWS-1,support);
  ring("neckTop",ROWS,top.positions);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({network,tier:"medium"});
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for(let i: number = 0; i < sampled.cage.positions.length; i += 3)
    vertices.push({position: AutoMovieHumanVector.of(sampled.cage.positions[i]!*1000,sampled.cage.positions[i+1]!*1000,sampled.cage.positions[i+2]!*1000)});
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map((face: number[], f: number): IAutoMovieHumanCage.IFace => ({
    vertices: [face[0]!,face[1]!,face[2]!,face[3]!],
    coordinates: sampled.corners[f]!.map((c: IAutoMovieSurfaceCoordinate): IAutoMovieHumanSurfaceCoordinate.IOn<"neck"> => {
      const uv: Array<{u:number;v:number}> = domains[c.patch]!;
      const weights: number[] = [(1-c.s)*(1-c.t), c.s*(1-c.t), c.s*c.t, (1-c.s)*c.t];
      return {part:"neck",side:null,u:uv.reduce((sum:number,p:{u:number;v:number},i:number):number=>sum+p.u*weights[i]!,0),v:uv.reduce((sum:number,p:{u:number;v:number},i:number):number=>sum+p.v*weights[i]!,0)};
    }) as IAutoMovieHumanCage.IFace["coordinates"],
  }));
  const boundary: (name: string, shape: IAutoMovieHumanRingShape) => IAutoMovieHumanCage["rings"][number] = (name: string, shape: IAutoMovieHumanRingShape): IAutoMovieHumanCage["rings"][number] => ({
    site:shape.site,side:shape.side,vertices:sampled.rings[name]!,start:shape.start,frame:shape.frame,
  });
  return {vertices,faces,creases:[],rings:[boundary("neckBase",base),boundary("neckTop",top)],construction:IAutoMovieHumanCage.inModel(network)};
}

interface IStation {
  origin: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  x: IAutoMovieVector3;
  section: IAutoMovieSweepSection;
}

/** Rows of the neck between its rings. */
const ROWS: number = 6;

/** Columns between the two transition bands: at least three fifths of the finer count on either side, 28 and 18, so neither band sets two reduction blocks side by side in a valence-six pole. */
const MIDDLE: number = 18;

const toMetres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** A plane whose first axis is the anterior direction within it, the spine running up the neck. */
const axesOf: (origin: IAutoMovieVector3, normal: IAutoMovieVector3, up: IAutoMovieVector3) => { origin: IAutoMovieVector3; normal: IAutoMovieVector3; x: IAutoMovieVector3; y: IAutoMovieVector3; } = (
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
const plane: (origin: IAutoMovieVector3, normal: IAutoMovieVector3, up: IAutoMovieVector3, points: IAutoMovieVector3[]) => IStation = (
  origin: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  up: IAutoMovieVector3,
  points: IAutoMovieVector3[],
): IStation => {
  const ax: { origin: IAutoMovieVector3; normal: IAutoMovieVector3; x: IAutoMovieVector3; y: IAutoMovieVector3; } = axesOf(origin, normal, up);
  const flat: Array<{ x: number; y: number }> = points.map(
    (p: IAutoMovieVector3): { x: number; y: number; } => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [origin, -1]);
      return {
        x: AutoMovieHumanVector.dot(d, ax.x) / 1000,
        y: AutoMovieHumanVector.dot(d, ax.y) / 1000,
      };
    },
  );
  let area: number = 0;
  for (let k: number = 0; k < flat.length; ++k)
    area += flat[k]!.x * flat[(k + 1) % flat.length]!.y - flat[(k + 1) % flat.length]!.x * flat[k]!.y;
  return { origin, normal: ax.normal, x: ax.x,
    section: {type: "bspline", points: area >= 0 ? flat : flat.reverse()} };
};

/** Each point's share of the polyline's chord length. */
const chordShares: (points: IAutoMovieVector3[]) => number[] = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(
      lengths[k - 1]! +
        AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

/** One authored quad per named neck patch at every cage tier. */
const ONE: IAutoMovieSurfaceNetwork.ICounts = {lowest: 1, low: 1, medium: 1, high: 1};

/** A neck-row sample on one of the two named construction sweeps. */
interface IPoint {
  key: string;
  sweep: "neck" | "neckCollar";
  u: number;
  v: number;
  domain: {u: number; v: number};
}
