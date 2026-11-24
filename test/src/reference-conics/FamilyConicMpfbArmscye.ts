import {
  AutoMovieMeshExtract, AutoMovieSolidVector as V, pointSegmentDistance,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanJoinLoop, AutoMovieHumanLandmarkSurface } from "@automovie/human";
import type { AutoMovieVector2Tuple as P, IAutoMovieMeshSectionFrame } from "@automovie/interface";
import { writeFile } from "node:fs/promises";
import { basename } from "node:path";

import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import type { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";

type Point = Mpfb.Point;
type Outline = ReturnType<typeof AutoMovieMeshExtract.prepareOutline>;
type Master = ReturnType<typeof AutoMovieHumanJoinLoop.master>;

/** Locate the left shoulder seam independently on the pinned HM08 skin. */
export namespace FamilyConicMpfbArmscye {
  /** Source-derived skin and rig anchors in the HM08 figure frame, millimetres. */
  export interface IMeasurement {
    /** Superior point of the skin on the shoulder marker's sagittal plane. */
    cap: Point;
    /** Anterior turn of the first fused trunk and arm contour. */
    front: Point;
    /** Posterior turn of the first fused trunk and arm contour. */
    back: Point;
    /** Saddle point between the closest separated contours. */
    apex: Point;
    /** Published upper-arm origin marker. */
    shoulder: Point;
    /** Published lower-arm origin marker. */
    elbow: Point;
    /** Separated and connected horizontal cuts bracketing the axillary saddle. */
    stationBracket: [number, number];
    /** The distance across the two separate contours at the lower cut. */
    opening: number;
    /** The selected connected neck spans one half-depth of the separate arm. */
    foldDepth: number;
    /** The signed outline turns at the front and back neck of the branch. */
    turns: [number, number];
  }

  /** Raw public seam cut and its radial-chart readings. */
  export interface IGuide {
    /** Successive millimetre positions on the closed source contour. */
    points: Point[];
    /** Cross tangent per segment, from its own outward facet normal and chord. */
    crossTangents: Point[];
    /** Distances in millimetres from cap, front, back and apex to the contour chords. */
    landmarkGaps: number[];
    /** Maximum absolute divider residual at the enumerated chord midpoints, in millimetres. */
    midpointResidual: number;
    /** Signed number of child azimuth turns about the humeral course. */
    winding: number;
    /** Number of angular steps opposite the contour orientation. */
    reversedSteps: number;
    /** Number of segments whose outward facet normal fails positive radial incidence. */
    reversedNormals: number;
    /** Child station, azimuth and radial incidence of every reversed segment. */
    reversedLocations: { station: number; phase: number; incidence: number }[];
    /** Least dot product of the outward facet normal and the child's radial direction. */
    minimumIncidence: number;
    /** Minimum and maximum child stations in millimetres along the source seam. */
    stations: [number, number];
  }

  const LEVEL: IAutoMovieMeshSectionFrame = {
    origin: [0, 0, 0], axes: [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
  };
  const SAGITTAL: IAutoMovieMeshSectionFrame = {
    origin: [0, 0, 0], axes: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  };

  /**
   * Find the topology change of the actual horizontal body contours. Just
   * above that bracket, the neck between the trunk and arm has an anterior
   * and a posterior turn. Their separating line is the common normal of the
   * facing contours immediately below the bracket.
   *
   * @see https://mewangcl.github.io/pubs/CADParaHuman.pdf#page=8
   * @evidence contracts/development/implementation.md#principled-implementation Two closed sections bracket the underarm branch, with front and back read at the waist of the connected section.
   * @evidence contracts/development/implementation.md#efficient-algorithms One prepared triangle section reader precedes a binary station search. Only the two facing contours in the final separated cut are compared.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a missing contour, ambiguous topology and an unbracketed cut. No private mesh, stored armpit coordinate or old conic family enters.
   */
  export function measure(source: Mpfb.IGeometry): IMeasurement {
    const landmark = (name: string): Point => {
      const point: Point | undefined = source.joints.get(name);
      if (point === undefined) throw new Error("The HM08 skin has no " + name);
      return point;
    };
    const shoulder: Point = landmark("joint-l-shoulder"), elbow: Point = landmark("joint-l-elbow");
    const pelvis: Point = landmark("joint-pelvis"), neck: Point = landmark("joint-neck");
    const query: Outline = AutoMovieMeshExtract.prepareOutline(source.body);
    const cut = (station: number) => {
      const arm: P = inLevel(shoulder, elbow, station);
      const trunk: P = inLevel(pelvis, neck, station);
      const loops: P[][] = outlines(query, LEVEL, station);
      const host: P[] | undefined = loops.find((loop): boolean => inside(loop, trunk));
      const child: P[] | undefined = loops.find((loop): boolean => inside(loop, arm));
      if (host === undefined || child === undefined)
        throw new Error("HM08 does not enclose its trunk and upper-arm axes on level " + station + " mm");
      return { host, child, connected: host === child };
    };
    let low: number = elbow[1], high: number = shoulder[1];
    let separate = cut(low), joined = cut(high);
    if (separate.connected || !joined.connected) throw new Error("The HM08 skin has no bracketed axillary branch");
    // One micrometre of height resolves an individual triangle interval while
    // keeping the cut well above the section reader's floating-point spacing.
    const tolerance: number = 0.001;
    while (high - low > tolerance) {
      const y: number = (low + high) / 2;
      const next = cut(y);
      if (next.connected) [high, joined] = [y, next];
      else [low, separate] = [y, next];
    }

    const [nearHost, nearChild] = closest(separate.host, separate.child);
    const dx: number = nearChild[0] - nearHost[0], dz: number = nearChild[1] - nearHost[1];
    const opening: number = Math.hypot(dx, dz);
    if (!(opening > 0)) throw new Error("The HM08 axillary contours have no separated germ");
    const centre: P = [(nearHost[0] + nearChild[0]) / 2, (nearHost[1] + nearChild[1]) / 2];
    const gate: P = [dx / opening, dz / opening];
    const folds = (loop: P[]) => {
      const [a, b] = around(crossLine([loop], centre, gate));
      if (a === undefined || b === undefined)
        throw new Error("The connected axillary section has no front and back fold crossings");
      const [back, front] = a.point[0] < b.point[0] ? [a, b] : [b, a];
      return { front, back, span: b.offset - a.offset };
    };
    const saddle = folds(joined.host);
    const depth: number[] = separate.child.map(([x, z]): number => gate[0] * z - gate[1] * x);
    const foldDepth: number = (Math.max(...depth) - Math.min(...depth)) / 2;
    // ESTIMATE: rise only until the conjoined neck is one observed arm
    // semidepth across. The first pinched cut gives the apex, and the
    // measured arm scale separates the anterior and posterior fold anchors.
    let foldLow: number = high, foldHigh: number = shoulder[1];
    let foldLoop = cut(foldHigh).host;
    let fold = folds(foldLoop);
    if (!(saddle.span < foldDepth && foldDepth <= fold.span))
      throw new Error("The observed arm semidepth does not bracket the two HM08 fold anchors");
    while (foldHigh - foldLow > tolerance) {
      const y: number = (foldLow + foldHigh) / 2;
      const nextLoop = cut(y).host;
      const next = folds(nextLoop);
      if (next.span < foldDepth) foldLow = y;
      else [foldHigh, fold, foldLoop] = [y, next, nextLoop];
    }
    const front = turnNear(foldLoop, fold.front, centre, gate, foldDepth);
    const back = turnNear(foldLoop, fold.back, centre, gate, foldDepth);
    const rise = crossLine(outlines(query, SAGITTAL, shoulder[2]), [shoulder[0], shoulder[1]], [1, 0]);
    const superior = rise.filter(({ offset }): boolean => offset > 0).sort((a, b): number => a.offset - b.offset)[0];
    if (superior === undefined) throw new Error("The HM08 shoulder marker has no superior skin crossing");
    return {
      cap: [superior.point[0], superior.point[1], shoulder[2]],
      front: [front.point[0], foldHigh, front.point[1]],
      back: [back.point[0], foldHigh, back.point[1]],
      apex: [(saddle.front.point[0] + saddle.back.point[0]) / 2, (low + high) / 2,
        (saddle.front.point[1] + saddle.back.point[1]) / 2],
      shoulder, elbow, stationBracket: [low, high], opening, foldDepth,
      turns: [front.turn, back.turn],
    };
  }

  /** Prepare the divider and Wang's cross tangent for an analytic parent seam. */
  export function divider(result: IMeasurement): AutoMovieHumanLandmarkSurface.ISurface {
    return AutoMovieHumanLandmarkSurface.create(result.shoulder,
      [result.cap, result.front, result.back, result.apex], result.elbow);
  }

  /** Wang §4.1, equation 4. The host's normal and seam tangent give the cross tangent. */
  export function crossTangent(master: Pick<Master, "at" | "normal">): (clock: number) => Point {
    return (clock: number): Point => {
      const tangent: Point = master.at(clock).first;
      const cross: Point = V.cross(master.normal(clock), tangent);
      if (!cross.every(Number.isFinite) || !(V.norm(cross) > 0))
        throw new Error("The public armscye has no cross tangent at clock " + clock);
      return cross;
    };
  }

  /**
   * Cut the public triangles by the measured divider and inspect the radial
   * chart of the upper-arm shaft. This source guide bounds a subsequent fit.
   * The signed values are evaluated at triangle corners and each crossing
   * edge is bisected on the physical divider. Each chord within a triangle
   * is refined along its own face until the divider residual is within one
   * micrometre at its midpoint.
   *
   * @see https://vtk.org/doc/nightly/html/classvtkCutter.html
   */
  export function guide(source: Mpfb.IGeometry, geometry: IMeasurement, normals?: Subdivision.INormalField): IGuide {
    const side = divider(geometry).side;
    const anchors: Point[] = [geometry.cap, geometry.front, geometry.back, geometry.apex];
    const loops = skinLoops(source, side, normals);
    const attempts = loops.map((loop) => {
      // Complete chord distance, including landmarks inside a facet.
      const vector = ([x, y, z]: Point) => ({ x, y, z });
      const gaps: number[] = anchors.map((p): number => Math.min(...loop.map(({ point }, i): number =>
        pointSegmentDistance(vector(p), vector(point), vector(loop[(i + 1) % loop.length]!.point)))));
      return { loop, gaps, worst: Math.max(...gaps) };
    }).sort((a, b): number => a.worst - b.worst);
    const selected = attempts[0];
    if (selected === undefined) throw new Error("The HM08 divider has no closed skin component");
    const axis = AutoMovieHumanConicLoft.axis({ centres: [geometry.shoulder, geometry.elbow], halves: [], up: [1, 0, 0] });
    const { u, v, origin } = axis.at(0);
    const shaft: Point = V.cross(v, u);
    const address = (p: Point) => {
      const q: Point = V.sub(p, origin);
      const station: number = V.dot(q, shaft);
      return { station, phase: Math.atan2(V.dot(q, v), V.dot(q, u)), ray: V.sub(q, V.scale(shaft, station)) };
    };
    const directed = (addresses: readonly ReturnType<typeof address>[]): number[] => addresses.map(({ phase }, i): number => {
      const d: number = addresses[(i + 1) % addresses.length]!.phase - phase;
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    let walk: CutNode[] = selected.loop;
    const addresses = walk.map(({ point }) => address(point));
    let steps: number[] = directed(addresses);
    let winding: number = Math.round(steps.reduce((sum, x): number => sum + x, 0) / (2 * Math.PI));
    if (winding === -1) {
      // Triangle traversal has no anatomical direction. Reverse each edge with the same owning face normal.
      const count: number = walk.length;
      const previous: CutNode[] = walk;
      walk = previous.map((_, i): CutNode => ({ point: previous[count - 1 - i]!.point, normal: previous[(2 * count - 2 - i) % count]!.normal }));
      addresses.reverse();
      steps = directed(addresses);
      winding = 1;
    }
    const points: Point[] = walk.map(({ point }): Point => point);
    const crosses: Point[] = [], incidences: number[] = [], residuals: number[] = [];
    const reversedLocations: IGuide["reversedLocations"] = [];
    walk.forEach(({ point, normal }, i): void => {
      const j: number = (i + 1) % points.length;
      const after: Point = points[j]!;
      const midpoint: Point = V.scale(V.add(point, after), 1 / 2);
      const e: Point | null = V.unit(V.add(addresses[i]!.ray, addresses[j]!.ray));
      if (e === null) throw new Error("The HM08 seam crosses its child course");
      crosses.push(V.cross(normal, V.sub(after, point)));
      const incidence: number = V.dot(normal, e);
      incidences.push(incidence);
      if (incidence <= 0) reversedLocations.push({ station: V.dot(V.sub(midpoint, origin), shaft),
        phase: Math.atan2(V.dot(e, v), V.dot(e, u)), incidence });
      residuals.push(Math.abs(side(midpoint)));
    });
    const stations: number[] = addresses.map(({ station }): number => station);
    return { points, crossTangents: crosses, landmarkGaps: selected.gaps,
      midpointResidual: Math.max(...residuals), winding,
      reversedSteps: steps.filter((d): boolean => winding * d <= 0).length,
      reversedNormals: incidences.filter((a): boolean => a <= 0).length,
      reversedLocations, minimumIncidence: Math.min(...incidences), stations: [Math.min(...stations), Math.max(...stations)] };
  }

  /** Measure the pinned public contour and write its provenance and chart diagnostics. */
  export async function main(): Promise<void> {
    const mesh = process.argv.find((arg): boolean => arg.startsWith("--mesh="))?.slice(7);
    const out = process.argv.find((arg): boolean => arg.startsWith("--out="))?.slice(6);
    const source = await Mpfb.load(mesh);
    const start: number = performance.now();
    const geometry = measure(source);
    const split = divider(geometry);
    const landmarkErrors: number[] = [geometry.cap, geometry.front, geometry.back, geometry.apex].map((p): number => split.side(p));
    const seam = guide(source, geometry);
    const report = JSON.stringify({ source: source.source, geometry, landmarkErrors, seam,
      elapsedMs: performance.now() - start }, null, 2) + "\n";
    if (out === undefined) process.stdout.write(report);
    else await writeFile(out, report);
  }
}

function inLevel(a: Point, b: Point, y: number): P {
  const t: number = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), a[2] + t * (b[2] - a[2])];
}

function outlines(query: Outline, frame: IAutoMovieMeshSectionFrame, station: number): P[][] {
  const cut = query(frame, [station], 0, 0, 0)[0]!;
  return cut.outer.filter((loop): boolean => loop.closed).map((loop): P[] => loop.points);
}

function inside(loop: readonly P[], [x, y]: P): boolean {
  let contained: boolean = false;
  for (let i: number = 0; i < loop.length; ++i) {
    const [a, b]: P = loop[i]!, [u, v]: P = loop[(i + 1) % loop.length]!;
    if ((b > y) !== (v > y) && x < a + (u - a) * (y - b) / (v - b)) contained = !contained;
  }
  return contained;
}

function project(p: P, a: P, b: P): P {
  const dx: number = b[0] - a[0], dy: number = b[1] - a[1];
  const length: number = dx * dx + dy * dy;
  const t: number = length === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length));
  return [a[0] + t * dx, a[1] + t * dy];
}

