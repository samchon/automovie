import type { IAutoMovieMotionAdoptionConsumer } from "./IAutoMovieMotionAdoptionConsumer";
import type { IAutoMovieMotionResourceConsumer } from "./IAutoMovieMotionResourceConsumer";

/**
 * Typed production consumer address for one asset-ledger use. Actual consumers decide which address kinds they admit.
 */
export type IAutoMovieAssetConsumer =
  | {
      /** Film audio cue whose `asset` field names this path. */
      kind: "audio-cue";

      /** Exact audio cue id. */
      id: string;
    }
  | {
      /** Model whose registered appearance consumes this model asset. */
      kind: "model";

      /** Exact model id. */
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
       * The model owns this consumer address: one image can serve several slots of several model materials (an ORM map carries occlusion, roughness and metalness), without requiring a ledger entry for every slot using the same bytes.
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
       * The observation document owns this byte use; several buildings may cite readings from one sheet. Registration permits the document to cite exact image bytes and does not convert those bytes into built geometry.
       */
      kind: "design-reference";

      /** Exact design-reference document id observing these bytes. */
      id: string;
    }
  | IAutoMovieMotionResourceConsumer
  | IAutoMovieMotionAdoptionConsumer;
