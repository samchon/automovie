import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The radius of the head as hair drapes over it, centred on each bump of the
 * skin: the largest of the skin radius along a direction and, for skin above
 * the menton within 0.3 radian, its radius less its arc distance, as if the
 * hair fell from every bump at 45 degrees to the surface (a convention of
 * this prototype). Over the auricle, which stands about 25 mm off the side of
 * the head, hair passes over the ear on a slope and returns to the head
 * about 25 mm beyond it. Sampled on six rings of eight directions, 0.05
 * radian apart.
 */
export namespace AutoMovieHumanHairEnvelopeDrape {
  /**
   * Radius of the head as hair drapes over it along a direction.
   *
   * @param field Head chart
   * @param d Unit direction
   * @returns Draped radius, millimetres
   */
  export function drape(
    field: AutoMovieHumanHeadField.IField,
    d: AutoMovieHumanSkinVector.Vec3,
  ): number {
    let best: number = AutoMovieHumanHeadField.radius(field, d);
    const a: AutoMovieHumanSkinVector.Vec3 =
      Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const e1: AutoMovieHumanSkinVector.Vec3 = unit(
      AutoMovieHumanSkinVector.cross(a, d),
    );
    const e2: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.cross(
      d,
      e1,
    );
    for (let ring: number = 1; ring <= 6; ++ring) {
      const theta: number = 0.05 * ring;
      for (let k: number = 0; k < 8; ++k) {
        const phi: number = ((k + 0.5 * (ring % 2)) / 8) * 2 * Math.PI;
        const s: number = Math.sin(theta);
        const q: AutoMovieHumanSkinVector.Vec3 = [
          d[0] * Math.cos(theta) +
            s * (e1[0] * Math.cos(phi) + e2[0] * Math.sin(phi)),
          d[1] * Math.cos(theta) +
            s * (e1[1] * Math.cos(phi) + e2[1] * Math.sin(phi)),
          d[2] * Math.cos(theta) +
            s * (e1[2] * Math.cos(phi) + e2[2] * Math.sin(phi)),
        ];
        const r: number = AutoMovieHumanHeadField.radius(field, q);

        // Only head skin above the menton drapes the hair; below it the
        // chart also measures the neck and shoulders the head chains loft.
        if (field.centre[1] + q[1] * r > field.top - field.height)
          best = Math.max(best, r * (1 - theta));
      }
    }
    return best;
  }
}

/**
 * Unit vector, dividing by the length (the zero vector stays zero): the
 * envelope keeps this arithmetic exactly, since a reciprocal multiplication
 * differs in the last bit and the digest of the guides and cards holds to a
 * micrometre.
 *
 * @param a Nonzero vector
 * @returns `a / |a|`
 */
function unit(a: AutoMovieHumanSkinVector.Vec3): AutoMovieHumanSkinVector.Vec3 {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
