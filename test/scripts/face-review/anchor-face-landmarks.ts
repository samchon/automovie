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
 * onto the built neutral `Human` surface (`faceShapeFitSurface.ts`), with
 * the other opaque surfaces (globes, teeth, tongue; the brow and lash cards
 * are coverage and do not hide) as occluders, so a lid-margin or inner-lip
 * landmark whose ray slips past the visible edge is held on the skin rim
 * instead of the socket or the pharynx behind it (`anchorFaceShapeFitRay`,
 * tolerance 1 mm). The inner lip contours are each cast onto their own lip
 * (the lower lip being the vertices the mandible carries), because with the
 * lips closed both contours project onto the one seam and a lower inner
 * landmark would otherwise ride the upper lip; the midline pair, stomion
 * superius (13) and inferius (14), is the basis's own vermilion seam vertex
 * pair (`contact.lips`). The
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
  anchorFaceShapeFitRay,
  faceShapeFitSurfacePositions,
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
// With the lips closed the two inner lip contours project onto one line and
// every ray there reaches the upper lip first, so a lower inner landmark
// would ride the upper lip. Each inner contour is cast onto its own lip: the
// lower lip is what the mandible carries, the vertices a full opening moves
// at least half as far as the lower vermilion seam vertex.
const opened = faceShapeFitSurfacePositions(
  basis,
  createHumanFaceBasisBuilder(basis)({
    id: "opened",
    name: "opened",
    basis: basis.id,
    shape: {},
    expression: { [basis.articulation!.jaw.opening.channel]: 1 },
  }),
  "Human",
);
const travel = (vertex: number) =>
  Math.hypot(
    ...[0, 1, 2].map(
      (k) => opened[3 * vertex + k]! - positions[3 * vertex + k]!,
    ),
  );
const lowerSeam = travel(basis.contact!.lips.lower);
const carried = (vertex: number) => travel(vertex) >= lowerSeam / 2;
const lipTriangles = (lower: boolean) => {
  const out: number[] = [];
  for (let t = 0; t < surface.indices.length; t += 3) {
    const tri = surface.indices.slice(t, t + 3);
    if (tri.every((vertex) => carried(vertex) === lower)) out.push(...tri);
  }
  return out;
};
const INNER_LIP = {
  upper: new Set([191, 80, 81, 82, 13, 312, 311, 310, 415]),
  lower: new Set([95, 88, 178, 87, 14, 317, 402, 318, 324]),
};
const STOMION: Record<number, number> = {
  13: basis.contact!.lips.upper,
  14: basis.contact!.lips.lower,
};
const upperLip = lipTriangles(false);
const lowerLip = lipTriangles(true);
const occluders = basis.surfaces
  .filter(
    (one) =>
      one.id !== "Human" &&
      one.regions.every((region) => {
        const mode = basis.materials.find(
          (material) => material.id === region.material,
        )?.alphaMode;
        return mode !== "mask" && mode !== "blend";
      }),
  )
  .map((one) => ({
    positions: faceShapeFitSurfacePositions(basis, model, one.id),
    indices: one.indices,
  }));
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
      // Stomion superius and inferius are the basis's own vermilion seam
      // vertices; a ray at a closed seam cannot tell which lip it is on.
      const seam = STOMION[landmark];
      if (seam !== undefined)
        return {
          landmark,
          anchor: {
            vertices: [seam, seam, seam] as [number, number, number],
            weights: [1, 0, 0] as [number, number, number],
          },
        };
      const anchor = anchorFaceShapeFitRay({
        positions,
        indices: INNER_LIP.upper.has(landmark)
          ? upperLip
          : INNER_LIP.lower.has(landmark)
            ? lowerLip
            : surface.indices,
        occluders,
        ray: faceShapeFitRay(view, pixel),
        tolerance: 0.001,
        nearest: INNER_LIP.upper.has(landmark) || INNER_LIP.lower.has(landmark),
      });
      return { landmark, anchor };
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
