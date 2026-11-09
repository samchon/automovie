import { AutoMovieLoftChain, AutoMovieLoftRelief, AutoMovieMeshCourse, AutoMovieViewAxis, tessellateAutoMovieContourStrip64, type AutoMovieMeshExtract, type IAutoMovieLoftChain, type IAutoMovieLoftRelief } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanHeadEarLoop } from "../generation/AutoMovieHumanHeadEarLoop";
import type { AutoMovieHumanHeadMass } from "../generation/head/AutoMovieHumanHeadMass";
import { AutoMovieHumanHeadJawRelief } from "../generation/head/AutoMovieHumanHeadJawRelief";
import { AutoMovieHumanHeadMassCurves } from "../generation/head/AutoMovieHumanHeadMassCurves";
import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];
/**
 * The head renderer's line trace (verification step 4): for a line seen on
 * the clay at a height, the chain's layers there with their spacing, the
 * outlines' and fullness laws' jets and the reliefs' heights, and the chain
 * shaded by its curvature along the station, so the line is named by the
 * curves that make it before anything changes.
 */
export namespace NodeHeadTrace {
  /** Replace only the first clay band by a strip on the exact shared neck rail. */
  export function attachNeck(capture: CaptureModel.IPart, boundary: V3[] | null, source: AutoMovieMeshExtract.IMesh, hasNeckBase: boolean): void {
    let receipt: string;
    try {
      if (capture.loft.status !== "available" || boundary === null || !hasNeckBase)
        throw new Error("the original neck rail or the first neck chart is unavailable");
      receipt = neckStrip(capture.loft, boundary, source);
    } catch (error) {
      receipt = `neck boundary strip refused: ${error instanceof Error ? error.message : String(error)}`;
    }
    capture.diagnostics.push(receipt);
    if (capture.loft.status === "available") capture.loft.diagnostics.push(receipt);
    console.log(receipt);
  }

