/**
 * Anchor the detector's landmarks on the shared neutral basis surface.
 * Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/anchor-face-landmarks.ts STUDY DETECTIONS CAPTURES OUTPUT.json
 *
 * STUDY holds `basis.json.gz`; CAPTURES is a `capture-articulation.mjs`
 * record whose `front` view of the neutral document (`neutral__front.png`,
 * a document with no shape, expression or hair) was run through
 * `detect-face-likeness.py` into DETECTIONS under the id
 * `neutral:neutral__front`. The neutral is built here with the same builder,
 * each of the 468 mesh landmarks is cast back along its capture ray onto the
 * `Human` surface (`faceShapeFitSurface.ts`), and the anchors are written
 * with the basis id, the render and detector hashes. The ten iris landmarks
 * lie on the globe, which moves with gaze, and are not anchored.
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
  readFaceLikenessJson,
} from "./faceLikenessIo";
import { faceShapeFitRay, faceShapeFitView } from "./faceShapeFitCamera";
import {
  faceShapeFitSurfacePositions,
  raycastFaceShapeFitSurface,
} from "./faceShapeFitSurface";

const [study, detections, captures, output] = process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error("Supply STUDY DETECTIONS CAPTURES and a new OUTPUT.json.");
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(path.join(study!, "basis.json.gz"))).toString(
    "utf8",
  ),
) as IAutoMovieHumanFaceBasis;
const detection = readFaceLikenessJson<IFaceLikenessDetections>(
  detections!,
).images.find((image) => image.id === "neutral:neutral__front");
const capture = readFaceLikenessJson<IFaceLikenessCaptures>(
  captures!,
).captures.find((one) => one.model === "neutral" && one.view === "front");
if (!detection?.face || capture === undefined)
  throw new Error("The neutral front render and its detection are required.");
const model = createHumanFaceBasisBuilder(basis)({
  id: "neutral",
  name: "neutral",
  basis: basis.id,
  shape: {},
  expression: {},
});
const surface = basis.surfaces.find((one) => one.id === "Human")!;
const positions = faceShapeFitSurfacePositions(basis, model, "Human");
const view = faceShapeFitView(capture.camera, detection.width);
const anchors = detection.face.landmarks
  .slice(0, 468)
  .map((pixel, landmark) => {
    const hit = raycastFaceShapeFitSurface(
      positions,
      surface.indices,
      faceShapeFitRay(view, pixel),
    );
    return hit === null
      ? { landmark, anchor: null }
      : { landmark, anchor: { vertices: hit.vertices, weights: hit.weights } };
  });
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      basis: basis.id,
      surface: "Human",
      renderSha256: detection.sha256,
      detector: readFaceLikenessJson<IFaceLikenessDetections>(detections!)
        .instrument,
      camera: capture.camera,
      missing: anchors
        .filter((one) => one.anchor === null)
        .map((one) => one.landmark),
      anchors,
    },
    null,
    1,
  ) + "\n",
);
console.log(
  "anchored",
  anchors.filter((one) => one.anchor !== null).length,
  "of 468",
);
