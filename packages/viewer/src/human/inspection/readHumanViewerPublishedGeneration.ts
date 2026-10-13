import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IReadHumanViewerPublishedGenerationProps } from "./IReadHumanViewerPublishedGenerationProps.js";

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
