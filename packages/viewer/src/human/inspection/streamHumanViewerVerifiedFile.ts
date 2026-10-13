import { createHash } from "node:crypto";
import fs from "node:fs";
import type { ServerResponse } from "node:http";

/**
 * Send a file's bytes only when their SHA-256 starts with the requested
 * digest; otherwise answer 409 with both digests. The file is read once: the
 * bytes that were hashed are the bytes sent, so a file replaced while it is
 * read can never go out under the digest of its predecessor. The file is read
 * asynchronously (the reads run outside the JavaScript thread) and each chunk
 * is hashed on the event loop as it arrives, so no single step blocks for the
 * whole file; the verified bytes are held for the one response (tens of
 * megabytes, released when it is written). A read failure answers 500 with
 * the cause.
 *
 * Digest admission retains the existing local twelve-to-sixty-four hexadecimal prefix protocol. It does not establish full-digest equality or remote acquisition history.
 */
export function streamHumanViewerVerifiedFile(
  response: ServerResponse,
  file: string,
  digest: string,
  label: string,
): void {
  const answer = (status: number, error: string): void => {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error }));
  };
  void (async () => {
    const hasher = createHash("sha256");
    const chunks: Buffer[] = [];
    for await (const chunk of fs.createReadStream(file)) {
      hasher.update(chunk as Buffer);
      chunks.push(chunk as Buffer);
    }
    const actual = hasher.digest("hex");
    if (!actual.startsWith(digest)) {
      answer(
        409,
        `${label} changed: digest ${actual.slice(0, 12)}, requested ${digest}`,
      );
      return;
    }
    response.setHeader("Content-Type", "application/gzip");
    response.end(Buffer.concat(chunks));
  })().catch((error: unknown) => {
    answer(
      500,
      `${label} could not be read: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  });
}
