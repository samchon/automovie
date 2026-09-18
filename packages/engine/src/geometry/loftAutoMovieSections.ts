/**
 * Connect corresponding planar rings along an authored three-dimensional
 * path. Asset authors call the proceduralMesh export; all distances use metres.
 * Validate path, station order and ring correspondence before creating frames
 * or buffers. Shared triangulation supplies end caps, transported frames locate
 * stations, and this owner interpolates sections and emits metric side UVs.
 * Caller arrays are copied or read only. Changing station arithmetic can break
 * exact cap attachment and authored coordinate-scale assumptions.
 */
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { finiteVector } from "./finiteVector";
import { emptyMeshTarget } from "./emptyMeshTarget";
import { pushFlatTriangle } from "./pushFlatTriangle";
import { IAutoMovieLoftSection } from "./IAutoMovieLoftSection";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { pathFrames } from "./pathFrames";
import { PLANAR_EPSILON } from "../architecture/constants/PLANAR_EPSILON";
import { canonicalRegion } from "./canonicalRegion";
import { signedArea } from "./signedArea";
import { trianglesOf } from "./trianglesOf";

/**
 * Loft free-form sections along a path, interpolating the section between them.
 *
 * [sweepAutoMovieProfile](./proceduralConvexProfile.ts) carries one hulled profile down the whole path,
 * so a tapered pier, a section that changes on the way, and any concave or
 * hollow section are all outside it. Here each station's section is the linear
 * blend of the two authored sections bracketing it, measured by chord length
 * along the path, which is the variable-section spine and the taper in one
 * operation: two sections that differ only in scale is a taper, two that differ
 * in shape is a loft, and the same section declared at both ends is a sweep of
 * a section [sweepAutoMovieProfile](./proceduralConvexProfile.ts) would have hulled.
 * Both operations share the same transported section frame along the path.
 *
 * Correspondence is authored, never inferred. Every section declares the same
 * rings with the same point counts wound the same way, and point `k` of a ring
 * blends into point `k` of that ring at the next section. A kernel that
 * resampled instead would silently decide which corner of a section becomes
 * which corner of the next, so a mismatch is refused with its own diagnostic.
 *
 * Both ends are capped from their own authored section, every triangle owns its
 * corners so the section's corners stay creases, and the atlas is metric in the
 * developed frame: the distance travelled around the section against the
 * distance travelled along the path, the same pair
 * [revolveAutoMovieProfile](./proceduralRevolution.ts) measures for a surface of revolution. Whether
 * the swept solid intersects itself is the author's to
 * decide, exactly as it is for a sweep: a path that turns tighter than the
 * section is wide folds the surface through itself, and this kernel measures
 * neither the turn nor the width.
 *
 * Where this atlas differs from a revolution's is worth stating, because the
 * difference is texel density rather than the angle between the axes, and
 * density is the distortion an author cannot see coming. A revolution's `v` is
 * the meridian's own length, so its map is exactly equiareal and only shears. A
 * loft's `v` is distance along the path, which is not distance along the
 * surface, and the gap between those two is area the atlas gains or loses.
 *
 * It opens two ways, and both are closed forms rather than tendencies. A
 * changing section tilts each ruling off the path by the taper angle, so the
 * ruling is longer than the path step by that angle's secant and the leg's area
 * ratio is that angle's cosine: a section growing 0.5 m over 4 m of path reads
 * 0.9923. A turning path is the larger one. At a point of the path whose
 * curvature radius is `R`, a section point sitting a signed `d` away from the
 * path travels `(R + d) / R` times as far as the path does, so its area ratio
 * is `R / (R + d)`. That depends on `d / R` alone, so scaling the whole member
 * up changes nothing: a section reaching a quarter of the bend radius on each
 * side of the path spans 0.8 to 1.333 across itself, a 1.67:1 density range on
 * one moulding, stretched on the outside of the turn and crowded on the inside.
 * A constant section does not save it; the bend alone produces it.
 *
 * `d` is the offset in the plane the path turns in, not the distance from the
 * path, and the difference is what an author can act on. A point displaced only
 * perpendicular to that plane carries `d` of zero however far out it sits, so
 * around a level bend it is the section's width that costs density and not its
 * height: a tall thin fillet loses almost nothing where a wide flat band of the
 * same reach loses a third on the outside and doubles on the inside. Turn a
 * band on edge before you curve it, or mitre a straight run instead.
 *
 * That is declared rather than pending, for the reason the revolution's shear
 * is. Making `v` measure surface distance would give every section point its
 * own `v` at one station, which is a developed layout of a bent tube rather
 * than this frame, and it would rewrite the coordinates of every surface
 * already authored against this one. So a finish wanting even texel density
 * belongs on a straight run of constant section, and a cornice that has to turn
 * a corner carries a finish that does not report its own density.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Connects authored planar sections along a declared path.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses incompatible ring topology rather than inventing correspondence.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-surface-coordinate-convention Measures section travel against path travel in the same developed metre frame the convention states, so one declared scale reads the same on a loft as on a flat face.
 */
