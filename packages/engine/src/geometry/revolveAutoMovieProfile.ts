import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { countAtLeast } from "./countAtLeast";
import { finitePoint } from "./finitePoint";
import { meshOf } from "./meshOf";

/**
 * Revolve a radius/height profile around local Y into a closed surface.
 *
 * Each profile point is `x` = radius and `y` = height, in metres. Unlike
 * extrusion and sweep, the meridian is taken as authored rather than hulled, so
 * an arbitrary silhouette polyline is allowed here; only its radii must be
 * non-negative. Profile order owns the surface orientation, and every output
 * buffer is new.
 *
 * Closure follows the meridian and is the caller's to declare: a meridian that
 * starts and ends on the axis closes into a solid whose pole rings collapse to
 * zero-area triangles, and one that does not is an open tube with a rim at each
 * end. Neither is repaired.
 *
 * The surface carries a metric atlas measured the way its siblings measure
 * theirs: distance travelled around the section against distance travelled
 * along the path. Around is the arc the vertex actually sits on, `theta` times
 * its own radius, so a baluster turned to a 0.3 m radius shows 1.88 m of grain
 * around it rather than one turn of an image stretched to fit it. Along is the
 * meridian's own polyline length, which is slant distance on a cone and
 * developed height on a cylinder rather than the shortcut through the axis.
 *
 * Around runs against the direction the lattice is built in, and that is the
 * whole reason it is written `2 * pi - theta` rather than `theta`. The outward
 * normal this winding produces, the meridian running up, and `theta` running
 * round form a left-handed triple, so an atlas keyed on `theta` directly comes
 * out mirrored against every other builder here: a letter reads backwards, and
 * a normal map's tangent basis is handed the wrong way, which tilts the
 * lighting rather than merely the image. Reversing the axis that closes on
 * itself costs nothing an author can name, because which way round a surface of
 * revolution is traversed carries no authored meaning, while reversing the
 * meridian instead would put `v = 0` at whichever end of the profile was typed
 * last.
 *
 * The lattice carries a duplicate ring at `theta = 2 * pi`, which is what makes
 * the seam an honest cut: one edge of the seam reads zero and the other reads
 * the full circumference at that radius, so the closing quad never
 * interpolates backwards through the atlas. Those two phases coincide only
 * when the declared texture repeat divides that circumference; the kernel does
 * not stretch a finish to hide a mismatched seam. A changing radius also makes
 * the surface non-developable in general. Scaling by radius preserves local
 * circumference scale on every parallel and therefore shears the flat atlas
 * between unequal parallels instead of pretending one global isometry exists.
 * A meridian point on the axis is a pole, and its whole ring reads zero around,
 * because a circle of no radius has no arc to travel. Its collapsed triangles
 * remain the topology this operator declares; their UVs stay finite, and they
 * are the one place the atlas has no handedness to report. The duplicate seam
 * vertices share their accumulated face normals before normalization, and every
 * duplicate of an axis pole shares that pole's normal as well, so the UV cut
 * does not introduce a lighting discontinuity.
 *
 * How far that shear goes decides what finish the surface can carry. The map
 * is exactly equiareal, its Jacobian determinant one everywhere, so the whole
 * distortion is pure shear of `2 * pi - theta` times `dr / ds`. Worst
 * anisotropy over a full turn is therefore
 * `(sqrt(k * k + 4) + k) / (sqrt(k * k + 4) - k)` at `k = 2 * pi * |dr / ds|`:
 * 1.0 on a cylinder, 2.0 at 6.5 degrees off the axis, 4.0 at 13.8 degrees, 21.5
 * on a 45-degree cone, and 41 where the meridian runs level, which is what a
 * dome's pole and a cone's tip approach. A tile that reads square beside the
 * seam is drawn into a ribbon a quarter turn away, and the curve of constant
 * `u` spirals instead of following a meridian.
 *
 * That is the price of the metric statement rather than a defect awaiting
 * repair. Measuring true arc around forces `u` to be `theta * r` plus some
 * `c(s)`, whose derivative would have to be `-theta * dr / ds` to cancel the
 * shear, and no function of `s` alone does that at every `theta`. Choosing
 * `c(s)` only moves where the shear vanishes, which is why it sits at the seam
 * here; centring it would halve the worst case to 11.8 at a pole, still far
 * past readable. The pole is not a second fault: cut the tip off a cone and the
 * frustum that remains shears exactly as hard, so the collapsed pole triangles
 * above are a topology note rather than the cause.
 *
 * A directional finish therefore wants a meridian within a few degrees of the
 * axis, which is a drum, a shaft, a turret barrel. A sloped or domed form that
 * must carry one is authored as flat faces through
 * {@link buildAutoMoviePolyhedron}, whose per-face frame is isometric, or as a
 * flat cap through {@link extrudeAutoMovieRegion}, and a spire built as facets
 * is how a spire is built anyway. {@link loftAutoMovieSections} is not the
 * escape here that it is for the coordinate-less builders. It measures this
 * same pair, a tapered loft shears the same way, and it gives up something this
 * one keeps: the map here is exactly equiareal, while a loft's `v` is path
 * distance rather than surface distance, so a taper or a bend costs it texel
 * density on top of the angle. Where the form has to stay a true surface of
 * revolution, the finish on it stays non-directional.
 *
 * @param props.profile Meridian points from one end to the other, at least two, with finite coordinates and `x >= 0`.
 * @param props.segments Angular divisions of the full turn, a safe integer of at least 3.
 * @returns A new unskinned mesh of `(segments + 1) * profile.length` vertices and `2 * segments * (profile.length - 1)` triangles, with smooth normals and the metric atlas above.
 * @throws Error when the profile has fewer than two points, a coordinate is not finite, a radius is negative, or `segments` is not a safe integer of at least 3.
 *
 * @evidence contracts/common.md#principled-implementation A surface of revolution sampled on a regular `theta` lattice with an explicit duplicate seam ring, smooth normals from area-weighted face normals merged across the seam and each pole ring by `meshOf`'s normal groups, and an atlas of `(2 * pi - theta) * r` against cumulative meridian length, whose equiareal shear is derived above; poles collapse to zero-area triangles that the topology report counts, and the remaining limitation is that shear, which no choice of `u` offset can remove.
 * @evidence contracts/common.md#clear-and-simple-design Admission, lattice, index strip and normal groups sit in one function because each depends on the same profile count and segment count; normal accumulation and buffer assembly are delegated to the shared `meshOf`, and admission to the shared `countAtLeast` and `finitePoint` guards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The meridian is never hulled, closed, reordered or deduplicated, and a pole is not welded; the seam keeps its true UV cut rather than a stretched finish, and normal groups only share lighting across vertices that are the same physical point.
 * @evidence contracts/common.md#meaningful-documentation States the profile axes and unit, closure and pole behaviour, the atlas formula and its handedness, the seam and shear limits with measured anisotropy, which builders to use instead for a directional finish, and each parameter's domain, the output counts and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms For P profile points and S segments, the lattice, indices and normal pass are each O(S * P) with one cosine and sine per segment; the pole groups add S + 1 entries per axis point, and output size is the floor.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds one requested mesh whose buffers the caller owns, so nothing is cached between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the meridian lengths and normal groups are released on return, and the position, UV, index and normal arrays are transferred to the returned mesh, sized by S * P.
 */
