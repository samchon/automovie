import type { createConnectedFaceRuntime } from "./connectedRuntime";

/**
 * File bytes, admitted previews and separately qualified constructions are
 * distinct alternatives. The numerical owner supplies exact models, readings
 * and the complete construction admission rather than a viewer verdict.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Distinguishes preview candidates from file export results before publication.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps the reply alternatives aligned with the numerical owner.
 * @author Samchon
 */
export type ConnectedFaceResult = Awaited<ReturnType<ReturnType<typeof createConnectedFaceRuntime>>>;
