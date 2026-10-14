import { randomUUID } from "node:crypto";
import os from "node:os";
import type { IAutoMovieLocalProcessOwner } from "./IAutoMovieLocalProcessOwner";

const PROCESS_GENERATION_SYMBOL: unique symbol = Symbol.for("automovie.local-process-generation.v1");
function processGeneration(): string {
  const owner: typeof globalThis & { [PROCESS_GENERATION_SYMBOL]?: string } = globalThis as typeof globalThis & { [PROCESS_GENERATION_SYMBOL]?: string };
  return (owner[PROCESS_GENERATION_SYMBOL] ??= randomUUID());
}

/**
 * Return this Node process identity with a process-stable generation UUID.
 *
 * @evidence contracts/common.md#principled-implementation The process-global registered symbol reuses one generated UUID across module reloads, while hostname and PID identify the local process slot.
 * @evidence contracts/common.md#clear-and-simple-design Commit-lock acquisition and observation use the same current-owner function; UUID creation remains private to this identity owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Module reload does not silently create another generation and a foreign occupied PID is never assigned this generation.
 * @evidence contracts/common.md#meaningful-documentation States process stability and the descriptor returned to lock storage and observation.
 * @evidence contracts/performance.md#efficient-algorithms Each call obtains hostname/PID and allocates one small descriptor; the first process call additionally generates one UUID, with native hostname and entropy costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One Symbol.for-keyed global UUID is reused for this process generation, independent of module cache eviction; hostname and PID are read on each call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The process owns one UUID until exit and callers own returned descriptors; no process handle, file or asynchronous task is acquired.
 */
export function currentAutoMovieLocalProcessOwner(): IAutoMovieLocalProcessOwner {
  return ({
    host: os.hostname(),
    pid: process.pid,
    generation: processGeneration(),
  });
}
