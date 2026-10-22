/** Keep the existing worker transport explicit while Human is reset.
 * Generation, runtime input admission and native rendering are unavailable.
 * No prior model, recovered sample or synthetic geometry is returned.
 *
 * @evidence contracts/common.md#principled-implementation IPC reports the public Human reset as an unimplemented operation instead of calling deleted algorithms.
 * @evidence contracts/common.md#clear-and-simple-design The retained transport owns only readiness and explicit failure replies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No old generator, source fallback, unchecked parameter cast or successful empty result is supplied.
 * @evidence contracts/common.md#meaningful-documentation States unavailable admission, generation and rendering and the absence of fallback output.
 * @evidence contracts/performance.md#efficient-algorithms Each message receives one fixed-size failure reply without model loading or GPU work.
 * @evidence contracts/performance.md#reuse-equivalent-work No generated result exists to retain or reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The IPC process owns one message listener and exits on disconnect; no files, loaders or native resources are acquired.
 */
export async function humanImageProcessEntry(): Promise<void> {
  if (!process.send)
    throw new Error("Human worker requires its owned IPC channel");
  process.once("disconnect", (): never => process.exit(0));
  process.on("message", (message: unknown): void => {
    if (
      message === null ||
      typeof message !== "object" ||
      !("id" in message) ||
      !Number.isSafeInteger(message.id)
    ) {
      process.send?.({ error: "Malformed Human worker request" });
      return;
    }
    process.send?.({
      id: message.id,
      error:
        "Human generation and runtime parameter admission are not implemented.",
    });
  });
  process.send({ kind: "ready" });
}

void humanImageProcessEntry().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
