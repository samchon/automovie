import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IReadHumanViewerPublishedGenerationProps } from "./IReadHumanViewerPublishedGenerationProps.js";

/**
 * Read the identities and byte digests of an explicitly selected one-skin generation view pair, published or candidate, and its view bases. Both view files must exist. The published caller refuses a missing view instead of falling back to the separate face/body bases; the candidate caller requires both sidecars before selecting this pair. A view still being read is pending. Each view must open with the same generation id, the head view must carry a `face` basis id and the body view a `body` basis id; those ids are what the standard people's documents name. The person owner joins and admits the views themselves when it builds.
 *
 * @evidence contracts/common.md#principled-implementation Requires both explicitly selected head/body view files, equal generation ids and the required face/body opening basis identities before returning paired byte digests.
 * @evidence contracts/common.md#clear-and-simple-design File availability, pending facts and malformed view refusal remain distinct outcomes within the existing catalogue union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing published view never falls back to unrelated separate bases; identity checks do not claim full view schema admission.
 * @evidence contracts/common.md#meaningful-documentation The comment explains paired selection, pending reads, equal generation authority and the Person owner's remaining construction judgment.
 * @evidence contracts/performance.md#efficient-algorithms Two existence/fact reads and required-member checks use fixed adapter work; sidecar inflation and hashing costs belong to the supplied facts owner.
 * @evidence contracts/performance.md#reuse-equivalent-work The facts provider shares reads under its byte/stamp authority; both returned digests accompany the selected generation and no local cache is added.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter borrows sidecar facts and retains only basis ids and digest strings in its result; it acquires no filesystem or worker handle.
 */
export function readHumanViewerPublishedGeneration(
  props: IReadHumanViewerPublishedGenerationProps,
): IHumanViewerPublishedGeneration | IHumanViewerRejectedInput {
  const missing: ("head" | "body")[] = (["head", "body"] as const).filter(
    (view: "head" | "body"): boolean => !props.exists(view),
  );
  if (missing.length !== 0)
    return {
      file: missing.map((view: "head" | "body"): string => props.files[view]).join(", "),
      pending: false,
      reason:
        "person generation files are not published yet: the standard people are drawn only on the published head and body views",
    };
  const head: ReturnType<IReadHumanViewerPublishedGenerationProps["facts"]> = props.facts("head");
  const body: ReturnType<IReadHumanViewerPublishedGenerationProps["facts"]> = props.facts("body");
  if (head === null || body === null)
    return {
      file: `${props.files.head}, ${props.files.body}`,
      pending: true,
      reason: "the published person generation views are still being read",
    };
  for (const [view, facts] of [
    ["head", head],
    ["body", body],
  ] as const)
    if (facts.view === null)
      return {
        file: props.files[view],
        pending: false,
        reason: `the ${view} view could not be read: ${facts.failure ?? "not a generation view"}`,
      };
  if (head.view!.id !== body.view!.id)
    return {
      file: `${props.files.head}, ${props.files.body}`,
      pending: false,
      reason: `the head view belongs to generation ${head.view!.id} but the body view to ${body.view!.id}`,
    };
  const face: string | undefined = head.view!.members.face;
  const bodyBasis: string | undefined = body.view!.members.body;
  if (face === undefined || face === "")
    return {
      file: props.files.head,
      pending: false,
      reason: "the head view has no face basis that opens with its id",
    };
  if (bodyBasis === undefined || bodyBasis === "")
    return {
      file: props.files.body,
      pending: false,
      reason: "the body view has no body basis that opens with its id",
    };
  return {
    face,
    body: bodyBasis,
    headDigest: head.digest,
    bodyDigest: body.digest,
  };
}
