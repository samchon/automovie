import type { IHumanViewerCatalogueEntry } from "@automovie/viewer/human/inspection/IHumanViewerCatalogueEntry";
import type { IReadHumanViewerStandardPeopleProps } from "@automovie/viewer/human/inspection/IReadHumanViewerStandardPeopleProps";
import type { IHumanViewerReferenceFaceDocument } from "@automovie/viewer/human/inspection/IHumanViewerReferenceFaceDocument";
import type { HumanViewerBodyExamples } from "@automovie/viewer/human/inspection/HumanViewerBodyExamples";
import { humanViewerPersonKey } from "@automovie/viewer/human/inspection/humanViewerPersonKey";
import { humanViewerPublishedGenerationBasis } from "@automovie/viewer/human/inspection/humanViewerPublishedGenerationBasis";

/**
 * The standard people, drawn on the published one-skin generation: `person:connected-reference` (the reference face on the neutral body) and `person:reference:<state>` for each standard body state, which states age and sex once on the person (`population: "linked"`) so the head follows the body. Their documents name the generation's view bases; the token names both view files' bytes, so a view replaced on disk is refused (409), never built under a key or a worker memo that names the old views, and the key follows both view digests. The Playground authors these documents, so the caller admits them like hand-written inputs.
 *
 * @evidence contracts/common.md#principled-implementation Reference face and authored body parameter states compose against the same published generation, with linked population semantics delegated to Person admission and keys including full document, both view digests and all numerical source authorities.
 * @evidence contracts/common.md#clear-and-simple-design Application example composition stays in Playground while Viewer supplies basis tokens and digest keys and Human owns actual person construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named examples are parameter documents requiring ordinary numerical admission, not prebuilt subject meshes or bypasses based on an example id.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies neutral and linked standard states, paired view authority, downstream replaced-byte refusal and application-owned example admission.
 * @evidence contracts/performance.md#efficient-algorithms Composing n examples creates n+1 catalogue records, while keys serialize and hash each complete composed document of d total characters in O(n+d) time and retained output; shared face references avoid an application-level deep copy per example.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue keys encode composed parameters, both view digests and all three source digests for downstream numerical reuse; replacing any authority invalidates the key, while this factory itself retains no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned catalogue records retain ordinary parameter references and strings without acquiring workers or rendered frames; the catalogue owner replaces them on revision.
 */
export function readHumanViewerStandardPeople(
  props: IReadHumanViewerStandardPeopleProps,
): IHumanViewerCatalogueEntry[] {
  const reference: IReadHumanViewerStandardPeopleProps["reference"] = props.reference;
  const generation: IReadHumanViewerStandardPeopleProps["generation"] = props.generation;
  const face: IHumanViewerReferenceFaceDocument = { ...reference, basis: generation.face };
  const documents: StandardPersonDraft[] = [
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
    ...Object.entries(props.examples).map(([name, state]: [string, HumanViewerBodyExamples[string]]): StandardPersonDraft => ({
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
  return documents.map((document: StandardPersonDraft): IHumanViewerCatalogueEntry => ({
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

/** Application-composed parameters; numerical schema admission remains with Person. */
type StandardPersonDraft = {
  id: string;
  name: string;
  population?: "linked";
  face: IHumanViewerReferenceFaceDocument;
  body: { id: string; name: string; basis: string } & HumanViewerBodyExamples[string];
};
