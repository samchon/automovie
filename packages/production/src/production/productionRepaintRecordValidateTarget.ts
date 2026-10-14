import { IAutoMovieRepaintRecordTarget } from "./IAutoMovieRepaintRecordTarget";

/**
 * Admit candidate/rendition identity and return a detached target before any reader call. Exact nonempty shot/record text is not a credential or path filter; enumerable extra state remains cloneable input rather than an exact schema here.
 *
 * @evidence contracts/common.md#principled-implementation Supported kind and unpadded nonempty string identities precede structuredClone, isolating the callback target from the caller's original object.
 * @evidence contracts/common.md#clear-and-simple-design Target-value admission remains separate from physical reader schema, locator and currentness policies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization or absent-record substitute is introduced; extra fields and clone failures are not hidden by an exact-schema claim.
 * @evidence contracts/common.md#meaningful-documentation Prose gives detached ownership, text/extra-state limits and validation-before-reader timing.
 * @evidence contracts/performance.md#efficient-algorithms Identity trims plus structuredClone follow actual target graph size; extra caller state can make copying exceed the three-field nominal shape.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each target is admitted independently and no mutable-target shape/copy cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The detached graph transfers to the collector and input stays caller-owned; trim/clone temporaries retain no file or reader task.
 */
export const productionRepaintRecordValidateTarget: (target: IAutoMovieRepaintRecordTarget) => IAutoMovieRepaintRecordTarget = (
  target: IAutoMovieRepaintRecordTarget,
): IAutoMovieRepaintRecordTarget => {
  if (
    (target.kind !== "candidate" && target.kind !== "rendition") ||
    typeof target.shot !== "string" ||
    target.shot.trim().length === 0 ||
    target.shot !== target.shot.trim() ||
    typeof target.recordId !== "string" ||
    target.recordId.trim().length === 0 ||
    target.recordId !== target.recordId.trim()
  )
    throw new Error(
      "Repaint inspection targets require exact safe identities.",
    );
  return structuredClone(target);
};
