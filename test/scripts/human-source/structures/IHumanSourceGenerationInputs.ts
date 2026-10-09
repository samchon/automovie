import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanSourceAcquisitionReading } from "./IHumanSourceAcquisitionReading.ts";
import type { IHumanSourceChinReceipt } from "./IHumanSourceChinReceipt.ts";
import type { IHumanSourceExtractionReceipt } from "./IHumanSourceExtractionReceipt.ts";
import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";
import type { IHumanSourceGenerationUpstream } from "./IHumanSourceGenerationUpstream.ts";
import type { IHumanSourceMirror } from "./IHumanSourceMirror.ts";
import type { IHumanSourcePosteriorOcclusionAuthoring } from "./IHumanSourcePosteriorOcclusionAuthoring.ts";
import type { IHumanSourceProducerClosure } from "./IHumanSourceProducerClosure.ts";
import type { IHumanSourceRecropReceipt } from "./IHumanSourceRecropReceipt.ts";
import type { IHumanSourceRigBone } from "./IHumanSourceRigBone.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";
import type { IHumanSourceTongueRestAuthoring } from "./IHumanSourceTongueRestAuthoring.ts";
import type { readHumanSourceBaseFaces } from "../readHumanSourceBaseFaces.ts";
import type { defineHumanSourceToeRays } from "../defineHumanSourceToeRays.ts";

/**
 * Licensed source inputs and mutable acquisition record before replay.
 * The compiler owns these parsed values; external files remain immutable.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationInputs {
  /** Immutable acquisition bytes and their final verifier. */
  acquisitionReading: IHumanSourceAcquisitionReading;

  /** Resolved producer authority and final byte verifier. */
  producer: IHumanSourceProducerClosure;

  /** Owned input record populated before identity is frozen. */
  inputs: IHumanSourceGenerationInput[];

  /** Admitted original attachment context; its source basis is never retargeted. */
  attachmentDocument: IAutoMovieHumanFaceBasisDocument;

  /** Pinned consumed content and distinct rights statements. */
  upstream: IHumanSourceGenerationUpstream[];

  /** Actual sampled neutral, endpoints, landmarks and weights. */
  sample: IHumanSourceSample;

  /** Owned published face with optional shared oral authoring. */
  face: IAutoMovieHumanFaceBasis;

  /** Owned published body before current-root reconstruction. */
  body: IAutoMovieHumanBodyBasis;

  /** Exact original published face byte identity. */
  faceSha256: string;

  /** Historical cut convention read from its original receipt. */
  preparation: IHumanSourceRecropReceipt;

  /** Published body frame and extraction authority. */
  extraction: IHumanSourceExtractionReceipt;

  /** Original chin conversion, unchanged by attachment work. */
  lowerFace: IHumanSourceChinReceipt;

  /** Historical fine head used for actual cut correspondence. */
  fineHead: IAutoMovieHumanFaceBasis;

  /** Exact historical face paired with the published body. */
  rigidFace: IAutoMovieHumanFaceBasis;

  /** Pinned native rig, still distinct from replayed joint rows. */
  rig: Record<string, IHumanSourceRigBone>;

  /** Native polygon table for source station registration. */
  baseFaces: ReturnType<typeof readHumanSourceBaseFaces>;

  /** Native identity-based left/right correspondence. */
  mirror: IHumanSourceMirror;

  /** Actual sampled toe memberships when supplied. */
  toeRays: ReturnType<typeof defineHumanSourceToeRays> | null;

  /** Licensed native oral content identities. */
  oralSourceSha256: string[];

  /** Optional original crown authoring observations. */
  oralAuthoring?: IHumanSourcePosteriorOcclusionAuthoring;

  /** Optional original tongue authoring observations. */
  tongueAuthoring?: IHumanSourceTongueRestAuthoring;
}