/** The closest pair of two separate polygonal contours lies at a vertex and an opposite edge. */
function closest(a: readonly P[], b: readonly P[]): [P, P] {
  let gap: number = Infinity;
  let pair: [P, P] = [a[0]!, b[0]!];
  for (const [points, edges, sense] of [[a, b, true], [b, a, false]] as const)
    for (const p of points)
      for (let j: number = 0; j < edges.length; ++j) {
        const q: P = project(p, edges[j]!, edges[(j + 1) % edges.length]!);
        const d: number = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
        if (d >= gap) continue;
        gap = d;
        pair = sense ? [p, q] : [q, p];
      }
  return pair;
}

type Crossing = { point: P; offset: number };

function crossLine(loops: readonly P[][], centre: P, normal: P): Crossing[] {
  const [nx, ny]: P = normal;
  const distance = ([u, v]: P): number => (u - centre[0]) * nx + (v - centre[1]) * ny;
  return loops.flatMap((loop): Crossing[] => loop.flatMap((a, i): Crossing[] => {
    const b: P = loop[(i + 1) % loop.length]!;
    const da: number = distance(a), db: number = distance(b);
    if ((da > 0) === (db > 0)) return [];
    const t: number = da / (da - db);
    const point: P = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    return [{ point, offset: nx * (point[1] - centre[1]) - ny * (point[0] - centre[0]) }];
  }));
}

