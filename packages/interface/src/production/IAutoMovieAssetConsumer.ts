import { IAutoMovieMotionAdoptionConsumer } from "./IAutoMovieMotionAdoptionConsumer";
import { IAutoMovieMotionResourceConsumer } from "./IAutoMovieMotionResourceConsumer";

/**
 * Typed production consumer address for one asset-ledger use. Actual consumers decide which address kinds they admit.
 *
 * @evidence contracts/common.md#principled-implementation Engine texture closure resolves material-texture model ids and scene-environment shot ids, allowing shared images and checking reverse bindings. Other arms retain authoring addresses without a surviving production graph resolver or exclusive-use gate; this union alone establishes no consumer existence.
 * @evidence contracts/common.md#clear-and-simple-design The union reuses motion resource and adoption consumer records and otherwise pairs one kind with its natural identity; texture and design-reference comments explain why ownership belongs to a model or observation document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One shared texture need not invent per-slot uses, and a reference image's ledger use never turns it into built geometry. Engine texture closure reports absent/stale image consumers explicitly; other kinds require their host's own resolution rather than inheriting that guarantee.
 * @evidence contracts/common.md#meaningful-documentation Names every supported consumer and the exact identity it addresses, including hero-resource ownership, model-scoped texture use and observation-document design-reference use.
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
