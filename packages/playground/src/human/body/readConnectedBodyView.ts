import type { IAutoMovieHumanPersonBodyView } from "@automovie/human";
import bodyViewUrl from "erased-data";

import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

/**
 * Read the body partition view of the published person generation, the body
 * every body editor page and worker edits.
 * An explicit caller URL selects its own typed definition without replacing
 * published bytes; the normal consumer retains source and geometry admission.
 *
 * @author Samchon
 */
export function readConnectedBodyView(
  source?: string,
): Promise<IAutoMovieHumanPersonBodyView> {
  return readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
    read: () =>
      fetch(
        source ?? bodyViewUrl,
      ),
  });
}
