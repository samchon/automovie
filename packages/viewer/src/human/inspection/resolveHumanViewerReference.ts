import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { IHumanViewerReference } from "./IHumanViewerReference.js";
import type { IHumanViewerReferenceIo } from "./IHumanViewerReferenceIo.js";

const IMAGE: RegExp = /^[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/i;

const finite: (value: unknown) => value is number = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const cameraOf: (value: unknown) => IHumanCaptureCamera | null = (value: unknown): IHumanCaptureCamera | null => {
  const camera: Partial<IHumanCaptureCamera> | null | undefined = value as Partial<IHumanCaptureCamera> | null | undefined;
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
 * The photograph for a document, or null when there is none, so that a machine without the local photographs shows no comparison and no error.
 *
 * Exact document matches in references/body/manifest.json take precedence for every category, including face. Entries require an existing plain image name and may supply a recorded camera. Otherwise a published face matches a references image stem and its application-recorded camera/landmarks. Missing images return null; this selector reads no image bytes and writes nothing.
 *
 * @evidence contracts/common.md#principled-implementation Tries exact document matches in the body manifest first for any category, then published-face image stems; optional recorded camera must have finite coordinates and positive distance.
 * @evidence contracts/common.md#clear-and-simple-design Reference choice is separate from image-byte reading and drawing; absent local photographs return null without changing numerical input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Plain supported image names must exist in the selected folder; landmarks remain application-recorded values and are not claimed validated anatomical measurements here.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains manifest versus face matching, optional camera, absent-reference behavior and the lack of image writes.
 * @evidence contracts/performance.md#efficient-algorithms Directory names are indexed once for body matching; manifest and face-name scans are linear in entries, with finite camera checks bounded to its three target coordinates.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's reference IO owns reading/memo policy; this resolver maintains no reference cache across changed manifest, poses or directory contents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reference metadata is borrowed and a small descriptor is returned; the function opens no image stream, canvas or retained observer.
 */
export function resolveHumanViewerReference(
  doc: string,
  io: IHumanViewerReferenceIo,
): IHumanViewerReference | null {
  const manifest: unknown = io.readJson("manifest");
  if (Array.isArray(manifest)) {
    const present: Set<string> = new Set(io.list("body"));
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
  const id: string = doc.replace(/-connected$/, "");
  const file: string | undefined = io
    .list("")
    .find((name: string): boolean => name.replace(/\.[^.]+$/, "") === id && IMAGE.test(name));
  if (file === undefined) return null;
  const poses: Record<string, unknown> | undefined = io.readJson("poses") as Record<string, unknown> | undefined;
  const landmarks: Record<string, { x: number; y: number; group: string }[]> | undefined = io.readJson("landmarks") as
    | Record<string, { x: number; y: number; group: string }[]>
    | undefined;
  return {
    folder: "",
    file,
    camera: cameraOf(poses?.[id]),
    landmarks: landmarks?.[id] ?? [],
  };
}
