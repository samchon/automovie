import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { IHumanViewerReference } from "./IHumanViewerReference.js";
import type { IHumanViewerReferenceIo } from "./IHumanViewerReferenceIo.js";

const IMAGE = /^[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/i;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const cameraOf = (value: unknown): IHumanCaptureCamera | null => {
  const camera = value as Partial<IHumanCaptureCamera> | null | undefined;
  if (
    camera === null ||
    camera === undefined ||
    !finite(camera.yaw) ||
    !finite(camera.pitch) ||
    !finite(camera.distance) ||
    !Array.isArray(camera.target) ||
    camera.target.length !== 3 ||
    !camera.target.every(finite) ||
    camera.distance <= 0 ||
    (camera.fov !== undefined &&
      !(finite(camera.fov) && camera.fov > 0 && camera.fov < 180))
  )
    return null;
  return camera as IHumanCaptureCamera;
};

/**
 * The photograph for a document, or null when there is none, so that a
 * machine without the local photographs shows no comparison and no error.
 *
 * A body document, or any hand-written `file:` document, is matched by the
 * body manifest (`references/body/manifest.json`, a list of `{ file, doc,
 * camera? }`), which names the document and pose each photograph is
 * reproduced by and the camera it was taken from. A published face document
 * is matched by file stem to a photograph in `references`, with the camera
 * and landmarks the face review recorded for that subject. A manifest entry
 * whose file name is not a plain image name, or whose file is absent, is
 * ignored. Nothing here reads image bytes or writes anything.
 *
 * @evidence contracts/common.md#principled-implementation Matches existing manifest or plain-image entries and admits finite positive-distance camera metadata without deriving numerical anatomy from photographs.
 * @evidence contracts/common.md#clear-and-simple-design One injected read-only resource lookup selects an optional photograph; camera shape admission remains local to that lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns supplied reference metadata or absence, without synthesized landmarks, hidden image writes or a numerical basis fitted to the image.
 * @evidence contracts/common.md#meaningful-documentation Defines both lookup paths, plain-name and camera constraints, optional absence and the read-only image boundary.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Matches existing manifest or plain-image entries and admits finite positive-distance camera metadata without deriving numerical anatomy from photographs.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance One injected read-only resource lookup selects an optional photograph; camera shape admission remains local to that lookup.
 */
export function resolveHumanViewerReference(
  doc: string,
  io: IHumanViewerReferenceIo,
): IHumanViewerReference | null {
  const manifest = io.readJson("manifest");
  if (Array.isArray(manifest)) {
    const present = new Set(io.list("body"));
    for (const entry of manifest as {
      file?: unknown;
      doc?: unknown;
      camera?: unknown;
    }[]) {
      if (
        entry?.doc === doc &&
        typeof entry.file === "string" &&
        IMAGE.test(entry.file) &&
        present.has(entry.file)
      )
        return {
          folder: "body",
          file: entry.file,
          camera: cameraOf(entry.camera),
          landmarks: [],
        };
    }
  }
  if (doc.startsWith("body:") || doc.startsWith("file:")) return null;
  const id = doc.replace(/-connected$/, "");
  const file = io
    .list("")
    .find((name) => name.replace(/\.[^.]+$/, "") === id && IMAGE.test(name));
  if (file === undefined) return null;
  const poses = io.readJson("poses") as Record<string, unknown> | undefined;
  const landmarks = io.readJson("landmarks") as
    | Record<string, { x: number; y: number; group: string }[]>
    | undefined;
  return {
    folder: "",
    file,
    camera: cameraOf(poses?.[id]),
    landmarks: landmarks?.[id] ?? [],
  };
}
