import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { IAutoMovieMeshTarget } from "../IAutoMovieMeshTarget";
import { IAutoMovieProfilePoint } from "../IAutoMovieProfilePoint";
import { IAutoMovieRegionRing } from "../IAutoMovieRegionRing";
import { IAutoMovieRegionTriangulation } from "../IAutoMovieRegionTriangulation";
import { canonicalRegion } from "../canonicalRegion";
import { emptyMeshTarget } from "../emptyMeshTarget";
import { meshOf } from "../meshOf";
import { pushFlatTriangle } from "../pushFlatTriangle";
import { signedArea } from "../signedArea";
import { trianglesOf } from "../trianglesOf";
import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import { compileAutoMovieSweep } from "./compileAutoMovieSweep";

/** Points per loop of a curved section when the caller gives no count. */
const COLUMNS: number = 32;

/**
 * Triangulate a sweep directly into a closed mesh, for hard-edged members such
 * as profiles, rails, pipes and tapering piers that need no subdivision cage.
 *
 * Rings sit at the given spine parameters, by default the chord-length shares
 * of the spine's own points, so a sweep along a polyline gets one ring per
 * corner and straight walls between them. Each ring is every loop of the
 * sweep at that parameter: a polygon section under parameter correspondence
 * gives exactly its corners, so corners stay corners; any other loop gives
 * `columns` points at even parameters. Rings are laid out by
 * `canonicalRegion`, outer loop counterclockwise and holes clockwise, so the
 * walls between consecutive rings face out of the solid and the hole walls
 * into the holes. Both ends are capped by triangulating the end rings as
 * planar regions (`trianglesOf`) unless `caps` is false.
 *
 * `flat` shading gives every wall triangle its own corners and plane normal,
 * so section corners and ring edges stay creases; `smooth` shares each ring
 * point between its walls and takes area-weighted vertex normals (`meshOf`),
 * so a polygon approximating a round section reads round. The atlas is
 * metric: on the walls `u` is the distance round the ring and `v` the spine
 * parameter times the spine's polygon length, the distance along a path of
 * straight legs; caps take their section-plane coordinates. A smooth wall
 * repeats each ring's first point at the end of the ring so the seam can
 * carry both `u` 0 and the ring's length, and pools the two normals there.
 *
 * Whether the solid intersects itself is the author's: a spine turning
 * tighter than the section is wide folds the walls through each other.
 *
 * @param props.sweep The sweep, only read.
 * @param props.rows Spine parameters of the rings, at least two, strictly increasing from 0 to 1; omitted, the spine points' chord-length shares.
 * @param props.columns Points per loop for a section that is not a polygon under parameter correspondence, at least 3; omitted, 32.
 * @param props.caps Whether to close both ends; omitted, true.
 * @param props.shading `flat` or `smooth`; omitted, `flat`.
 * @returns A new mesh with normals and metric UVs and no skin.
 * @throws Error when `compileAutoMovieSweep` refuses the sweep, the rows or columns are invalid, a ring is not a valid planar region, or a ring winds the other way from the first.
 *
 * @evidence contracts/common.md#principled-implementation A ruled loft between corresponding rings of the sweep's own interpolated sections, with canonical region layout so walls face out of the solid, ear-clipped planar caps, and a metric developed atlas; corners are kept by sampling polygons at their corners. Limitation: self-intersection on tight bends is not detected.
 * @evidence contracts/common.md#clear-and-simple-design Section interpolation, frames and holes come from `compileAutoMovieSweep`, region validation and triangulation from `canonicalRegion` and `trianglesOf`, flat triangles from `pushFlatTriangle` and smooth normals from `meshOf`; this function only lays out rings, walls and caps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid rings and winding flips are refused instead of being repaired, and the walls are not smoothed beyond the requested shading.
 * @evidence contracts/common.md#meaningful-documentation States ring placement, loop sampling, layout and orientation, caps, both shadings, the atlas, the seam, the self-intersection premise and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For R rings of P points: O(R P) evaluations and wall triangles, one region validation per ring and two cap triangulations; flat shading emits 6 (R - 1) P wall vertices, smooth (R (P + L)) for L loops.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds one mesh whose buffers the caller owns.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the compiled sweep and ring layouts are released on return and the buffers transferred to the mesh.
 */
