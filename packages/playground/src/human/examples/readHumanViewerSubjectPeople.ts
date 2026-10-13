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
