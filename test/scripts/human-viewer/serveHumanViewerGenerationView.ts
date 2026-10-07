import fs from "node:fs";
import path from "node:path";

import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";
import { streamHumanViewerVerifiedFile } from "./streamHumanViewerVerifiedFile";

/**
 * Answer `/basis/person/head` and `/basis/person/body` with the published
 * one-skin person generation views, or an input's split candidate views with
 * `?candidate=<name>@<digest>`. Candidate names resolve only to the matching
 * `<name>.head.json.gz` or `<name>.body.json.gz` in the selected input directory.
 * A request names the digest prefix its
 * document was keyed with (`?digest=<hex>`): without one it is refused with
 * 400, a replaced view with 409, so no build runs on views its key does not
 * name. A missing view is 404; the catalogue already lists the standard
 * people and body states as rejected by name until both exist. Returns
 * whether the path was one of the two views.
 *
 * @evidence contracts/common.md#principled-implementation Serves only the view bytes the requesting document's key names.
 * @evidence contracts/common.md#clear-and-simple-design One route owns both views; verification is the shared streamer's.
 * @evidence contracts/common.md#meaningful-documentation States the 400, 404 and 409 answers.
 */
export function serveHumanViewerGenerationView(
  props: IServeHumanViewerDataProps,
): boolean {
  const { url, response } = props;
  if (
    url.pathname !== "/basis/person/head" &&
    url.pathname !== "/basis/person/body"
  )
    return false;
  const view = url.pathname.endsWith("head") ? "head" : "body";
  const candidate = url.searchParams.get("candidate");
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
  const [name, candidateDigest] = (candidate ?? "").split("@");
  const file =
    candidate === null
      ? props.generationFiles[view]
      : path.join(props.inputsDirectory, name + "." + view + ".json.gz");
  const digest =
    candidate === null ? url.searchParams.get("digest") : candidateDigest;
  if (digest === null || !/^[0-9a-f]{12,64}$/.test(digest)) {
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
