import type { IAutoMovieMaterial } from "@automovie/interface";
import type { IPortraitCheekShape } from "../anatomy/cheek/IPortraitCheekShape";
import type { IPortraitEarShape } from "../anatomy/ear/IPortraitEarShape";
import type { IPortraitEyeShape } from "../anatomy/eye/structures/IPortraitEyeShape";
import type { IPortraitComponentHost } from "../surface/structures/IPortraitComponentHost";
import { AutoMovieHumanFaceOverride } from "../AutoMovieHumanFaceOverride";
import { IAutoMovieHumanFaceBindings } from "./IAutoMovieHumanFaceBindings";
import { IAutoMovieHumanFaceControls } from "./IAutoMovieHumanFaceControls";
import { IAutoMovieHumanFaceExpression } from "./IAutoMovieHumanFaceExpression";
import { IAutoMovieHumanFaceRecipe } from "./IAutoMovieHumanFaceRecipe";

/**
 * A replayable procedural face, with observed basis, author-owned shape,
 * explicit side overrides and expression. Photographs and measurement tools
 * are provenance only and never executable replay dependencies.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Stores an independent face document with basis, detail, asymmetry and appearance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Separates observed topology and shape settings from deterministic interpretation.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Retains the selected photo URL, byte digest, known author/license and source-quality decision without fetching it.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance Uses an optional reference with nullable unknown facts; it never participates in shape resolution.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-review Subject inventories, rendered-view observations and likeness decisions belong to the authoring study, not the replayable face document or geometry library.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The library emits a model for external capture and inspection; it does not issue a subjective likeness verdict or a per-study review receipt.
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

  /** Explicit detailed overrides after intermediate controls; arrays replace whole populations. */
  detail?: AutoMovieHumanFaceOverride<IAutoMovieHumanFaceRecipe>;

  /** Independent side profiles after common detail; omission keeps the common profile. */
  asymmetry?: {
    /** Anatomical right side (-X). */
    right?: {
      eye?: AutoMovieHumanFaceOverride<IPortraitEyeShape>;
      cheek?: AutoMovieHumanFaceOverride<IPortraitCheekShape>;
      ear?: AutoMovieHumanFaceOverride<IPortraitEarShape>;
    };

    /** Anatomical left side (+X). */
    left?: {
      eye?: AutoMovieHumanFaceOverride<IPortraitEyeShape>;
      cheek?: AutoMovieHumanFaceOverride<IPortraitCheekShape>;
      ear?: AutoMovieHumanFaceOverride<IPortraitEarShape>;
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
