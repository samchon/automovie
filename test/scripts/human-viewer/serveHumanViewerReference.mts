import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";

/**
 * Answer `/reference-info` and `/reference` for one document from the local
 * reference directory under the ignored `.shots` tree.
 *
 * A reference photograph is a local display resource and never part of the
 * numerical inventory: `/reference-info` reports whether one exists for the
 * document's subject, the measured portrait camera the review recorded for it
 * and any landmark overlay, and `/reference` streams the image itself with
 * `no-store` so a replaced photograph is never cached. The subject id is the
 * document id without its `-connected` suffix, and a photograph is matched by
 * file stem. Returns whether the request was one of the two routes, so the
 * caller can fall through otherwise.
 */
export function serveHumanViewerReference(props: {
  url: URL;
  response: ServerResponse;
  root: string;
  storage: string;
  json: (value: unknown) => void;
}): boolean {
  const { url, response, root, storage, json } = props;
  if (url.pathname !== "/reference-info" && url.pathname !== "/reference")
    return false;
  const id = (url.searchParams.get("doc") ?? "").replace(/-connected$/, "");
  const directory = path.join(storage, "references");
  const filename = fs.existsSync(directory)
    ? fs
        .readdirSync(directory)
        .find(
          (name) =>
            path.parse(name).name === id &&
            /\.(png|jpg|jpeg|webp)$/i.test(name),
        )
    : undefined;
  if (url.pathname === "/reference-info") {
    const poses = JSON.parse(
      fs.readFileSync(
        path.join(
          root,
          "test/studies/human-face/connected-basis/global-face/population/poses-lens-frame.json",
        ),
        "utf8",
      ),
    );
    const landmarksFile = path.join(directory, "landmarks.json");
    const landmarks = fs.existsSync(landmarksFile)
      ? JSON.parse(fs.readFileSync(landmarksFile, "utf8"))[id]
      : undefined;
    json({
      available: filename !== undefined,
      camera: filename === undefined ? null : (poses[id] ?? null),
      landmarks: landmarks ?? [],
    });
    return true;
  }
  if (filename === undefined) {
    response.statusCode = 404;
    response.end();
    return true;
  }
  response.setHeader("Cache-Control", "no-store");
  response.setHeader(
    "Content-Type",
    filename.endsWith(".png")
      ? "image/png"
      : filename.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg",
  );
  fs.createReadStream(path.join(directory, filename)).pipe(response);
  return true;
}