/** Pick the two contour crossings that enclose the facing walls' previous gap. */
function around(crossings: readonly Crossing[]): [Crossing | undefined, Crossing | undefined] {
  const rear = crossings.filter(({ offset }): boolean => offset <= 0).sort((a, b): number => b.offset - a.offset)[0];
  const fore = crossings.filter(({ offset }): boolean => offset >= 0).sort((a, b): number => a.offset - b.offset)[0];
  return [rear, fore];
}

/** Find the concave turn near one gate crossing on its own facing contour. */
function turnNear(loop: readonly P[], gate: Crossing, centre: P, normal: P, depth: number): { point: P; turn: number } {
  const size: number = loop.length;
  const area: number = loop.reduce((sum, p, i): number => {
    const q: P = loop[(i + 1) % size]!;
    return sum + p[0] * q[1] - p[1] * q[0];
  }, 0);
  const orientation: number = Math.sign(area);
  // ESTIMATE: a quarter of the arm semidepth spans several triangulated
  // edges near the fold while staying local to the same connected neck.
  const chord: number = depth / 4;
  const toward = (start: number, sign: -1 | 1): P => {
    let distance: number = 0;
    for (let k: number = 0; k < size; ++k) {
      const a: P = loop[((start + sign * k) % size + size) % size]!;
      const b: P = loop[((start + sign * (k + 1)) % size + size) % size]!;
      const step: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (step > 0 && distance + step >= chord) {
        const t: number = (chord - distance) / step;
        return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
      }
      distance += step;
    }
    throw new Error("The local HM08 fold chord leaves its closed section");
  };
  const choices = loop.flatMap((p, i): { point: P; turn: number }[] => {
    const offset: number = normal[0] * (p[1] - centre[1]) - normal[1] * (p[0] - centre[0]);
    if (!(offset * gate.offset > 0) || Math.hypot(p[0] - gate.point[0], p[1] - gate.point[1]) > depth) return [];
    const a: P = toward(i, -1), b: P = toward(i, 1);
    const u: P = [p[0] - a[0], p[1] - a[1]], v: P = [b[0] - p[0], b[1] - p[1]];
    return [{ point: p, turn: -orientation * Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]) }];
  });
  const best = choices.sort((a, b): number => b.turn - a.turn)[0];
  if (best === undefined || !(best.turn > 0)) throw new Error("The HM08 gate has no adjacent concave fold turn");
  return best;
}

