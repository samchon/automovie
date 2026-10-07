import type { IHumanViewerClientIo } from "./IHumanViewerClientIo";

/**
 * What a capture driver supplies to connect to a resident viewer.
 *
 * @evidence contracts/common.md#clear-and-simple-design Keeps transport and address as the only inputs of the pure client.
 * @evidence contracts/common.md#meaningful-documentation Names both inputs.
 * @author Samchon
 */
export interface IConnectHumanViewerProps {
  /** Network and input-directory effects. */
  io: IHumanViewerClientIo;

  /** `http://127.0.0.1:<port>` of the viewer. */
  origin: string;
}
