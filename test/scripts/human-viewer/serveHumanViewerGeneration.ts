import type { IServeHumanViewerGenerationProps } from "./IServeHumanViewerGenerationProps";

/**
 * Answer the candidate window routes. `/generation/hold` opens a window,
 * sends its token in `X-Human-Generation` and keeps the response open: the
 * window closes when the client ends the request, so a tab closed or a page
 * reloaded mid-load releases its hold without any timer. `/generation/label`
 * answers a token's label once its window is closed (`{ label }`, null when
 * the candidate's code is not a proven revision). Returns whether the path
 * was one of them.
 *
 * @evidence contracts/common.md#principled-implementation The hold lives exactly as long as the client's open request, so no vanished client keeps compiles withheld.
 * @evidence contracts/common.md#meaningful-documentation States both routes, the release rule and the answer.
 */
export function serveHumanViewerGeneration(
  props: IServeHumanViewerGenerationProps,
): boolean {
  const { url, response } = props;
  if (url.pathname === "/generation/hold") {
    const token = props.windows.open();
    // The response closes when the client ends the request or its connection
    // goes; a request's own close also fires once a GET body is read, so it
    // is not a release signal.
    response.once("close", () => props.windows.close(token));
    response.statusCode = 200;
    response.setHeader("X-Human-Generation", token);
    response.setHeader("Content-Type", "text/plain");
    response.setHeader("Cache-Control", "no-store");
    response.flushHeaders();
    response.write("held\n");
    return true;
  }
  if (url.pathname === "/generation/label") {
    void props.windows.label(url.searchParams.get("token")).then((label) => {
      if (label === undefined) {
        response.statusCode = 404;
        props.json({ error: "Unknown generation token" });
        return;
      }
      props.json({ label });
    });
    return true;
  }
  return false;
}
