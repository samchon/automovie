import { AutoMovieChannelValueType } from "@automovie/interface";

import { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";

/**
 * One supported light axis joins track type/bounds, kind admission, optional whole-vector validation and sparse override writing. The canonical property table supplies the implementations, while staged-kind validity and sample width are caller admission preconditions.
 *
 * @evidence contracts/common.md#principled-implementation Represent one supported light axis with its value type, component bounds, light-kind predicate, optional whole-value fault and override writer; the shared table supplies actual rules.
 * @evidence contracts/common.md#clear-and-simple-design The table co-locates gate admission and playback writing, while sampleClip owns type widths and the scene gate owns staged-light validity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each rule follows the supported light/property pair; this interface does not validate arbitrary implementations or introduce an unsupported axis.
 * @evidence contracts/common.md#meaningful-documentation Members describe inclusive bounds, optional collective checks, kind admission and the write preconditions rather than promising unrestricted property assignment.
 * @evidence contracts/performance.md#efficient-algorithms Each table row is fixed-size; carries/write/valueFault costs depend on their concrete fixed-width implementations, not a type-level traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Light staging, track admission and shot application reuse the same property table; changed animation samples are evaluated rather than cached by property name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The constant table owns callback references; this shape acquires no light, sampled buffer, native handle or running task.
 * @author Samchon
 */
export interface IAutoMovieLightChannelProperty {
  /**
   * Track value discriminator; sampleClip owns the corresponding component width and rejects mismatched payloads.
   */
  valueType: AutoMovieChannelValueType;

  /**
   * Per-component keyframe bounds shared by scene admission and playback semantics; positive-only axes use exclusive min.
   */
  bounds: {
    /** Lower bound. */
    min: number;

    /** Upper bound, `Infinity` for none. */
    max: number;

    /** Whether {@link min} itself is allowed (`false` for the spot cone). */
    inclusiveMin: boolean;
  };

  /**
   * Whether the admitted light kind carries this axis; the gate checks it before allowing a track to reach the writer.
   *
   * @evidence contracts/common.md#principled-implementation Under admitted staged kinds, table predicates identify which kinds carry the axis; unconditional shared-axis predicates rely on that prior admission rather than themselves validating unknown kinds.
   * @evidence contracts/common.md#clear-and-simple-design The predicate sits beside its writer and bounds so staging and playback share one supported-axis decision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unconditional intensity/color predicates rely on prior staged-kind admission; kind-specific predicates implement the supported compatibility law rather than a consumer-id exception.
   * @evidence contracts/common.md#meaningful-documentation The comment describes kind admission before writing and distinguishes this predicate from whole-light validation.
   * @evidence contracts/performance.md#efficient-algorithms Supported light kinds form a fixed population and each predicate uses constant-time scalar comparisons.
   * @evidence contracts/performance.md#reuse-equivalent-work Gate and shot application borrow the same table callback; changing a light kind requires a new predicate evaluation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The table owns the callback reference and the call retains only a boolean, with no light object, handle or task.
   */
  carries: (kind: unknown) => boolean;

  /**
   * Optional whole-vector fault text, or null when valid. Rotation uses this for unit norm; scalar/color axes need only component bounds.
   *
   * @evidence contracts/common.md#principled-implementation The optional callback checks a collective constraint such as quaternion unit norm that component bounds cannot express; null means no reported whole-value fault.
   * @evidence contracts/common.md#clear-and-simple-design Whole-vector admission stays in the same property table as the writer, while scalar/color entries omit this extra check.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Its concrete quaternion norm tolerance is the supported rotation rule, not an id-specific exception; omission does not excuse component admission.
   * @evidence contracts/common.md#meaningful-documentation Docs distinguish optional callback absence from null success and identify rotation's whole-vector constraint.
   * @evidence contracts/performance.md#efficient-algorithms Concrete supported checks examine a fixed-width vector with constant work and diagnostic-string storage.
   * @evidence contracts/performance.md#reuse-equivalent-work The gate reuses the table callback for each key value; mutable vectors are rechecked rather than cached by identity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The table retains the callback, while supplied vectors remain borrowed and returned fault text belongs to the caller; no handle or task is acquired.
   */
  valueFault?: (value: readonly unknown[]) => string | null;

  /**
   * Write an admitted, correctly sized numeric sample into the sparse override. Kind admission and track width are caller preconditions.
   *
   * @evidence contracts/common.md#principled-implementation Concrete writers copy scalar/vector/quaternion sample components into the corresponding override field after kind and width admission.
   * @evidence contracts/common.md#clear-and-simple-design Writing is a narrow numerical operation; applyLightOverride separately owns exhaustive reconstruction of the staged light kind.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Writers assign only supported axes and introduce no renderer callback or fixture-specific light value; malformed input admission is not performed here.
   * @evidence contracts/common.md#meaningful-documentation Docs state admitted kind/width preconditions and sparse override effects, with absent fields preserving staged values later.
   * @evidence contracts/performance.md#efficient-algorithms Each supported width is at most four components, requiring constant work and at most one fixed-size vector/color record.
   * @evidence contracts/performance.md#reuse-equivalent-work All shot light application uses the same table writer; a new sample replaces that field rather than repeating light reconstruction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the mutated override and its numeric records; the table callback retains no samples, native light handles or running tasks.
   */
  write: (override: IAutoMovieLightOverride, value: readonly number[]) => void;
}