  /** The lower boundary values are copied verbatim and the upper rail retains its existing vertices. */
  function neckStrip(
    loft: Extract<CaptureModel.ILoft, { status: "available" }>,
    boundary: V3[],
    source: AutoMovieMeshExtract.IMesh,
  ): string {
    const y: number = 1458;
    const clay: CaptureModel.ITriangles = loft.clay;
    if (boundary.length < 3 || boundary.some((point: V3): boolean => point[1] !== y))
      throw new Error("the canonical lower rail must lie on y = 1458 mm");
    // CaptureSpecs emits (first lower, first upper, next upper) for its first band.
    // Its rows follow their own frame planes, so a world-Y equality cannot identify them.
    const removed: number = clay.indices[1]!;
    if (loft.lines[0]?.id !== "domain 0:loft:ring:0" || clay.indices[0] !== 0 || clay.indices[2] !== removed + 1 || removed < 3 || clay.positions.length < 6 * removed)
      throw new Error("the first two indexed rows of the neck clay are unavailable");
    const vertex = (i: number): V3 => [clay.positions[3 * i]!, clay.positions[3 * i + 1]!, clay.positions[3 * i + 2]!];
    const original: V3[] = Array.from({ length: removed }, (_: unknown, i: number): V3 => vertex(i));
    const upper: V3[] = original.map((_: V3, i: number): V3 => vertex(i + removed));
    const first: ReturnType<typeof railPlane> = railPlane(original);
    const second: ReturnType<typeof railPlane> = railPlane(upper);
    const planes: string = `canonical y ${y} mm, n (0,1,0); replaced ${first.label}; upper ${second.label}`;
    if (!(second.min > y) || first.min > second.min || first.max >= second.max)
      throw new Error(`the first clay band does not advance above the shared boundary (${planes})`);
    const positions: number[] = clay.positions.slice(3 * removed);

    const faces: number[] = [];
    for (let i: number = 0; i + 2 < clay.indices.length; i += 3) {
      const triangle: number[] = clay.indices.slice(i, i + 3);
      if (triangle.every((vertex: number): boolean => vertex >= removed))
        faces.push(...triangle.map((vertex: number): number => vertex - removed));
    }
    if (edgeDirection(faces, 0, upper.length) !== -1)
      throw new Error("the retained conic rail does not have one consistently directed boundary edge per vertex");
    const bottom: number = positions.length / 3;
    const vertices: Map<V3, number> = new Map(upper.map((point: V3, i: number): [V3, number] => [point, i]));
    for (const [i, point] of boundary.entries()) {
      vertices.set(point, bottom + i);
      positions.push(...point);
    }
    const strip: number[] = [];
    let refused: string | null = null;
    tessellateAutoMovieContourStrip64(boundary, upper, (a: V3, b: V3, c: V3): void => {
      for (const point of [a, b, c]) {
        const vertex: number | undefined = vertices.get(point);
        if (vertex === undefined) throw new Error("the strip changed a rail vertex");
        strip.push(vertex);
      }
    }, undefined, (observation): void => {
      if (!observation.qualified) refused = observation.diagnostics.join(" | ") || "the strip failed its contour checks";
    });
    if (refused !== null) throw new Error(refused);
    if (edgeDirection(strip, bottom, boundary.length) === 1)
      for (let i: number = 0; i < strip.length; i += 3) [strip[i + 1], strip[i + 2]] = [strip[i + 2]!, strip[i + 1]!];
    if (edgeDirection(strip, bottom, boundary.length) !== -1 || edgeDirection(strip, 0, upper.length) !== 1)
      throw new Error("the strip did not preserve both ordered rails in the required opposite directions");

    const mid: number = (y + second.min) / 2;
    const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.horizontal();
    const raw: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(source, axis, mid);
    const band: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read({ positions, indices: strip }, axis, mid);
    const error: string = raw === null || band === null ? "midpoint not readable" : `raw midpoint deviation ${Math.sqrt(Math.max(directed(raw.loop, band.loop), directed(band.loop, raw.loop))).toFixed(3)} mm`;
    loft.clay = { positions, indices: faces.concat(strip) };
    loft.lines = loft.lines.filter((line: CaptureModel.ILine): boolean => line.id !== "domain 0:loft:ring:0");
    loft.lines.push({ id: "loft:ring:shared-neck", closed: true, colour: "505050", points: boundary });
    return `neck strip (${planes}): ${boundary.length} canonical body rail edges at unchanged coordinates, ${upper.length} existing upper rail edges reused by index, ${strip.length / 3} triangles, ${error}; the body rail is exposed for assembly`;
  }

  function railPlane(points: readonly V3[]): { min: number; max: number; label: string } {
    const a: V3 = points[0]!;
    const b: V3 = points[Math.floor(points.length / 3)]!;
    const c: V3 = points[Math.floor(2 * points.length / 3)]!;
    let normal: V3 = NodeArmDraw.unit(NodeArmDraw.cross(NodeArmDraw.sub(b, a), NodeArmDraw.sub(c, a)));
    if (normal[1] < 0) normal = NodeArmDraw.scale(normal, -1);
    const ys: number[] = points.map((p: V3): number => p[1]);
    const min: number = Math.min(...ys);
    const max: number = Math.max(...ys);
    const residual: number = Math.max(...points.map((p: V3): number => Math.abs(NodeArmDraw.dot(NodeArmDraw.sub(p, a), normal))));
    return { min, max, label: `y ${min.toFixed(6)}–${max.toFixed(6)} mm, n (${normal.map((v: number): string => v.toFixed(6)).join(",")}), plane residual ${residual.toExponential(3)} mm` };
  }

  /** The orientation of a contiguous rail, or zero if any edge is missing or repeated. */
  function edgeDirection(faces: readonly number[], start: number, count: number): number {
    return railDirection(faces, Array.from({ length: count }, (_: unknown, i: number): number => start + i));
  }

