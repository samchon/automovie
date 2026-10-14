import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";
import type { IServeHumanViewerGenerationProps } from "./IServeHumanViewerGenerationProps.js";

/**
 * Answer the candidate window routes. `/generation/hold` opens a window, sends its token in `X-Human-Generation` and keeps the response open: the window closes when the client ends the request, so a tab closed or a page reloaded mid-load releases its hold without any timer. `/generation/label` answers a token's label once its window is closed (`{ label }`, null when the candidate's code is not a proven revision). Returns whether the path was one of them.
 *
 * @evidence contracts/common.md#principled-implementation Opens one candidate window for a held response and releases it on response close or synchronous header/write failure; label reads await the existing window owner's resolution.
 * @evidence contracts/common.md#clear-and-simple-design The windows service owns generation accounting while this adapter ties a hold to the actual response lifetime and writes token/label results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A completed GET request body is not mistaken for client loss, unknown labels return 404 and label failure produces 503 rather than an unhandled successful reply.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes response-owned holds, candidate label/null semantics and acquisition-failure release.
 * @evidence contracts/performance.md#efficient-algorithms Route dispatch and token lookup use fixed adapter work; pending label duration and retained window population belong to the supplied window owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Holds are distinct lifetime effects even for equal source candidates; resolved token labels are shared only by the windows owner's existing token identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One response close listener releases its acquired hold and setup failure withdraws the listener before independently reporting cleanup/primary failures. Active held responses and pending label waits have no numeric cap here; the windows owner retains at most 64 closed labels while active windows remain until their actual close.
 */
export function serveHumanViewerGeneration(
  props: IServeHumanViewerGenerationProps,
): boolean {
  const {
    url,
    response,
  }: Pick<IServeHumanViewerGenerationProps, "url" | "response"> = props;
  if (url.pathname === "/generation/hold") {
    const token: string = props.windows.open();
    // The response closes when the client ends the request or its connection
    // goes; a request's own close also fires once a GET body is read, so it
    // is not a release signal.
    const closed: () => void = (): void => props.windows.close(token);
    response.once("close", closed);
    try {
      response.statusCode = 200;
      response.setHeader("X-Human-Generation", token);
      response.setHeader("Content-Type", "text/plain");
      response.setHeader("Cache-Control", "no-store");
      response.flushHeaders();
      response.write("held\n");
    } catch (error) {
      response.off("close", closed);
      reportAutoMovieResourceRetirement([closed], { error });
    }
    return true;
  }
  if (url.pathname === "/generation/label") {
    void props.windows
      .label(url.searchParams.get("token"))
      .then((label: string | null | undefined): void => {
        if (label === undefined) {
          response.statusCode = 404;
          props.json({ error: "Unknown generation token" });
          return;
        }
        props.json({ label });
      })
      .catch((error: unknown): void => {
        response.statusCode = 503;
        props.json({
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return true;
  }
  return false;
}
