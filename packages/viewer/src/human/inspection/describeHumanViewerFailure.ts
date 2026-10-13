/**
 * The cause of a refused request as an HTTP client should read it: the first
 * line of the error, without the browser automation prefix and the page
 * stack that follows it. Stack frames name served module URLs and local paths
 * that no caller needs, so only the cause leaves the server.
 */
export function describeHumanViewerFailure(message: string): string {
  const first = message.split(/\r?\n/, 1)[0];
  return first.replace(/^page\.evaluate: (Error: )?/, "");
}
