import type { IAutoMovieHumanPersonHeadView } from "@automovie/human";

import { readConnectedFaceAsset } from "../common/connectedAsset";

/**
 * Read the head partition view of the published person generation, the head
 * the body editor seats on its neck.
 * An explicit caller URL selects its own typed definition instead; the same
 * decoder is used and the normal Person owner checks the paired generation.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Loads the published head view the editor seats on the body's neck.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Supplies the companion head that stays display-only beside the body.
 * @author Samchon
 */
export function readConnectedHeadView(
  source?: string,
): Promise<IAutoMovieHumanPersonHeadView> {
  return readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
    read: () =>
      fetch(
        source ??
          new URL(
            "../../../../../test/studies/human-person/generation/head.json.gz",
            import.meta.url,
          ),
      ),
  });
}
