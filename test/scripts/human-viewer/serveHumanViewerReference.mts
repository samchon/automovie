import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";

import { resolveHumanViewerReference } from "./resolveHumanViewerReference";

/**
 * Answer `/reference-info`, `/reference` and `/reference-index` from the local
 * reference directory under the ignored `.shots` tree.
 *
 * A reference photograph is a local display resource and never part of the
 * numerical inventory: `/reference-info` reports whether one exists for the
 * document, the camera it was taken from and any landmark overlay,
 * `/reference` streams the image itself with `no-store` so a replaced
 * photograph is never cached, and `/reference-index` lists which of the given
 * documents have one, so the index page can badge them. Face photographs sit
 * in `references` matched by subject; body photographs sit in
 * `references/body` and are matched by its manifest. Returns whether the
 * request was one of the routes, so the caller can fall through otherwise.
 */
export function serveHumanViewerReference(props: {
  url: URL;
  response: ServerResponse;
  root: string;
  storage: string;
  documents: readonly string[];
  json: (value: unknown) => void;
}): boolean {
  const { url, response, root, storage, json } = props;
  if (
    url.pathname !== "/reference-info" &&
    url.pathname !== "/reference" &&
    url.pathname !== "/reference-index"
  )
    return false;
  const directory = path.join(storage, "references");
  const resolve = (doc: string) =>
    resolveHumanViewerReference(doc, {
      list: (folder) => {
        const at = path.join(directory, folder);
        return fs.existsSync(at)
          ? fs
              .readdirSync(at, { withFileTypes: true })
              .filter((entry) => entry.isFile())
              .map((entry) => entry.name)
          : [];
      },
      readJson: (name) => {
        const file =
          name === "poses"
            ? path.join(
                root,
                "test/studies/human-face/connected-basis/global-face/population/poses-lens-frame.json",
              )
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
      documents: props.documents.filter((doc) => resolve(doc) !== null),
    });
    return true;
  }
  const reference = resolve(url.searchParams.get("doc") ?? "");
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
  response.setHeader(
    "Content-Type",
    reference.file.endsWith(".png")
      ? "image/png"
      : reference.file.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg",
  );
  fs.createReadStream(path.join(directory, reference.folder, reference.file)).pipe(
    response,
  );
  return true;
}
