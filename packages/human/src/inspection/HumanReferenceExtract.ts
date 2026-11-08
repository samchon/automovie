import { AutoMovieMeshExtract } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { HumanInspectionReferenceMesh } from "./HumanInspectionReferenceMesh";

/**
 * The registered reference model as one triangle mesh for a region's world
 * match, and the one-call reading of a region's sparse lines from it. The
 * readings themselves (exact plane sections, loops, extremes, flags and
 * Hermite knot reduction) are the engine's {@link AutoMovieMeshExtract}; this
 * loader feeds them the same registered model node:capture's reference stage
 * reads (`NodeCaptureSources.context(pose).reference()`, or the saved
 * `test/.shots/f1/reference-model.json` that NodeHeadExtract parses).
 */
export namespace HumanReferenceExtract {
  /** A triangle mesh in millimetres, the engine extraction's input. */
  export type IMesh = AutoMovieMeshExtract.IMesh;

  /** One of a section's eight extreme directions. */
  export type Direction = keyof NonNullable<AutoMovieMeshExtract.ISection["extremes"]>;

  /** The eight directions in a fixed order. */
  export const DIRECTIONS: readonly Direction[] = ["+a", "-a", "+b", "-b", "+a+b", "+a-b", "-a+b", "-a-b"];

  /** A box in frame coordinates: millimetres along the frame's three axes from its origin. */
  export interface IBox {
    /** Lower corner. */
    min: AutoMovieMeshExtract.V3;

    /** Upper corner. */
    max: AutoMovieMeshExtract.V3;
  }

  /** What {@link lines} reads from a region. */
  export interface ILines {
    /** The raw sections, one per station, for the viewer check of every flag. */
    sections: AutoMovieMeshExtract.ISection[];

    /**
     * Per direction, the extreme's reach against station reduced to Hermite
     * knots (`s` the station, `value` the reach, knot `index` the station's
     * index), with the station indices that direction's flags name (a jump in
     * it, or an open cut) to check in the viewer; null when fewer than two
     * stations cut the region.
     */
    runs: Record<Direction, { knots: AutoMovieMeshExtract.IKnot[]; error: number; flagged: number[] } | null>;

    /**
     * Per station, each outer boundary of the cut (`ISection.outer`: chains
     * bridged across holes and slits, enclosed pieces dropped) reduced to
     * Hermite knots in the section's `[a, b]` coordinates, largest enclosed
     * area first.
     */
    loops: { knots: AutoMovieMeshExtract.ILoopKnot[]; length: number; error: number; area: number }[][];
  }

