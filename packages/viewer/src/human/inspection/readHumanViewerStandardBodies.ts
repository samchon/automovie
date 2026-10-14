import { createHash } from "node:crypto";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IReadHumanViewerStandardBodiesProps } from "./IReadHumanViewerStandardBodiesProps.js";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis.js";

/**
 * The standard body states, `body:<state>`, built on the published generation's body view (its `body` basis): the same body the standard people wear. Shape and pose come from the standard review states unchanged. The paired token names both views because head-only endpoint contributions are actual body constructor dependencies. The key hashes the document, both view digests and the body and person source digests. The viewer authors these documents, so the caller admits them like hand-written inputs.
 *
 * @evidence contracts/common.md#principled-implementation Builds catalogue documents from unchanged application body states on the paired published generation and hashes each document with both view and body/person source digests.
 * @evidence contracts/common.md#clear-and-simple-design Document composition and key creation stay together while basis-token interpretation and numerical body construction retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No example's shape or pose is tuned here and no generated body is admitted merely because its catalogue key was composed.
 * @evidence contracts/common.md#meaningful-documentation The comment explains paired head dependencies, application parameter ownership and the downstream build/admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms For E examples, mapping and hashing cost the total serialized parameter bytes with O(E) returned catalogue entries; each full document enters its key.
 * @evidence contracts/performance.md#reuse-equivalent-work Keys include parameters, both paired view digests and body/person sources, allowing downstream reuse only under that declared authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This pure catalogue constructor owns temporary serialized strings and returned entries but acquires no basis stream, numerical process or GPU handle.
 */
export function readHumanViewerStandardBodies(
  props: IReadHumanViewerStandardBodiesProps,
): IHumanViewerCatalogueEntry[] {
  const { generation }: Pick<IReadHumanViewerStandardBodiesProps, "generation"> = props;
  return Object.entries(props.examples).map(([name, state]: [string, IReadHumanViewerStandardBodiesProps["examples"][string]]): IHumanViewerCatalogueEntry => {
    const document: { id: string; name: string; basis: string } & IReadHumanViewerStandardBodiesProps["examples"][string] = {
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
