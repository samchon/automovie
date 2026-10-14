import { type Hash, createHash } from "node:crypto";
import fs from "node:fs";
import type { ServerResponse } from "node:http";

/**
 * Read a file once, hash its buffered chunks and send those same bytes only when their SHA-256 matches the requested prefix; mismatch answers 409 and read failure 500. Reopening cannot substitute later bytes after verification. Prefix collisions and concurrent mutation during reading remain outside full-content or atomic-snapshot proof.
 *
 * Reads are asynchronous, hashing runs per chunk on the event loop and final concatenation holds the verified response bytes. Their actual size is uncapped here and output buffers remain response-owned through transport settlement.
 *
 * Digest admission retains the existing local twelve-to-sixty-four hexadecimal prefix protocol. It does not establish full-digest equality or remote acquisition history.
 *
 * @evidence contracts/common.md#principled-implementation Hashes the same buffered file chunks that will be sent and admits the existing digest prefix before response, preventing a second file read from substituting different bytes.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns verified bytes and HTTP refusal; the route supplies expected identity and owns which basis/view was selected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest prefix equality is the existing local protocol, not full-digest or remote provenance proof, and client loss stops the actual file reader.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes asynchronous reads, event-loop hashing, same-bytes response and the local twelve-to-sixty-four-character prefix limit.
 * @evidence contracts/performance.md#efficient-algorithms Reading/hashing is linear in file bytes and verification retains all chunks plus the final concatenation before sending; no independent file-byte cap is imposed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each request verifies its current read bytes rather than trusting a prior hash or reopening after verification; equal paths do not share one response stream.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned reader destroys on response close or finally, its close listener is withdrawn and chunk references clear; the response still owns queued output bytes until transport settlement.
 */
export function streamHumanViewerVerifiedFile(
  response: ServerResponse,
  file: string,
  digest: string,
  label: string,
): void {
  const answer: (status: number, error: string) => void = (
    status: number,
    error: string,
  ): void => {
    if (response.destroyed) return;
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error }));
  };
  void (async (): Promise<void> => {
    if (response.destroyed) return;
    const hasher: Hash = createHash("sha256");
    const chunks: Buffer[] = [];
    const stream: fs.ReadStream = fs.createReadStream(file);
    const closed: () => void = (): void => {
      stream.destroy();
    };
    response.once("close", closed);
    try {
      for await (const chunk of stream) {
        hasher.update(chunk as Buffer);
        chunks.push(chunk as Buffer);
      }
      const actual: string = hasher.digest("hex");
      if (response.destroyed) return;
      if (!actual.startsWith(digest)) {
        answer(
          409,
          `${label} changed: digest ${actual.slice(0, 12)}, requested ${digest}`,
        );
        return;
      }
      response.setHeader("Content-Type", "application/gzip");
      response.end(Buffer.concat(chunks));
    } finally {
      stream.destroy();
      chunks.length = 0;
      response.off("close", closed);
    }
  })().catch((error: unknown): void => {
    answer(
      500,
      `${label} could not be read: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  });
}