export const loftAutoMovieSections = (props: {
  path: readonly IAutoMovieVector3[];
  sections: readonly IAutoMovieLoftSection[];
}): IAutoMovieMesh => {
  if (props.path.length < 2)
    throw new Error("loft path needs at least two points");
  props.path.forEach((point, index) => {
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
  props.sections.forEach((section, index) => {
    if (Number.isFinite(section.at) === false)
      throw new Error(`loft section[${index}] at must be finite`);
    if (index > 0 && section.at <= props.sections[index - 1]!.at)
      throw new Error(
        `loft section[${index}] at must be greater than section[${index - 1}] at`,
      );
  });
  if (
    props.sections[0]!.at !== 0 ||
    props.sections[props.sections.length - 1]!.at !== 1
  )
    throw new Error("loft sections must run from at 0 to at 1");
  const plans = props.sections.map((section, index) =>
    canonicalRegion(
      section.outer,
      section.holes ?? [],
      `loft section[${index}]`,
    ),
  );
  const first = loftSectionRings(props.sections[0]!);
  props.sections.forEach((section, index) => {
    const rings = loftSectionRings(section);
    if (rings.length !== first.length)
      throw new Error(
        `loft section[${index}] must declare the same ${first.length} rings as section[0]`,
      );
    rings.forEach((ring, at) => {
      if (ring.length !== first[at]!.length)
        throw new Error(
          `loft section[${index}] ring[${at}] must carry the same ${first[at]!.length} points as section[0]`,
        );
      if (Math.sign(signedArea(ring)) !== Math.sign(signedArea(first[at]!)))
        throw new Error(
          `loft section[${index}] ring[${at}] must wind the same way as section[0]`,
        );
    });
  });

  const travelled = [0];
  for (let index = 1; index < props.path.length; ++index)
    travelled.push(
      travelled[index - 1]! +
        Vector3.length(
          Vector3.subtract(props.path[index]!, props.path[index - 1]!),
        ),
    );
  const total = travelled[travelled.length - 1]!;
  const frames = pathFrames(props.path, "loft path");
  const stations = props.path.map((point, index) => {
    const { tangent, right, up } = frames[index]!;
    const profile = loftSectionAt(
      plans,
      props.sections,
      travelled[index]! / total,
    );
    return {
      tangent,
      profile,
      points: profile.map((corner) => ({
        x: point.x + right.x * corner.x + up.x * corner.y,
        y: point.y + right.y * corner.x + up.y * corner.y,
        z: point.z + right.z * corner.x + up.z * corner.y,
      })),
    };
  });

  const target = emptyMeshTarget();
  for (const [outward, station, triangles] of [
    [-1, stations[0]!, trianglesOf(plans[0]!)],
    [1, stations[stations.length - 1]!, trianglesOf(plans[plans.length - 1]!)],
  ] as ReadonlyArray<
    readonly [1 | -1, (typeof stations)[number], readonly number[]]
  >) {
    const base = target.positions.length / 3;
    station.points.forEach((point, index) => {
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
    for (let at = 0; at < triangles.length; at += 3)
      target.indices.push(
        base + triangles[at]!,
        base + triangles[at + (outward === 1 ? 1 : 2)]!,
        base + triangles[at + (outward === 1 ? 2 : 1)]!,
      );
  }
  for (const span of plans[0]!.rings)
    for (let leg = 0; leg + 1 < stations.length; ++leg) {
      const near = stations[leg]!;
      const far = stations[leg + 1]!;
      let nearAlong = 0;
      let farAlong = 0;
      for (let step = 0; step < span.count; ++step) {
        const head = span.start + step;
        const tail = span.start + ((step + 1) % span.count);
        const nearLength = Math.hypot(
          near.profile[tail]!.x - near.profile[head]!.x,
          near.profile[tail]!.y - near.profile[head]!.y,
        );
        const farLength = Math.hypot(
          far.profile[tail]!.x - far.profile[head]!.x,
          far.profile[tail]!.y - far.profile[head]!.y,
        );
        const corners = [
          [far.points[head]!, farAlong, travelled[leg + 1]!],
          [near.points[head]!, nearAlong, travelled[leg]!],
          [near.points[tail]!, nearAlong + nearLength, travelled[leg]!],
          [far.points[tail]!, farAlong + farLength, travelled[leg + 1]!],
        ] as ReadonlyArray<readonly [IAutoMovieVector3, number, number]>;
        pushFlatTriangle(target, [corners[0]!, corners[1]!, corners[2]!]);
        pushFlatTriangle(target, [corners[0]!, corners[2]!, corners[3]!]);
        nearAlong += nearLength;
        farAlong += farLength;
      }
    }
  return { ...target, skin: null };
};

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
  let span = 0;
  while (span + 2 < declared.length && declared[span + 1]!.at <= fraction)
    ++span;
  const from = declared[span]!.at;
  const progress = (fraction - from) / (declared[span + 1]!.at - from);
  const before = plans[span]!.points;
  const after = plans[span + 1]!.points;
  return before.map((point, index) => ({
    x: point.x * (1 - progress) + after[index]!.x * progress,
    y: point.y * (1 - progress) + after[index]!.y * progress,
  }));
};
