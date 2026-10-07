import type { IHumanPreviewFailure } from "./IHumanPreviewFailure";
import type { IHumanPreviewSuccess } from "./IHumanPreviewSuccess";

/**
 * Artifact or refusal alternative of the disposable preview protocol.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps refused work out of successful preview decoding.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Shares the existing success discriminator with the preview caller.
 * @author Samchon
 */
export type HumanPreviewReply = IHumanPreviewSuccess | IHumanPreviewFailure;
