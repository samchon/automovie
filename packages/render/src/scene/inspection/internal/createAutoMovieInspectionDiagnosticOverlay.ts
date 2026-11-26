import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import type { IAutoMovieInspectionDiagnosticOverlay } from "../IAutoMovieInspectionDiagnosticOverlay.js";
import type { IAutoMovieInspectionOverlay } from "../IAutoMovieInspectionOverlay.js";
import type { IRenderAutoMovieInspectionDiagnosticsProps } from "../IRenderAutoMovieInspectionDiagnosticsProps.js";
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

/** The cubes built for one sequence of colours and stroke. */
interface IKept {
  overlay: IAutoMovieInspectionOverlay;
  marks: { mark: IAutoMovieMark; color: number }[];
  signature: string;
  width: number;
  height: number;
}

/**
 * Create a witness-cube overlay that review pictures share.
 *
 * Each picture draws a translucent red wire cube at every confirmed error's
 * measured point and an amber one at every possible error's, in world space,
 * through the existing stroke renderer. Findings with interval-only or
 * other-time evidence remain in the report for review at their own time. While
 * the number of cubes, their colours and the stroke stay the same, the cubes
 * are moved by rewriting their vertices in place; otherwise they are built
 * again and the previous ones released. The overlay is attached to the scene
 * only for the caller's render, including when it throws.
 *
 * @returns The overlay; dispose it when the pictures end.
 */
export function createAutoMovieInspectionDiagnosticOverlay(): IAutoMovieInspectionDiagnosticOverlay {
  let kept: IKept | undefined;
  return {
    render: (
      props: IRenderAutoMovieInspectionDiagnosticsProps,
    ): IAutoMovieInspectionLegendEntry[] => {
      const witnesses: { point: IAutoMovieVector3; color: number }[] = select(
        props.diagnostics,
      );
      if (witnesses.length === 0) {
        props.render();
        return [];
      }
      const signature: string = `${props.stroke}|${witnesses
        .map(({ color }: { color: number }): number => color)
        .join(",")}`;
      if (kept === undefined || kept.signature !== signature) {
        kept?.overlay.dispose();
        kept = undefined;
        const marks: { mark: IAutoMovieMark; color: number }[] = witnesses.map(
          (
            witness: { point: IAutoMovieVector3; color: number },
            index: number,
          ): { mark: IAutoMovieMark; color: number } => ({
            mark: cube(witness.point, index, witness.color),
            color: witness.color,
          }),
        );
        const overlay: IAutoMovieInspectionOverlay =
          buildAutoMovieInspectionMarks([{ anchor: null, marks }], {
            stroke: props.stroke,
            xray: true,
          });
        for (const child of overlay.object.children)
          if (AutoMovieThreeKind.isMesh(child))
            for (const material of [child.material].flat())
              material.opacity = 0.78;
        kept = { overlay, marks, signature, width: 0, height: 0 };
      } else
        witnesses.forEach(
          (
            witness: { point: IAutoMovieVector3; color: number },
            index: number,
          ): void => place(kept!.marks[index]!.mark, witness.point),
        );
      if (kept.width !== props.width || kept.height !== props.height) {
        kept.overlay.resize(props.width, props.height);
        kept.width = props.width;
        kept.height = props.height;
      }
      const object: THREE.Object3D = kept.overlay.object;
      props.scene.add(object);
      try {
        object.updateWorldMatrix(true, false);
        kept.overlay.update();
        props.render();
      } finally {
        props.scene.remove(object);
      }
      return legendOf(witnesses);
    },
    dispose: (): void => {
      kept?.overlay.dispose();
      kept = undefined;
    },
  };
}

/**
 * The located error witnesses of the sample's own time, in finding order, with
 * their colours.
 */
function select(
  diagnostics: IAutoMovieInspectionDiagnostics | undefined,
): { point: IAutoMovieVector3; color: number }[] {
  const out: { point: IAutoMovieVector3; color: number }[] = [];
  if (diagnostics === undefined) return out;
  for (const finding of diagnostics.findings) {
    const { point, time } = finding.witness;
    if (
      finding.category !== "error" ||
      point === undefined ||
      (time !== undefined && time.filmSeconds !== diagnostics.time.filmSeconds)
    )
      continue;
    out.push({
      point,
      color: finding.confidence === "confirmed" ? COLOR : POSSIBLE_COLOR,
    });
  }
  return out;
}

/** Legend entries for the confirmed and possible cubes drawn. */
function legendOf(
  witnesses: readonly { color: number }[],
): IAutoMovieInspectionLegendEntry[] {
  const confirmed: number = witnesses.filter(
    ({ color }: { color: number }): boolean => color === COLOR,
  ).length;
  const legend: IAutoMovieInspectionLegendEntry[] = [];
  if (confirmed !== 0)
    legend.push({ label: "production error", color: COLOR, count: confirmed });
  if (confirmed !== witnesses.length)
    legend.push({
      label: "possible production error",
      color: POSSIBLE_COLOR,
      count: witnesses.length - confirmed,
    });
  return legend;
}

/** The twelve edges of one cube, centred on a measured world point. */
function cube(
  centre: IAutoMovieVector3,
  index: number,
  color: number,
): IAutoMovieMark {
  const points: number[] = new Array<number>(EDGES.length * 6);
  const mark: IAutoMovieMark = {
    path: `production/diagnostic/${index}`,
    kind: "production/diagnostic",
    label: "production error",
    color,
    shape: { type: "segments", points },
    flagged: true,
    anchor: null,
  };
  place(mark, centre);
  return mark;
}

/** Rewrite a cube's segment coordinates in place around a new centre. */
function place(mark: IAutoMovieMark, centre: IAutoMovieVector3): void {
  if (mark.shape.type !== "segments") return;
  const points: number[] = mark.shape.points;
  EDGES.forEach(
    (
      [ax, ay, az, bx, by, bz]: readonly [
        number,
        number,
        number,
        number,
        number,
        number,
      ],
      edge: number,
    ): void => {
      const at: number = edge * 6;
      points[at] = centre.x + ax * HALF_SIDE_METRES;
      points[at + 1] = centre.y + ay * HALF_SIDE_METRES;
      points[at + 2] = centre.z + az * HALF_SIDE_METRES;
      points[at + 3] = centre.x + bx * HALF_SIDE_METRES;
      points[at + 4] = centre.y + by * HALF_SIDE_METRES;
      points[at + 5] = centre.z + bz * HALF_SIDE_METRES;
    },
  );
}