  /** Read one-face edge direction by index; an open rail has no edge between its ends. */
  export function railDirection(faces: readonly number[], rail: readonly number[], closed: boolean = true): number {
    const count: number = rail.length;
    const local: Map<number, number> = new Map(rail.map((vertex: number, i: number): [number, number] => [vertex, i]));
    if (count < 3 || local.size !== count) return 0;
    const edges: Int8Array = new Int8Array(count - (closed ? 0 : 1));
    for (let i: number = 0; i + 2 < faces.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number | undefined = local.get(faces[i + j]!);
        const b: number | undefined = local.get(faces[i + (j + 1) % 3]!);
        if (a === undefined || b === undefined) continue;
        const forward: boolean = (a + 1) % count === b;
        const edge: number = forward ? a : b;
        if ((!forward && (b + 1) % count !== a) || edge >= edges.length) continue;
        if (edges[edge] !== 0) return 0;
        edges[edge] = forward ? 1 : -1;
      }
    return edges.every((value: number): boolean => value === edges[0]) ? edges[0]! : 0;
  }

  /** One original closed ring on its unchanged world-height plane. */
  export interface IOriginalRing {
    /** Height in millimetres. */
    station: number;

    /** The original ring sampled in world X and Z. */
    points: [number, number][];

    /** The published centre used to locate the corresponding raw outer loop. */
    centre: [number, number];
  }

  /** Ordinary loft bands inside a refused conic interval, retaining the actual tilted rows. */
  export function turnedBands(name: string, mesh: AutoMovieMeshExtract.IMesh, planes: readonly AutoMovieMeshCourse.IPlane[]): { bands: IAutoMovieLoftChain[]; notes: string[] } {
    const order: number = 192;
    const rows: { stations: number[]; rings: V3[][]; last: AutoMovieMeshCourse.IPlane }[] = [];
    const notes: string[] = [];
    let run: (typeof rows)[number] | null = null;
    for (const cut of AutoMovieMeshCourse.cut(mesh, planes, 0.5, 0.5)) {
      const { station, origin, u, v } = cut.plane;
      if (cut.loop === null || cut.pieces !== 1) {
        notes.push(`${station.toFixed(3)} mm: refused ${cut.pieces} outer loops, ${cut.flags.join("; ")}`);
        run = null;
        continue;
      }
      if (cut.flags.some((flag: string): boolean => flag.startsWith("unclosed"))) notes.push(`${station.toFixed(3)} mm: closed outer rail preserved separately from the open arcs`);
      const ring: V3[] = AutoMovieHumanHeadEarLoop.phased("sagittal", positiveLoop(cut.loop), order, false).ring.map(([x, z]: [number, number]): V3 =>
        NodeArmDraw.add(origin, NodeArmDraw.add(NodeArmDraw.scale(u, x), NodeArmDraw.scale(v, z))),
      );
      if (run !== null && !advances(run.rings.at(-1)!, ring, run.last, cut.plane)) {
        notes.push(`${run.last.station.toFixed(3)}–${station.toFixed(3)} mm: neighbouring planes cross a contour`);
        run = null;
      }
      if (run === null) rows.push(run = { stations: [], rings: [], last: cut.plane });
      run.last = cut.plane;
      run.stations.push(station);
      run.rings.push(ring);
    }
    return { notes, bands: rows.filter(({ stations }): boolean => stations.length >= 2).map(({ stations, rings }): IAutoMovieLoftChain =>
      AutoMovieHumanHorizontalChain.build({ name: `${name}.${stations[0]}`, order, samples: order, rule: "sagittal" }, rings, undefined, stations),
    ) };
  }
  /** Each physical rail must lie wholly on the correct side of the other plane. */
  export function advances(a: readonly V3[], b: readonly V3[], lower: AutoMovieMeshCourse.IPlane, upper: AutoMovieMeshCourse.IPlane): boolean {
    const normals: V3[] = [lower, upper].map(({ u, v }): V3 => NodeArmDraw.cross(v, u));
    return b.every((p: V3): boolean => NodeArmDraw.dot(NodeArmDraw.sub(p, lower.origin), normals[0]!) > 0) &&
      a.every((p: V3): boolean => NodeArmDraw.dot(NodeArmDraw.sub(p, upper.origin), normals[1]!) < 0);
  }
  function positiveLoop(loop: [number, number][]): [number, number][] {
    if (loop[0]![0] === loop.at(-1)![0] && loop[0]![1] === loop.at(-1)![1]) loop = loop.slice(0, -1);
    const area: number = loop.reduce((sum: number, a: [number, number], i: number): number => {
      const b: [number, number] = loop[(i + 1) % loop.length]!;
      return sum + a[0] * b[1] - a[1] * b[0];
    }, 0);
    return area < 0 ? [...loop].reverse() : loop;
  }

