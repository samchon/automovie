import { clampAutoMovieUnitInterval } from "@automovie/engine/math/clampAutoMovieUnitInterval";

/** Linear RGB of the pupil, the constructed portrait eye's opening colour. */
const HUMAN_FACE_PUPIL_COLOUR: readonly [number, number, number] = [
  0.0025, 0.002, 0.0015,
];

/**
 * Linear RGB of one iris texel from its polar coordinates.
 *
 * Normalized radius `rho` runs from 0 at the pupil margin to 1 at the limbus.
 * Beyond `rho = 0.87` is the limbal ring, band 0. Inside, the band is the
 * portrait eye's radial fibre value `0.48 + 0.23 sin(37 phi + 7 rho) +
 * 0.17 sin(71 phi - 11 rho) + 0.12 cos(13 phi)` quantized to eight bands.
 * Inside the pupil the pupil colour is used. Both edges blend linearly over
 * `edge` radians either side: into the pupil, and outward into the
 * texture's `original` colour, so the sclera keeps its painted detail.
 *
 * Angles are radians from the optical axis (`theta`) and about it (`phi`),
 * and colours are linear RGB. The fibre expression, the 0.87 limbal-ring
 * radius and the pupil colour are authored optical conventions shared with
 * the constructed portrait eye and are not measured; the eight-band pigment
 * comes from the caller. The blend weights are clamped to [0,1], so a texel
 * exactly at an edge takes half of each side and no colour leaves the range of
 * its inputs. A pupil or limbus at the same angle (zero width iris) divides by
 * zero, so the caller supplies `limbus > pupil`, which the disc guarantees.
 *
 * @evidence contracts/common.md#principled-implementation Polar normalized radius selects the shared authored fibre/limbal palette and convex edge blends preserve admitted input colour bounds.
 * @evidence contracts/common.md#clear-and-simple-design One pure colour rule serves connected-basis painting; the existing engine unit clamp owns identical min/max endpoint semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fibre frequencies, pupil colour and limbal ratio are authored; positive edge width and eight valid bands are caller premises.
 * @evidence contracts/common.md#meaningful-documentation The prose states radians, linear RGB, limbus-above-pupil premise and authored constants.
 * @evidence contracts/performance.md#efficient-algorithms Fixed trigonometric/scalar work and three colour channels require constant work per texel.
 * @evidence contracts/performance.md#reuse-equivalent-work Every eye uses the same palette and canonical clamp without retaining coordinate-dependent results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a fresh colour triple escapes; no pixel buffer, cache or resource is retained.
 */
export function humanFaceIrisTexelColour(props: {
  /** Actual texel's polar angle from the optical axis, radians. */
  theta: number;

  /** Actual texel's azimuth about the registered reference axis, radians. */
  phi: number;

  /** Admitted limbal polar half-angle, strictly above pupil, radians. */
  limbus: number;

  /** Admitted pupillary polar half-angle, radians. */
  pupil: number;

  /** Eight admitted linear-RGB bands from the canonical pigment owner. */
  bands: readonly (readonly [number, number, number])[];

  /** Half-width of each blended edge, radians of polar angle. */
  edge: number;

  /** Source texel's linear colour, retained outside the blended iris edge. */
  original: readonly [number, number, number];
}): [number, number, number] {
  const { theta, phi, limbus, pupil, edge }: Parameters<typeof humanFaceIrisTexelColour>[0] = props;
  const rho: number = clampAutoMovieUnitInterval((theta - pupil) / (limbus - pupil));
  const fibre: number =
    0.48 +
    0.23 * Math.sin(phi * 37 + rho * 7) +
    0.17 * Math.sin(phi * 71 - rho * 11) +
    0.12 * Math.cos(phi * 13);
  const band: number = rho > 0.87 ? 0 : Math.max(0, Math.min(7, Math.floor(fibre * 8)));
  const stroma: readonly [number, number, number] = props.bands[band];
  const open: number = clampAutoMovieUnitInterval((theta - pupil + edge) / (2 * edge));
  const inside: number = clampAutoMovieUnitInterval((limbus + edge - theta) / (2 * edge));
  return [0, 1, 2].map((c: number): number  => {
    const iris: number =
      HUMAN_FACE_PUPIL_COLOUR[c] +
      (stroma[c] - HUMAN_FACE_PUPIL_COLOUR[c]) * open;
    return props.original[c] + (iris - props.original[c]) * inside;
  }) as [number, number, number];
}
