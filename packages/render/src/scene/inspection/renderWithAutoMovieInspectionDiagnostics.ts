import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import { buildAutoMovieInspectionMarks } from "./buildAutoMovieInspectionMarks.js";

/** The review overlay uses red, in sRGB. */
const COLOR: number = 0xff0000;

/** Possible errors that have a located point appear in amber. */
const POSSIBLE_COLOR: number = 0xe6a300;

/** Half the side of a witness cube, in world metres. */
const HALF_SIDE_METRES: number = 0.025;

/** Endpoints of each edge, relative to the cube centre. */
const EDGES: readonly (readonly [
  number,
  number,
  number,
  number,
  number,
  number,
])[] = [
  [-1, -1, -1, 1, -1, -1],
  [-1, 1, -1, 1, 1, -1],
  [-1, -1, 1, 1, -1, 1],
  [-1, 1, 1, 1, 1, 1],
  [-1, -1, -1, -1, 1, -1],
  [1, -1, -1, 1, 1, -1],
  [-1, -1, 1, -1, 1, 1],
  [1, -1, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, 1],
  [1, -1, -1, 1, -1, 1],
  [-1, 1, -1, -1, 1, 1],
  [1, 1, -1, 1, 1, 1],
];

/**
 * Render one review picture with translucent red wire cubes for confirmed errors and amber cubes for possible errors.
 *
 * The cubes are world-space marks, batched into the existing stroke renderer.
 * The draw borrows the overlay and releases it before returning, including on
 * render failure. Findings with interval-only or other-time evidence remain in
 * the report for review at their own time.
 *
 * @param props The review scene, draw callback, actual draw raster, stroke width and optional placed diagnostics.
 * @returns Legend entries for the kinds of witnesses drawn.
 * @evidence contracts/development/common.md#meaningful-documentation States which witnesses are shown, their shape and how long they are attached.
 * @evidence contracts/development/implementation.md#principled-implementation The witness's measured world point centres its cube. One review render uses the requested camera and current scene with the temporary strokes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Select measured confirmed errors, construct one mark set and bracket the caller's draw with attachment and cleanup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Possible and confirmed evidence have different colours and legend entries. No world location is inferred from coverage or an interval alone.
 * @evidence contracts/development/implementation.md#efficient-algorithms The marks share one stroke batch. Empty samples draw directly without allocating it.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the inspection mark builder and the caller's one render.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The overlay is disposed after each draw, including a failed render. Its points and materials never enter the next placed sample.
 */
export function renderWithAutoMovieInspectionDiagnostics(props: {
  scene: THREE.Scene;
  diagnostics: IAutoMovieInspectionDiagnostics | undefined;
  render: () => void;
  width: number;
  height: number;
  stroke: number;
}): IAutoMovieInspectionLegendEntry[] {
  const { diagnostics } = props;
  if (diagnostics === undefined || diagnostics.findings.length === 0) {
    props.render();
    return [];
  }
  const marks: { mark: IAutoMovieMark; color: number }[] = [];
  let confirmed: number = 0;
  for (const finding of diagnostics.findings) {
    const { point, time } = finding.witness;
    if (
      finding.category !== "error" ||
      point === undefined ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.z) ||
      (time !== undefined && time.filmSeconds !== diagnostics.time.filmSeconds)
    )
      continue;
    const color: number =
      finding.confidence === "confirmed" ? COLOR : POSSIBLE_COLOR;
    if (color === COLOR) ++confirmed;
    marks.push({ mark: cube(point, marks.length, color), color });
  }
  if (marks.length === 0) {
    props.render();
    return [];
  }
  const overlay: ReturnType<typeof buildAutoMovieInspectionMarks> =
    buildAutoMovieInspectionMarks([{ anchor: null, marks }], {
      stroke: props.stroke,
      xray: true,
    });
  try {
    for (const child of overlay.object.children)
      if (child instanceof THREE.Mesh && !Array.isArray(child.material))
        child.material.opacity = 0.78;
    overlay.resize(props.width, props.height);
    props.scene.add(overlay.object);
    overlay.object.updateWorldMatrix(true, false);
    overlay.update();
    props.render();
  } finally {
    overlay.dispose();
  }
  const legend: IAutoMovieInspectionLegendEntry[] = [];
  if (confirmed !== 0)
    legend.push({ label: "production error", color: COLOR, count: confirmed });
  if (confirmed !== marks.length)
    legend.push({
      label: "possible production error",
      color: POSSIBLE_COLOR,
      count: marks.length - confirmed,
    });
  return legend;
}

/** The twelve edges of one cube, centred on a measured world point. */
function cube(
  centre: IAutoMovieVector3,
  index: number,
  color: number,
): IAutoMovieMark {
  const points: number[] = [];
  for (const [ax, ay, az, bx, by, bz] of EDGES)
    points.push(
      centre.x + ax * HALF_SIDE_METRES,
      centre.y + ay * HALF_SIDE_METRES,
      centre.z + az * HALF_SIDE_METRES,
      centre.x + bx * HALF_SIDE_METRES,
      centre.y + by * HALF_SIDE_METRES,
      centre.z + bz * HALF_SIDE_METRES,
    );
  return {
    path: `production/diagnostic/${index}`,
    kind: "production/diagnostic",
    label: "production error",
    color,
    shape: { type: "segments", points },
    flagged: true,
    anchor: null,
  };
}
