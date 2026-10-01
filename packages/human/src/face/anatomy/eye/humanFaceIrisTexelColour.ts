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
 *
 * @evidence contracts/common.md#principled-implementation Each texel is a convex blend, first between the pupil colour and the band colour across the pupillary edge and then between that and the texture's own colour across the limbal edge, with weights clamped to [0,1] and a linear ramp of the stated half-width, so the result stays inside the hull of its inputs and the edges are anti-aliased at texel scale. Normalized radius runs from the pupil margin to the limbus, which is where the fibre and ring laws are defined.
 * @evidence contracts/common.md#clear-and-simple-design One pure function maps polar coordinates and a palette to one colour in the fixed order radius, band, pupil edge, limbal edge, with no state and no option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The colour depends on the texel's coordinates and the palette only, with no case named after a subject, an asset or a fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the radius normalization, the band law, the ring, the two blends, the units, which parts are conventions and the precondition on limbus and pupil.
 * @evidence contracts/modeling.md#spatial-conventions Theta, phi and the edge half-width are radians and the colours are linear RGB, each stated; no frame is converted and no length is involved.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function colours one texel and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The palette is declared by the pigment type and the function defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits a colour and no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the blend at the limbal edge is an appearance blend of colours and not a joined boundary of two parts.
 * @evidence contracts/modeling.md#rendered-observation Painted onto the connected globe and drawn through the resident viewer on a real GPU (ANGLE AMD Radeon 780M), 2048 px beauty front crops of one subject shape with blue, pale-grey, near-black and brown pigments, plus that subject's left three-quarter, each cropped to the eye band. The disc reads as a circular iris with a darker limbal ring, a small black pupil and a clean edge into the painted sclera in every pigment and in the oblique view. The radial spokes are visibly regular, because the fibre law is a sum of fixed-frequency sinusoids; that regularity is a named ceiling of an authored optical convention and not a claim of iris anatomy. Not taken: profile close-up at iris scale, clay and normal passes (the rule changes colour only), and pigment pairs at unequal left and right values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is an internal per-texel colour rule called by the pigment compiler; no caller shapes a face through its polar arguments, and the caller-facing pigment input is owned by the pigment type and the compiler.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value.
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
