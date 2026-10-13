/**
 * One or more named targets or observations, with no empty part input.
 *
 * A group is optional when nothing is specified, but `{}` must not claim that its bone or muscle was specified. This mapped union requires at least one property of a closed component interface while preserving the other properties as optional. It does not substitute for runtime admission of finite values, physical ranges, acquisition methods or consistent posture.
 *
 * @evidence contracts/common.md#principled-implementation The mapped union requires at least one component key while preserving other supplied properties as optional readonly inputs.
 * @evidence contracts/common.md#clear-and-simple-design One reusable nonempty operator keeps sparse component ownership closed without generic free-form measurement bags.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type-level nonemptiness does not replace finite-value, range, acquisition or posture admission at runtime.
 * @evidence contracts/common.md#meaningful-documentation Prose explains why empty component records are misleading and lists the remaining runtime obligations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The mapped type executes no runtime property traversal or physical measurement validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Nonempty typing has no evaluated admission result to share across component records.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generic declaration retains no input objects, validation state or runtime resources.
 * @author Samchon
 */
export type AutoMovieHumanBodyNonemptyMeasurements<T> = {
  [Key in keyof T]-?: Readonly<Required<Pick<T, Key>> & Partial<Omit<T, Key>>>;
}[keyof T];
