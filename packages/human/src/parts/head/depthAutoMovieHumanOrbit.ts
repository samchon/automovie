/**
 * Place the orbital course relative to the anterior lid in head-local depth.
 *
 * The seed-to-eighth outward quad-strip depth of four reference heads was
 * sampled at common physical transverse planes, normalized by each seed's
 * aperture width and fitted with equal reference weights. The quadratic uses
 * medial, middle and lateral Lagrange stations. Four training heads and 25
 * other heads were checked offline; geometric strip correspondence is not a
 * clinical orbital-rim or eyelid-margin certification. This relative course
 * must follow the generated lid rather than re-query an unrelated head field.
 */
export function depthAutoMovieHumanOrbit(props: {
  margin: number;
  length: number;
  share: number;
  upper: boolean;
}): number {
  const s: number = props.share;
  const c: { medial: number; middle: number; lateral: number } = props.upper
    ? DEPTH.upper
    : DEPTH.lower;
  return (
    props.margin +
    props.length *
      (2 * (s - 0.5) * (s - 1) * c.medial +
        4 * s * (1 - s) * c.middle +
        2 * s * (s - 0.5) * c.lateral)
  );
}

/** Pooled normalized reference-course depth; protocol is stated above. */
const DEPTH: Record<
  "upper" | "lower",
  { medial: number; middle: number; lateral: number }
> = {
  upper: { medial: 0.0277, middle: -0.0078, lateral: -0.0941 },
  lower: { medial: 0.0251, middle: 0.0027, lateral: -0.0895 },
};
