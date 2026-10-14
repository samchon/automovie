import type { IAutoMovieMaterial } from "@automovie/interface";

import type { AutoMovieHumanFaceEditableEyeOverride } from "../AutoMovieHumanFaceEditableEyeOverride";
import type { AutoMovieHumanFaceEditableOverride } from "../AutoMovieHumanFaceEditableOverride";
import type { AutoMovieHumanFaceOverride } from "../AutoMovieHumanFaceOverride";
import type { IPortraitCheekShape } from "../anatomy/cheek/IPortraitCheekShape";
import type { IPortraitEarShape } from "../anatomy/ear/IPortraitEarShape";
import type { IPortraitComponentHost } from "../surface/structures/IPortraitComponentHost";
import type { IAutoMovieHumanFaceBindings } from "./IAutoMovieHumanFaceBindings";
import type { IAutoMovieHumanFaceControls } from "./IAutoMovieHumanFaceControls";
import type { IAutoMovieHumanFaceExpression } from "./IAutoMovieHumanFaceExpression";
import type { IAutoMovieHumanFaceRecipe } from "./IAutoMovieHumanFaceRecipe";

/**
 * A replayable procedural face, with observed basis, author-owned shape,
 * explicit side overrides and expression. Photographs and measurement tools
 * are provenance only and never executable replay dependencies.
 *
 * @evidence contracts/common.md#principled-implementation A revisioned 478-sample millimetre source host/recipe/bindings records observed expression separately from current performance; resolution applies intermediate then detail then side edits while direct/parsed replay retains immutable source-geometry boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Basis, scalar controls/detail, explicit side profiles, material palette and passive provenance own separate concerns without runtime photograph fitting or embedded named-person defaults.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Monocular depth is inferred rather than hidden-tissue measurement, nonempty detail geometry cannot replace source arrays, and provenance does not select/fetch a subject or certify likeness.
 * @evidence contracts/common.md#meaningful-documentation Members state topology/frame, ordering, neutral/current-versus-observed meaning, sparse/remove-array semantics, anatomical signs and passive source/license unknowns.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema executes no source admission, profile merge or facial build.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Saved source identity supplies review/replay inputs but defines no fit, merge or geometry cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document caller owns basis/profile arrays and references; this type opens no photograph stream, model task or renderer.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceDocument {
  /** Nonempty caller-owned identity, independent from any photograph filename. */
  id: string;

  /** Human-readable label, not a runtime subject selector. */
  name: string;

  /** Immutable observed or authored shape and attachment foundation. */
  basis: {
    /** Caller-owned basis revision; changing it makes prior derived reviews stale. */
    id: string;

    /** Landmark topology interpretation the cranial continuation reads. */
    topology: "mediapipe-478/1";

    /** Host in head millimetres; image XY is observed, monocular depth is inferred. */
    host: IPortraitComponentHost;

    /** Anatomical socket and group identities on this host. */
    bindings: IAutoMovieHumanFaceBindings;

    /** Complete baseline part shapes; no named-person defaults are embedded in the package. */
    recipe: IAutoMovieHumanFaceRecipe;

    /** Expression already present in the host. Empty means an authored neutral basis. */
    expression: IAutoMovieHumanFaceExpression;
  };

  /** Optional intermediate trait offsets; omitted channels are zero. */
  controls?: IAutoMovieHumanFaceControls;

  /**
   * Explicit scalar/detail overrides after intermediate controls. Nonempty
   * source geometry arrays are immutable basis content: omission inherits
   * them, while [] may remove an inherited optional population.
   * Additional hair layers may vary scalar styling but keep source card guides.
   * Skin-colour regions and iris RGB affect reflectance rather than 3D shape.
   * The runtime admission owns this boundary for parsed and direct documents.
   */
  detail?: Omit<
    AutoMovieHumanFaceEditableOverride<IAutoMovieHumanFaceRecipe>,
    "hairLayers" | "skinColour" | "eye"
  > & {
    /** Eye shape is scalar; iris RGB remains independent appearance. */
    eye?: AutoMovieHumanFaceEditableEyeOverride;

    /** Numerical legacy layer edits preserve each source card guide. */
    hairLayers?: AutoMovieHumanFaceOverride<
      IAutoMovieHumanFaceRecipe["hairLayers"]
    >;

    /** Reflectance fields change no geometric surface. */
    skinColour?: AutoMovieHumanFaceOverride<
      IAutoMovieHumanFaceRecipe["skinColour"]
    >;
  };

  /** Independent side profiles after common detail; omission keeps the common profile. */
  asymmetry?: {
    /** Anatomical right side (-X). */
    right?: {
      /** Right eye's scalar identity and independent iris appearance. */
      eye?: AutoMovieHumanFaceEditableEyeOverride;

      /** Right cheek detail over the common cheek profile. */
      cheek?: AutoMovieHumanFaceEditableOverride<IPortraitCheekShape>;

      /** Right ear detail over the common ear profile. */
      ear?: AutoMovieHumanFaceEditableOverride<IPortraitEarShape>;
    };

    /** Anatomical left side (+X). */
    left?: {
      /** Left eye's scalar identity and independent iris appearance. */
      eye?: AutoMovieHumanFaceEditableEyeOverride;

      /** Left cheek detail over the common cheek profile. */
      cheek?: AutoMovieHumanFaceEditableOverride<IPortraitCheekShape>;

      /** Left ear detail over the common ear profile. */
      ear?: AutoMovieHumanFaceEditableOverride<IPortraitEarShape>;
    };
  };

  /** Complete base material palette; omission uses the fixed defaults, not photograph colours. */
  appearance?: readonly IAutoMovieMaterial[];

  /** Current performance; omission means neutral, not the source's expression. */
  expression?: IAutoMovieHumanFaceExpression;

  /** Optional source facts, never used to fetch or fit geometry during replay. */
  reference?: {
    /** Original or replacement URL, or null for a wholly authored basis. */
    url: string | null;

    /** Original downloaded byte identity, or null when no photograph exists. */
    sha256: string | null;

    /** Known author, or null when not established. */
    author: string | null;

    /** Established license, or null when not established. */
    license: string | null;

    /** Source selection and visible quality limitations. */
    decision: string;
  };
}
