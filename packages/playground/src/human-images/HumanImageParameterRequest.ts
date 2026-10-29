import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";

/** Read the bounded JSON transport of a public Human parameter request.
 *
 * @evidence contracts/common.md#principled-implementation The request is consumed up to four MiB, parsed as an own JSON object and hashed from its canonical serialization; the resident page's shared authored validator admits the actual mandatory physical construction.
 * @evidence contracts/common.md#clear-and-simple-design HTTP body transport and structural screening stay separate from route selection, generation and rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The object check grants transport authority only; no alias equality, partial key vocabulary or JSON cast grants authored or geometry admission.
 * @evidence contracts/common.md#meaningful-documentation Returns exact serialized bytes and their SHA; malformed or oversized input rejects as a parameter request error.
 * @evidence contracts/performance.md#efficient-algorithms Linear work in the at most four MiB request and canonical JSON bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical serialization supplies both transport bytes and the generation-input commitment.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Accepted chunks total at most four MiB before aggregation; the aggregate, parsed graph and separately capped canonical bytes are call-owned. Async iteration releases its stream subscription and no cache is acquired.
 */
export async function HumanImageParameterRequest(request: IncomingMessage): Promise<{ value: Record<string, unknown>; bytes: Buffer; sha256: string }> {
  try {
    const chunks: Buffer[] = [];
    let size: number = 0;
    for await (const chunk of request) {
      if (!Buffer.isBuffer(chunk)) throw new Error("Expected byte chunks for Human parameter transport");
      if (size + chunk.length > 4 * 1024 * 1024) throw new Error("Input exceeds four MiB");
      size += chunk.length;
      chunks.push(chunk);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected a JSON parameter object");
    const value: Record<string, unknown> = parsed as Record<string, unknown>;
    const serialized: string = JSON.stringify(value);
    if (Buffer.byteLength(serialized) > 4 * 1024 * 1024) throw new Error("Canonical input exceeds four MiB");
    const bytes: Buffer = Buffer.from(serialized);
    return { value, bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
  } catch (error: unknown) {
    throw new Error("Human parameter request: " + (error instanceof Error ? error.message : String(error)));
  }
}
