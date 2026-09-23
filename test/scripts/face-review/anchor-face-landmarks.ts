/**
 * Anchor the detector's landmarks on the shared neutral basis surface, once
 * per camera view. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/anchor-face-landmarks.ts STUDY DETECTIONS CAPTURES OUTPUT.json
 *
 * STUDY holds `basis.json.gz`. CAPTURES is a `capture-articulation.mjs`
 * record of the neutral document (no shape, expression or hair) rendered
 * under each subject's camera: the neutral model file is copied under every
 * subject id and captured with the `reference-yaw` pose file, so each
 * capture shows the shared neutral from that subject's view. DETECTIONS is
 * one `detect-face-likeness.py` run over those renders, with image ids
 * `neutral:<file stem>`.
 *
 * Why per view: the face-oval landmarks are a silhouette, and a silhouette
 * is a different surface curve from every direction; an anchor taken from
 * the front would pair a turned photograph's far contour with the wrong
 * surface point, and a fit would then bend unrelated channels (neck, ears)
 * to close that gap. Interior landmarks barely move between views. Each of
 * the 468 mesh landmarks of every view is cast back along its capture ray
 * onto the built neutral `Human` surface (`faceShapeFitSurface.ts`). The
 * ten iris landmarks lie on the globe, which moves with gaze, and are not
 * anchored. The output records the basis id, the detector and every
 * render's hash and camera. An anchor is shared data of the basis and a
 * view, never a person's coordinate.
 */
import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import {
  type IFaceLikenessCaptures,
  type IFaceLikenessDetections,
  indexFaceLikenessDetections,
  readFaceLikenessJson,
} from "./faceLikenessIo";
import { faceShapeFitRay, faceShapeFitView } from "./faceShapeFitCamera";
import {
  faceShapeFitSurfacePositions,
  raycastFaceShapeFitSurface,
} from "./faceShapeFitSurface";

const [study, detectionFile, captureFile, output] = process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error("Supply STUDY DETECTIONS CAPTURES and a new OUTPUT.json.");
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(path.join(study!, "basis.json.gz"))).toString(
    "utf8",
  ),
) as IAutoMovieHumanFaceBasis;
const detections = readFaceLikenessJson<IFaceLikenessDetections>(
  detectionFile!,
);
const byId = indexFaceLikenessDetections(detections);
const model = createHumanFaceBasisBuilder(basis)({
  id: "neutral",
  name: "neutral",
  basis: basis.id,
  shape: {},
  expression: {},
});
const surface = basis.surfaces.find((one) => one.id === "Human")!;
const positions = faceShapeFitSurfacePositions(basis, model, "Human");
const views: Record<string, unknown> = {};
for (const capture of readFaceLikenessJson<IFaceLikenessCaptures>(captureFile!)
  .captures) {
  const detection = byId.get(`neutral:${path.parse(capture.file).name}`);
  if (!detection?.face) {
    console.log(capture.model, "neutral render undetected");
    continue;
  }
  const view = faceShapeFitView(capture.camera, detection.width);
  const anchors = detection.face.landmarks
    .slice(0, 468)
    .map((pixel, landmark) => {
      const hit = raycastFaceShapeFitSurface(
        positions,
        surface.indices,
        faceShapeFitRay(view, pixel),
      );
      return {
        landmark,
        anchor:
          hit === null
            ? null
            : { vertices: hit.vertices, weights: hit.weights },
      };
    });
  views[capture.model] = {
    renderSha256: detection.sha256,
    camera: capture.camera,
    missing: anchors
      .filter((one) => one.anchor === null)
      .map((one) => one.landmark),
    anchors,
  };
  console.log(
    capture.model,
    "anchored",
    anchors.filter((one) => one.anchor !== null).length,
    "of 468",
  );
}
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      basis: basis.id,
      surface: "Human",
      detector: detections.instrument,
      views,
    },
    null,
    1,
  ) + "\n",
);
