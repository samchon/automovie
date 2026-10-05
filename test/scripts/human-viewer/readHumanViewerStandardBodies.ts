import { createHash } from "node:crypto";

import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IReadHumanViewerStandardBodiesProps } from "./IReadHumanViewerStandardBodiesProps";

/**
 * The body basis token prefix the numerical worker reads as the published
 * generation's body view, using its `body` basis; the full token is
 * `published-generation-body@<body12>`.
 */
const PUBLISHED_GENERATION_BODY = "published-generation-body";

/**
 * The standard body states, `body:<state>`, built on the published
 * generation's body view (its `body` basis): the same body the standard
 * people wear. Shape and pose come from the standard review states unchanged.
 * The token names the body view's bytes and the key hashes the document, the
 * view digest and the body source digest. The viewer authors these documents,
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
      basis: `${PUBLISHED_GENERATION_BODY}@${generation.bodyDigest.slice(0, 12)}`,
      key: createHash("sha256").update(JSON.stringify(document) + generation.bodyDigest + props.sources.body).digest("hex"),
    };
  });
}
