import type { IAutoMovieHumanPersonHeadView } from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

/**
 * Read the caller-selected person generation's head partition for the body companion or whole-person evaluator. Omitted source rejects before fetch; decode failures propagate, and the numerical Person owner checks schema and pairing with the independently loaded body view.
 *
 * @evidence contracts/common.md#principled-implementation The head is loaded from an explicit caller URL using shared content decoding; the Person generation owner, rather than this generic JSON loader, establishes schema and head-body pairing.
 * @evidence contracts/common.md#clear-and-simple-design Head-specific payload typing and absent-source refusal remain here, while the Viewer adapter owns response, decompression and JSON failure handling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing selection has no bundled head substitute, and naming the decoded head-view type does not certify raw source or generation identity.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies companion and whole-person use, omission refusal, propagated decoding failure and downstream pairing authority.
 * @evidence contracts/performance.md#efficient-algorithms Head reading performs one fetch, optional content decompression and JSON parse with work proportional to b response bytes plus t decoded characters and their transient storage, without fetching another body here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A head read coordinates no repeated-request cache; its numerical consumer retains the admitted generation for subsequent evaluations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fetch response, bytes and decoded text leave the call after parsing or failure; only the returned caller-owned head view remains retained.
 *
 * @author Samchon
 */
export async function readConnectedHeadView(
  source?: string,
): Promise<IAutoMovieHumanPersonHeadView> {
  if (source === undefined)
    throw new Error(
      "No person generation is bundled: select headSource and bodySource URLs.",
    );
  return readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
    read: (): Promise<Response> => fetch(source),
  });
}
