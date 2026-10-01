/**
 * The cause of a refused request as an HTTP client should read it: the first
 * line of the error, without the browser automation prefix and the page
 * stack that follows it. Stack frames name served module URLs and local paths
 * that no caller needs, so only the cause leaves the server.
 *
 * @evidence contracts/common.md#principled-implementation The first line of an Error message is its cause and later lines are stack frames.
 * @evidence contracts/common.md#clear-and-simple-design One pure projection serves every refusal response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cause is rewritten or hidden, only the stack is dropped.
 * @evidence contracts/common.md#meaningful-documentation States what is removed and why.
 */
export function describeHumanViewerFailure(message: string): string {
  const first = message.split(/\r?\n/, 1)[0];
  return first.replace(/^page\.evaluate: (Error: )?/, "");
}