  /** Loft one signed source contour track; compare the analytic surface and the drawn chord grid independently. */
  export function linkedBand(name: string, rings: readonly IOriginalRing[], mesh: AutoMovieMeshExtract.IMesh): { chain: IAutoMovieLoftChain; receipt: string } {
    const order: number = name.endsWith("lobe") ? 96 : 384;
    const first: IOriginalRing = rings[0]!;
    const last: IOriginalRing = rings[rings.length - 1]!;
    const archived: IOriginalRing[] = [first];
    for (const ring of rings.slice(1, -1))
      if (ring.station - archived[archived.length - 1]!.station >= 0.25 && last.station - ring.station >= 0.25) archived.push(ring);
    archived.push(last);
    const cuts: Map<number, AutoMovieMeshCourse.ISection> = new Map();
    const read = ({ station, centre: [x, z] }: Omit<IOriginalRing, "points">): AutoMovieMeshCourse.ISection => {
      let cut: AutoMovieMeshCourse.ISection | undefined = cuts.get(station);
      if (cut === undefined) {
        cut = AutoMovieMeshCourse.cut(mesh, [{ station, origin: [x, station, z], u: [1, 0, 0], v: [0, 0, 1] }])[0]!;
        cuts.set(station, cut);
      }
      return cut;
    };
    const world = (cut: AutoMovieMeshCourse.ISection): [number, number][] => {
      const points: [number, number][] = cut.loop!.map(([u, v]: [number, number]): [number, number] => [cut.plane.origin[0] + u, cut.plane.origin[2] + v]);
      if (points[0]![0] === points.at(-1)![0] && points[0]![1] === points.at(-1)![1]) points.pop();
      return points;
    };
    const between = (a: IOriginalRing, b: IOriginalRing, f: number): Omit<IOriginalRing, "points"> => ({
      station: a.station + (b.station - a.station) * f,
      centre: [a.centre[0] + (b.centre[0] - a.centre[0]) * f, a.centre[1] + (b.centre[1] - a.centre[1]) * f],
    });
    const layers: IOriginalRing[] = [first];
    const withheld: string[] = [];
    for (let i: number = 1; i < archived.length; ++i) {
      const a: IOriginalRing = archived[i - 1]!;
      const b: IOriginalRing = archived[i]!;
      const intervals: number = Math.ceil((b.station - a.station) / 2);
      if (intervals > 1) {
        const start: AutoMovieMeshCourse.ISection = read(a);
        const end: AutoMovieMeshCourse.ISection = read(b);
        const middle = Array.from({ length: intervals - 1 }, (_: unknown, j: number) => between(a, b, (j + 1) / intervals));
        const observed: AutoMovieMeshCourse.ISection[] = middle.map(read);
        // The archive already links the exterior. Keep additional cuts on that same
        // contour only while the raw outer-loop count also stays unchanged.
        if ([start, ...observed, end].every((cut: AutoMovieMeshCourse.ISection): boolean => cut.loop !== null && cut.pieces === start.pieces))
          middle.forEach((ring: Omit<IOriginalRing, "points">, j: number): void => { layers.push({ ...ring, points: world(observed[j]!) }); });
        else withheld.push(`${a.station.toFixed(3)}–${b.station.toFixed(3)} mm`);
      }
      layers.push(b);
    }
    const chain: IAutoMovieLoftChain = AutoMovieHumanHorizontalChain.build(
      { name, order, samples: order, rule: "sagittal" },
      layers.map((ring: IOriginalRing): V3[] => AutoMovieHumanHeadEarLoop.phased("sagittal", positiveLoop(ring.points), order, false).ring.map(([x, z]: [number, number]): V3 => [x, ring.station, z])),
      undefined,
      layers.map((ring: IOriginalRing): number => ring.station),
    );
    const phases: number[] = Array.from({ length: 2 * order }, (_: unknown, i: number): number => i * Math.PI / order);
    const shownPhases: number[] = Array.from({ length: 72 }, (_: unknown, i: number): number => i * Math.PI / 36);
    const loftRing = (s: number, sample: number[] = phases): [number, number][] => AutoMovieLoftChain.ring(chain, s, sample).map((p: readonly number[]): [number, number] => [p[0]!, p[2]!]);
    const max: number = Math.max(...rings.map((ring: IOriginalRing): number => directed(ring.points, loftRing(ring.station))));
    const checks: { station: number; centre: [number, number] }[] = [...layers];
    for (let i: number = 1; i < layers.length; ++i) {
      const a: IOriginalRing = layers[i - 1]!;
      const b: IOriginalRing = layers[i]!;
      checks.push(between(a, b, 0.5));
    }
    let worst: { station: number; distance: number } | null = null;
    let chord: number = 0;
    const refused: number[] = [];
    for (const request of checks) {
      const { station } = request;
      const cut: AutoMovieMeshCourse.ISection = read(request);
      if (cut.loop === null) {
        refused.push(station);
        continue;
      }
      const source: [number, number][] = world(cut);
      const loft: [number, number][] = loftRing(station);
      const distance: number = Math.max(directed(source, loft), directed(loft, source));
      chord = Math.max(chord, directed(loft, loftRing(station, shownPhases)));
      if (worst === null || distance > worst.distance) worst = { station, distance };
    }
    const raw: string = worst === null ? "no raw comparison" : `raw bidirectional max ${Math.sqrt(worst.distance).toFixed(3)} mm at ${worst.station.toFixed(6)} mm`;
    return { chain, receipt: `${name}: ${rings.length} one-to-one original rings at ${first.station.toFixed(6)}–${last.station.toFixed(6)} mm; ${layers.length} loft layers including ${layers.length - archived.length} additional original-mesh cuts; withheld [${withheld.join(", ")}]; sampled original-to-loft max ${Math.sqrt(max).toFixed(3)} mm; ${raw}, ${checks.length - refused.length}/${checks.length} raw source/midpoint sections read, missing [${refused.map((s: number): string => s.toFixed(6)).join(", ")}]; 72-phase chord max ${Math.sqrt(chord).toFixed(3)} mm; both boundaries open` };
  }

