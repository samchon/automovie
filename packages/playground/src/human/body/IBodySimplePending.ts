import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * A simple projection in flight for one body. `shape` is the request's cloned dependency snapshot. Settlement means the control owner has displayed or discarded the result; it does not imply that the numerical reader accepted a projection.
 *
 * @evidence contracts/common.md#principled-implementation An input snapshot identifies the in-flight projection and a void promise identifies completion of its display-or-discard path, keeping completion distinct from numerical acceptance.
 * @evidence contracts/common.md#clear-and-simple-design The pending record has no accepted values; completed reusable readings belong to the measured record, while the control closure owns cancellation by generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Promise settlement is not asserted to prove a successful reading; the record supports superseded and refused requests through the same completion path.
 * @evidence contracts/common.md#meaningful-documentation The documentation states that the input is a cloned snapshot and that completion can mean either display or discard, including refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A pending projection record stores dependencies and completion only; it chooses neither the numerical algorithm nor the queue strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work In-flight sharing is implemented by the refresh owner's input comparison; this type supplies the state it compares but performs no lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The completion promise is retained by the mounted controls until settlement or replacement; this schema acquires no cancellable task or worker itself.
 *
 * @author Samchon
 */
export interface IBodySimplePending {
  /** The body being projected. */
  shape: IBodySimpleBody;

  /** Settles when the projection is displayed or dropped. */
  result: Promise<void>;
}
