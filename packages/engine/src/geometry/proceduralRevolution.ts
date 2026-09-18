/**
 * Revolve an authored meridian into a metric surface of revolution. The
 * proceduralMesh entry exposes this operation to asset authors. Admit finite
 * nonnegative radii before emitting duplicated seam vertices, then combine
 * normal groups without merging their distinct UVs. All output buffers are new.
 * Profile order owns the surface orientation; the documented atlas distortion
 * is part of the operation rather than a downstream material correction.
 */
import { IAutoMovieMesh } from "@automovie/interface";

import { countAtLeast } from "./countAtLeast";
import { finitePoint } from "./finitePoint";
import { meshOf } from "./meshOf";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * Revolve a radius/height profile around local Y into a closed surface.
 *
 * Unlike extrusion and sweep, the meridian is taken as authored rather than
 * hulled, so an arbitrary silhouette polyline is allowed here; only its radii
 * must be non-negative.
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
 * The lattice already carries a duplicate ring at `theta = 2 * pi`, which is
 * what makes the seam an honest cut: one edge of the seam reads zero and the
 * other reads the full circumference at that radius, so the closing quad never
 * interpolates backwards through the atlas. Those two phases coincide only
 * when the declared texture repeat divides that circumference; the kernel does
 * not stretch a finish to hide a mismatched seam. A changing radius also makes
 * the surface non-developable in general. Scaling by radius preserves local
 * circumference scale on every parallel and therefore shears the flat atlas
 * between unequal parallels instead of pretending one global isometry exists.
 * A meridian point on the axis is a pole, and its whole ring reads zero around,
 * because a circle of no radius has no arc to travel. Its collapsed triangles
 * remain the topology this operator already declares; their UVs stay finite,
 * and they are the one place the atlas has no handedness to report.
 * The duplicate seam vertices share their accumulated face normals before
 * normalization. Every duplicate of an axis pole shares that pole's normal
 * as well, so the UV cut does not introduce a lighting discontinuity.
 *
 * How far that shear goes is worth stating, because it decides what finish the
 * surface can carry. The map is exactly equiareal, its Jacobian determinant one
 * everywhere, so the whole distortion is pure shear of `2 * pi - theta` times
 * `dr / ds`. Worst anisotropy over a full turn is therefore
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
 * past readable, and would rewrite the coordinates of every surface already
 * authored against this one. The pole is not a second fault: cut the tip off a
 * cone and the frustum that remains shears exactly as hard, so the collapsed
 * pole triangles above are a topology note rather than the cause.
 *
 * A directional finish therefore wants a meridian within a few degrees of the
 * axis, which is a drum, a shaft, a turret barrel. A sloped or domed form that
 * must carry one is authored as flat faces through
 * [buildAutoMoviePolyhedron](./proceduralPolyhedron.ts), whose per-face frame is isometric, or as a
 * flat cap through [extrudeAutoMovieRegion](./proceduralRegionExtrusion.ts), and a spire built as facets
 * is how a spire is built anyway. [loftAutoMovieSections](./proceduralLoft.ts) is not the
 * escape here that it is for the coordinate-less builders. It measures this
 * same pair, a tapered loft shears the same way, and it gives up something this
 * one keeps: the map here is exactly equiareal, while a loft's `v` is path
 * distance rather than surface distance, so a taper or a bend costs it texel
 * density on top of the angle. Where the form has to stay a true surface of
 * revolution, the finish on it stays non-directional.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Builds a surface by revolving an authored metric profile.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves the authored meridian topology through revolution.
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-texture-coordinates-scale Gives the revolved surface texture coordinates in a stated metric coordinate system so a declared scale places the same way every run.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Emits the coordinate set a material binding samples the revolved surface through.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-surface-coordinate-convention Lays the revolved atlas under the shared surface coordinate convention rather than under a rule of its own.
 */
export const revolveAutoMovieProfile = (props: {
  profile: readonly IAutoMovieProfilePoint[];
  segments: number;
}): IAutoMovieMesh => {
  if (props.profile.length < 2)
    throw new Error("revolve profile needs at least two points");
  countAtLeast(props.segments, 3, "revolve segments");
  props.profile.forEach((point, index) => {
    finitePoint(point, `revolve profile[${index}]`);
    if (point.x < 0)
      throw new Error(`revolve profile[${index}] radius must be >= 0`);
  });
  const meridian = [0];
  for (let index = 1; index < props.profile.length; ++index)
    meridian.push(
      meridian[index - 1]! +
        Math.hypot(
          props.profile[index]!.x - props.profile[index - 1]!.x,
          props.profile[index]!.y - props.profile[index - 1]!.y,
        ),
    );
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let segment = 0; segment <= props.segments; ++segment) {
    const angle = (segment / props.segments) * Math.PI * 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    props.profile.forEach((point, index) => {
      positions.push(point.x * cosine, point.y, point.x * sine);
      uvs.push((Math.PI * 2 - angle) * point.x, meridian[index]!);
    });
  }
  const count = props.profile.length;
  const indices: number[] = [];
  for (let segment = 0; segment < props.segments; ++segment)
    for (let point = 0; point + 1 < count; ++point) {
      const current = segment * count + point;
      const next = current + count;
      indices.push(current, current + 1, next);
      indices.push(current + 1, next + 1, next);
    }
  const normalGroups = props.profile.map((point, index) =>
    point.x === 0
      ? Array.from(
          { length: props.segments + 1 },
          (_, segment) => segment * count + index,
        )
      : [index, props.segments * count + index],
  );
  return meshOf(positions, indices, uvs, normalGroups);
};
