import { TestValidator } from "@nestia/e2e";

import { humanViewerPhotoLook } from "../../../scripts/human-viewer/humanViewerPhotoLook";
import { resolveHumanViewerReference } from "../../../scripts/human-viewer/resolveHumanViewerReference";

const camera = { yaw: -12, pitch: 3, distance: 0.62, target: [0, 0, 0.06] as [number, number, number] };
const io = (
  files: { "": string[]; body: string[] },
  json: Record<string, unknown>,
) => ({
  list: (folder: "" | "body") => files[folder],
  readJson: (name: "poses" | "landmarks" | "manifest") => json[name],
});

/**
 * A document is compared with a local photograph only when one exists.
 *
 * Scenarios:
 * 1. A published face document matches the photograph of its subject by file
 *    stem, with the recorded camera and landmarks; an absent photograph, or
 *    no photographs at all, resolves to nothing without an error.
 * 2. A body or hand-written document matches only through the body manifest,
 *    with the camera recorded there; an entry whose file is missing, whose name
 *    is not a plain image name or whose camera is malformed gives no photograph
 *    or no camera respectively.
 * 3. The photograph look copies the recorded camera, taking 28 degrees when
 *    none was recorded, and fits nothing.
 */
export const test_human_viewer_reference_resolution = (): void => {
  const faces = io(
    { "": ["alan-rickman.jpg", "landmarks.json", "note.txt"], body: [] },
    {
      poses: { "alan-rickman": { ...camera, fov: 8.8 } },
      landmarks: { "alan-rickman": [{ x: 0.5, y: 0.5, group: "eye" }] },
    },
  );
  const found = resolveHumanViewerReference("alan-rickman-connected", faces);
  TestValidator.equals("face file", [found?.folder, found?.file], ["", "alan-rickman.jpg"]);
  TestValidator.equals("face camera", found?.camera?.fov, 8.8);
  TestValidator.equals("face landmarks", found?.landmarks.length, 1);
  TestValidator.equals("no photograph", resolveHumanViewerReference("emma-watson-connected", faces), null);
  TestValidator.equals("no folder", resolveHumanViewerReference("alan-rickman", io({ "": [], body: [] }, {})), null);
  TestValidator.equals("body needs manifest", resolveHumanViewerReference("body:neutral", faces), null);

  const bodies = io(
    { "": [], body: ["pose-a.jpg", "../evil.png"] },
    {
      manifest: [
        { file: "pose-a.jpg", doc: "file:pose-a", camera: { ...camera, distance: 2.4, fov: 30 } },
        { file: "missing.jpg", doc: "body:neutral", camera },
        { file: "../evil.png", doc: "body:heavy", camera },
        { file: "pose-a.jpg", doc: "body:sitting", camera: { yaw: 1 } },
        null,
      ],
    },
  );
  const body = resolveHumanViewerReference("file:pose-a", bodies);
  TestValidator.equals("body file", [body?.folder, body?.file], ["body", "pose-a.jpg"]);
  TestValidator.equals("body camera", body?.camera?.distance, 2.4);
  TestValidator.equals("missing file", resolveHumanViewerReference("body:neutral", bodies), null);
  TestValidator.equals("unsafe name", resolveHumanViewerReference("body:heavy", bodies), null);
  const malformed = resolveHumanViewerReference("body:sitting", bodies);
  TestValidator.equals("malformed camera", [malformed?.file, malformed?.camera], ["pose-a.jpg", null]);
  TestValidator.equals("face not through manifest", resolveHumanViewerReference("file:other", bodies), null);

  TestValidator.equals("look", humanViewerPhotoLook(camera), [-12, 3, 0.62, 0, 0, 0.06, 28]);
  TestValidator.equals("look fov", humanViewerPhotoLook({ ...camera, fov: 8.8 })[6], 8.8);
};
