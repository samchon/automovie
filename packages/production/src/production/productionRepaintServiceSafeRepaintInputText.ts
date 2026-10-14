/**
 * Guardedly reads one requested input key through Reflect and returns a string or empty text for nonstrings/unsafe access.
 *
 * @evidence contracts/common.md#principled-implementation Guardedly reads one requested input key through Reflect and returns a string or empty text for nonstrings/unsafe access.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation No hostile input reference is retained after the immediate call.
 * @evidence contracts/performance.md#efficient-algorithms One property read is used only to construct a safe refusal identity before schema validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No hostile input reference is retained after the immediate call.
 */
export const productionRepaintServiceSafeRepaintInputText: (input: unknown, key: "productionId" | "shot") => string = (
  input: unknown,
  key: "productionId" | "shot",
): string => {
  try {
    if (typeof input !== "object" || input === null) return "";
    const value: unknown = Reflect.get(input, key);
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
};
