import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Report blank or duplicate sibling identities, then record the identity as seen.
 *
 * @evidence contracts/common.md#principled-implementation Whitespace trimming decides blankness and exact string Set membership decides duplication; even a rejected blank id is added to match the original traversal policy.
 * @evidence contracts/common.md#clear-and-simple-design Callers own the sibling population and fresh seen set, while one shared helper owns identity diagnostic wording.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ids are neither renamed nor trimmed before insertion; authored identity and duplicate handling remain observable.
 * @evidence contracts/common.md#meaningful-documentation Documents exact-string duplicate policy, blankness and mutation of both the supplied set and collector.
 * @evidence contracts/performance.md#efficient-algorithms Trim costs O(id length), with expected constant Set lookup/insertion and at most one finding per call.
 * @evidence contracts/performance.md#reuse-equivalent-work Planting and soft-domain validation share identical identity logic but keep distinct caller-owned sets and labels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Seen ids live only as long as the validation owner's set; this helper retains no set or registry itself.
 */
export const validateSoftIdentity: (
  out: ViolationCollector,
  path: string,
  label: string,
  id: string,
  seen: Set<string>,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  id: string,
  seen: Set<string>,
): void => {
  if (id.trim().length === 0)
    out.push("type", `${path}.id`, `${label} id must be non-empty`, id);
  else if (seen.has(id))
    out.push("type", `${path}.id`, `${label} id "${id}" is duplicated`, id);
  seen.add(id);
};
