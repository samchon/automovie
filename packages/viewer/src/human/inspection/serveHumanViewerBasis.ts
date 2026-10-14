import fs from "node:fs";
import path from "node:path";

import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";
import { streamHumanViewerVerifiedFile } from "./streamHumanViewerVerifiedFile.js";

/**
 * Serve supported published face/body bases or plain-named input candidates using the requested digest prefix. Person uses candidate .person.json.gz rather than a published basis. Missing digest is 400, mismatching current prefix 409 and unsupported domain/candidate or absent file 404. Prefix equality does not exclude changed bytes with a colliding prefix. Return false for paths outside the basis routes.
 *
 * The server compares the requested 12-to-64-hex prefix with the current bytes' SHA-256 digest and sends those same bytes. A prefix collision can accept changed bytes; local selection and byte checks do not establish complete frame dependency or receipt closure.
 *
 * @evidence contracts/common.md#principled-implementation Selects only supported published or plain-named candidate basis files and requires the caller's digest prefix before the verified-file owner checks current bytes.
 * @evidence contracts/common.md#clear-and-simple-design Route selection and HTTP refusal remain here while content hashing and streaming are delegated to the shared verified-file owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or prefix-mismatching basis refuses without asset substitution; collisions can accept changed bytes and this local check is not a complete rendered-frame dependency receipt.
 * @evidence contracts/common.md#meaningful-documentation Documentation names candidate naming, required digest, supported domains and 400/404/409 outcomes.
 * @evidence contracts/performance.md#efficient-algorithms Path and digest admission use bounded adapter checks; delegated file hashing/streaming is linear in compressed basis bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The expected digest names the bytes used by the document's key, and current bytes are checked per request instead of trusting a prior availability check.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The route borrows response and inventory, while the verified-file owner acquires/releases its readers; no basis buffer or stream is cached here.
 */
export function serveHumanViewerBasis(
  props: IServeHumanViewerDataProps,
): boolean {
  const {
    url,
    response,
  }: Pick<IServeHumanViewerDataProps, "url" | "response"> = props;
  if (!url.pathname.startsWith("/basis/")) return false;
  const domain: string = url.pathname.slice(7);
  const candidate: string | null = url.searchParams.get("candidate");
  if (
    (domain !== "face" && domain !== "body" && domain !== "person") ||
    (domain === "person" && candidate === null) ||
    (candidate !== null && !/^[A-Za-z0-9._-]+(@[0-9a-f]+)?$/.test(candidate))
  ) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  const [name, digest]: (string | undefined)[] = (candidate ?? "").split("@");
  const file: string =
    candidate === null
      ? props.basisFiles[domain as "face" | "body"]
      : path.join(
          props.inputsDirectory,
          name + (domain === "person" ? ".person.json.gz" : ".basis.json.gz"),
        );
  if (!fs.existsSync(file)) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  const expected: string | undefined =
    candidate === null ? (url.searchParams.get("digest") ?? undefined) : digest;
  if (expected === undefined || !/^[0-9a-f]{12,64}$/.test(expected)) {
    response.statusCode = 400;
    props.json({
      error: `A ${domain} basis request must name the digest its document was built for`,
    });
    return true;
  }
  streamHumanViewerVerifiedFile(
    response,
    file,
    expected,
    candidate === null ? `The published ${domain} basis` : `Candidate ${name}`,
  );
  return true;
}
