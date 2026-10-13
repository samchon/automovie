import type { IAutoMovieHumanPersonBodyView } from "@automovie/human";

import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

/**
 * Read the caller-selected person generation's body partition. Omitted source rejects before fetch because the repository bundles no generation. HTTP, content decoding and JSON failures propagate; the generic decoded type is not schema validation, and the numerical consumer owns source and geometry admission.
 *
 * @evidence contracts/common.md#principled-implementation An explicit caller URL is fetched through the shared content-decoding adapter, with absent-source refusal before IO and numerical source admission left to the body-generation consumer.
 * @evidence contracts/common.md#clear-and-simple-design This loader selects the body payload type and supplies fetch, reusing the Viewer adapter's HTTP, gzip and JSON error path rather than duplicating decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no bundled body fallback, and the generic result type is explicitly not claimed to validate caller-selected bytes.
 * @evidence contracts/common.md#meaningful-documentation The comment states required source selection, pre-fetch omission refusal, propagated transport and parse errors and downstream schema ownership.
 * @evidence contracts/performance.md#efficient-algorithms One fetch, optional decompression and JSON parse take work proportional to b response bytes plus t decoded characters, with transient byte/text storage and the parsed body; the shared decoder chooses decompression from content.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This single asset read implements no request cache; mounted workers and pages decide the lifetime of their independently admitted source views.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Response bytes and decode text remain call-local until parsing completes or fails, and the returned body view becomes caller-owned data without a retained connection handle.
 *
 * @author Samchon
 */
export async function readConnectedBodyView(
  source?: string,
): Promise<IAutoMovieHumanPersonBodyView> {
  if (source === undefined)
    throw new Error(
      "No person generation is bundled: select headSource and bodySource URLs.",
    );
  return readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
    read: (): Promise<Response> => fetch(source),
  });
}
