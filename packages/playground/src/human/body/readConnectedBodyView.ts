import type { IAutoMovieHumanPersonBodyView } from "@automovie/human";

import { readConnectedFaceAsset } from "../common/connectedAsset";

/**
 * Read the body partition view of the published person generation, the body
 * every body editor page and worker edits.
 *
 * @author Samchon
 */
export function readConnectedBodyView(): Promise<IAutoMovieHumanPersonBodyView> {
  return readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
    read: () => fetch(new URL("../../../../../test/studies/human-person/generation/body.json.gz", import.meta.url)),
  });
}
