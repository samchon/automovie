/**
 * Anchor the jaw's outline on the shared neutral basis surface, once per
 * camera view, beside the detector's anchors. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/anchor-face-jaw.ts STUDY ANCHORS DETECTIONS CAPTURES OUTPUT.json
 *
 * STUDY holds `basis.json.gz`; ANCHORS is an `anchor-face-landmarks.ts`
 * output on a basis of the same surface (its id is kept, the jaw's basis
 * recorded beside it). CAPTURES is a `capture-editor-views.mjs` record of
 * the neutral document rendered through the product editor under each
 * subject's camera (the same renders the instrument and the render
 * correction read), and DETECTIONS one `detect-face-likeness.py` run over
 * them with the skin segmenter, image ids `neutral:<file stem>`. Each view's
 * outline (`measureFaceLikenessJawOutline`: soft-tissue menton and the two
 * points of each level) is cast along its capture ray onto the built
 * neutral `Human` surface, the nearest hit being the face's rim where the
 * mask ends; a ray that passes outside the face by the mask's own error
 * takes the surface vertex nearest its line. The anchors are added to the
 * view's as landmarks 470 to 474 (`FACE_LIKENESS_JAW_LANDMARKS`); a view
 * whose outline cannot be read keeps its detector anchors only, and a view
 * of ANCHORS without a render is refused.
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
  readFaceLikenessMask,
} from "./faceLikenessIo";
import {
  faceLikenessJawLandmarks,
  measureFaceLikenessJawOutline,
} from "./faceLikenessJawOutline";
import { faceShapeFitRay, faceShapeFitView } from "./faceShapeFitCamera";
import {
  type IFaceShapeFitAnchor,
  anchorFaceShapeFitRay,
  faceShapeFitSurfacePositions,
} from "./faceShapeFitSurface";

const [study, anchorFile, detectionFile, captureFile, output] =
  process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error(
    "Supply STUDY ANCHORS DETECTIONS CAPTURES and a new OUTPUT.json.",
  );
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(path.join(study!, "basis.json.gz"))).toString(
    "utf8",
  ),
) as IAutoMovieHumanFaceBasis;
const anchors = readFaceLikenessJson<{
  basis: string;
  views: Record<
    string,
    { anchors: { landmark: number; anchor: IFaceShapeFitAnchor | null }[] }
  >;
}>(anchorFile!);
const detections = readFaceLikenessJson<IFaceLikenessDetections>(
  detectionFile!,
);
const byId = indexFaceLikenessDetections(detections);
// The skin segmenter's face-skin mask of each image, when it ran.
const masks = new Map(
  (detections.images as { id: string; faceSkinMask?: string | null }[]).map(
    (one) => [one.id, one.faceSkinMask ?? null],
  ),
);
const model = createHumanFaceBasisBuilder(basis)({
  id: "neutral",
  name: "neutral",
  basis: basis.id,
  shape: {},
  expression: {},
});
const surface = basis.surfaces.find((one) => one.id === "Human")!;
const positions = faceShapeFitSurfacePositions(basis, model, "Human");
const captures = new Map(
  readFaceLikenessJson<IFaceLikenessCaptures>(captureFile!).captures.map(
    (one) => [one.model, one],
  ),
);
const views: Record<string, unknown> = {};
for (const [subject, view] of Object.entries(anchors.views)) {
  const capture = captures.get(subject);
  if (capture === undefined)
    throw new Error(`No neutral render for the view ${subject}.`);
  const id = `neutral:${path.parse(capture.file).name}`;
  const detection = byId.get(id);
  const name = masks.get(id) ?? null;
  const outline =
    detection?.face && name !== null
      ? measureFaceLikenessJawOutline(
          readFaceLikenessMask(path.join(path.dirname(detectionFile!), name)),
          detection.face.landmarks,
        )
      : null;
  const own = view.anchors.filter((one) => one.landmark < 470);
  if (outline === null || !detection) {
    console.log(subject, "outline unread");
    views[subject] = { ...view, anchors: own };
    continue;
  }
  const camera = faceShapeFitView(capture.camera, detection.width);
  const jaw = faceLikenessJawLandmarks(outline).map(([landmark, pixel]) => ({
    landmark,
    anchor: anchorFaceShapeFitRay({
      positions,
      indices: surface.indices,
      occluders: [],
      ray: faceShapeFitRay(camera, pixel),
      tolerance: 0.001,
      nearest: true,
    }),
  }));
  views[subject] = {
    ...view,
    jawRenderSha256: detection.sha256,
    anchors: [...own, ...jaw],
  };
  console.log(
    subject,
    "jaw anchored",
    jaw.filter((one) => one.anchor !== null).length,
    "of",
    jaw.length,
  );
}
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      ...anchors,
      jawBasis: basis.id,
      jawDetector: detections.instrument,
      views,
    },
    null,
    1,
  ) + "\n",
);