  /**
   * The registered reference model's triangles as one mesh in millimetres
   * (positions in metres times 1000 times `scale`), unregistered: a region
   * applies its own registration, as its reference executable does.
   *
   * @param model The model `NodeCaptureSources.context(pose).reference()` returns.
   * @param scale Calibration scale.
   */
  export function triangles(model: IAutoMovieModel, scale: number = 1): IMesh {
    const positions: number[] = [];
    const indices: number[] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts as IAutoMovieModelPart[]) {
      if (part.geometry.type !== "mesh" || part.geometry.mesh.indices === null) continue;
      const offset: number = positions.length / 3;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      for (let i: number = 0; i < p.length; ++i) positions.push(p[i]! * 1000 * scale);
      const t: ArrayLike<number> = part.geometry.mesh.indices;
      for (let i: number = 0; i < t.length; ++i) indices.push(t[i]! + offset);
    }
    return { positions, indices };
  }

  /**
   * The triangles whose centroid lies in a box of the frame, so that a cut
   * through one region (an arm) does not also read its neighbour (the trunk).
   * Positions are shared, not copied.
   *
   * @param mesh The whole mesh.
   * @param frame The region's frame.
   * @param box The region's box in that frame.
   */
  export function crop(mesh: IMesh, frame: AutoMovieMeshExtract.IFrame, box: IBox): IMesh {
    const indices: number[] = [];
    const p: ArrayLike<number> = mesh.positions;
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const c: number[] = [0, 0, 0];
      for (let k: number = 0; k < 3; ++k) {
        const v: number = mesh.indices[t + k]!;
        for (let d: number = 0; d < 3; ++d) c[d] = c[d]! + p[3 * v + d]! / 3;
      }
      const r: number[] = [c[0]! - frame.origin[0], c[1]! - frame.origin[1], c[2]! - frame.origin[2]];
      let inside: boolean = true;
      for (let d: number = 0; d < 3 && inside; ++d) {
        const axis: AutoMovieMeshExtract.V3 = frame.axes[d]!;
        const x: number = r[0]! * axis[0] + r[1]! * axis[1] + r[2]! * axis[2];
        inside = x >= box.min[d]! && x <= box.max[d]!;
      }
      if (inside) indices.push(mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!);
    }
    return { positions: mesh.positions, indices };
  }

  /**
   * A region's sparse lines in one call: the exact sections at the stations
   * (of the cropped mesh when a box is given), each direction's extreme
   * reach against station reduced to Hermite knots, and each station's closed
   * loops reduced. No sample is excluded unless the caller names it: the
   * jump flag also fires on genuinely sharp anatomy (a reach whose second
   * difference over one station step exceeds twice the tolerance), so the
   * flagged stations are returned for the viewer check instead.
   *
   * @param mesh The reference mesh (see {@link triangles}), in the frame's coordinates.
   * @param frame The region's frame.
   * @param stations Stations along the frame axis, millimetres, increasing.
   * @param axis The station axis's index in `frame.axes`; the in-plane a and b are the next two cyclically.
   * @param options `tolerance` (0.5 mm), `bridge` (25 mm, the longest hole or slit the outer boundaries close), `box` to crop the region, and per direction the station indices to `pin` (landmarks) or `exclude` (artifacts confirmed in the viewer).
   */
  export function lines(
    mesh: IMesh,
    frame: AutoMovieMeshExtract.IFrame,
    stations: readonly number[],
    axis: 0 | 1 | 2,
    options: { tolerance?: number; bridge?: number; box?: IBox; pin?: Partial<Record<Direction, number[]>>; exclude?: Partial<Record<Direction, number[]>> } = {},
  ): ILines {
    const tolerance: number = options.tolerance ?? 0.5;
    const region: IMesh = options.box === undefined ? mesh : crop(mesh, frame, options.box);
    const sections: AutoMovieMeshExtract.ISection[] = AutoMovieMeshExtract.outline(region, frame, stations, axis, tolerance, options.bridge ?? 25);
    const runs: Partial<ILines["runs"]> = {};
    for (const direction of DIRECTIONS) {
      // Stations the plane misses carry no extreme; they stay out of the run.
      const present: number[] = [];
      for (let i: number = 0; i < sections.length; ++i) if (sections[i]!.extremes !== null) present.push(i);
      if (present.length < 2) {
        runs[direction] = null;
        continue;
      }
      const points: [number, number][] = present.map((i: number): [number, number] => [sections[i]!.station, sections[i]!.extremes![direction].reach]);
      const local: (indices: number[] | undefined) => number[] = (indices: number[] | undefined): number[] => (indices ?? []).map((i: number): number => present.indexOf(i)).filter((i: number): boolean => i >= 0);
      const reduced: { knots: AutoMovieMeshExtract.IKnot[]; error: number } = AutoMovieMeshExtract.reduce(points, tolerance, local(options.pin?.[direction]), local(options.exclude?.[direction]));
      runs[direction] = {
        knots: reduced.knots.map((k: AutoMovieMeshExtract.IKnot): AutoMovieMeshExtract.IKnot => ({ ...k, index: present[k.index]! })),
        error: reduced.error,
        flagged: present.filter((i: number): boolean => sections[i]!.flags.some((f: string): boolean => f.startsWith("open") || f.startsWith(`jump ${direction}:`))),
      };
    }
    const loops: ILines["loops"] = sections.map((section: AutoMovieMeshExtract.ISection): ILines["loops"][number] =>
      section.outer
        .filter((loop: AutoMovieMeshExtract.ILoop): boolean => loop.points.length >= 4)
        .map((loop: AutoMovieMeshExtract.ILoop): ILines["loops"][number][number] => ({ ...AutoMovieMeshExtract.reduceLoop(loop.points, tolerance), area: Math.abs(area(loop.points)) }))
        .sort((x: { area: number }, y: { area: number }): number => y.area - x.area),
    );
    return { sections, runs: runs as ILines["runs"], loops };
  }

  /** The shoelace signed area of a closed polygon. */
  function area(points: readonly [number, number][]): number {
    let out: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const p: [number, number] = points[i]!;
      const q: [number, number] = points[(i + 1) % points.length]!;
      out += (p[0] * q[1] - q[0] * p[1]) / 2;
    }
    return out;
  }
}
