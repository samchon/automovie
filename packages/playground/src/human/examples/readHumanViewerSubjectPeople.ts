import type { IHumanViewerCatalogueEntry } from "@automovie/viewer/human/inspection/IHumanViewerCatalogueEntry";
import type { IReadHumanViewerSubjectPeopleProps } from "@automovie/viewer/human/inspection/IReadHumanViewerSubjectPeopleProps";
import type { IHumanViewerSubjectDocument } from "@automovie/viewer/human/inspection/IHumanViewerSubjectDocument";
import { humanViewerPersonKey } from "@automovie/viewer/human/inspection/humanViewerPersonKey";
import { humanViewerPublishedBasis } from "@automovie/viewer/human/inspection/humanViewerPublishedBasis";

/**
 * Each published subject on the neutral body, `person:<subject>`. These stay on the legacy published face and body bases because their face documents use the population macros the one-skin generation does not carry. The transport token uses 12-hex-character prefixes of both basis digests, which do not exclude prefix collisions; the numerical key includes both full digests and all three source digests.
 *
 * The supplied face JSON remains unexamined catalogue data and ordinary numerical admission can refuse it; composing a subject id does not establish personal geometry or clinical validity.
 *
 * @evidence contracts/common.md#principled-implementation Supplied subject face parameters pair with empty authored body weights on published face and body bases, and numerical keys include full composed JSON, both basis digests and all three builder source digests.
 * @evidence contracts/common.md#clear-and-simple-design Playground composes application subject documents while Viewer owns published authority tokens and numerical identity and Human owns face/body/person admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subject names are descriptive catalogue identities rather than numerical bypasses, and supplied face data receives no fabricated schema or clinical acceptance here.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes legacy published macro-compatible bases, paired digest authority, supplied unexamined face data and downstream admission limits.
 * @evidence contracts/performance.md#efficient-algorithms Mapping n supplied subjects creates n constant-size wrappers, then serializing and hashing d total composed-document characters costs O(n+d) time and output storage without deep copying supplied face JSON.
 * @evidence contracts/performance.md#reuse-equivalent-work Each downstream cache key reflects full subject document, both basis digests and face/body/person source digests; subject display identity alone cannot reuse a result, and this mapper retains no local cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned catalogue records retain supplied face references and ordinary strings without numerical or GPU resources; revision publication owns catalogue replacement.
 */
export function readHumanViewerSubjectPeople(
  props: IReadHumanViewerSubjectPeopleProps,
): IHumanViewerCatalogueEntry[] {
  return props.subjects.map((face: IHumanViewerSubjectDocument): IHumanViewerCatalogueEntry => {
    const document: { id: string; name: string; face: IHumanViewerSubjectDocument; body: { id: string; name: string; basis: string; shape: Record<string, number> } } = {
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
