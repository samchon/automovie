import fs from "node:fs";
import path from "node:path";

import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";
import { streamHumanViewerVerifiedFile } from "./streamHumanViewerVerifiedFile.js";

/**
 * Serve published Person head/body views or an input's matching plain-named split candidate. The selected request must name its digest prefix: missing/malformed identity is 400, current-prefix mismatch 409 and missing file 404. A prefix collision can accept changed view bytes. Catalogue pairing and Person numerical admission remain separate owners; return false outside these two routes.
 *
 * Current SHA-256 is compared using the requested 12-to-64-hex prefix. A collision can accept changed view bytes; this local availability check is not a complete frame receipt, and workflow dependency substitution remains caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation Selects one named head/body published or candidate view and requires its digest prefix, then delegates current digest-prefix comparison and streaming of those same read bytes to the verified-file owner.
 * @evidence contracts/common.md#clear-and-simple-design Specific paired-view paths and candidate naming stay separate from the general basis route, preserving the selected view's authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, ambiguous or malformed view selection refuses and unavailable generation views do not fall back to unrelated face/body files.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies split candidate names, digest requirements, byte-change refusal and the limit of local availability proof.
 * @evidence contracts/performance.md#efficient-algorithms View/path checks are fixed adapter work while delegated digest/stream processing is linear in the compressed selected view bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's document key supplies expected view bytes; current file contents are checked before each response rather than trusting a previous generation name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The route borrows inventory and response and retains no view-byte cache; owned file readers are acquired and retired by verified streaming.
 */
export function serveHumanViewerGenerationView(
  props: IServeHumanViewerDataProps,
): boolean {
  const { url, response }: Pick<IServeHumanViewerDataProps, "url" | "response"> = props;
  if (
    url.pathname !== "/basis/person/head" &&
    url.pathname !== "/basis/person/body"
  )
    return false;
  const view: "head" | "body" = url.pathname.endsWith("head") ? "head" : "body";
  const candidate: string | null = url.searchParams.get("candidate");
  if (
    candidate !== null &&
    (!/^[A-Za-z0-9._-]+@[0-9a-f]{12,64}$/.test(candidate) ||
      url.searchParams.has("digest"))
  ) {
    response.statusCode = 400;
    props.json({
      error:
        "A split view request needs one candidate name and its digest, without a published digest.",
    });
    return true;
  }
  const [name, candidateDigest]: (string | undefined)[] = (candidate ?? "").split("@");
  const file: string =
    candidate === null
      ? props.generationFiles[view]
      : path.join(props.inputsDirectory, name + "." + view + ".json.gz");
  const digest: string | null | undefined =
    candidate === null ? url.searchParams.get("digest") : candidateDigest;
  if (digest === null || digest === undefined || !/^[0-9a-f]{12,64}$/.test(digest)) {
    response.statusCode = 400;
    props.json({
      error: `The ${view} view request must name the digest its document was built for (?digest=<hex>)`,
    });
    return true;
  }
  if (!fs.existsSync(file)) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  streamHumanViewerVerifiedFile(
    response,
    file,
    digest,
    `The ${candidate === null ? "published" : "candidate"} ${view} view`,
  );
  return true;
}
