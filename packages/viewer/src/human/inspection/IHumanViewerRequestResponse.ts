/**
 * The members of an HTTP response a queued GPU request uses to detect client
 * loss and to answer a refusal.
 *
 * @evidence contracts/common.md#principled-implementation Client loss is read from the response's own completion state.
 * @evidence contracts/common.md#meaningful-documentation Names each member the adapter depends on.
 *
 * @evidence contracts/common.md#clear-and-simple-design Only response lifecycle, header and completion members consumed by queued HTTP work are projected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Client-loss detection uses the response's actual close and finished states rather than an elapsed request deadline.
 *
 * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point Client loss is read from the response's own completion state.
 * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement Client-loss detection uses the response's actual close and finished states rather than an elapsed request deadline.
 *
 * @author Samchon
 */
export interface IHumanViewerRequestResponse {
  /**
   * Whether the socket was destroyed.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point Reads the response's actual socket-loss state before returning queued GPU results.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement Reads the response's actual socket-loss state before returning queued GPU results.
   */
  destroyed: boolean;

  /**
   * Whether the response finished writing.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point Distinguishes completed HTTP writing from an early close that withdraws client authority.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement Distinguishes completed HTTP writing from an early close that withdraws client authority.
   */
  writableFinished: boolean;

  /**
   * Status code to answer with.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point Carries the actual response status chosen for the completed result or explicit refusal.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement Carries the actual response status chosen for the completed result or explicit refusal.
   */
  statusCode: number;

  /**
   * Subscribes to the response's close.
   *
   * @evidence contracts/common.md#principled-implementation The adapter subscribes to the actual response close event that may withdraw client authority.
   * @evidence contracts/common.md#clear-and-simple-design Only the close event needed by queued GPU work is projected.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No global response method is replaced and no request-age timer stands in for socket closure.
   * @evidence contracts/common.md#meaningful-documentation The listener is attached to this response's close event.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point The adapter subscribes to the actual response close event that may withdraw client authority.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement The listener is attached to this response's close event.
   */
  on: (event: "close", listener: () => void) => unknown;

  /**
   * Unsubscribes from the response's close.
   *
   * @evidence contracts/common.md#principled-implementation The adapter removes its own close listener when the request binding settles.
   * @evidence contracts/common.md#clear-and-simple-design One unsubscribe operation closes the lifecycle subscription introduced by on.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the supplied listener is removed, preserving unrelated response observers.
   * @evidence contracts/common.md#meaningful-documentation The event and listener identify the existing close subscription to release.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point The adapter removes its own close listener when the request binding settles.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement The event and listener identify the existing close subscription to release.
   */
  off: (event: "close", listener: () => void) => unknown;

  /**
   * Sets a response header.
   *
   * @evidence contracts/common.md#principled-implementation The response owner accepts the selected HTTP header and serialized value.
   * @evidence contracts/common.md#clear-and-simple-design Header writing remains at the transport boundary rather than GPU execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The call uses the supplied response API without replacing native HTTP methods.
   * @evidence contracts/common.md#meaningful-documentation Name and value identify one header on the actual response.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point The response owner accepts the selected HTTP header and serialized value.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement Name and value identify one header on the actual response.
   */
  setHeader: (name: string, value: string) => unknown;

  /**
   * Ends the response with a body.
   *
   * @evidence contracts/common.md#principled-implementation The transport completes the bound response with its serialized result or refusal body.
   * @evidence contracts/common.md#clear-and-simple-design The response owns completion while queued work owns settlement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused request returns its real cause rather than fabricated frame bytes.
   * @evidence contracts/common.md#meaningful-documentation The body is written to this response and its completion state changes through the normal HTTP API.
   *
   * @evidence requirements/operations-and-recovery/cancellation-and-interruption.md#operations-safe-interruption-point The transport completes the bound response with its serialized result or refusal body.
   * @evidence specifications/execution-and-recovery/cancellation-timeout-and-preemption.md#execution-safe-point-acknowledgement The body is written to this response and its completion state changes through the normal HTTP API.
   */
  end: (body: string) => unknown;
}
