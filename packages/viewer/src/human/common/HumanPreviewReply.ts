import type { IHumanPreviewFailure } from "./IHumanPreviewFailure.js";
import type { IHumanPreviewSuccess } from "./IHumanPreviewSuccess.js";

/**
 * Artifact or refusal alternative of the disposable preview protocol.
 *
 * @author Samchon
 */
export type HumanPreviewReply = IHumanPreviewSuccess | IHumanPreviewFailure;