type CutNode = { point: Point; normal: Point };
type CrossingEdge = { a: number; b: number; node: number; face: number };
type Triangle = [Point, Point, Point];

/** A marching-triangles adjacency on source edge indices, with no geometric welding. */
function skinLoops(source: Mpfb.IGeometry, field: (p: Point) => number, normals?: Subdivision.INormalField): CutNode[][] {
  const { positions, indices } = source.body;
  if (normals !== undefined && normals.indices.length !== indices.length)
    throw new Error("HM08 limit normals must address every triangle corner");
  const points: Point[] = Array.from({ length: positions.length / 3 }, (_, i): Point =>
    [positions[3 * i]!, positions[3 * i + 1]!, positions[3 * i + 2]!]);
  const values: number[] = points.map(field);
  if (!values.every(Number.isFinite)) throw new Error("The HM08 divider is undefined on a skin vertex");
  const boundaries: CrossingEdge[] = [];
  const triangles: { cuts: CrossingEdge[]; normal: Point; corners: Triangle; readNormal: (p: Point) => Point }[] = [];
  for (let i: number = 0; i < indices.length; i += 3) {
    const [p, q, r] = [indices[i]!, indices[i + 1]!, indices[i + 2]!];
    const cuts: CrossingEdge[] = ([[p, q], [q, r], [r, p]] as [number, number][]).flatMap(([u, v]): CrossingEdge[] => {
      if ((values[u]! > 0) === (values[v]! > 0)) return [];
      return [{ a: Math.min(u, v), b: Math.max(u, v), node: -1, face: triangles.length }];
    });
    if (cuts.length === 0) continue;
    const normal = V.unit(V.cross(V.sub(points[q]!, points[p]!), V.sub(points[r]!, points[p]!)));
    if (cuts.length !== 2 || normal === null) throw new Error("The divider cuts a degenerate HM08 triangle");
    const corners: Triangle = [points[p]!, points[q]!, points[r]!];
    const readNormal = normals === undefined ? (): Point => normal : faceNormal(corners, normal, normals, i);
    triangles.push({ cuts, normal, corners, readNormal });
    boundaries.push(...cuts);
  }
  boundaries.sort((a, b): number => a.a - b.a || a.b - b.b);
  const nodes: { point: Point; parts: number[] }[] = [];
  let previous: CrossingEdge | undefined;
  for (const vertex of boundaries) {
    if (previous?.a !== vertex.a || previous.b !== vertex.b) {
      let lo: Point = points[vertex.a]!, hi: Point = points[vertex.b]!;
      const positive: boolean = values[vertex.a]! > 0;
      // This geometric bisection resolves the triangle edge to a nanometre.
      while (V.norm(V.sub(hi, lo)) > 1e-6) {
        const middle: Point = V.scale(V.add(lo, hi), 1 / 2);
        if ((field(middle) > 0) === positive) lo = middle;
        else hi = middle;
      }
      nodes.push({ point: V.scale(V.add(lo, hi), 1 / 2), parts: [] });
    }
    vertex.node = nodes.length - 1;
    nodes.at(-1)!.parts.push(vertex.face);
    previous = vertex;
  }

  const used: Uint8Array = new Uint8Array(triangles.length);
  const closed: CutNode[][] = [];
  for (let i: number = 0; i < triangles.length; ++i) {
    if (used[i] !== 0) continue;
    const loop: CutNode[] = [];
    const start: number = triangles[i]!.cuts[0]!.node;
    let node: number = start, face: number = i;
    while (used[face] === 0) {
      used[face] = 1;
      const { cuts, normal, corners, readNormal } = triangles[face]!;
      const end: number = cuts.find((cut): boolean => cut.node !== node)!.node;
      loop.push(...refine(nodes[node]!.point, nodes[end]!.point, corners, normal, field, readNormal));
      node = end;
      if (node === start && nodes[node]!.parts.length === 2) { closed.push(loop); break; }
      const parts: number[] = nodes[node]!.parts;
      if (parts.length !== 2) break;
      face = parts.find((candidate): boolean => candidate !== face)!;
    }
  }
  return closed;
}

