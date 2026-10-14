import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { IRenderFileDescriptorFailure } from "./IRenderFileDescriptorFailure";
import { RenderFileDescriptorCleanupError } from "./RenderFileDescriptorCleanupError";

/**
 * Attempt one render-descriptor close without replacing an earlier read failure.
 *
 * @evidence contracts/common.md#principled-implementation Calls closeSync once; a sole close failure propagates unchanged, while an earlier captured failure joins the new failure in an ordered native aggregate. Only this owner's existing cleanup aggregate is flattened.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProductionProject.readRenderFile owns descriptor acquisition and supplies captured read failures at outer and resident-descriptor cleanup boundaries; this helper owns cause-preserving closure only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary prior thrown values survive aggregation, and closure failure is never swallowed or retried under a different descriptor.
 * @evidence contracts/common.md#meaningful-documentation States single-close behavior, sole-failure propagation and ordered aggregation; a close failure does not prove the host released the descriptor.
 * @evidence contracts/performance.md#efficient-algorithms Success performs one host close; failure copies A prior cleanup causes once into A+1 ordered references plus native error creation. It does not read render bytes or rescan paths.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Descriptor closure is an effect on one owned acquisition and cannot share another close's result; repeated calls would risk a reused descriptor number.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The render read scope hands over its descriptor for immediate close on success or failure; the host owns release success, and a thrown close exposes unresolved cleanup rather than claiming release. Error cause references transfer to the catcher, with no retained store or task.
 */
export function closeRenderFileDescriptor(descriptor: number, failure: IRenderFileDescriptorFailure | undefined, relativePath: string): void {
  try { fileSystem.closeSync(descriptor); }
  catch (closeFailure) {
    if (failure === undefined) throw closeFailure;
    throw new RenderFileDescriptorCleanupError([
      ...(failure.error instanceof RenderFileDescriptorCleanupError ? failure.error.errors : [failure.error]),
      closeFailure,
    ], `Render-file descriptor cleanup failed after the read failed: ${relativePath}.`);
  }
}
