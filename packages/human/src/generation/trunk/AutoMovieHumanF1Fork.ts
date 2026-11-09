import { AutoMovieCurveMath64 as V, AutoMovieMeshCourse, type AutoMovieMeshExtract } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../AutoMovieHumanF1Trace";
import { AutoMovieHumanTrunkF1Traced } from "./AutoMovieHumanTrunkF1Traced";

type Point = V.V;
type Plane = { centroid: Point; normal: Point };

/**
 * The actual F1 trunk fork and the one measured seam shared by its children.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the world frame, parent boundary, shared seam and child planes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One owner reads the boundary consumed by the trunk and both legs.
 */
export namespace AutoMovieHumanF1Fork {
  /** Ordered parent and child boundaries in ISB world millimetres. */
  export interface IResult {
    /** The parent's outer boundary with the two exact median crossings. */
    ring: Point[];
    /** The shared median seam in front-to-back order. */
    crotch: Point[];
    /** The child boundary on negative Z relative to the median. */
    left: Point[];
    /** The child boundary on positive Z relative to the median. */
    right: Point[];
    /** The child plane's area centroid and Newell normal. */
    leftPlane: Plane;
    /** The child plane's area centroid and Newell normal. */
    rightPlane: Plane;
    /** The original parent's area centroid and upward cut normal. */
    parentPlane: Plane;
    /** Distance from each rounded historical seam endpoint to its exact cut crossing, mm. */
    endpointDisplacement: [number, number];
    /** Original section extraction flags. */
    flags: string[];
  }

  /**
   * Read the fork-plane contour and divide it along the measured median seam.
   *
   * @param mesh Reference triangles in ISB world millimetres.
   * @param z The historical survey's median Z in the same world frame.
   * @returns The parent and children reusing the very same seam point objects.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the source frame and the shared seam identity.
   * @evidence contracts/development/implementation.md#principled-implementation Intersect the ordered contour with the median plane, keep the original arcs on both sides and close them against the measured skin seam.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuse missing or ambiguous crossings and preserve the actual cut endpoints.
   */
  export function read(mesh: AutoMovieMeshExtract.IMesh, z: number): IResult {
    const survey: Point[] = AutoMovieHumanTrunkF1Traced.CROTCH_LINE.map(([x, y]: [number, number]): Point => [x + 26.8, y, z]);
    const notch: Point = survey[0]!;
    const cleft: Point = survey[survey.length - 1]!;
    const v: Point = [0, 0, 1];
    const forkDirection: Point = V.sub(cleft, notch);
    const normal: Point = unit([forkDirection[1], -forkDirection[0], 0]);
    const u: Point = [normal[1], -normal[0], 0];
    const origin: Point = V.scale(V.add(notch, cleft), 0.5);
    const section: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut(mesh, [{ station: 0, origin, u, v }], AutoMovieHumanF1Trace.TOLERANCE)[0]!;
    if (section.pieces !== 1 || section.loop === null || section.centroid === null)
      throw new Error(`trunk fork: expected one holding contour, found ${section.pieces} outer contours (${section.flags.join("; ")})`);

    const loop: [number, number][] = section.loop;
    const nodes: [number, number][] = [];
    for (let i: number = 0; i < loop.length; ++i) {
      const a: [number, number] = loop[i]!;
      const b: [number, number] = loop[(i + 1) % loop.length]!;
      nodes.push(a);
      if (a[1] * b[1] < 0) nodes.push([a[0] + ((b[0] - a[0]) * a[1]) / (a[1] - b[1]), 0]);
    }
    const crossings: number[] = nodes.flatMap((p: [number, number], i: number): number[] => p[1] === 0 ? [i] : []);
    if (crossings.length !== 2)
      throw new Error(`trunk fork: expected two median crossings of the single outline, found ${crossings.length}`);
    const [a, b]: [number, number] = [crossings[0]!, crossings[1]!];
    const ring: Point[] = nodes.map(([x, y]: [number, number]): Point => V.add(origin, V.add(V.scale(u, x), V.scale(v, y))));
    const [front, back]: [Point, Point] = nodes[a]![0] > nodes[b]![0] ? [ring[a]!, ring[b]!] : [ring[b]!, ring[a]!];
    // The surveyed ends were rounded to tenths. The raw cut owns both joins.
    const interior: Point[] = survey.slice(1, -1);
    const crotch: Point[] = [front, ...interior, back];
    const arcs: [Point[], Point[]] = [ring.slice(a, b + 1), [...ring.slice(b), ...ring.slice(0, a + 1)]];
    const halves: Point[][] = arcs.map((arc: Point[]): Point[] => [...arc, ...(arc[0] === front ? [...interior].reverse() : interior)]);
    const firstLeft: boolean = arcs[0].some((point: Point): boolean => point[2] < z);
    const [left, right]: [Point[], Point[]] = firstLeft ? [halves[0]!, halves[1]!] : [halves[1]!, halves[0]!];
    return {
      ring,
      crotch,
      left,
      right,
      leftPlane: childPlane(left),
      rightPlane: childPlane(right),
      parentPlane: { centroid: section.centroid, normal },
      endpointDisplacement: [Math.hypot(...V.sub(front, notch)), Math.hypot(...V.sub(back, cleft))],
      flags: section.flags,
    };
  }

  /** Measure the area centroid in the child's Newell plane while preserving the original 3D boundary. */
  function childPlane(loop: Point[]): Plane {
    const newell: Point = AutoMovieMeshCourse.newell(loop);
    if (Math.hypot(...newell) === 0) throw new Error("trunk fork: a child boundary has zero vector area");
    const normal: Point = unit(newell);
    const mean: Point = V.scale(loop.reduce(V.add, [0, 0, 0]), 1 / loop.length);
    const projected: Point[] = loop.map((point: Point): Point => {
      const displacement: Point = V.sub(point, mean);
      const height: number = displacement[0] * normal[0] + displacement[1] * normal[1] + displacement[2] * normal[2];
      return V.sub(point, V.scale(normal, height));
    });
    const centroid: Point | null = AutoMovieMeshCourse.centroid(projected);
    if (centroid === null) throw new Error("trunk fork: a child boundary has zero projected area");
    return { centroid, normal };
  }

  /** Normalize a nonzero cut direction. */
  function unit(a: Point): Point {
    return V.scale(a, 1 / Math.hypot(...a));
  }
}