export const meshAutoMovieSweep: (props: {
  sweep: IAutoMovieSweep;
  rows?: readonly number[];
  columns?: number;
  caps?: boolean;
  shading?: "flat" | "smooth";
}) => IAutoMovieMesh = (props: {
  sweep: IAutoMovieSweep;
  rows?: readonly number[];
  columns?: number;
  caps?: boolean;
  shading?: "flat" | "smooth";
}): IAutoMovieMesh => {
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(props.sweep);
  const spine: IAutoMovieVector3[] = props.sweep.spine.points;
  const rows: number[] =
    props.rows !== undefined
      ? [...props.rows]
      : spine.map((_: IAutoMovieVector3, k: number): number =>
          k === 0 ? 0 : k === spine.length - 1 ? 1 : chordShare(spine, k),
        );
  if (rows.length < 2 || rows[0] !== 0 || rows[rows.length - 1] !== 1)
    throw new Error(
      "sweep mesh rows must run from 0 to 1 with at least two rings",
    );
  rows.forEach((u: number, k: number): void => {
    if (!Number.isFinite(u) || (k > 0 && !(u > rows[k - 1]!)))
      throw new Error(
        `sweep mesh row ${k} must be finite and follow row ${k - 1}`,
      );
  });
  const columns: number = props.columns ?? COLUMNS;
  if (!Number.isSafeInteger(columns) || columns < 3)
    throw new Error("sweep mesh columns must be an integer of at least 3");
  // parameters of each loop's ring points: a polygon's corners under parameter correspondence, even otherwise
  const parameters: number[][] = Array.from(
    { length: surface.loops },
    (_: unknown, l: number): number[] => {
      const first: IAutoMovieSweep.IStation = props.sweep.stations[0]!;
      const section: IAutoMovieSweepSection =
        l === 0 ? first.section : first.holes![l - 1]!;
      const n: number =
        props.sweep.correspondence === "parameter" && section.type === "polygon"
          ? section.points.length
          : columns;
      return Array.from(
        { length: n },
        (__: unknown, k: number): number => k / n,
      );
    },
  );
  const length: number = surface.path.length;
  const rings: IRing[] = rows.map((u: number, r: number): IRing => {
    const loops: IAutoMovieProfilePoint[][] = parameters.map(
      (ts: number[], l: number): IAutoMovieProfilePoint[] =>
        ts.map((t: number): IAutoMovieProfilePoint => surface.section(u, t, l)),
    );
    const plan: Omit<IAutoMovieRegionTriangulation, "triangles"> =
      canonicalRegion(loops[0]!, loops.slice(1), `sweep mesh ring ${r}`);
    const frame: IAutoMovieSweepFrame = surface.frame(u);
    return {
      frame,
      along: u * length,
      winding: loops.map((loop: IAutoMovieProfilePoint[]): number =>
        Math.sign(signedArea(loop)),
      ),
      plan,
      points: plan.points.map(
        (p: IAutoMovieProfilePoint): IAutoMovieVector3 =>
          Vector3.add(
            frame.origin,
            Vector3.add(
              Vector3.scale(frame.x, p.x),
              Vector3.scale(frame.y, p.y),
            ),
          ),
      ),
    };
  });
  rings.forEach((ring: IRing, r: number): void => {
    ring.winding.forEach((w: number, l: number): void => {
      if (w !== rings[0]!.winding[l])
        throw new Error(
          `sweep mesh ring ${r} loop ${l} winds the other way from ring 0`,
        );
    });
  });

  const walls: IAutoMovieMesh =
    (props.shading ?? "flat") === "flat"
      ? flatWalls(rings)
      : smoothWalls(rings);
  if (!(props.caps ?? true)) return walls;
  const target: IAutoMovieMeshTarget = {
    positions: walls.positions,
    normals: walls.normals!,
    uvs: walls.uvs!,
    indices: walls.indices!,
  };
  const ends: ReadonlyArray<readonly [1 | -1, IRing]> = [
    [-1, rings[0]!],
    [1, rings[rings.length - 1]!],
  ];
  for (const [outward, ring] of ends) {
    const triangles: number[] = trianglesOf(ring.plan);
    const base: number = target.positions.length / 3;
    ring.points.forEach((p: IAutoMovieVector3, k: number): void => {
      target.positions.push(p.x, p.y, p.z);
      target.normals.push(
        ring.frame.normal.x * outward,
        ring.frame.normal.y * outward,
        ring.frame.normal.z * outward,
      );
      target.uvs.push(ring.plan.points[k]!.x, ring.plan.points[k]!.y * outward);
    });
    for (let k: number = 0; k < triangles.length; k += 3)
      target.indices.push(
        base + triangles[k]!,
        base + triangles[k + (outward === 1 ? 1 : 2)]!,
        base + triangles[k + (outward === 1 ? 2 : 1)]!,
      );
  }
  return { ...target, skin: null };
};

