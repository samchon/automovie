import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { PLANAR_EPSILON } from "../architecture/constants/PLANAR_EPSILON";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieLoftSection } from "./IAutoMovieLoftSection";
import { IAutoMovieMeshTarget } from "./IAutoMovieMeshTarget";
import { IAutoMoviePathSectionFrame } from "./IAutoMoviePathSectionFrame";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { canonicalRegion } from "./canonicalRegion";
import { emptyMeshTarget } from "./emptyMeshTarget";
import { finiteVector } from "./finiteVector";
import { pathFrames } from "./pathFrames";
import { pushFlatTriangle } from "./pushFlatTriangle";
import { signedArea } from "./signedArea";
import { trianglesOf } from "./trianglesOf";

/**
 * Loft free-form sections along a three-dimensional path, interpolating the
 * section between them.
 *
 * `sweepAutoMovieProfile` carries one hulled profile down the whole path, so a
 * tapered pier, a section that changes on the way, and any concave or hollow
 * section are outside it. Here each path point's section is the linear blend
 * of the two authored sections bracketing it, by chord length along the path:
 * two sections differing only in scale make a taper, two differing in shape a
 * loft, and one section declared at both ends a sweep of a section the sweep
 * would have hulled. Both operations place sections in `pathFrames`' frames.
 *
 * Correspondence is authored, never inferred. Every section declares the same
 * rings with the same point counts wound the same way, and point `k` of a ring
 * blends into point `k` of that ring at the next section; a mismatch is refused
 * with its own diagnostic rather than resampled. Both ends are capped from
 * their own authored section, every triangle owns its corners so section
 * corners stay creases, and the side atlas is metric in the developed frame:
 * distance around the section as U against distance along the path as V, the
 * same pair `revolveAutoMovieProfile` measures. Whether the solid intersects
 * itself is the author's to decide: a path turning tighter than the section is
 * wide folds the surface through itself, and this kernel measures neither.
 *
 * That atlas is exact in U but not in texel density, because V is distance
 * along the path rather than along the surface. A changing section tilts each
 * ruling off the path by the taper angle, so a leg's area ratio is that
 * angle's cosine: a section growing 0.5 m over 4 m reads 0.9923. A turning path
 * costs more: where the path's curvature radius is `R`, a section point offset
 * a signed `d` within the plane of the turn travels `(R + d) / R` as far as the
 * path, so its area ratio is `R / (R + d)`, which depends on `d / R` alone; a
 * section reaching a quarter of the bend radius each side spans 0.8 to 1.333, a
 * 1.67:1 density range across one moulding. A point displaced only
 * perpendicular to that plane has `d` of zero, so around a level bend the
 * section's width costs density and its height does not: turn a band on edge
 * before curving it, or mitre a straight run instead. Measuring V along the
 * surface would give every section point its own V at one station, a developed
 * layout of a bent tube rather than this frame, so a finish wanting even
 * density belongs on a straight run of constant section.
 *
 * Refused, before any frame or buffer is built: fewer than two path points, a
 * non-finite point, a point within `PLANAR_EPSILON` of its predecessor, fewer
 * than two sections, a non-finite or non-increasing `at`, sections not running
 * from `at` 0 to 1, an invalid section region, and a section whose rings
 * differ from the first section's in count, point count or winding. Inputs are
 * only read; distances are metres.
 *
 * @param props.path Path points in metres, at least two.
 * @param props.sections Sections at increasing path fractions from 0 to 1.
 * @returns A closed mesh with flat normals and metric UVs.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise-linear interpolation of corresponding section points by normalized chord length, written as `(1 - t) * a + t * b` so a station on a declared section reproduces it bit for bit and the end caps triangulated from the authored sections sit exactly on the side surface; each side quad is split into two flat triangles because two changing sections make it nonplanar.
 * @evidence contracts/common.md#clear-and-simple-design Validation and layout come from `canonicalRegion`, frames from `pathFrames`, cap triangles from `trianglesOf` and flat triangles from `pushFlatTriangle`; this function owns only correspondence checks, station blending and the atlas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Correspondence mismatches are refused instead of resampled, the density distortion is stated as a closed form instead of corrected per surface, and the only tolerance is the shared `PLANAR_EPSILON` repeat-point test.
 * @evidence contracts/common.md#meaningful-documentation States how it relates to the sweep, the blend and correspondence rules, the cap, crease and atlas conventions, the self-intersection limit, the exact density distortion and how to avoid it, every refusal, ownership and units.
 * @evidence contracts/performance.md#efficient-algorithms For p path points, s sections and n points per section: validation and layout cost one canonical layout per section, then each station blends n points in O(n) after a section search of O(s), and the sides emit two triangles per ring edge per leg, O(p n) in total; only the two caps are triangulated.
 * @evidence contracts/performance.md#reuse-equivalent-work Each section is validated and laid out once and the layouts are reused by every station blend and both caps, and the path frames are computed once for every station.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the target's four arrays, 6 n (p - 1) side vertices from two flat triangles per ring edge per leg, plus n per cap; the section layouts, frames and stations are released on return.
 * @author Samchon
 */
