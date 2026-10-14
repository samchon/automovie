import type { IAutoMovieLocalProcessOwner } from "./IAutoMovieLocalProcessOwner";

const UUID_PATTERN: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const HOST_MAX_BYTES: number = 255;
const HOST_CONTROL_PATTERN: RegExp = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;

/**
 * Admit a persisted local process descriptor before any process-table query.
 *
 * @evidence contracts/common.md#principled-implementation Structural admission requires a trimmed nonempty control-free hostname of at most 255 UTF-8 bytes, a positive safe PID and a versioned UUID spelling.
 * @evidence contracts/common.md#clear-and-simple-design The observer and lock parser share one raw-value guard before reading identity or querying the process table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed descriptors are refused without normalization, PID guessing or a process-table side effect; valid persisted JSON is the supported raw boundary.
 * @evidence contracts/common.md#meaningful-documentation States descriptor admission purpose and the requirement to guard before process observation.
 * @evidence contracts/performance.md#efficient-algorithms For hostname H and UUID G text, validation scans O(H+G) characters/bytes with no process query; hostname UTF-8 length and control scanning enforce independent bounds.
 * @evidence contracts/performance.md#reuse-equivalent-work Each raw descriptor is validated at its admission boundary and no mutable descriptor answer is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The guard keeps only local scalar references and regex constants, opening no handle or task.
 */
export function isAutoMovieLocalProcessOwner(value: unknown): value is IAutoMovieLocalProcessOwner {
  if (typeof value !== "object" || value === null) return false;
  const { host, pid, generation }: Record<string, unknown> = value as Record<string, unknown>;
  return (
    typeof host === "string" &&
    host.length !== 0 &&
    host === host.trim() &&
    Buffer.byteLength(host, "utf8") <= HOST_MAX_BYTES &&
    HOST_CONTROL_PATTERN.test(host) === false &&
    typeof pid === "number" &&
    Number.isSafeInteger(pid) &&
    pid > 0 &&
    typeof generation === "string" &&
    UUID_PATTERN.test(generation)
  );
}
