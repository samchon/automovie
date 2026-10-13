import type { IAutoMovieHumanPersonHeadView } from "@automovie/human";
import headViewUrl from "erased-data";

import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

/**
 * Read the head partition view of the published person generation, the head
 * the body editor seats on its neck.
 * An explicit caller URL selects its own typed definition instead; the same
 * decoder is used and the normal Person owner checks the paired generation.
 *
 * @author Samchon
 */
export function readConnectedHeadView(
  source?: string,
): Promise<IAutoMovieHumanPersonHeadView> {
  return readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
    read: () =>
      fetch(
        source ?? headViewUrl,
      ),
  });
}
