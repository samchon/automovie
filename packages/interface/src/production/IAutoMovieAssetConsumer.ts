import { IAutoMovieMotionAdoptionConsumer } from "./IAutoMovieMotionAdoptionConsumer";
import { IAutoMovieMotionResourceConsumer } from "./IAutoMovieMotionResourceConsumer";

/**
 * One typed consumer that can own an asset use in a production graph.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `IAutoMovieAssetConsumer` as the portable data boundary for the asset semantic enrichment requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `IAutoMovieAssetConsumer` for the asset spec element consumer links system contract.
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
       * The consumer is the MODEL, not the material or the slot: one image
       * routinely serves several slots of several materials of one model (an
       * ORM map is occlusion, roughness and metalness at once), and a ledger
       * keyed per slot would demand one entry per use of the same bytes for the
       * same reason.
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
       * The consumer is the observation DOCUMENT, not the building it informs:
       * one sheet is routinely read by several buildings, and the reading — not
       * the building — is what the bytes justify. Registering the use never
       * converts the image into design; it only authorizes an observation
       * document to cite these exact bytes as evidence.
       */
      kind: "design-reference";

      /** Exact design-reference document id observing these bytes. */
      id: string;
    }
  | IAutoMovieMotionResourceConsumer
  | IAutoMovieMotionAdoptionConsumer;
