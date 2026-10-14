/**
 * The data member delivered by a native worker message callback.
 *
 * @evidence contracts/common.md#principled-implementation The normalized event exposes Data without browser event internals, allowing typed correlated numerical replies at the resident port seam. Native data admission still belongs to its producer and consumer.
 * @evidence contracts/common.md#clear-and-simple-design A single payload field is all the coordinator reads; browser adapter event normalization stays outside the numerical request owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The wrapper forwards actual event data rather than deriving a value from fixture or consumer identity. A generic type parameter is not a runtime payload validator.
 * @evidence contracts/common.md#meaningful-documentation The comment and field identify callback payload rather than an entire native MessageEvent with browser-owned members.
 * @evidence contracts/performance.md#efficient-algorithms Wrapping the event requires constant work and one record; native buffer transfer or cloning cost remains part of the port's actual payload transport.
 * @evidence contracts/performance.md#reuse-equivalent-work The data reference is forwarded from its actual event; no message cache or equivalence by id is implemented in this type.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Data can retain numerical buffers until its consumer releases them; the wrapper owns no worker or native listener and imposes no payload byte bound.
 *
 * @author Samchon
 */
export interface IHumanWorkerMessage<Data> {
  /** Numerical payload delivered by this message. */
  data: Data;
}
