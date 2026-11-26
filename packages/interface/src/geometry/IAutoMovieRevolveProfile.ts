import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * An authored meridian and angular sampling count for a local-Y surface of
 * revolution.
 *
 * Profile x is nonnegative radius and y is height in metres; angular segments
 * count one complete turn. The producer checks at least two finite profile
 * points and a safe-integer segment count of at least three; closure,
 * orientation and self-intersections remain properties of the authored
 * meridian.
 */
export namespace IAutoMovieRevolveProfile {
  /**
   * A radius/height meridian for an authored lateral surface around local Y.
   *
   * Each profile point is `x` = radius and `y` = height, in metres. Unlike
   * extrusion and sweep, the meridian is taken as authored rather than hulled,
   * so an arbitrary silhouette polyline is allowed here; only its radii must be
   * non-negative. Profile order owns the surface orientation, and every output
   * buffer is new.
   *
   * Closure follows the meridian and is the caller's to declare: a meridian
   * that starts and ends on the axis closes into a solid whose pole rings
   * collapse to zero-area triangles, and one that does not is an open tube with
   * a rim at each end. Neither is repaired.
   *
   * The surface carries a metric atlas measured the way its siblings measure
   * theirs: distance travelled around the section against distance travelled
   * along the path. Around is the arc the vertex actually sits on, `theta`
   * times its own radius, so a baluster turned to a 0.3 m radius shows 1.88 m
   * of grain around it rather than one turn of an image stretched to fit it.
   * Along is the meridian's own polyline length, which is slant distance on a
   * cone and developed height on a cylinder rather than the shortcut through
   * the axis.
   *
   * Around runs against the direction the lattice is built in, and that is the
   * whole reason it is written `2 * pi - theta` rather than `theta`. The
   * outward normal this winding produces, the meridian running up, and `theta`
   * running round form a left-handed triple, so an atlas keyed on `theta`
   * directly comes out mirrored against every other builder here: a letter
   * reads backwards, and a normal map's tangent basis is handed the wrong way,
   * which tilts the lighting rather than merely the image. Reversing the axis
   * that closes on itself costs nothing an author can name, because which way
   * round a surface of revolution is traversed carries no authored meaning,
   * while reversing the meridian instead would put `v = 0` at whichever end of
   * the profile was typed last.
   *
   * The lattice carries a duplicate ring at `theta = 2 * pi`, which is what
   * makes the seam an honest cut: one edge of the seam reads zero and the other
   * reads the full circumference at that radius, so the closing quad never
   * interpolates backwards through the atlas. Those two phases coincide only
   * when the declared texture repeat divides that circumference; the kernel
   * does not stretch a finish to hide a mismatched seam. A changing radius also
   * makes the surface non-developable in general. Scaling by radius preserves
   * local circumference scale on every parallel and therefore shears the flat
   * atlas between unequal parallels instead of pretending one global isometry
   * exists. A meridian point on the axis is a pole, and its whole ring reads
   * zero around, because a circle of no radius has no arc to travel. Its
   * collapsed triangles remain the topology this operator declares; their UVs
   * stay finite, and they are the one place the atlas has no handedness to
   * report. The duplicate seam vertices share their accumulated face normals
   * before normalization, and every duplicate of an axis pole shares that
   * pole's normal as well, so the UV cut does not introduce a lighting
   * discontinuity.
   *
   * How far that shear goes decides what finish the surface can carry. The map
   * is exactly equiareal, its Jacobian determinant one everywhere, so the whole
   * distortion is pure shear of `2 * pi - theta` times `dr / ds`. Worst
   * anisotropy over a full turn is therefore `(sqrt(k * k + 4) + k) / (sqrt(k *
   * k + 4) - k)` at `k = 2 * pi * |dr / ds|`: 1.0 on a cylinder, 2.0 at 6.5
   * degrees off the axis, 4.0 at 13.8 degrees, 21.5 on a 45-degree cone, and 41
   * where the meridian runs level, which is what a dome's pole and a cone's tip
   * approach. A tile that reads square beside the seam is drawn into a ribbon a
   * quarter turn away, and the curve of constant `u` spirals instead of
   * following a meridian.
   *
   * That is the price of the metric statement rather than a defect awaiting
   * repair. Measuring true arc around forces `u` to be `theta * r` plus some
   * `c(s)`, whose derivative would have to be `-theta * dr / ds` to cancel the
   * shear, and no function of `s` alone does that at every `theta`. Choosing
   * `c(s)` only moves where the shear vanishes, which is why it sits at the
   * seam here; centring it would halve the worst case to 11.8 at a pole, still
   * far past readable. The pole is not a second fault: cut the tip off a cone
   * and the frustum that remains shears exactly as hard, so the collapsed pole
   * triangles above are a topology note rather than the cause.
   *
   * A directional finish therefore wants a meridian within a few degrees of the
   * axis, which is a drum, a shaft, a turret barrel. A sloped or domed form
   * that must carry one is authored as flat faces through
   * `buildAutoMoviePolyhedron`, whose per-face frame is isometric, or as a flat
   * cap through `AutoMovieEnginePlanarRegion.extrude`, and a spire built as
   * facets is how a spire is built anyway. `meshAutoMovieSweep` is not the
   * escape here that it is for the coordinate-less builders. It measures this
   * same pair, a tapered loft shears the same way, and it gives up something
   * this one keeps: the map here is exactly equiareal, while a loft's `v` is
   * path distance rather than surface distance, so a taper or a bend costs it
   * texel density on top of the angle. Where the form has to stay a true
   * surface of revolution, the finish on it stays non-directional.
   */
  export type IProps = {
    /**
     * Borrowed ordered meridian with at least two finite radius/height points
     * in metres; radius x is nonnegative. Authored order sets winding; ends off
     * the axis remain open rims.
     */
    profile: readonly IAutoMovieProfilePoint[];

    /**
     * Safe integer of at least three angular intervals over 2 pi; checked
     * before allocation. One extra duplicate ring carries the UV seam.
     */
    segments: number;
  };
}
