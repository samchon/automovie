import { IAutoMovieMotionAdoptionConsumer } from "./IAutoMovieMotionAdoptionConsumer";
import { IAutoMovieMotionResourceConsumer } from "./IAutoMovieMotionResourceConsumer";

/**
 * Addressable production consumer that justifies one asset-ledger use. Inventory validation resolves the kind and id against current production records.
 *
 * @evidence contracts/common.md#principled-implementation A kind and stable address identify the record that consumes exact asset bytes; inventory validation resolves each typed consumer instead of accepting a free-form reason as proof of live usage.
 * @evidence contracts/common.md#clear-and-simple-design The union reuses motion resource and adoption consumer records and otherwise pairs one kind with its natural identity; texture and design-reference comments explain why ownership belongs to a model or observation document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One shared texture need not invent per-slot uses, and a reference image's ledger use never turns it into built geometry; absent consumers are refused rather than retained as imaginary byte ownership.
 * @evidence contracts/common.md#meaningful-documentation Names every supported consumer and the exact identity it addresses, including hero-resource ownership, model-scoped texture use and observation-document design-reference use.
 * @author Samchon
 */
export type IAutoMovieAssetConsumer =
  | {
      /** Film audio cue whose `asset` field names this path. */
      kind: "audio-cue";

      /** Exact audio cue id. */
      id: string;
    }
  | {
      /** Model recipe whose registered appearance consumes this model asset. */
      kind: "model-recipe";

      /** Exact model recipe id. */
      id: string;
    }
  | {
      /** Sidecar or LOD bytes owned by one external-model asset. */
      kind: "model-resource";

      /** Exact path of the owning hero model asset. */
      id: string;
    }
  | {
      /** Byte-authored deterministic proxy owned by one external model. */
      kind: "model-proxy";

      /** Exact path of the owning hero model asset. */
      id: string;
    }
  | {
      /** Fixed non-collapsible role-specific reference for one repaint shot. */
      kind: "rendition-reference";

      /** Exact shot id. */
      id: string;
    }
  | {
      /**
       * Image bound by one compiled material's PBR texture slots.
       *
       * The consumer is the MODEL, not the material or the slot: one image routinely serves several slots of several materials of one model (an ORM map is occlusion, roughness and metalness at once), and a ledger keyed per slot would demand one entry per use of the same bytes for the same reason.
       */
      kind: "material-texture";

      /** Exact compiled model id whose materials bind this image. */
      id: string;
    }
  | {
      /** Equirectangular image lighting the scene of one compiled shot. */
      kind: "scene-environment";

      /** Exact shot id whose scene environment names this image. */
      id: string;
    }
  | {
      /**
       * Observed plan, section, elevation, detail, or generated design study.
       *
       * The consumer is the observation DOCUMENT, not the building it informs: one sheet is routinely read by several buildings, and the reading; not the building; is what the bytes justify. Registering the use never converts the image into design; it only authorizes an observation document to cite these exact bytes as evidence.
       */
      kind: "design-reference";

      /** Exact design-reference document id observing these bytes. */
      id: string;
    }
  | IAutoMovieMotionResourceConsumer
  | IAutoMovieMotionAdoptionConsumer;
