import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";

/**
 * Preparation and reply transport for one resident numerical runtime. Each
 * request awaits the same preparation result; its own error boundary retains
 * the initiating correlation id even when preparation rejects.
 *
 * @author Samchon
 */
export interface IHumanResidentHandlerProps<Input, Output> {
  /**
   * Shared runtime preparation; the resulting evaluator owns input admission.
   */
  prepare: Promise<(input: Input) => Promise<Output>>;

  /** Publish the evaluated value or refusal under the original request id. */
  send: (reply: HumanResidentReply<Output>) => void;
}
