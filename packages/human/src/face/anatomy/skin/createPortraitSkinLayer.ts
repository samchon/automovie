import { createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieMeshDeformationField, IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import { resolveHumanFaceExpression } from "../../document/resolveHumanFaceExpression";
import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import type { IAutoMovieHumanFaceBindings } from "../../structures/IAutoMovieHumanFaceBindings";
import type { IAutoMovieHumanFaceExpression } from "../../structures/IAutoMovieHumanFaceExpression";
import type { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { resolvePortraitSkinShape } from "./resolvePortraitSkinShape";
import { type IPortraitSkinShape } from "./structures/IPortraitSkinShape";
import type { IPortraitSurfaceHost as IPortraitSurfaceHostImported, IPortraitEyeSocket as IPortraitEyeSocketImported } from "../../../index";



/**
 * Shape resting and expression-dependent skin on the live shared face. Eye
 * and oral attachments define each region; every support queries anterior
 * skin depth rather than borrowing an offset anchor's unmodified depth.
 * Narrow overlapping compact fields form crease valleys; broad fields carry
 * tissue descent, deflation and infraorbital projection. No texture is painted.
 *
 * Both sides share settings, with independent current expression and live
 * attachments. Curves fade at their ends and are clipped to the resident skin
 * silhouette. Open rims retain the surface assembler's geodesic protection.
 * Displacements use head Y/Z, not simulated material stress or measured age.
 * Zero laxity and expression creasing require no new attachment or topology.
 * Course offsets, family counts and the 0.018 m depth support are authored
 * morphology conventions. The anterior depth envelope and width-dependent
 * compact-field sampling do not certify native material correspondence,
 * source-normal depth or clinical crease shape; missing projected skin omits
 * that field. Actual assembled contact and opposing-view review remain separate.
 *
 * @evidence contracts/common.md#principled-implementation Admitted morphology/expression settings and live eye/mouth bindings generate compact head-Y/Z deformation fields on the anterior skin depth envelope; persistent laxity and current creasing stay independent, with no tissue-mechanics or age inference.
 * @evidence contracts/common.md#clear-and-simple-design One surface-layer callback groups conventional crease families and broad descent fields; shared scalar/expression resolvers own input ranges and the surface assembler owns refinement and protected rims.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed course offsets/counts and depth support are authored conventions, not primary anatomical measurements. Width-dependent sampling, anterior-envelope support and omission of null depth remain representation limits rather than proof of exact skin correspondence or source-normal displacement.
 * @evidence contracts/common.md#meaningful-documentation The prose gives units/conversions, conventional geometry, independent performance, no-op state, projected-support omission and unfinished anatomical/visual judgments.
 * @evidence contracts/performance.md#efficient-algorithms With T host triangles and K generated stroke samples, depth-sampler compilation and K projected queries accompany field generation; K grows with path length divided by admitted wrinkle width. One depth sampler serves all fields and the zero-laxity/creasing case avoids its construction.
 * @evidence contracts/performance.md#reuse-equivalent-work Bindings/settings/expression are copied and resolved once for the layer; each fields call rebuilds the depth sampler for its actual supplied host because different assembly states cannot share projected depth solely by equal settings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The layer retains fixed copied bindings/settings; per-host depth queries and K field records are invocation-owned and returned to the assembler, without mutation of input geometry or global tasks/handles.
 */
export function createPortraitSkinLayer(
  inputBindings: Pick<IAutoMovieHumanFaceBindings, "eyes" | "mouth">,
  input: IPortraitSkinShape,
  inputExpression: IAutoMovieHumanFaceExpression = {},
): IPortraitSurfaceLayer {
  const bindings: Pick<IAutoMovieHumanFaceBindings, "eyes" | "mouth"> = structuredClone(inputBindings),
    shape: Required<Partial<Record<"forehead" | "laxity" | "wrinkleDepth" | "wrinkleWidth" | "glabella" | "crowFeet" | "lowerLid" | "nasolabial" | "marionette" | "perioral" | "cheekSag" | "jowlSag" | "underEyeBag" | "volumeLoss" | "expressionCreasing", number>>> = resolvePortraitSkinShape(input),
    expression: Required<{ blink?: { right: number; left: number; } | undefined; browRaise?: { right: number; left: number; } | undefined; smile?: { right: number; left: number; } | undefined; jawOpen?: number | undefined; lipPart?: number | undefined; pucker?: number | undefined; tongueRaise?: number | undefined; tongueAdvance?: number | undefined; gazePitch?: { right: number; left: number; } | undefined; gazeYaw?: { right: number; left: number; } | undefined; }> = resolveHumanFaceExpression(inputExpression);
  return {
    id: "anatomical-skin",
    sampleSpacing:
      shape.laxity * shape.wrinkleDepth > 0 || shape.expressionCreasing > 0
        ? shape.wrinkleWidth * 0.75
        : undefined,
    fields: (host: IPortraitSurfaceHostImported): IAutoMovieMeshDeformationField[]  => {
      if (shape.laxity === 0 && shape.expressionCreasing === 0) return [];
      const point: (id: number) => readonly number[] = (id: number): readonly number[] => {
        const p: readonly number[] = host.positions[id];
        if (
          !Number.isInteger(id) ||
          p === undefined ||
          p.length !== 3 ||
          !p.every(Number.isFinite)
        )
          throw new Error(
            "Skin morphology requires finite resident anatomical attachments.",
          );
        return p;
      };
      const curve: (ids: readonly number[]) => (readonly number[])[] = (ids: readonly number[]): (readonly number[])[]  => {
        if (ids.length < 2)
          throw new Error(
            "Skin morphology requires nonempty anatomical boundary curves.",
          );
        return ids.map(point);
      };
      const middle: (points: readonly (readonly number[])[]) => readonly number[] = (points: readonly (readonly number[])[]): readonly number[]  =>
        points[Math.floor(points.length / 2)];
      const mouth: (readonly number[])[] = curve(bindings.mouth.upper),
        lowerMouth: (readonly number[])[] = curve(bindings.mouth.lower);
      const skin: (u: number, v: number) => { minimum: number; maximum: number; } | null = createAutoMovieMeshDepthSampler(
        createMetricMeshPart(
          "skin-morphology-basis",
          {
            positions: host.positions.flat(),
            indices: [...host.indices],
            normals: null,
            uvs: null,
            skin: null,
          },
          "skin-morphology-basis",
        ).geometry.mesh,
        "z",
      );
      const fields: IAutoMovieMeshDeformationField[] = [];
      const support: (x: number, y: number, rx: number, ry: number, dy: number, dz: number) => void = (
        x: number,
        y: number,
        rx: number,
        ry: number,
        dy: number,
        dz: number,
      ): void  => {
        if (dy === 0 && dz === 0) return;
        const hit: { minimum: number; maximum: number; } | null = skin(x / 1000, y / 1000);
        if (hit === null) return;
        fields.push({
          center: { x: x / 1000, y: y / 1000, z: hit.maximum },
          radius: { x: rx / 1000, y: ry / 1000, z: 0.018 },
          displacement: { x: 0, y: dy / 1000, z: dz / 1000 },
          stretch: { x: 0, y: 0, z: 0 },
        });
      };
      const stroke: (points: readonly (readonly number[])[], depth: number, width?: number) => void = (
        points: readonly (readonly number[])[],
        depth: number,
        width: number = shape.wrinkleWidth,
      ): void  => {
        if (depth === 0) return;
        const lengths: number[] = points
          .slice(1)
          .map((p: readonly number[], i: number): number  => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
        const total: number = lengths.reduce((a: number, b: number): number  => a + b, 0);
        const guide: { x: number; y: number; z: number; }[] = points.map((p: readonly number[]): { x: number; y: number; z: number; }  => ({ x: p[0], y: p[1], z: 0 }));
        // Every constructed path spans at least seven millimetres vertically,
        // has a positive admitted eye span, or contains the forehead arch.
        let travelled: number = 0;
        for (let i: number = 0; i < lengths.length; i++) {
          const length: number = lengths[i],
            count: number = Math.max(1, Math.ceil(length / width));
          for (let sample: number = 0; sample < count; sample++) {
            const t: number = sample / count,
              progress: number = (travelled + length * t) / total;
            // A sine envelope retains the continuous interior and zero ends.
            const at: IAutoMovieVector3Imported = catmullRomPoint(guide, (i + t) / lengths.length);
            support(
              at.x,
              at.y,
              width * 1.2,
              width * 1.2,
              0,
              -depth * 0.65 * Math.sin(Math.PI * progress),
            );
          }
          travelled += length;
        }
      };
      const rest: number = shape.laxity * shape.wrinkleDepth,
        dynamic: number = shape.expressionCreasing;
      const eyeData: { side: "right" | "left"; sign: number; outer: readonly number[]; inner: readonly number[]; width: number; brow: (readonly number[])[]; lower: readonly number[]; }[] = (["right", "left"] as const).map((side: "right" | "left"): { side: "right" | "left"; sign: number; outer: readonly number[]; inner: readonly number[]; width: number; brow: (readonly number[])[]; lower: readonly number[]; }  => {
        const eye: IPortraitEyeSocketImported = bindings.eyes[side],
          top: (readonly number[])[] = curve(eye.top),
          bottom: (readonly number[])[] = curve(eye.bottom),
          brow: (readonly number[])[] = curve(eye.browBottom),
          sign: 1 | -1 = side === "right" ? -1 : 1;
        const outer: readonly number[] = top[side === "right" ? 0 : top.length - 1],
          inner: readonly number[] = top[side === "right" ? top.length - 1 : 0],
          width: number = Math.abs(outer[0] - inner[0]);
        if (!(width > 1))
          throw new Error("Skin morphology requires nondegenerate eye spans.");
        return { side, sign, outer, inner, width, brow, lower: middle(bottom) };
      });
      const leftEdge: number = Math.min(...eyeData[0].brow.map((p: readonly number[]): number  => p[0])),
        rightEdge: number = Math.max(...eyeData[1].brow.map((p: readonly number[]): number  => p[0]));
      const browY: number = eyeData.reduce((s: number, e: { side: "right" | "left"; sign: number; outer: readonly number[]; inner: readonly number[]; width: number; brow: (readonly number[])[]; lower: readonly number[]; }): number  => s + middle(e.brow)[1], 0) / 2;
      const elevation: number =
        (expression.browRaise.left + expression.browRaise.right) / 2;
      for (let line: number = 0; line < 4; line++) {
        const y: number = browY + 10 + line * 6;
        const span: number = 0.78 - line * 0.07,
          centreX: number = (leftEdge + rightEdge) / 2;
        stroke(
          Array.from({ length: 9 }, (_: unknown, i: number): number[]  => {
            const t: number = i / 8;
            return [
              centreX +
                (leftEdge - centreX) * span +
                (rightEdge - leftEdge) * span * t,
              y + 2 * Math.sin(Math.PI * t),
            ];
          }),
          (rest * shape.forehead + (dynamic * Math.max(0, elevation)) / 8) *
            (1 - line * 0.15),
        );
      }
      const midX: number = (eyeData[0].inner[0] + eyeData[1].inner[0]) / 2;
      for (const e of eyeData) {
        const { side, sign, width, outer, lower }: { side: "right" | "left"; sign: number; outer: readonly number[]; inner: readonly number[]; width: number; brow: (readonly number[])[]; lower: readonly number[]; } = e,
          corner: readonly number[] = mouth[side === "right" ? 0 : mouth.length - 1],
          smile: number = Math.max(0, expression.smile[side]) / 8;
        stroke(
          [
            [midX + sign * 3, browY - 5],
            [midX + sign * 4, browY + 5],
            [midX + sign * 5, browY + 15],
          ],
          rest * shape.glabella +
            (dynamic * Math.max(0, -expression.browRaise[side])) / 6,
        );
        for (let ray: number = -1; ray <= 1; ray++)
          stroke(
            [
              [outer[0] + sign * 2, outer[1] + ray],
              [outer[0] + sign * width * 0.27, outer[1] + ray * 3],
              [outer[0] + sign * width * 0.53, outer[1] + ray * 6],
            ],
            rest * shape.crowFeet +
              dynamic * (expression.blink[side] * 0.25 + smile * 0.75),
          );
        stroke(
          [
            [e.inner[0] + sign * 3, lower[1] - 5],
            [lower[0], lower[1] - 7],
            [outer[0] - sign * 2, lower[1] - 5],
          ],
          rest * shape.lowerLid * 0.75,
        );
        stroke(
          [
            [corner[0] * 0.64, corner[1] + width * 0.7],
            [corner[0] + sign * 2, corner[1] + width * 0.3],
            [corner[0] + sign * 4, corner[1] - 3],
          ],
          rest * shape.nasolabial + dynamic * smile * 0.5,
          shape.wrinkleWidth * 1.5,
        );
        stroke(
          [
            [corner[0] + sign * 3, corner[1] - 2],
            [corner[0] + sign * 5, corner[1] - 10],
            [corner[0] + sign * 8, corner[1] - 21],
          ],
          rest * shape.marionette,
          shape.wrinkleWidth * 1.5,
        );
        support(
          lower[0],
          lower[1] - 6,
          width * 0.45,
          5,
          0,
          shape.laxity * shape.underEyeBag,
        );
        support(
          lower[0] + sign * 5,
          lower[1] - width * 0.7,
          width * 0.8,
          width * 0.7,
          -shape.laxity * shape.cheekSag,
          -shape.laxity * shape.volumeLoss,
        );
        support(
          corner[0] + sign * width * 0.42,
          Math.min(corner[1], middle(lowerMouth)[1]) - 12,
          width * 0.5,
          14,
          -shape.laxity * shape.jowlSag,
          shape.laxity * shape.jowlSag * 0.2,
        );
      }
      const centre: readonly number[] = middle(mouth),
        half: number = (mouth.at(-1)![0] - mouth[0][0]) / 2;
      for (const fraction of [-0.65, -0.4, -0.2, 0.2, 0.4, 0.65])
        stroke(
          [
            [centre[0] + half * fraction, centre[1] + 3],
            [centre[0] + half * fraction * 1.1, centre[1] + 10],
          ],
          rest * shape.perioral + (dynamic * expression.pucker) / 4,
        );
      return fields;
    },
  };
}