export const loftAutoMovieSections = (props: {
  /** Path points in metres, at least two, no point repeating its neighbour. */
  path: readonly IAutoMovieVector3[];

  /** Sections at strictly increasing path fractions from 0 to 1. */
  sections: readonly IAutoMovieLoftSection[];
}): IAutoMovieMesh => {
  if (props.path.length < 2)
    throw new Error("loft path needs at least two points");
  props.path.forEach((point: IAutoMovieVector3, index: number): void => {
    finiteVector(point, `loft path[${index}]`);
    if (
      index > 0 &&
      Vector3.length(Vector3.subtract(point, props.path[index - 1]!)) <=
        PLANAR_EPSILON
    )
      throw new Error(`loft path[${index}] repeats the point beside it`);
  });
  if (props.sections.length < 2)
    throw new Error("loft needs at least two sections");
  props.sections.forEach(
    (section: IAutoMovieLoftSection, index: number): void => {
      if (Number.isFinite(section.at) === false)
        throw new Error(`loft section[${index}] at must be finite`);
      if (index > 0 && section.at <= props.sections[index - 1]!.at)
        throw new Error(
          `loft section[${index}] at must be greater than section[${index - 1}] at`,
        );
    },
  );
  if (
    props.sections[0]!.at !== 0 ||
    props.sections[props.sections.length - 1]!.at !== 1
  )
    throw new Error("loft sections must run from at 0 to at 1");
  const plans: Omit<IAutoMovieRegionTriangulation, "triangles">[] =
    props.sections.map(
      (
        section: IAutoMovieLoftSection,
        index: number,
      ): Omit<IAutoMovieRegionTriangulation, "triangles"> =>
        canonicalRegion(
          section.outer,
          section.holes ?? [],
          `loft section[${index}]`,
        ),
    );
  const first: readonly (readonly IAutoMovieProfilePoint[])[] =
    loftSectionRings(props.sections[0]!);
  props.sections.forEach(
    (section: IAutoMovieLoftSection, index: number): void => {
      const rings: readonly (readonly IAutoMovieProfilePoint[])[] =
        loftSectionRings(section);
      if (rings.length !== first.length)
        throw new Error(
          `loft section[${index}] must declare the same ${first.length} rings as section[0]`,
        );
      rings.forEach(
        (ring: readonly IAutoMovieProfilePoint[], at: number): void => {
          if (ring.length !== first[at]!.length)
            throw new Error(
              `loft section[${index}] ring[${at}] must carry the same ${first[at]!.length} points as section[0]`,
            );
          if (Math.sign(signedArea(ring)) !== Math.sign(signedArea(first[at]!)))
            throw new Error(
              `loft section[${index}] ring[${at}] must wind the same way as section[0]`,
            );
        },
      );
    },
  );

  const travelled: number[] = [0];
  for (let index: number = 1; index < props.path.length; ++index)
    travelled.push(
      travelled[index - 1]! +
        Vector3.length(
          Vector3.subtract(props.path[index]!, props.path[index - 1]!),
        ),
    );
  const total: number = travelled[travelled.length - 1]!;
  const frames: IAutoMoviePathSectionFrame[] = pathFrames(
    props.path,
    "loft path",
  );
  const stations: ILoftStation[] = props.path.map(
    (point: IAutoMovieVector3, index: number): ILoftStation => {
      const { tangent, right, up } = frames[index]!;
      const profile: IAutoMovieProfilePoint[] = loftSectionAt(
        plans,
        props.sections,
        travelled[index]! / total,
      );
      return {
        tangent,
        profile,
        points: profile.map(
          (corner: IAutoMovieProfilePoint): IAutoMovieVector3 => ({
            x: point.x + right.x * corner.x + up.x * corner.y,
            y: point.y + right.y * corner.x + up.y * corner.y,
            z: point.z + right.z * corner.x + up.z * corner.y,
          }),
        ),
      };
    },
  );

  const target: IAutoMovieMeshTarget = emptyMeshTarget();
  const caps: ReadonlyArray<
    readonly [outward: 1 | -1, station: ILoftStation, triangles: number[]]
  > = [
    [-1, stations[0]!, trianglesOf(plans[0]!)],
    [1, stations[stations.length - 1]!, trianglesOf(plans[plans.length - 1]!)],
  ];
  for (const [outward, station, triangles] of caps) {
    const base: number = target.positions.length / 3;
    station.points.forEach((point: IAutoMovieVector3, index: number): void => {
      target.positions.push(point.x, point.y, point.z);
      target.normals.push(
        station.tangent.x * outward,
        station.tangent.y * outward,
        station.tangent.z * outward,
      );
      target.uvs.push(
        station.profile[index]!.x,
        station.profile[index]!.y * outward,
      );
    });
    for (let at: number = 0; at < triangles.length; at += 3)
      target.indices.push(
        base + triangles[at]!,
        base + triangles[at + (outward === 1 ? 1 : 2)]!,
        base + triangles[at + (outward === 1 ? 2 : 1)]!,
      );
  }
  for (const span of plans[0]!.rings)
    for (let leg: number = 0; leg + 1 < stations.length; ++leg) {
      const near: ILoftStation = stations[leg]!;
      const far: ILoftStation = stations[leg + 1]!;
      let nearAlong: number = 0;
      let farAlong: number = 0;
      for (let step: number = 0; step < span.count; ++step) {
        const head: number = span.start + step;
        const tail: number = span.start + ((step + 1) % span.count);
        const nearLength: number = Math.hypot(
          near.profile[tail]!.x - near.profile[head]!.x,
          near.profile[tail]!.y - near.profile[head]!.y,
        );
        const farLength: number = Math.hypot(
          far.profile[tail]!.x - far.profile[head]!.x,
          far.profile[tail]!.y - far.profile[head]!.y,
        );
        const corners: ReadonlyArray<
          readonly [IAutoMovieVector3, number, number]
        > = [
          [far.points[head]!, farAlong, travelled[leg + 1]!],
          [near.points[head]!, nearAlong, travelled[leg]!],
          [near.points[tail]!, nearAlong + nearLength, travelled[leg]!],
          [far.points[tail]!, farAlong + farLength, travelled[leg + 1]!],
        ];
        pushFlatTriangle(target, [corners[0]!, corners[1]!, corners[2]!]);
        pushFlatTriangle(target, [corners[0]!, corners[2]!, corners[3]!]);
        nearAlong += nearLength;
        farAlong += farLength;
      }
    }
  return { ...target, skin: null };
};

