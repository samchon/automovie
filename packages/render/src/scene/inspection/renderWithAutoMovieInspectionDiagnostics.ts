import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
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
 * What one review picture draws over the scene, and how it is drawn.
 *
 * @evidence contracts/development/design.md#principled-representation The scene, the placed diagnostics, the caller's render and the drawn raster and stroke.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly what the overlay needs to place and draw its cubes once.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent diagnostics draw the scene alone.
 * @evidence contracts/development/common.md#meaningful-documentation Names each member.
 */
export interface IRenderAutoMovieInspectionDiagnosticsProps {
  /** The scene the cubes are attached to while it renders. */
  scene: THREE.Scene;

  /** The placed sample's diagnostics, or undefined to draw no witness. */
  diagnostics: IAutoMovieInspectionDiagnostics | undefined;

  /** Render the scene once, through the caller's camera and target. */
  render: () => void;

  /** Drawn raster width in pixels. */
  width: number;

  /** Drawn raster height in pixels. */
  height: number;

  /** Stroke width in drawn pixels. */
  stroke: number;
}

/**
 * A witness-cube overlay kept across review pictures.
 *
 * @evidence contracts/development/design.md#principled-representation A live resource with one draw call per picture and one release.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Viewer draws through it every painted frame; a one-shot capture uses `renderWithAutoMovieInspectionDiagnostics`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The overlay is attached only while the picture renders, so no observation or other pass sees it.
 * @evidence contracts/development/common.md#meaningful-documentation States what it holds and when it is attached.
 */
export interface IAutoMovieInspectionDiagnosticOverlay {
  /** Render one picture with the sample's witness cubes and return the legend entries drawn. */
  render(
    props: IRenderAutoMovieInspectionDiagnosticsProps,
  ): IAutoMovieInspectionLegendEntry[];

  /** Release the kept cubes' geometry and materials. Calling it again does nothing. */
  dispose(): void;
}

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
 * other-time evidence remain in the report for review at their own time.
 * While the number of cubes, their colours and the stroke stay the same, the
 * cubes are moved by rewriting their vertices in place; otherwise they are
 * built again and the previous ones released. The overlay is attached to the
 * scene only for the caller's render, including when it throws.
 *
 * @returns The overlay; dispose it when the pictures end.
 * @evidence contracts/development/common.md#meaningful-documentation States which witnesses are shown, their shape, when the cubes are reused or rebuilt and how long they are attached.
 * @evidence contracts/development/implementation.md#principled-implementation The witness's measured world point centres its cube. The stroke builder rereads its marks' coordinate arrays on update, so moved witnesses reuse the built buffers and materials.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Select witnesses, reuse or rebuild one mark set, bracket the caller's render with attachment and detachment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Possible and confirmed evidence have different colours and legend entries. No world location is inferred from coverage or an interval alone.
 * @evidence contracts/development/implementation.md#efficient-algorithms A repeated colour sequence costs one vertex rewrite linear in the cubes; geometry and materials are built only when the sequence or stroke changes. Empty samples draw directly.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the inspection mark builder, its buffers and materials across pictures, and the caller's one render.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds at most one built mark set, released when replaced and by `dispose`; it never stays attached to the scene between pictures.
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
          if (child instanceof THREE.Mesh && !Array.isArray(child.material))
            child.material.opacity = 0.78;
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
 * Render one review picture with translucent red wire cubes for confirmed errors and amber cubes for possible errors.
 *
 * A one-shot use of `createAutoMovieInspectionDiagnosticOverlay`: the cubes are
 * built for this picture and released before returning, including on render
 * failure.
 *
 * @param props The review scene, draw callback, actual draw raster, stroke width and optional placed diagnostics.
 * @returns Legend entries for the kinds of witnesses drawn.
 * @evidence contracts/development/common.md#meaningful-documentation States that the picture's cubes are built and released within the call.
 * @evidence contracts/development/implementation.md#principled-implementation Draws through the shared overlay so a capture and the Viewer place the same cubes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Create, render, dispose.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The release runs even when the render throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One build per picture, suited to a still that is drawn once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the overlay and the caller's one render.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing built for the picture outlives the call.
 */
export function renderWithAutoMovieInspectionDiagnostics(
  props: IRenderAutoMovieInspectionDiagnosticsProps,
): IAutoMovieInspectionLegendEntry[] {
  const overlay: IAutoMovieInspectionDiagnosticOverlay =
    createAutoMovieInspectionDiagnosticOverlay();
  try {
    return overlay.render(props);
  } finally {
    overlay.dispose();
  }
}

/** The located error witnesses of the sample's own time, in finding order, with their colours. */
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
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.z) ||
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
  const points: number[] = mark.shape.points as number[];
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
