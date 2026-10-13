import type { AutoMovieHumanPersonHeadShapeField } from "./AutoMovieHumanPersonHeadShapeField";

/**
 * Source-neutral anatomical exterior differences on a shared head generation.
 *
 * Every present value requests the generation's corresponding source trait, including zero. Omission preserves that source's neutral. The generation registration supplies units, actual authored support, bounds and the one body channel that carries both skin partitions and their attached parts. Raw clinical observations remain in their separate anatomical record.
 *
 * @evidence contracts/common.md#principled-implementation A partial record over closed anatomical fields preserves the distinction between omitted source neutral and an explicitly requested numerical zero.
 * @evidence contracts/common.md#clear-and-simple-design Source-neutral numerical requests stay separate from raw clinical observations and source-specific endpoint weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values require actual generation registration and supported source bounds rather than nearby coordinate inference or a preferred asset name.
 * @evidence contracts/common.md#meaningful-documentation The comment defines zero versus omission, source-owned units/support and the body channel that carries both partitions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The closed anatomical exterior difference requests specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the closed anatomical exterior difference requests; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The closed anatomical exterior difference requests acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShape extends Partial<
  Record<AutoMovieHumanPersonHeadShapeField, number>
> {}
