import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieMeshExtract as M, type AutoMovieLoftFrame } from "@automovie/engine";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The fixed f1 reference as the offline fit observes it: the native body and
 * head meshes and the native bind joints, all in the reference frame
 * (millimetres, forward +X, up +Y, +Z the side the source calls left).
 *
 * Runtime generation never reads this module or its files.
 */
export namespace FamilyConicSource {
  /** A point or direction in the reference frame. */
  export type V = [number, number, number];

  /** The loaded reference. */
  export interface ISource {
    /** Native body skin, exact positional aliases merged so cuts chain into loops. */
    body: M.IMesh;

    /** Native head skin, likewise. */
    head: M.IMesh;

    /** Body and head skins as one mesh, positions shared where the two meet, so a cut through the neck seam still closes. */
    all: M.IMesh;

    /** Native bind joint centres by name, mm. */
    joints: Map<string, V>;
  }

  /** One exact plane cut about a frame's origin. */
  export interface ICut {
    /** The outermost closed loop winding round the origin, counter-clockwise in the `(u, v)` chart, or null when none does. */
    loop: C.P[] | null;

    /** Closed loops that wind round the origin. */
    around: number;

    /** Every chained piece of the cut, closed or open. */
    pieces: number;
  }

  /** Load the reference from the repository root. */
  export async function load(root: string): Promise<ISource> {
    const read = async <T>(relative: string): Promise<T> => JSON.parse(await fs.readFile(path.join(root, relative), "utf8")) as T;
    const observations: { skeleton: { joints: { name: string; bindNativeTranslation: V }[] } } = await read("test/.shots/f1/body-observations.json");

    // Native joints are centimetres in the native chart; the reference frame is (10 z, 10 y, -10 x) of it, as the earlier part study established against the saved limb planes.
    const joints: Map<string, V> = new Map(observations.skeleton.joints.map((joint): [string, V] => [joint.name, [10 * joint.bindNativeTranslation[2], 10 * joint.bindNativeTranslation[1], -10 * joint.bindNativeTranslation[0]]]));
    const model: { parts: { id: string; geometry: { mesh: { positions: number[]; indices: number[] } } }[] } = await read("test/.shots/f1/reference-model.json");
    const mesh = (keys: string[]): M.IMesh => {
      const positions: number[] = [];
      const indices: number[] = [];
      const alias: Map<string, number> = new Map();
      for (const key of keys) {
        const part = model.parts.find((p): boolean => p.id.includes(key));
        if (part === undefined) throw new Error("The reference model has no " + key + " part.");
        const remap: number[] = [];
        const source: number[] = part.geometry.mesh.positions;
        for (let i: number = 0; i < source.length; i += 3) {
          const p: V = [source[i]! * 1000, source[i + 1]! * 1000, source[i + 2]! * 1000];
          const id: string = p.join(",");
          let index: number | undefined = alias.get(id);
          if (index === undefined) {
            index = positions.length / 3;
            alias.set(id, index);
            positions.push(...p);
          }
          remap.push(index);
        }
        for (const i of part.geometry.mesh.indices) indices.push(remap[i]!);
      }
      return { positions, indices };
    };
    return { body: mesh(["body"]), head: mesh(["head"]), all: mesh(["body", "head"]), joints };
  }

  /**
   * Cut a mesh by a frame's plane and read the loop round its origin in the frame's chart.
   *
   * @param bridge Longest gap between open chains' ends the outer boundary closes where no closed loop winds round the origin, mm.
   */
  export function cut(mesh: M.IMesh, frame: AutoMovieLoftFrame.IFrame, bridge: number = 3): ICut {
    const n: V = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
    const place: M.IFrame = { origin: [...frame.origin] as V, axes: [n, [...frame.u] as V, [...frame.v] as V] };
    const section: M.ISection = M.outline(mesh, place, [0], 0, 0.5, 0)[0]!;
    const closed = (loops: readonly M.ILoop[]): C.P[][] => loops.filter((loop: M.ILoop): boolean => loop.closed && winds(loop.points)).map((loop: M.ILoop): C.P[] => (area(loop.points) < 0 ? [...loop.points].reverse() : [...loop.points]));
    let round: C.P[][] = closed(section.loops);

    // Where the body and head skins meet their rims do not share vertices, so a cut through the seam chains into open pieces; the extractor's own bridging joins ends up to 3 mm apart into the outer boundary.
    if (round.length === 0) round = closed(M.outline(mesh, place, [0], 0, 0.5, bridge)[0]!.outer);
    // Several loops round the origin are nested shells (the head mesh carries its mouth and throat lining): the skin is the outermost, the one of largest area.
    const outer: C.P[] | null = round.length === 0 ? null : round.reduce((a: C.P[], b: C.P[]): C.P[] => (area(b) > area(a) ? b : a));
    return { loop: outer, around: round.length, pieces: section.loops.length };
  }

  /** Every closed loop of a mesh's cut by a frame's plane, counter-clockwise in the frame's chart, whether or not it winds round the origin. */
  export function loops(mesh: M.IMesh, frame: AutoMovieLoftFrame.IFrame): C.P[][] {
    const n: V = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
    const section: M.ISection = M.outline(mesh, { origin: [...frame.origin] as V, axes: [n, [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!;
    return section.loops.filter((loop: M.ILoop): boolean => loop.closed).map((loop: M.ILoop): C.P[] => (area(loop.points) < 0 ? [...loop.points].reverse() : [...loop.points]));
  }

  /**
   * Convex hull of a chart polygon, counter-clockwise (Andrew's monotone
   * chain). It is the path a taut tape takes round the section, so a family
   * fitted to it is the part's tape wall, and what lies inside it is relief.
   */
  export function hull(points: readonly C.P[]): C.P[] {
    const sorted: C.P[] = [...points].sort((a: C.P, b: C.P): number => a[0] - b[0] || a[1] - b[1]);
    const turn = (o: C.P, a: C.P, b: C.P): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (source: C.P[]): C.P[] => {
      const out: C.P[] = [];
      for (const p of source) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    return [...half(sorted), ...half([...sorted].reverse())];
  }

  /** Signed area of a chart polygon, mm^2, positive counter-clockwise. */
  export function area(points: readonly C.P[]): number {
    let sum: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const p: C.P = points[i]!;
      const q: C.P = points[(i + 1) % points.length]!;
      sum += p[0] * q[1] - p[1] * q[0];
    }
    return sum / 2;
  }

  /** Whether a polygon encloses the chart origin, by the parity of its crossings of the positive `u` axis. */
  function winds(points: readonly C.P[]): boolean {
    let inside: boolean = false;
    for (let i: number = 0; i < points.length; ++i) {
      const a: C.P = points[i]!;
      const b: C.P = points[(i + 1) % points.length]!;
      if (a[1] > 0 !== b[1] > 0 && a[0] + ((b[0] - a[0]) * -a[1]) / (b[1] - a[1]) > 0) inside = !inside;
    }
    return inside;
  }
}
