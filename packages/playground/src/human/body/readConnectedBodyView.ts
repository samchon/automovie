import type { IAutoMovieHumanPersonBodyView } from "@automovie/human";

import { readConnectedFaceAsset } from "../common/connectedAsset";

/**
 * Read the body partition view of the published person generation, the body
 * every body editor page and worker edits.
 * An explicit caller URL selects its own typed definition without replacing
 * published bytes; the normal consumer retains source and geometry admission.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Loads the published body partition view every body editor page and worker edits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Supplies the basis the persistent body worker reads once and compiles before evaluating documents.
 * @author Samchon
 */
export function readConnectedBodyView(source?: string): Promise<IAutoMovieHumanPersonBodyView> {
  return readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
    read: () => fetch(source ?? new URL("../../../../../test/studies/human-person/generation/body.json.gz", import.meta.url)),
  });
}
