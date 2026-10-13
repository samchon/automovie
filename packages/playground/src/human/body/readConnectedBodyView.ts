import type { IAutoMovieHumanPersonBodyView } from "@automovie/human";

import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

/**
 * Read the body partition view of the caller-selected person generation, the
 * body every body editor page and worker edits. The repository bundles no
 * generation, so an omitted URL refuses before any fetch; the normal consumer
 * retains source and geometry admission.
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
    read: () => fetch(source),
  });
}
