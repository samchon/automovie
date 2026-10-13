import type { IPortraitComponentPlan as ImportedIPortraitComponentPlan, IPortraitSkinConstraint as ImportedIPortraitSkinConstraint } from "@automovie/human";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { resolveHumanFaceExpression } from "../../document/resolveHumanFaceExpression";
import type { IAutoMovieHumanFaceBindings } from "../../structures/IAutoMovieHumanFaceBindings";
import type { IAutoMovieHumanFaceExpression } from "../../structures/IAutoMovieHumanFaceExpression";
import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitFacePerformanceComponent } from "../cranium/createPortraitFacePerformanceComponent";
import type { IPortraitHeadPerformance } from "../cranium/structures/IPortraitHeadPerformance";
import type { IPortraitNeckShape } from "../cranium/structures/IPortraitNeckShape";
import { portraitJawSkinWeight } from "./portraitJawSkinWeight";
import { posePortraitJawPoint } from "./posePortraitJawPoint";

/**
 * Continue the facial jaw field through reference-formed cranium and neck. The actual facial-performance constraints identify the restored source vertices, so the mouth's separately owned tissue is never restored or posed twice. The posterior hinge plane and lower cervical section stay anchored.
 *
 * The observed lower face bounds a rigid angular sector. A monotone rational quadratic continues its rotation to the fixed posterior/cervical boundary on each sagittal ray. Unlike multiplying Cartesian falloffs, the angular transition does not reverse the fully mandibular cervical field. The oral band retains facial performance's weight. These are kinematic attachments, not recovered muscle weights, joint translation or a collision simulation. Matching observed/current angles omit the extra assembly path exactly.
 *
 * @evidence contracts/common.md#principled-implementation Actual facial-performance constraints restore source responsibility before a rational angular transition continues jaw motion through cranium/neck.
 * @evidence contracts/common.md#clear-and-simple-design Observed/current angle equality omits the extra field exactly and avoids double-posing mouth-owned tissue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid lower-face/hinge/cervical premises refuse; the field is kinematic attachment rather than recovered muscle or collision simulation.
 * @evidence contracts/common.md#meaningful-documentation Head millimetres and degree differences govern the shared transverse hinge, with posterior/cervical anchors fixed.
 * @evidence contracts/performance.md#efficient-algorithms Preparation scans facial constraints and lower attachments; each subsequent point uses fixed rational/vector work.
 * @evidence contracts/performance.md#reuse-equivalent-work Cloned reference samples and computed sector limits serve both inverse-reference and forward-pose closures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The continuation owns cloned host/bindings and reference map until its assembly completes; no posed-history cache persists.
 */
