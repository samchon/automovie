import { AutoMovieHumanHairEnvelopeCurtain } from "./AutoMovieHumanHairEnvelopeCurtain";
import { AutoMovieHumanHairEnvelopeMean } from "./AutoMovieHumanHairEnvelopeMean";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Smooth envelope of the hair mass: a radial function over directions from
 * the head chart's centre, whose surface hair lies over and whose normals
 * shade it, assembled from its pieces: the kernel power mean of the draped
 * head (`AutoMovieHumanHairEnvelopeMean`, with the drape
 * `AutoMovieHumanHairEnvelopeDrape` under it) over the head, and the
 * analytic hanging column (`AutoMovieHumanHairEnvelopeCurtain`) below the
 * elevation where it takes over, with no step in radius between them.
 *
 * Normals: the star surface `P(d) = f(d) d` has the outward normal
 * `d - grad f / f`, with the tangential gradient of `f` on the sphere,
 * evaluated analytically for every part.
 */
export namespace AutoMovieHumanHairEnvelope {
  /** Fitted envelope: the power mean's data and the curtain's profiles. */
  export interface IEnvelope
    extends
      AutoMovieHumanHairEnvelopeMean.IMean,
      AutoMovieHumanHairEnvelopeCurtain.ICurtain {}

  /**
   * Fit the envelope of one head chart.
   *
   * @param field Head chart
   * @returns The envelope
   */
  export function create(field: AutoMovieHumanHeadField.IField): IEnvelope {
    const scan: AutoMovieHumanHairEnvelopeMean.IScan =
      AutoMovieHumanHairEnvelopeMean.scan(field);
    const mean: AutoMovieHumanHairEnvelopeMean.IMean =
      AutoMovieHumanHairEnvelopeMean.fit(scan);
    return {
      ...mean,
      ...AutoMovieHumanHairEnvelopeCurtain.create(scan, mean),
    };
  }

  /**
   * Envelope radius along a direction.
   *
   * Lying hair follows the head down to its lowest draped point and hangs
   * from there; hanging hair (`hang`) leaves the head at its widest draped
   * point in each azimuth and falls below it as a vertical curtain, as a cut
   * hanging under gravity does, instead of following the head back in under
   * the occiput, the ears and the jaw, where the surface faces down and
   * shades the hair dark.
   *
   * @param envelope Envelope
   * @param u Direction; need not be unit
   * @param hang Whether the hair hangs from the widest point
   * @returns Radius in millimetres
   */
  export function radius(
    envelope: IEnvelope,
    u: AutoMovieHumanSkinVector.Vec3,
    hang: boolean = false,
  ): number {
    return evaluate(envelope, AutoMovieHumanSkinVector.normalize(u), hang)[0];
  }

  /**
   * Outward unit normal of the envelope at the direction of a point, which is
   * also the normal of every scaled copy `lambda P(d)` there.
   *
   * @param envelope Envelope
   * @param p Point, head-local millimetres
   * @param hang Whether the hair hangs from the widest point, see {@link radius}
   * @returns Unit normal
   */
  export function normal(
    envelope: IEnvelope,
    p: AutoMovieHumanSkinVector.Vec3,
    hang: boolean = false,
  ): AutoMovieHumanSkinVector.Vec3 {
    const d: AutoMovieHumanSkinVector.Vec3 =
      AutoMovieHumanSkinVector.normalize(p);
    const [f, g] = evaluate(envelope, d, hang);
    if (!(f > 1e-9)) return d;
    return AutoMovieHumanSkinVector.normalize([
      d[0] - g[0] / f,
      d[1] - g[1] / f,
      d[2] - g[2] / f,
    ]);
  }
}

/**
 * Value and tangential gradient at a unit direction.
 *
 * The column takes over below its hanging elevation. Its radius there is the
 * head's own reach (`AutoMovieHumanHairEnvelopeCurtain.create`), so the
 * radius is continuous; at the widest point the head is vertical, so the
 * normal is too, up to the azimuth smoothing of that elevation. A blend band
 * either side lifted the column over the scalp above it, or mixed in the
 * head's down-facing normals below it.
 *
 * @param envelope Envelope
 * @param d Unit direction
 * @param hang Whether the column hangs from the widest point rather than the
 *   lowest
 * @returns Radius and its gradient on the sphere
 */
function evaluate(
  envelope: AutoMovieHumanHairEnvelope.IEnvelope,
  d: AutoMovieHumanSkinVector.Vec3,
  hang: boolean,
): [number, AutoMovieHumanSkinVector.Vec3] {
  const beta: number = Math.asin(Math.max(-1, Math.min(1, d[1])));
  const column: AutoMovieHumanHairEnvelopeCurtain.IColumn =
    AutoMovieHumanHairEnvelopeCurtain.column(envelope, d, hang);
  if (beta <= column.floor) return [column.value, column.gradient];
  return (
    AutoMovieHumanHairEnvelopeMean.power(envelope, d) ?? [
      column.value,
      column.gradient,
    ]
  );
}
