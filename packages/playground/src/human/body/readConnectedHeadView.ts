import type { IAutoMovieHumanPersonHeadView } from "@automovie/human";

import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

/**
 * Read the head partition view of the caller-selected person generation, the
 * head the body editor seats on its neck. The repository bundles no
 * generation, so an omitted URL refuses before any fetch; the normal Person
 * owner checks the paired generation.
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
    read: () => fetch(source),
  });
}
