/**
 * Anchor the outlines the detector does not follow, the jaw's and the
 * vermilion's, on the shared neutral basis surface, once per camera view,
 * beside the detector's anchors. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/anchor-face-outlines.ts STUDY ANCHORS DETECTIONS CAPTURES OUTPUT.json
 *
 * STUDY holds `basis.json.gz`; ANCHORS is an `anchor-face-landmarks.ts`
 * output on a basis of the same surface (its id is kept, the jaw's basis
 * recorded beside it). CAPTURES is a `capture-editor-views.mjs` record of
 * the neutral document rendered through the product editor under each
 * subject's camera (the same renders the instrument and the render
 * correction read), and DETECTIONS one `detect-face-likeness.py` run over
 * them with the skin segmenter, image ids `neutral:<file stem>`. Each view's
 * jaw outline (`measureFaceLikenessJawOutline`: soft-tissue menton and the
 * two points of each level) and vermilion borders
 * (`measureFaceLikenessVermilion`: labrale superius and inferius on the
 * render's midline colour) are cast along their capture rays onto the built
 * neutral `Human` surface, the nearest hit being the rim or the border; a
 * ray that passes outside the face by the mask's own error takes the
 * surface vertex nearest its line. The anchors are added to the view's as
 * landmarks 470 to 474 (`FACE_LIKENESS_JAW_LANDMARKS`) and 475 and 476
 * (`FACE_LIKENESS_VERMILION_LANDMARKS`); an outline or border a view cannot
 * read is left out of it, and a view of ANCHORS without a render is
 * refused.
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
  readFaceLikenessImage,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";
import {
  faceLikenessJawLandmarks,
  measureFaceLikenessJawOutline,
} from "./faceLikenessJawOutline";
import {
  FACE_LIKENESS_VERMILION_LANDMARKS,
  measureFaceLikenessVermilion,
} from "./faceLikenessVermilion";
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
  if (!detection?.face) {
    console.log(subject, "neutral render undetected");
    views[subject] = { ...view, anchors: own };
    continue;
  }
  const vermilion = measureFaceLikenessVermilion(
    readFaceLikenessImage(path.join(path.dirname(captureFile!), capture.file)),
    detection.face.landmarks,
  );
  const pixels: [number, readonly [number, number]][] = [
    ...(outline === null ? [] : faceLikenessJawLandmarks(outline)),
    ...(
      [
        [FACE_LIKENESS_VERMILION_LANDMARKS.superius, vermilion.superius],
        [FACE_LIKENESS_VERMILION_LANDMARKS.inferius, vermilion.inferius],
      ] as const
    ).flatMap(([landmark, pixel]) =>
      pixel === null
        ? []
        : [[landmark, pixel] as [number, readonly [number, number]]],
    ),
  ];
  const camera = faceShapeFitView(capture.camera, detection.width);
  const added = pixels.map(([landmark, pixel]) => ({
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
    outlineRenderSha256: detection.sha256,
    anchors: [...own, ...added],
  };
  console.log(
    subject,
    "outlines anchored",
    added
      .filter((one) => one.anchor !== null)
      .map((one) => one.landmark)
      .join(","),
  );
}
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      ...anchors,
      outlineBasis: basis.id,
      outlineDetector: detections.instrument,
      views,
    },
    null,
    1,
  ) + "\n",
);
