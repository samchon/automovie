import type { IHumanViewerCatalogueEntry } from "@automovie/viewer/human/inspection/IHumanViewerCatalogueEntry";
import type { IReadHumanViewerSubjectPeopleProps } from "@automovie/viewer/human/inspection/IReadHumanViewerSubjectPeopleProps";
import { humanViewerPersonKey } from "@automovie/viewer/human/inspection/humanViewerPersonKey";
import { humanViewerPublishedBasis } from "@automovie/viewer/human/inspection/humanViewerPublishedBasis";

/**
 * Each published subject on the neutral body, `person:<subject>`. These stay
 * on the legacy published face and body bases because their face documents
 * use the population macros the one-skin generation does not carry. The
 * token names both basis files' bytes and the key both digests and all three
 * source digests.
 *
 * @evidence contracts/common.md#principled-implementation Keeps documents that use legacy macros on the bases that define them, with both basis digests bound.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the subject-people group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves each supplied face and legacy basis identity without converting unsupported macros to a different generation or manufacturing anatomical measurements.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps original subject face parameters on the supplied legacy basis that defines their channels.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Preserves parameter documents and their basis identities without fitting or replacing them during person example composition.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Authors legacy subject-person catalogue examples with the application's neutral body convention.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Supplies paired person selection without moving preset parameter creation into the viewer library.
 * @evidence contracts/common.md#meaningful-documentation States why these people stay on the legacy bases.
 */
export function readHumanViewerSubjectPeople(
  props: IReadHumanViewerSubjectPeopleProps,
): IHumanViewerCatalogueEntry[] {
  return props.subjects.map((face) => {
    const document = {
      id: "person:" + face.id,
      name: face.name ?? face.id,
      face,
      body: {
        id: "person-body",
        name: "neutral body",
        basis: props.bases.body.id,
        shape: {},
      },
    };
    return {
      id: document.id,
      domain: "person" as const,
      document,
      basis: humanViewerPublishedBasis(
        props.bases.face.digest,
        props.bases.body.digest,
      ),
      key: humanViewerPersonKey({
        document,
        bases: props.bases,
        sources: props.sources,
      }),
    };
  });
}
