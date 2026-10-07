import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";
import type { IReadHumanViewerPublishedGenerationProps } from "./IReadHumanViewerPublishedGenerationProps";

/**
 * Read the identities and byte digests of an explicitly selected one-skin
 * generation view pair, published or candidate, and its view bases. Both view
 * files must exist. The published caller refuses a missing view instead of
 * falling back to the separate face/body bases; the candidate caller requires
 * both sidecars before selecting this pair. A view
 * still being read is pending. Each view must open with the same generation
 * id, the head view must carry a `face` basis id and the body view a `body`
 * basis id; those ids are what the standard people's documents name. The
 * person owner joins and admits the views themselves when it builds.
 *
 * @evidence contracts/common.md#principled-implementation Takes the basis ids from the views and refuses a missing or mismatched pair rather than substituting another path.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the generation verdict; reading and catalogue composition stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never falls back to the legacy face and body pair for the standard people.
 * @evidence contracts/common.md#meaningful-documentation States the existence, pending, id and member rules.
 */
export function readHumanViewerPublishedGeneration(
  props: IReadHumanViewerPublishedGenerationProps,
): IHumanViewerPublishedGeneration | IHumanViewerRejectedInput {
  const missing = (["head", "body"] as const).filter(
    (view) => !props.exists(view),
  );
  if (missing.length !== 0)
    return {
      file: missing.map((view) => props.files[view]).join(", "),
      pending: false,
      reason:
        "person generation files are not published yet: the standard people are drawn only on the published head and body views",
    };
  const head = props.facts("head");
  const body = props.facts("body");
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
  const face = head.view!.members.face;
  const bodyBasis = body.view!.members.body;
  if (face === undefined)
    return {
      file: props.files.head,
      pending: false,
      reason: "the head view has no face basis that opens with its id",
    };
  if (bodyBasis === undefined)
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