export function createPortraitJawContinuation(
  inputHost: IPortraitComponentHost,
  inputBindings: IAutoMovieHumanFaceBindings,
  inputObservation: IAutoMovieHumanFaceExpression,
  inputExpression: IAutoMovieHumanFaceExpression,
  inputNeck: IPortraitNeckShape,
): IPortraitHeadPerformance | undefined {
  const observation: { blink: { right: number; left: number; }; browRaise: { right: number; left: number; }; smile: { right: number; left: number; }; jawOpen: number; lipPart: number; pucker: number; tongueRaise: number; tongueAdvance: number; gazePitch: { right: number; left: number; }; gazeYaw: { right: number; left: number; }; } = resolveHumanFaceExpression(inputObservation);
  const expression: { blink: { right: number; left: number; }; browRaise: { right: number; left: number; }; smile: { right: number; left: number; }; jawOpen: number; lipPart: number; pucker: number; tongueRaise: number; tongueAdvance: number; gazePitch: { right: number; left: number; }; gazeYaw: { right: number; left: number; }; } = resolveHumanFaceExpression(inputExpression);
  const angle: number = expression.jawOpen - observation.jawOpen;
  if (angle === 0) return undefined;
  const host: IPortraitComponentHost = structuredClone(inputHost),
    bindings: IAutoMovieHumanFaceBindings = structuredClone(inputBindings);
  const plan: ImportedIPortraitComponentPlan = createPortraitFacePerformanceComponent(bindings, observation, {
    ...expression,
    browRaise: observation.browRaise,
  }).fit(host);
  const reference: Map<number, number[]> = new Map(
    plan.constraints.map(({ vertex }: ImportedIPortraitSkinConstraint): [number, number[]] => [vertex, host.positions[vertex]]),
  );
  const middle: (curve: number[]) => number = (curve: number[]): number =>
    host.positions[curve[Math.floor(curve.length / 2)]][1];
  const upper: number = middle(bindings.mouth.upper),
    lower: number = middle(bindings.mouth.lower);
  const lowerFace: number[][] = [...reference.values()].filter(
    (point: number[]): boolean => portraitJawSkinWeight(point[1], upper, lower) === 1,
  );
  const chin: number = Math.min(...lowerFace.map((point: number[]): number => point[1]));
  const anterior: number = Math.min(...lowerFace.map((point: number[]): number => point[2]));
  const hinge: ImportedIAutoMovieVector3 = bindings.jawHinge!,
    anchorY: number = inputNeck.lower.y;
  if (
    !Number.isFinite(chin) ||
    !Number.isFinite(anchorY) ||
    chin <= anchorY ||
    chin >= hinge.y ||
    anterior <= hinge.z
  )
    throw new Error(
      "Jaw continuation needs lower facial attachments above the lower neck, below the hinge and anterior to it.",
    );
  const frontAngle: number = Math.max(
    ...lowerFace.map((point: number[]): number =>
      Math.atan2(hinge.y - point[1], point[2] - hinge.z),
    ),
  );
  return {
    reference: (point: number[], vertex: number): number[] => {
      const original: number[] | undefined = reference.get(vertex);
      if (original === undefined) return [...point];
      // Undo only the jaw rotation. A second component's compatible residual
      // must survive rather than being replaced by the original host sample.
      const restored: ImportedIAutoMovieVector3 = posePortraitJawPoint(
        { x: point[0], y: point[1], z: point[2] },
        hinge,
        -angle,
        portraitJawSkinWeight(original[1], upper, lower),
      );
      return [restored.x, restored.y, restored.z];
    },
    pose: ([x, y, z]: number[]): number[] => {
      let weight: number = portraitJawSkinWeight(y, upper, lower);
      if (z <= hinge.z || y <= anchorY) weight = 0;
      else if (weight !== 0) {
        const radius: number = Math.hypot(y - hinge.y, z - hinge.z),
          theta: number = Math.atan2(hinge.y - y, z - hinge.z),
          start: number = Math.min(
            frontAngle,
            Math.asin(Math.min(1, (hinge.y - chin) / radius)),
          ),
          end: number = Math.asin(Math.min(1, (hinge.y - anchorY) / radius));
        if (theta > start) {
          const span: number = end - start,
            ratio: number = 1 - (angle * weight * Math.PI) / (180 * span);
          if (!Number.isFinite(ratio) || ratio <= 0)
            throw new Error(
              "Jaw continuation has no angular clearance before its fixed cervical boundary.",
            );
          const u: number = (theta - start) / span;
          // Unit endpoint derivatives join rigid and fixed tissue. This is
          // the displacement form of a monotone rational quadratic, avoiding
          // subtraction of nearly identical posed/reference polar angles.
          const fraction: number =
            ((1 - u) ** 2 * (ratio + 2 * u)) /
            (ratio + 2 * (1 - ratio) * u * (1 - u));
          weight *= Math.max(0, Math.min(1, fraction));
        }
      }
      const point: ImportedIAutoMovieVector3 = posePortraitJawPoint({ x, y, z }, hinge, angle, weight);
      return [point.x, point.y, point.z];
    },
  };
}
