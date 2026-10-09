import type { IAutoMovieHumanFaceStylingDescriptor } from "../../structures/IAutoMovieHumanFaceStylingDescriptor";

/**
 * Describe the existing terminal-shaft profile's numerical authoring domain.
 *
 * Bounds are the scalar admission in `assertHumanFaceFacialHair`, including
 * its integer count and seed requirements. A step of one is an entry aid;
 * runtime admission still refuses fractional values. These envelopes supply
 * no biological density, follicle-angle interval or personal reconstruction.
 * There is no default profile. Source registration, dependent hair allocation
 * and the resulting geometry retain their existing admission owners.
 *
 * @evidence contracts/common.md#principled-implementation Carries the existing profile validator's scalar envelopes, open endpoints and integer entry steps without converting them into clinical ranges.
 * @evidence contracts/common.md#clear-and-simple-design One descriptor table serves every existing named terminal site; current values remain in the authored document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies no default population, source-specific profile or geometry correction.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes scalar entry domains, resource limits, authored styling and subsequent geometry admission.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The existing site input and resolver own population identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The existing terminal-shaft profile defines each channel's meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Metadata emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Profile and resolver owners define units and frame conversion; metadata carries their stated units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source growth and contact owners construct attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation Metadata displays no form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source These entries describe authored numerical targets and assert no measured biological interval.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing validator and geometry owners decide admission; these numerical envelopes are not physiological bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Metadata introduces no authoring input.
 */
export const HUMAN_FACE_FACIAL_HAIR_TRAITS: readonly IAutoMovieHumanFaceStylingDescriptor[] = [
  {
    path: ["count"],
    label: "Visible shaft count",
    unit: "count",
    minimum: 0,
    maximum: 1024,
    step: 1,
    qualification: "An integer rendering population within the per-site allocation budget; zero emits no terminal layer. This is not biological density.",
  },
  {
    path: ["lengthMm"],
    label: "Visible shaft length",
    unit: "mm",
    minimum: 0,
    maximum: null,
    step: null,
    qualification: "Authored root-to-tip length; zero records a shaved visible layer. No clinical length interval is supplied.",
  },
  {
    path: ["diameterMicrometres"],
    label: "Visible shaft diameter",
    unit: "micrometres",
    minimum: 0,
    maximum: null,
    minimumExclusive: true,
    step: null,
    qualification: "Authored physical calibre of an emitted terminal shaft, independent of count. No population-normal interval is supplied.",
  },
  {
    path: ["emergenceAngleDegrees"],
    label: "Emergence elevation",
    unit: "degrees",
    minimum: 0,
    maximum: 90,
    minimumExclusive: true,
    step: null,
    qualification: "Authored elevation above the skin tangent plane; a rooted transition can refuse without changing it. This is not a clinical follicle-angle interval.",
  },
  {
    path: ["flowAngleDegrees"],
    label: "Head-frontal flow angle",
    unit: "degrees",
    minimum: -180,
    maximum: 180,
    step: null,
    qualification: "Authored neutral head-frontal styling: zero points inferior and positive turns toward anatomical left. The registered reference field transports the direction.",
  },
  {
    path: ["samplingStepMm"],
    label: "Curve integration step",
    unit: "mm",
    minimum: 0,
    maximum: 5,
    minimumExclusive: true,
    step: null,
    qualification: "Numerical curve integration spacing, independent of shaft count and calibre; subsequent allocation and geometry admission still apply.",
  },
  {
    path: ["seed"],
    label: "Root population seed",
    unit: "integer",
    minimum: 0,
    maximum: 0xffffffff,
    step: 1,
    qualification: "Unsigned 32-bit integer for deterministic root selection. Editing another member retains this authored seed.",
  },
  {
    path: ["finish", "red"],
    label: "Reflected red",
    unit: "linear RGB",
    minimum: 0,
    maximum: 1,
    step: null,
    qualification: "Authored linear reflected red component of the emitted shafts, separate from lighting and skin reflectance.",
  },
  {
    path: ["finish", "green"],
    label: "Reflected green",
    unit: "linear RGB",
    minimum: 0,
    maximum: 1,
    step: null,
    qualification: "Authored linear reflected green component of the emitted shafts, separate from lighting and skin reflectance.",
  },
  {
    path: ["finish", "blue"],
    label: "Reflected blue",
    unit: "linear RGB",
    minimum: 0,
    maximum: 1,
    step: null,
    qualification: "Authored linear reflected blue component of the emitted shafts, separate from lighting and skin reflectance.",
  },
  {
    path: ["finish", "roughness"],
    label: "Shaft roughness",
    unit: "ratio",
    minimum: 0,
    maximum: 1,
    step: null,
    qualification: "Authored microsurface response of the emitted shafts; it does not change their count, dimensions or source attachment.",
  },
];