/** One ring of the mesh: its plane, its distance along the spine, and its canonical layout in the plane and in space. */
interface IRing {
  frame: IAutoMovieSweepFrame;
  along: number;
  winding: number[];
  plan: Omit<IAutoMovieRegionTriangulation, "triangles">;
  points: IAutoMovieVector3[];
}

/** Chord-length share of spine point `k`. */
const chordShare = (points: IAutoMovieVector3[], k: number): number => {
  let before: number = 0;
  let total: number = 0;
  for (let i: number = 1; i < points.length; ++i) {
    const d: number = Vector3.length(
      Vector3.subtract(points[i]!, points[i - 1]!),
    );
    total += d;
    if (i <= k) before += d;
  }
  return before / total;
};

/** Walls whose triangles own their corners and plane normals. */
const flatWalls = (rings: IRing[]): IAutoMovieMesh => {
  const target: IAutoMovieMeshTarget = emptyMeshTarget();
  for (const span of rings[0]!.plan.rings)
    for (let leg: number = 0; leg + 1 < rings.length; ++leg) {
      const near: IRing = rings[leg]!;
      const far: IRing = rings[leg + 1]!;
      let nearAround: number = 0;
      let farAround: number = 0;
      for (let step: number = 0; step < span.count; ++step) {
        const head: number = span.start + step;
        const tail: number = span.start + ((step + 1) % span.count);
        const nearLength: number = gap(near, head, tail);
        const farLength: number = gap(far, head, tail);
        const corners: ReadonlyArray<
          readonly [IAutoMovieVector3, number, number]
        > = [
          [far.points[head]!, farAround, far.along],
          [near.points[head]!, nearAround, near.along],
          [near.points[tail]!, nearAround + nearLength, near.along],
          [far.points[tail]!, farAround + farLength, far.along],
        ];
        pushFlatTriangle(target, [corners[0]!, corners[1]!, corners[2]!]);
        pushFlatTriangle(target, [corners[0]!, corners[2]!, corners[3]!]);
        nearAround += nearLength;
        farAround += farLength;
      }
    }
  return { ...target, skin: null };
};

/** Walls sharing each ring point, with a repeated seam point per ring and loop. */
const smoothWalls = (rings: IRing[]): IAutoMovieMesh => {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const groups: number[][] = [];
  for (const span of rings[0]!.plan.rings as IAutoMovieRegionRing[]) {
    const first: number = positions.length / 3;
    const width: number = span.count + 1;
    rings.forEach((ring: IRing): void => {
      let around: number = 0;
      for (let step: number = 0; step <= span.count; ++step) {
        const index: number = span.start + (step % span.count);
        const p: IAutoMovieVector3 = ring.points[index]!;
        positions.push(p.x, p.y, p.z);
        uvs.push(around, ring.along);
        if (step < span.count)
          around += gap(ring, index, span.start + ((step + 1) % span.count));
      }
      const row: number = positions.length / 3 - width;
      groups.push([row, row + span.count]);
    });
    for (let leg: number = 0; leg + 1 < rings.length; ++leg)
      for (let step: number = 0; step < span.count; ++step) {
        const nearHead: number = first + leg * width + step;
        const farHead: number = nearHead + width;
        indices.push(
          farHead,
          nearHead,
          nearHead + 1,
          farHead,
          nearHead + 1,
          farHead + 1,
        );
      }
  }
  return meshOf(positions, indices, uvs, groups);
};

/** Distance between two points of a ring in its section plane. */
const gap = (ring: IRing, a: number, b: number): number =>
  Math.hypot(
    ring.plan.points[b]!.x - ring.plan.points[a]!.x,
    ring.plan.points[b]!.y - ring.plan.points[a]!.y,
  );
