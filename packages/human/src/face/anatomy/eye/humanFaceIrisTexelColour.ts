/**
 * The colour rule of one iris texel, shared by every connected-basis eye.
 * `createHumanFaceIrisPigment` calls it for each texel of an iris disc with
 * that texel's polar coordinates, the eye's eight linear-RGB bands and the
 * texture's own linear colour there. Pure; returns a new triple.
 */
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
 */
export function humanFaceIrisTexelColour(props: {
  theta: number;
  phi: number;
  limbus: number;
  pupil: number;
  bands: readonly (readonly [number, number, number])[];
  /** Half-width of each blended edge, radians of polar angle. */
  edge: number;
  original: readonly [number, number, number];
}): [number, number, number] {
  const { theta, phi, limbus, pupil, edge } = props;
  const rho = Math.min(1, Math.max(0, (theta - pupil) / (limbus - pupil)));
  const fibre =
    0.48 +
    0.23 * Math.sin(phi * 37 + rho * 7) +
    0.17 * Math.sin(phi * 71 - rho * 11) +
    0.12 * Math.cos(phi * 13);
  const band = rho > 0.87 ? 0 : Math.max(0, Math.min(7, Math.floor(fibre * 8)));
  const stroma = props.bands[band];
  const open = clamp01((theta - pupil + edge) / (2 * edge));
  const inside = clamp01((limbus + edge - theta) / (2 * edge));
  return [0, 1, 2].map((c) => {
    const iris =
      HUMAN_FACE_PUPIL_COLOUR[c] +
      (stroma[c] - HUMAN_FACE_PUPIL_COLOUR[c]) * open;
    return props.original[c] + (iris - props.original[c]) * inside;
  }) as [number, number, number];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
