import type { IPortraitColourField } from "../anatomy/skin/structures/IPortraitColourField";
import type { IAutoMovieHumanFaceAnatomicalRequest } from "./IAutoMovieHumanFaceAnatomicalRequest";
import type { IAutoMovieHumanFaceBrows } from "./IAutoMovieHumanFaceBrows";
import type { IAutoMovieHumanFaceEyelidPhenotypes } from "./IAutoMovieHumanFaceEyelidPhenotypes";
import type { IAutoMovieHumanFaceEyelids } from "./IAutoMovieHumanFaceEyelids";
import type { IAutoMovieHumanFaceEyes } from "./IAutoMovieHumanFaceEyes";
import type { IAutoMovieHumanFaceHair } from "./IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceFacialHair } from "./IAutoMovieHumanFaceFacialHair";
import type { IAutoMovieHumanFaceHairTraits } from "./IAutoMovieHumanFaceHairTraits";
import type { IAutoMovieHumanFaceIris } from "./IAutoMovieHumanFaceIris";
import type { IAutoMovieHumanFaceLashes } from "./IAutoMovieHumanFaceLashes";
import type { IAutoMovieHumanFaceMaterialOverride } from "./IAutoMovieHumanFaceMaterialOverride";
import type { IAutoMovieHumanFaceOcularSurfaces } from "./IAutoMovieHumanFaceOcularSurfaces";
import type { IAutoMovieHumanFaceOral } from "./IAutoMovieHumanFaceOral";
import type { IAutoMovieHumanFacePeriocularTissues } from "./IAutoMovieHumanFacePeriocularTissues";
import type { IAutoMovieHumanFaceScalpHair } from "./IAutoMovieHumanFaceScalpHair";
import type { IAutoMovieHumanFaceSkinRegionAppearance } from "./IAutoMovieHumanFaceSkinRegionAppearance";
import type { IAutoMovieHumanFaceSkinRelief } from "./IAutoMovieHumanFaceSkinRelief";

/**
 * Compact edits against a separately supplied immutable facial basis.
 * Zero is the source neutral; omitted channels are zero. Negative controls use
 * their authored negative endpoint, not an extrapolated positive endpoint.
 * The document contains no photo, mesh cache, renderer or Blender dependency.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisDocument {
  /** Stable identity of this authored face. */
  id: string;

  /** Display name, independent of basis selection. */
  name: string;

  /** Must equal the supplied basis identity; no implicit migration occurs. */
  basis: string;

  /**
   * Persistent identity weights against the basis's named shape endpoints.
   * These dimensionless values are not anthropometric measurements. Weinberg
   * et al. 2016 report landmark-derived, age/sex-specific norms from 2,454
   * photographed 3D faces aged 3–40 in its recruited cohort
   * (https://pubmed.ncbi.nlm.nih.gov/26492185/); neither those measured
   * distances nor that cohort's age/ancestry limits map automatically to this basis's
   * artist-authored morph weights. The current channel bounds therefore do
   * not certify a scientifically supported physiological range.
   */
  shape: Record<string, number>;

  /** Current transient expression; omitted channels mean source neutral. */
  expression: Record<string, number>;

  /**
   * Optional numerical scalp populations on the basis's shared growth domains.
   * Omission, null or empty layers is bald. Every lock is generated from fields;
   * no identity-dependent groom resource or personal guide coordinates resolve.
   */
  hair?: IAutoMovieHumanFaceHair | null;

  /** Named visible terminal facial shafts; independent of scalp locks and recorded follicle observations. */
  facialHair?: IAutoMovieHumanFaceFacialHair | null;

  /** Complete named scalp styling; alternative to the legacy full hair document. */
  scalpHair?: IAutoMovieHumanFaceScalpHair;

  /** Sparse named traits over selected hair layer identities; unselected fields retain exact values. */
  hairTraits?: Record<string, IAutoMovieHumanFaceHairTraits>;

  /** Reflectance gains on immutable basis-owned skin areas; no personal coordinates or region geometry. */
  skinAppearance?: Record<string, IAutoMovieHumanFaceSkinRegionAppearance>;

  /**
   * Numerical pigmentation by basis surface identity. Field centres and radii
   * use metres in the immutable neutral basis, so shape and expression carry
   * the same tissue colours. Omission, null and an empty record add no fields.
   * These compact envelopes carry no image or per-vertex colour array.
   * Global colour and roughness remain in materials. A surface's fields apply
   * across its material regions with their common vertex correspondence.
   */
  skin?: Record<string, IPortraitColourField[]> | null;

  /**
   * Independent authored resting and performed regional skin relief. This
   * moves the connected host before contact and normals; clinical observations
   * in `anatomical` remain separate. Omission retains source geometry.
   */
  skinRelief?: IAutoMovieHumanFaceSkinRelief;

  /**
   * Optional iris pigmentation of each articulated eye, painted by one shared
   * rule into the basis eye texture's anatomical iris disc. Omission and null
   * keep the basis texture byte for byte.
   */
  iris?: IAutoMovieHumanFaceIris | null;

  /**
   * Optional independent optical dimensions of each eye. They need the basis's
   * optical support; without it the document refuses by name. Omission keeps
   * the basis's authored globes byte for byte.
   */
  eyes?: IAutoMovieHumanFaceEyes;

  /**
   * Optional independent upper and lower lash profiles. A present row needs the
   * basis's periocular registration; without it the document refuses by name.
   * An omitted row keeps the basis's lash cards byte for byte.
   */
  lashes?: IAutoMovieHumanFaceLashes;

  /**
   * Coarse tissue dimensions attached to the registered live lid cage.
   * Omission of the whole section expands owner-defined defaults for eyes
   * with generated optics and a cage. An explicit section retains sparse
   * selection, including an empty side, without adding omitted members.
   */
  periocularTissues?: IAutoMovieHumanFacePeriocularTissues;

  /** Independent source crown, arch and tongue dimensions and oral lining. */
  oral?: IAutoMovieHumanFaceOral;

  /** Independent numerical brow shafts on the registered shared forehead. */
  brows?: IAutoMovieHumanFaceBrows;

  /** Independent authored lid sections on the common source cage. */
  eyelids?: IAutoMovieHumanFaceEyelids;

  /** Visible resting crease, hood and source epicanthal traits; source-row displacement controls cannot author the same side simultaneously. */
  eyelidPhenotypes?: IAutoMovieHumanFaceEyelidPhenotypes;

  /** Visible medial and wet-margin surfaces on one registered shared opening. */
  ocularSurfaces?: IAutoMovieHumanFaceOcularSurfaces;

  /**
   * Optional overrides by existing material ID: linear RGB `color` and
   * `roughness`, each in [0,1]. A material whose base-colour texture carries
   * fibre coverage in its alpha (a brow or lash card cut by a mask or
   * blended) also takes `pigment`, the fibres' linear RGB albedo in [0,1],
   * and `density`, a factor on that coverage in [0,4]; both are painted into
   * the texture by the shared fibre rule.
   */
  materials?: Record<string, IAutoMovieHumanFaceMaterialOverride>;

  /**
   * Optional anatomical record: measurement targets the editor solves onto
   * existing channels, and clinical observations kept unchanged or refused by
   * name. Admitted before evaluation; a posed jaw beyond the record's own
   * observed motion capacity refuses. Omission changes nothing.
   */
  anatomical?: IAutoMovieHumanFaceAnatomicalRequest;
}
