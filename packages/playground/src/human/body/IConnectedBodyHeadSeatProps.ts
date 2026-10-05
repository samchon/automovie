import type { createConnectedBodyViewport } from "./connectedBodyViewport";

/**
 * Where the body editor's head is shown and reported.
 *
 * @author Samchon
 */
export interface IConnectedBodyHeadSeatProps {
  /** The page's viewport, read when a head arrives (it is created after the seat). */
  viewport: () => Pick<ReturnType<typeof createConnectedBodyViewport>, "companion">;

  /** Append one line to the body status. */
  status: (text: string) => void;
}
