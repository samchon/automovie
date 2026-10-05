import type { IAutoMovieHumanPersonHeadView } from "@automovie/human";

import { readConnectedFaceAsset } from "../common/connectedAsset";

/**
 * Read the head partition view of the published person generation, the head
 * the body editor seats on its neck.
 *
 * @author Samchon
 */
export function readConnectedHeadView(): Promise<IAutoMovieHumanPersonHeadView> {
  return readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
    read: () => fetch(new URL("../../../../../test/studies/human-person/generation/head.json.gz", import.meta.url)),
  });
}
