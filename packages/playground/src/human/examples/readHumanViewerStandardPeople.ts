import type { IHumanViewerCatalogueEntry } from "@automovie/viewer/human/inspection/IHumanViewerCatalogueEntry";
import type { IReadHumanViewerStandardPeopleProps } from "@automovie/viewer/human/inspection/IReadHumanViewerStandardPeopleProps";
import { humanViewerPersonKey } from "@automovie/viewer/human/inspection/humanViewerPersonKey";
import { humanViewerPublishedGenerationBasis } from "@automovie/viewer/human/inspection/humanViewerPublishedGenerationBasis";

/**
 * The standard people, drawn on the published one-skin generation:
 * `person:connected-reference` (the reference face on the neutral body) and
 * `person:reference:<state>` for each standard body state, which states age
 * and sex once on the person (`population: "linked"`) so the head follows the
 * body. Their documents name the generation's view bases; the token names
 * both view files' bytes, so a view replaced on disk is refused (409), never
 * built under a key or a worker memo that names the old views, and the key
 * follows both view digests. The Playground authors these documents, so the
 * caller admits them like hand-written inputs.
 *
 * @evidence contracts/common.md#principled-implementation Binds each standard person to the exact view bytes it is built on.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the standard-people group; admission stays with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Catalogue examples retain the supplied reference, body states and paired basis digests; no fitted subject geometry or admitted-preview exception is introduced.
 * @evidence contracts/common.md#meaningful-documentation States the documents, the linked population and the token.
 */
export function readHumanViewerStandardPeople(
  props: IReadHumanViewerStandardPeopleProps,
): IHumanViewerCatalogueEntry[] {
  const { reference, generation } = props;
  const face = { ...reference, basis: generation.face };
  const documents = [
    {
      id: "person:connected-reference",
      name: reference.name,
      face,
      body: {
        id: "person-body",
        name: "neutral body",
        basis: generation.body,
        shape: {},
      },
    },
    ...Object.entries(props.examples).map(([name, state]) => ({
      id: "person:reference:" + name,
      name: "reference " + name,
      population: "linked",
      face,
      body: {
        id: "person-body:" + name,
        name,
        basis: generation.body,
        ...state,
      },
    })),
  ];
  return documents.map((document) => ({
    id: document.id,
    domain: "person" as const,
    document,
    basis: humanViewerPublishedGenerationBasis(generation),
    key: humanViewerPersonKey({
      document,
      bases: {
        face: { digest: generation.headDigest },
        body: { digest: generation.bodyDigest },
      },
      sources: props.sources,
    }),
  }));
}
