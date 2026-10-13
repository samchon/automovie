import { createHash } from "node:crypto";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IReadHumanViewerStandardBodiesProps } from "./IReadHumanViewerStandardBodiesProps.js";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis.js";

/**
 * The standard body states, `body:<state>`, built on the published
 * generation's body view (its `body` basis): the same body the standard
 * people wear. Shape and pose come from the standard review states unchanged.
 * The paired token names both views because head-only endpoint contributions
 * are actual body constructor dependencies. The key hashes the document, both
 * view digests and the body and person source digests. The viewer authors these documents,
 * so the caller admits them like hand-written inputs.
 */
export function readHumanViewerStandardBodies(
  props: IReadHumanViewerStandardBodiesProps,
): IHumanViewerCatalogueEntry[] {
  const { generation } = props;
  return Object.entries(props.examples).map(([name, state]) => {
    const document = {
      id: "body:" + name,
      name,
      basis: generation.body,
      ...state,
    };
    return {
      id: document.id,
      domain: "body" as const,
      document,
      basis: humanViewerPublishedGenerationBasis(generation),
      key: createHash("sha256")
        .update(
          JSON.stringify(document) +
            generation.headDigest +
            generation.bodyDigest +
            props.sources.body +
            props.sources.person,
        )
        .digest("hex"),
    };
  });
}