export const revolveAutoMovieProfile: (props: {
  profile: readonly IAutoMovieProfilePoint[];
  segments: number;
}) => IAutoMovieMesh = (props: {
  profile: readonly IAutoMovieProfilePoint[];
  segments: number;
}): IAutoMovieMesh => {
  if (props.profile.length < 2)
    throw new Error("revolve profile needs at least two points");
  countAtLeast(props.segments, 3, "revolve segments");
  props.profile.forEach(
    (point: IAutoMovieProfilePoint, index: number): void => {
      finitePoint(point, `revolve profile[${index}]`);
      if (point.x < 0)
        throw new Error(`revolve profile[${index}] radius must be >= 0`);
    },
  );
  const meridian: number[] = [0];
  for (let index: number = 1; index < props.profile.length; ++index)
    meridian.push(
      meridian[index - 1]! +
        Math.hypot(
          props.profile[index]!.x - props.profile[index - 1]!.x,
          props.profile[index]!.y - props.profile[index - 1]!.y,
        ),
    );
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let segment: number = 0; segment <= props.segments; ++segment) {
    const angle: number = (segment / props.segments) * Math.PI * 2;
    const cosine: number = Math.cos(angle);
    const sine: number = Math.sin(angle);
    props.profile.forEach(
      (point: IAutoMovieProfilePoint, index: number): void => {
        positions.push(point.x * cosine, point.y, point.x * sine);
        uvs.push((Math.PI * 2 - angle) * point.x, meridian[index]!);
      },
    );
  }
  const count: number = props.profile.length;
  const indices: number[] = [];
  for (let segment: number = 0; segment < props.segments; ++segment)
    for (let point: number = 0; point + 1 < count; ++point) {
      const current: number = segment * count + point;
      const next: number = current + count;
      indices.push(current, current + 1, next);
      indices.push(current + 1, next + 1, next);
    }
  const normalGroups: number[][] = props.profile.map(
    (point: IAutoMovieProfilePoint, index: number): number[] =>
      point.x === 0
        ? Array.from(
            { length: props.segments + 1 },
            (_: unknown, segment: number): number => segment * count + index,
          )
        : [index, props.segments * count + index],
  );
  return meshOf(positions, indices, uvs, normalGroups);
};