/** One path point's blended section, in section XY and placed in 3D. */
interface ILoftStation {
  /** The path tangent the end caps face along. */
  tangent: IAutoMovieVector3;

  /** The blended canonical section in section-local XY metres. */
  profile: IAutoMovieProfilePoint[];

  /** The same section placed in the path frame, point for point. */
  points: IAutoMovieVector3[];
}

/** One loft section's rings in canonical declaration order. */
const loftSectionRings = (
  section: IAutoMovieLoftSection,
): ReadonlyArray<readonly IAutoMovieProfilePoint[]> => [
  section.outer,
  ...(section.holes ?? []),
];

/**
 * The section at one fraction of the path, blended from the two around it.
 *
 * The blend is written as `(1 - t) * a + t * b` rather than `a + (b - a) * t`
 * so a station landing exactly on a declared section reproduces that section's
 * coordinates bit for bit, which is what lets the end caps be triangulated from
 * the authored section and still sit on the surface the sides sweep out.
 */
const loftSectionAt = (
  plans: ReadonlyArray<Omit<IAutoMovieRegionTriangulation, "triangles">>,
  declared: readonly IAutoMovieLoftSection[],
  fraction: number,
): IAutoMovieProfilePoint[] => {
  let span: number = 0;
  while (span + 2 < declared.length && declared[span + 1]!.at <= fraction)
    ++span;
  const from: number = declared[span]!.at;
  const progress: number = (fraction - from) / (declared[span + 1]!.at - from);
  const before: IAutoMovieProfilePoint[] = plans[span]!.points;
  const after: IAutoMovieProfilePoint[] = plans[span + 1]!.points;
  return before.map(
    (point: IAutoMovieProfilePoint, index: number): IAutoMovieProfilePoint => ({
      x: point.x * (1 - progress) + after[index]!.x * progress,
      y: point.y * (1 - progress) + after[index]!.y * progress,
    }),
  );
};
