import fs from "node:fs";
import path from "node:path";

import type { IServeHumanViewerReferenceProps } from "./IServeHumanViewerReferenceProps.js";
import { resolveHumanViewerReference } from "./resolveHumanViewerReference.js";

/**
 * Answer `/reference-info`, `/reference` and `/reference-index` from the local reference directory under the ignored `.shots` tree.
 *
 * A reference photograph is a local display resource and never part of the numerical inventory: `/reference-info` reports whether one exists for the document, the camera it was taken from and any landmark overlay, `/reference` streams the image itself with `no-store` so a replaced photograph is never cached, and `/reference-index` lists which of the given documents have one, so the index page can badge them. Exact document matches in the `references/body` manifest take precedence for every category, including faces; otherwise published-face stems match photographs in `references`. Returns whether the request was one of the routes, so the caller can fall through otherwise.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing local-reference resolver for metadata/index selection and streams only its admitted plain image name under the selected reference folder.
 * @evidence contracts/common.md#clear-and-simple-design Reference metadata and image serving remain separate routes and neither enters numerical inventory or basis persistence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing references produce explicit unavailability/404, supported image suffixes select MIME case-insensitively and no photograph is fabricated for a subject.
 * @evidence contracts/common.md#meaningful-documentation The comment explains body-manifest versus face-stem matching, no-store image policy and photograph independence from numerical input.
 * @evidence contracts/performance.md#efficient-algorithms Reference index selection performs each document's directory/manifest resolution, so cost can repeat those reads across D documents; individual images stream their actual bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work No local metadata cache assumes unchanged photographs; no-store responses ask the browser to fetch replaced image bytes while resolver IO reads current local facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned image readers destroy on response close and remove their exact listener at stream close; decoded browser-image lifetime belongs to display ownership.
 */
export function serveHumanViewerReference(
  props: IServeHumanViewerReferenceProps,
): boolean {
  const { url, response, cameraPosesFile, referenceDirectory: directory, json }: IServeHumanViewerReferenceProps = props;
  if (
    url.pathname !== "/reference-info" &&
    url.pathname !== "/reference" &&
    url.pathname !== "/reference-index"
  )
    return false;
  const resolve: (doc: string) => ReturnType<typeof resolveHumanViewerReference> = (doc: string): ReturnType<typeof resolveHumanViewerReference> =>
    resolveHumanViewerReference(doc, {
      list: (folder: "" | "body"): string[] => {
        const at: string = path.join(directory, folder);
        return fs.existsSync(at)
          ? fs
              .readdirSync(at, { withFileTypes: true })
              .filter((entry: fs.Dirent): boolean => entry.isFile())
              .map((entry: fs.Dirent): string => entry.name)
          : [];
      },
      readJson: (name: "poses" | "landmarks" | "manifest"): unknown => {
        const file: string =
          name === "poses"
            ? cameraPosesFile
            : name === "landmarks"
              ? path.join(directory, "landmarks.json")
              : path.join(directory, "body", "manifest.json");
        try {
          return JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
        } catch {
          return undefined;
        }
      },
    });
  if (url.pathname === "/reference-index") {
    json({
      documents: props.documents.filter((doc: string): boolean => resolve(doc) !== null),
    });
    return true;
  }
  const reference: ReturnType<typeof resolve> = resolve(url.searchParams.get("doc") ?? "");
  if (url.pathname === "/reference-info") {
    json({
      available: reference !== null,
      camera: reference?.camera ?? null,
      landmarks: reference?.landmarks ?? [],
    });
    return true;
  }
  if (reference === null) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  response.setHeader("Cache-Control", "no-store");
  const extension: string = path.extname(reference.file).toLowerCase();
  response.setHeader(
    "Content-Type",
    extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg",
  );
  const stream: fs.ReadStream = fs.createReadStream(
    path.join(directory, reference.folder, reference.file),
  );
  const closed: () => void = (): void => { stream.destroy(); };
  response.once("close", closed);
  stream.once("close", (): void => { response.off("close", closed); });
  stream.once("error", (error: Error): void => { response.destroy(error); });
  stream.pipe(response);
  return true;
}
