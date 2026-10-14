/**
 * The cause of a refused request as an HTTP client should read it: the first line of the error, without the browser automation prefix and the page stack that follows it. Stack frames name served module URLs and local paths that no caller needs, so only the cause leaves the server.
 *
 * @evidence contracts/common.md#principled-implementation The first error line becomes the HTTP-facing cause and only the known page.evaluate prefix is removed.
 * @evidence contracts/common.md#clear-and-simple-design A first-line split and anchored prefix replacement perform the transport-specific cleanup without another error taxonomy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function preserves the remaining cause text and removes trailing stack lines rather than fabricating another failure explanation.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies automation-prefix removal and why page stack paths stay out of the client answer.
 * @evidence contracts/performance.md#efficient-algorithms Finding the first line and replacing its anchored prefix scan message text linearly with one returned string.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied error message is formatted independently with no expensive equivalent work or memoization.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned string survives the call and no error history or external resource is owned.
 */
export function describeHumanViewerFailure(message: string): string {
  const first: string = message.split(/\r?\n/, 1)[0];
  return first.replace(/^page\.evaluate: (Error: )?/, "");
}
