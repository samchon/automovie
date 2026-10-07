import type { IAutoMovieHumanBodyLayerThicknessAnchor } from "./IAutoMovieHumanBodyLayerThicknessAnchor";

/**
 * Skin and subcutaneous thickness over every vertex of one body skin.
 *
 * The skin is the body's one exterior. Beneath it lie the dermis and the
 * subcutaneous fat, and beneath those the fascia that wraps muscle and bone.
 * This field gives the two thicknesses that place those inner surfaces: at
 * each skin vertex the dermis's inner face is the skin moved inward by the
 * skin thickness, and the fascial face is moved inward by both. The
 * subcutaneous layer is the shell between the two faces, so its outer side is
 * the dermis by definition and it has the skin's own resolution.
 *
 * Values are metres along the inward skin normal, addressed by the basis's
 * native skin vertex ordinal; a field belongs to exactly one basis revision.
 * The default values are authored: they interpolate between the listed
 * anchors, and only at an anchor's own site, for its own population, is a
 * value a measurement. They describe no individual and no population the
 * anchors did not measure. A field is offline source data. A person's
 * document does not carry it; named tissue measurements that scale it are a
 * later input, admitted by their own owner.
 *
 * @evidence contracts/common.md#principled-implementation Two scalar fields on the skin's own vertices place both inner faces by one offset rule, so the layer shares its boundaries with the skin instead of approximating them on a lattice.
 * @evidence contracts/common.md#clear-and-simple-design One record holds both thicknesses, the basis they address and the anchors they rest on.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are stated per vertex with their anchors; nothing is back-solved from a wanted volume or a rendered result.
 * @evidence contracts/common.md#meaningful-documentation States what the two faces are, the addressing rule and what the default values do and do not claim.
 * @evidence contracts/modeling.md#part-identity-and-grouping The field belongs to the one connected skin and defines the subcutaneous layer as the part between two of its offsets.
 * @evidence contracts/modeling.md#parameter-channels Skin thickness and subcutaneous thickness are separate traits in metres with no neutral-zero offset; left and right vertices hold their own values, so asymmetry is data.
 * @evidence contracts/modeling.md#emitted-geometry The layer's primitive count follows from the skin's own vertices and triangles and from nothing else.
 * @evidence contracts/modeling.md#spatial-conventions Metres along the inward area-weighted skin normal, addressed by native vertex ordinal in the basis's canonical frame.
 * @evidence contracts/modeling.md#shared-boundaries The dermal face is the subcutaneous layer's outer boundary and the fascial face its inner one; both derive from the skin by this field alone.
 * @evidence contracts/anatomy.md#anatomical-source Each anchor names its source, quantity, protocol and population; values away from an anchor are declared authored and unmeasured populations unknown.
 * @evidenceExclude contracts/modeling.md#rendered-observation The layer's consumer owns observation of the emitted shell.
 * @evidenceExclude contracts/anatomy.md#permitted-range The surface builder reports limited normal-ray and orientation conditions; the field itself admits no anatomical thickness.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The field is offline source data; no document addresses its vertices.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLayerThicknessField {
  /** Body basis revision whose native skin vertices these arrays address. */
  basis: string;

  /** Epidermis and dermis thickness in metres, one per native skin vertex. */
  skinMetres: number[];

  /** Subcutaneous adipose thickness in metres, one per native skin vertex. */
  subcutaneousMetres: number[];

  /** Measurements the values are tied to, and the authored values that fill the rest. */
  anchors: IAutoMovieHumanBodyLayerThicknessAnchor[];

  /** How values between anchors were set, and which populations no anchor measured. */
  qualification: string;
}
