import { createHash } from "node:crypto";

import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis";
import type { IReadHumanViewerStandardBodiesProps } from "./IReadHumanViewerStandardBodiesProps";

/**
 * The standard body states, `body:<state>`, built on the published
 * generation's body view (its `body` basis): the same body the standard
 * people wear. Shape and pose come from the standard review states unchanged.
 * The paired token names both views because head-only endpoint contributions
 * are actual body constructor dependencies. The key hashes the document, both
 * view digests and the body and person source digests. The viewer authors these documents,
 * so the caller admits them like hand-written inputs.
 *
 * @evidence contracts/common.md#principled-implementation Binds each standard body state to the exact view bytes it is built on.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the standard-body group; admission stays with the caller.
 * @evidence contracts/common.md#meaningful-documentation States the basis, the unchanged states and the key inputs.
 */
export function readHumanViewerStandardBodies(props: IReadHumanViewerStandardBodiesProps): IHumanViewerCatalogueEntry[] {
  const { generation } = props;
  return Object.entries(standardBodyReviewStates()).map(([name, state]) => {
    const document = { id: "body:" + name, name, basis: generation.body, ...state };
    return {
      id: document.id,
      domain: "body" as const,
      document,
      basis: humanViewerPublishedGenerationBasis(generation),
      key: createHash("sha256").update(JSON.stringify(document) + generation.headDigest + generation.bodyDigest + props.sources.body + props.sources.person).digest("hex"),
    };
  });
}