  /** Maximum squared point-to-edge deviation between two closed plane polylines. */
  export function directed(source: readonly [number, number][], target: readonly [number, number][]): number {
    let worst: number = 0;
    for (const [x, z] of source) {
      let nearest: number = Infinity;
      for (let i: number = 0; i < target.length; ++i) {
        const a: [number, number] = target[i]!;
        const b: [number, number] = target[(i + 1) % target.length]!;
        const u: number = b[0] - a[0];
        const v: number = b[1] - a[1];
        const length: number = u * u + v * v;
        const fraction: number = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * u + (z - a[1]) * v) / length));
        nearest = Math.min(nearest, (x - a[0] - u * fraction) ** 2 + (z - a[1] - v * fraction) ** 2);
      }
      worst = Math.max(worst, nearest);
    }
    return worst;
  }

  /** The world points behind the largest radial residual in a built span. */
  export function witness(
    mesh: AutoMovieMeshExtract.IMesh,
    axis: AutoMovieViewAxis.IAxis | undefined,
    chain: IAutoMovieLoftChain | null | undefined,
    layers: readonly AutoMovieHumanF1Trace.ILayer[],
  ): string[] {
    if (axis === undefined || chain === null || chain === undefined) return [];
    const worst: AutoMovieHumanF1Trace.ILayer | undefined = layers.reduce<AutoMovieHumanF1Trace.ILayer | undefined>(
      (a: AutoMovieHumanF1Trace.ILayer | undefined, b: AutoMovieHumanF1Trace.ILayer): AutoMovieHumanF1Trace.ILayer | undefined =>
        b.fault === null && (a === undefined || b.max > a.max) ? b : a,
      undefined,
    );
    if (worst === undefined) return [];
    const cut: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(mesh, axis, worst.station);
    const point: [number, number] | undefined = cut?.loop.find(([u, v]: [number, number]): boolean => Math.atan2(v, u) === worst.phase);
    if (point === undefined) return [`${chain.name}: cannot recover the raw vertex at the worst recorded phase ${worst.phase}`];
    const f: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(worst.station);
    const [u, v] = point;
    const world: V3 = [0, 1, 2].map((k: number): number => f.origin[k]! + u * f.u[k]! + v * f.v[k]!) as V3;
    const loft: readonly number[] = AutoMovieLoftChain.ring(chain, worst.station, [worst.phase])[0]!;
    const ring: readonly (readonly number[])[] = AutoMovieLoftChain.ring(chain, worst.station,
      Array.from({ length: 1024 }, (_: unknown, k: number): number => k * 2 * Math.PI / 1024),
    );
    const near: number = Math.min(...ring.map((p: readonly number[]): number => Math.hypot(p[0]! - world[0], p[1]! - world[1], p[2]! - world[2])));
    const pointText = (p: readonly number[]): string => p.map((x: number): string => x.toFixed(3)).join(", ");
    return [`${chain.name} worst at station ${worst.station.toFixed(6)} mm (${worst.between ? "between cuts" : "at source cut"}), phase ${(worst.phase * 180 / Math.PI).toFixed(3)} deg, signed radial ${worst.signed.toFixed(3)} mm: reference (${pointText(world)}), loft (${pointText(loft)}); nearest of 1024 loft samples ${near.toFixed(3)} mm`];
  }

  /** One chain layer near a traced height. */
  export interface ILayer {
    /** Layer index in the chain. */
    k: number;

    /** Head-frame station, mm. */
    y: number;

    /** Spacing to the next layer, mm. */
    spacing: number;

    /** Anterior outline's value and station derivatives. */
    anterior: [number, number, number];

    /** Lateral outline's value and station derivatives. */
    lateral: [number, number, number];

    /** Posterior outline's value and station derivatives. */
    posterior: [number, number, number];

    /** Fullness laws' values with central-difference derivatives (0.5 mm). */
    fullness: { anterior: [number, number, number]; posterior: [number, number, number] };

    /** The reliefs' summed height at three phases, mm. */
    relief: { phase: number; height: number }[];
  }

  /** Every chain layer within 8 mm of each traced height (head-frame stations; `shift` the chain's station of FH). */
  export function layers(chain: IAutoMovieLoftChain, curves: AutoMovieHumanHeadMass.IOutput, shift: number, heights: readonly number[]): { y: number; layers: ILayer[] }[] {
    const M: typeof AutoMovieHumanHeadMassCurves = AutoMovieHumanHeadMassCurves;
    const jet: (f: (s: number) => number, s: number) => [number, number, number] = (f: (s: number) => number, s: number): [number, number, number] => [f(s), f(s + 0.5) - f(s - 0.5), (f(s + 0.5) - 2 * f(s) + f(s - 0.5)) / 0.25];
    return heights.map((y: number): { y: number; layers: ILayer[] } => ({
      y,
      layers: chain.layers.flatMap((layer: IAutoMovieLoftChain.ILayer, k: number): ILayer[] => {
        const s: number = layer.y - shift;
        if (Math.abs(s - y) > 8) return [];
        return [
          {
            k,
            y: s,
            spacing: k + 1 < chain.layers.length ? chain.layers[k + 1]!.y - layer.y : NaN,
            anterior: M.value(curves.outlines.anterior, s, curves.length),
            lateral: M.value(curves.outlines.lateral, s, curves.length),
            posterior: M.value(curves.outlines.posterior, s, curves.length),
            fullness: {
              anterior: jet((x: number): number => M.fullness(curves.fullness.anterior, x), s),
              posterior: jet((x: number): number => M.fullness(curves.fullness.posterior, x), s),
            },
            relief: [0.5, 1, 1.5].map((phase: number): { phase: number; height: number } => ({ phase, height: (chain.reliefs ?? []).reduce((sum: number, r: IAutoMovieLoftRelief): number => sum + AutoMovieLoftRelief.height(r, layer.y, phase)[0], 0) })),
          },
        ];
      }),
    }));
  }

  /**
   * The actual chain shaded by its curvature along the station: at each point
   * of rings 1 mm apart, the second difference projected on the outward
   * normal, per mm. Blue concave (bending inward along the station), red
   * convex, white flat, saturated at 0.05 /mm.
   */
  export function curvature(v: NodeArmDraw.IView, chain: IAutoMovieLoftChain): void {
    const phases: number[] = Array.from({ length: 128 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 128);
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil(z - a));
    const ys: number[] = Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((z - a) * k) / n);
    const rows: V3[][] = ys.map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases));
    const quads: { q: V3[]; colour: string; depth: number }[] = [];
    for (let i: number = 1; i + 1 < rows.length; ++i) {
      const h: number = (ys[i + 1]! - ys[i - 1]!) / 2;
      const axis: V3 = AutoMovieLoftChain.axis(chain, ys[i]!) as V3;
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        const k0: number = (k + phases.length - 1) % phases.length;
        const p: V3 = rows[i]![k]!;
        let normal: V3 = NodeArmDraw.unit(NodeArmDraw.cross(NodeArmDraw.sub(rows[i]![k1]!, rows[i]![k0]!), NodeArmDraw.sub(rows[i + 1]![k]!, rows[i - 1]![k]!)));
        if (NodeArmDraw.dot(normal, NodeArmDraw.sub(p, axis)) < 0) normal = NodeArmDraw.scale(normal, -1);
        const second: V3 = NodeArmDraw.add(NodeArmDraw.sub(rows[i + 1]![k]!, NodeArmDraw.scale(p, 2)), rows[i - 1]![k]!);
        const t: number = Math.max(-1, Math.min(1, -NodeArmDraw.dot(second, normal) / (h * h) / 0.05));
        const colour: string = t >= 0 ? `rgb(255,${Math.round(255 * (1 - t))},${Math.round(255 * (1 - t))})` : `rgb(${Math.round(255 * (1 + t))},${Math.round(255 * (1 + t))},255)`;
        const q: V3[] = [p, rows[i]![k1]!, rows[i + 1]![k1]!, rows[i + 1]![k]!];
        quads.push({ q, colour, depth: NodeArmDraw.dot(NodeArmDraw.add(NodeArmDraw.add(q[0]!, q[1]!), NodeArmDraw.add(q[2]!, q[3]!)), v.forward) });
      }
    }
    quads.sort((x: { depth: number }, y: { depth: number }): number => y.depth - x.depth);
    for (const { q, colour } of quads) {
      v.g.fillStyle = colour;
      v.g.strokeStyle = colour;
      v.g.lineWidth = 0.6;
      v.g.beginPath();
      q.forEach((p: V3, m: number): void => {
        const [x, y]: [number, number] = v.project(p);
        if (m === 0) v.g.moveTo(x, y);
        else v.g.lineTo(x, y);
      });
      v.g.closePath();
      v.g.fill();
      v.g.stroke();
    }
  }

  /**
   * The phase ripple of the chain's curvature along the station at one
   * height (the face's vertical streaks, 2026-11-08): at 720 phases, the
   * second difference of 1 mm rings on the radial direction from the chain's
   * axis; its residual from a 15 degree moving mean; the residual's root mean
   * square; and the lag of its first autocorrelation peak, the streaks'
   * period in degrees. The period names the source: 360 / order for the
   * sections' control net, the relief nets' phase spacing, or the ring
   * samples.
   */
  export function ripple(chain: IAutoMovieLoftChain, y: number): { y: number; rms: number; period: number | null; mean: number } {
    const n: number = 720;
    const axis: V3 = AutoMovieLoftChain.axis(chain, y) as V3;
    const phases: number[] = Array.from({ length: n }, (_: unknown, k: number): number => (2 * Math.PI * k) / n);
    const rows: V3[][] = [y - 1, y, y + 1].map((s: number): V3[] => AutoMovieLoftChain.ring(chain, s, phases) as V3[]);
    const kappa: number[] = phases.map((_: number, k: number): number => {
      const p: V3 = rows[1]![k]!;
      const radial: V3 = NodeArmDraw.unit([p[0] - axis[0], 0, p[2] - axis[2]]);
      return NodeArmDraw.dot(NodeArmDraw.add(NodeArmDraw.sub(rows[2]![k]!, NodeArmDraw.scale(p, 2)), rows[0]![k]!), radial);
    });
    const w: number = 30;
    const residual: number[] = kappa.map((v: number, k: number): number => {
      let sum: number = 0;
      for (let j: number = -w; j <= w; ++j) sum += kappa[(k + j + n) % n]!;
      return v - sum / (2 * w + 1);
    });
    const rms: number = Math.sqrt(residual.reduce((m: number, v: number): number => m + v * v, 0) / n);
    const correlation: (lag: number) => number = (lag: number): number => residual.reduce((m: number, v: number, k: number): number => m + v * residual[(k + lag) % n]!, 0);
    let period: number | null = null;
    for (let lag: number = 2; lag < 90; ++lag)
      if (correlation(lag) > correlation(lag - 1) && correlation(lag) >= correlation(lag + 1) && correlation(lag) > 0) {
        period = lag / 2;
        break;
      }
    return { y, rms, period, mean: kappa.reduce((m: number, v: number): number => m + v, 0) / n };
  }

  /**
   * The height the jaw relief's step behind the ramus removes, at heights
   * from the gonion to FH: the reliefs' summed height at the base point
   * (the chain without reliefs) whose forward place is the step's top, the
   * ramus line plus the roll (`AutoMovieHumanHeadJawRelief`), on the +v side.
   * `me` is the menton in the head frame, `shift` the chain's station of FH.
   */
  export function jawStep(chain: IAutoMovieLoftChain, shift: number, me: V3): { y: number; ramus: number; top: number; height: number }[] {
    const J: typeof AutoMovieHumanHeadJawRelief = AutoMovieHumanHeadJawRelief;
    const goY: number = me[1] + me[0] * Math.tan(AutoMovieHumanHeadMassCurves.FMA);
    const back: number = 1 / Math.tan(J.GONIAL - AutoMovieHumanHeadMassCurves.FMA);
    const base: IAutoMovieLoftChain = { ...chain, reliefs: [] };
    const out: { y: number; ramus: number; top: number; height: number }[] = [];
    for (let y: number = goY; y < 0; y += (0 - goY) / 6) {
      const ramus: number = (y - goY) * back;
      const top: number = ramus + J.ROLL;
      let best: number = 0;
      let gap: number = Infinity;
      for (let k: number = 1; k < 180; ++k) {
        const phi: number = (Math.PI * k) / 180;
        const p: number[] = AutoMovieLoftChain.point(base, y + shift, phi);
        if (!(p[2]! > 0)) continue;
        if (Math.abs(p[0]! - top) < gap) {
          gap = Math.abs(p[0]! - top);
          best = phi;
        }
      }
      const height: number = (chain.reliefs ?? []).reduce((sum: number, r: IAutoMovieLoftRelief): number => sum + AutoMovieLoftRelief.height(r, y + shift, best)[0], 0);
      out.push({ y, ramus, top, height });
    }
    return out;
  }
}