/** Prepare barycentric interpolation of the evaluated limit normals at a sample triangle's corners. */
function faceNormal(corners: Triangle, facet: Point, normals: Subdivision.INormalField, offset: number): (point: Point) => Point {
  const [a, b, c]: Triangle = corners;
  const u: Point = V.sub(b, a), v: Point = V.sub(c, a);
  const area: number = V.dot(V.cross(u, v), facet);
  const samples: Point[] = [0, 1, 2].map((k): Point => {
    const at: number = 3 * normals.indices[offset + k]!;
    return [normals.values[at]!, normals.values[at + 1]!, normals.values[at + 2]!];
  });
  return (point: Point): Point => {
    const q: Point = V.sub(point, a);
    const s: number = V.dot(V.cross(q, v), facet) / area;
    const t: number = V.dot(V.cross(u, q), facet) / area;
    const normal: Point | null = V.unit(V.combine([[1 - s - t, samples[0]!], [s, samples[1]!], [t, samples[2]!]]));
    if (normal === null || !(V.dot(normal, facet) > 0))
      throw new Error("An interpolated limit normal reverses its HM08 sample facet");
    return normal;
  };
}

/** Continue the divider inside a face by cutting across each chord's midpoint. */
function refine(a: Point, b: Point, corners: Triangle, normal: Point, field: (p: Point) => number, readNormal: (p: Point) => Point): CutNode[] {
  const tolerance: number = 0.001;
  const nodes: CutNode[] = [];
  const pending: [Point, Point][] = [[a, b]];
  while (pending.length > 0) {
    const [p, q] = pending.pop()!;
    const middle: Point = V.scale(V.add(p, q), 1 / 2);
    if (Math.abs(field(middle)) <= tolerance) { nodes.push({ point: p, normal: readNormal(middle) }); continue; }
    const across: Point | null = V.unit(V.cross(normal, V.sub(q, p)));
    if (across === null || V.norm(V.sub(q, p)) <= tolerance)
      throw new Error("The HM08 divider does not converge inside its source facet");
    let lo: number = -Infinity, hi: number = Infinity;
    for (let i: number = 0; i < 3; ++i) {
      const start: Point = corners[i]!, v: Point = V.sub(corners[(i + 1) % 3]!, start);
      const initial: number = V.dot(V.cross(v, V.sub(middle, start)), normal);
      const rate: number = V.dot(V.cross(v, across), normal);
      if (rate > 0) lo = Math.max(lo, -initial / rate);
      if (rate < 0) hi = Math.min(hi, -initial / rate);
    }
    const at = (x: number): Point => V.add(middle, V.scale(across, x));
    const positive: boolean = field(at(lo)) > 0;
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || positive === field(at(hi)) > 0)
      throw new Error("The HM08 divider leaves its facet between two crossings");
    while (hi - lo > 1e-6) {
      const t: number = (lo + hi) / 2;
      if ((field(at(t)) > 0) === positive) lo = t;
      else hi = t;
    }
    const intersection: Point = at((lo + hi) / 2);
    pending.push([intersection, q], [p, intersection]);
  }
  return nodes;
}

// CommonJS bundles share require.main with their imported source modules.
if (require.main === module && /^FamilyConicMpfbArmscye\.[cm]?[jt]s$/u.test(basename(process.argv[1] ?? "")))
  void FamilyConicMpfbArmscye.main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
