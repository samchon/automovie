import fs from "node:fs";
import path from "node:path";

import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";
import { streamHumanViewerVerifiedFile } from "./streamHumanViewerVerifiedFile";

/**
 * Answer `/basis/face`, `/basis/body` and `/basis/person` with the basis a
 * document is built on: the published face or body basis (`?digest=<hex>`)
 * or a candidate beside a hand-written input (`?candidate=<name>@<digest>`,
 * `<name>.basis.json.gz`, or `<name>.person.json.gz` for a person, which has
 * no published basis). Every request must name the bytes its document was
 * keyed with: without a digest it is refused with 400, changed bytes with
 * 409; an unknown domain, malformed candidate or missing file is 404.
 * Returns whether the path was a basis route.
 *
 * @evidence contracts/common.md#principled-implementation Every basis is served only as the bytes its document's key names.
 * @evidence contracts/common.md#clear-and-simple-design One route owns basis resolution; verification is the shared streamer's.
 * @evidence contracts/common.md#meaningful-documentation States the accepted forms and the 400, 404 and 409 answers.
 */
export function serveHumanViewerBasis(props: IServeHumanViewerDataProps): boolean {
  const { url, response } = props;
  if (!url.pathname.startsWith("/basis/")) return false;
  const domain = url.pathname.slice(7);
  const candidate = url.searchParams.get("candidate");
  if ((domain !== "face" && domain !== "body" && domain !== "person") ||
      (domain === "person" && candidate === null) ||
      (candidate !== null && !/^[A-Za-z0-9._-]+(@[0-9a-f]+)?$/.test(candidate))) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  const [name, digest] = (candidate ?? "").split("@");
  const file = candidate === null
    ? props.basisFiles[domain as "face" | "body"]
    : path.join(props.inputsDirectory, name + (domain === "person" ? ".person.json.gz" : ".basis.json.gz"));
  if (!fs.existsSync(file)) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  const expected = candidate === null ? url.searchParams.get("digest") ?? undefined : digest;
  if (expected === undefined || !/^[0-9a-f]{12,64}$/.test(expected)) {
    response.statusCode = 400;
    props.json({ error: `A ${domain} basis request must name the digest its document was built for` });
    return true;
  }
  streamHumanViewerVerifiedFile(response, file, expected,
    candidate === null ? `The published ${domain} basis` : `Candidate ${name}`);
  return true;
}
