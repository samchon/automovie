import type { IAutoMovieHumanBodyLayerThicknessAnchor } from "./IAutoMovieHumanBodyLayerThicknessAnchor";

/**
 * Skin and subcutaneous thickness over every vertex of one body skin.
 *
 * The skin is the body's one exterior. Beneath it lie the dermis and the subcutaneous fat, and beneath those the fascia that wraps muscle and bone. This field gives the two thicknesses that place those inner surfaces: at each skin vertex the dermis's inner face is the skin moved inward by the skin thickness, and the fascial face is moved inward by both. The subcutaneous layer is the shell between the two faces, so its outer side is the dermis by definition and it has the skin's own resolution.
 *
 * Values are metres along the inward skin normal, addressed by the basis's native skin vertex ordinal; a field belongs to exactly one basis revision. The default values are authored: they interpolate between the listed anchors, and only at an anchor's own site, for its own population, is a value a measurement. They describe no individual and no population the anchors did not measure. A field is offline source data. A person's document does not carry it; named tissue measurements that scale it are a later input, admitted by their own owner.
 *
 * @evidence contracts/common.md#principled-implementation Basis-native metre arrays place dermal/fascial faces along common inward skin normals, keeping published anchors distinct from authored interpolation elsewhere.
 * @evidence contracts/common.md#clear-and-simple-design One exact-basis field owns skin/subcutaneous thickness and qualification, outside personal document controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anchor measurements do not extrapolate population validity, and no second source skin supplies the subcutaneous outer face.
 * @evidence contracts/common.md#meaningful-documentation The prose defines native ordering, inward metre offsets, shared shell boundaries and measured-versus-authored limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Thickness field typing supplies offsets without executing surface-normal or interpolation algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Basis revision identifies correspondence without caching evaluated layer geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source field arrays belong to their publisher and the type acquires no construction task.
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
