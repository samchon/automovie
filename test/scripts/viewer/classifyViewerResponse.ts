import type { IViewerProbe } from "./IViewerIo";

/** Text every playground page carries in its title, which no other program's page on the port would. */
const MARKER = "automovie:";

/**
 * What an answer from the viewer's port says about who is serving it.
 *
 * A refused connection means nothing listens. Any other answer means something
 * does, and it is the playground only when the page it returned is a success
 * carrying the playground's title marker. A different program's page, an error
 * status, or an answer that never came (a timeout) all count as a listener that
 * is not the playground, so the port is never taken from it.
 *
 * @param answer `null` for a refused connection, otherwise the status and text
 * of the page, with `null` text for an answer that did not arrive in time.
 */
export function classifyViewerResponse(
  answer: { status: number; text: string | null } | null,
): IViewerProbe {
  if (answer === null) return { open: false, playground: false };
  return {
    open: true,
    playground:
      answer.status >= 200 &&
      answer.status < 300 &&
      answer.text !== null &&
      answer.text.includes(MARKER),
  };
}
