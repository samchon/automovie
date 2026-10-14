import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import type { IAutoMovieHumanPersonFormedSkin } from "../structures/IAutoMovieHumanPersonFormedSkin";
import type { IAutoMovieHumanPersonSkinFrame } from "../structures/IAutoMovieHumanPersonSkinFrame";
import type { IAutoMovieHumanPersonSkinPlan } from "../structures/IAutoMovieHumanPersonSkinPlan";

/**
 * Form a one-skin person's posed skin from both partitions' evaluations.
 *
 * Face source vertices receive eye-anchor rest shift, except shared samples add their actual body rest displacement, which already contains carry. The body's skinning owner poses head weights, and both halves copy the head result at each shared identity. Optional band displacement is the difference between skinning body rest with and without the actual face-view delta. This remains the existing skinning owner's operation, including any position-dependent twist behavior.
 *
 * Inputs are admitted matching-generation buffers in common source metres and remain unchanged. Returned face/body coordinates are owned. Boundary fields report maximal requested face and non-carry body rest displacement; they correct neither a remaining adjacent-ring step nor clinical neck/head proportion or global embeddedness.
 *
 * @evidence contracts/common.md#principled-implementation Canonical shared samples combine absolute face/body rest fields, pose through one head weight map and copy one exact performed value to both partitions; band deltas use the same body skinning owner.
 * @evidence contracts/common.md#clear-and-simple-design This forming step owns field combination and shared-value publication; bone skinning and invariant correspondence admission retain their dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary disagreement is reported without smoothing or coordinate fitting; admitted source populations remain premises and band transport does not replace the actual skinning law with a claimed rigid approximation.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, shared/band formulas, owned outputs and the meaning/limits of boundary displacement receipts.
 * @evidence contracts/performance.md#efficient-algorithms Rest combination visits F face and S shared rows, copies B body coordinates, and optional band gathering visits its view rows; actual head and two band skinning costs remain charged to the bone owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled correspondence and region tables drive all evaluations, and each posed head boundary value is reused on the body without a second solve or seam fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rest/band buffers are call-local and returned formed coordinate arrays are caller-owned; the routine retains no generation closure or task.
 */
export function formHumanPersonSkin(
  plan: IAutoMovieHumanPersonSkinPlan,
  frame: IAutoMovieHumanPersonSkinFrame,
): IAutoMovieHumanPersonFormedSkin {
  const { shift, bodyRest, bones }: IAutoMovieHumanPersonSkinFrame = frame;
  const raw: readonly number[] = frame.faceRest.head;
  let faceField: number = 0;
  let bodyField: number = 0;
  const rest: number[] = raw.map(
    (value: number, at: number): number => value + shift[at % 3],
  );
  for (const [vertex, own] of plan.bodyOfFace) {
    const at: number = plan.restRows.get(own)!;
    const faceStep: number[] = [0, 1, 2].map(
      (axis: number): number =>
        raw[vertex * 3 + axis] - plan.faceNeutral[vertex * 3 + axis],
    );
    const bodyStep: number[] = [0, 1, 2].map(
      (axis: number): number =>
        bodyRest[at * 3 + axis] - plan.bodyNeutral[own * 3 + axis],
    );
    faceField = Math.max(faceField, Math.hypot(...faceStep));
    bodyField = Math.max(
      bodyField,
      Math.hypot(
        ...bodyStep.map(
          (step: number, axis: number): number => step - shift[axis],
        ),
      ),
    );
    for (let axis: number = 0; axis < 3; axis++)
      rest[vertex * 3 + axis] = raw[vertex * 3 + axis] + bodyStep[axis];
  }
  const facePosed: number[] = skinHumanBodySurface(
    rest,
    plan.headSkin,
    plan.joints,
    bones,
  );
  const bodyPosed: number[] = frame.bodyPosed.slice();
  plan.sharedBody.forEach((vertex: number, at: number): void => {
    for (let axis: number = 0; axis < 3; axis++)
      bodyPosed[vertex * 3 + axis] = facePosed[plan.sharedFace[at] * 3 + axis];
  });
  const band: IAutoMovieHumanPersonSkinPlan["band"] = plan.band;
  const bandRest: IAutoMovieHumanPersonSkinFrame["faceRest"]["band"] =
    frame.faceRest.band;
  if (
    band !== undefined &&
    bandRest !== undefined &&
    band.bodyVertices.length > 0
  ) {
    // Add the face-view delta in rest coordinates, then subtract the actual body skinning results with and without it.
    const banded: number[] = new Array<number>(
      band.bodyVertices.length * 3,
    ).fill(0);
    // only the view vertices the band part draws carry the producer's value
    const drawn: Set<number> = new Set(band.sources);
    band.viewBodyVertices.forEach(
      (bodyVertex: number, viewVertex: number): void => {
        const slot: number | undefined = band.slots.get(bodyVertex);
        if (slot === undefined || !drawn.has(viewVertex)) return;
        for (let axis: number = 0; axis < 3; axis++)
          banded[slot * 3 + axis] = bandRest[viewVertex * 3 + axis];
      },
    );
    const before: number[] = bodyRest.slice(plan.sharedBody.length * 3);
    const after: number[] = before.map(
      (value: number, at: number): number =>
        value +
        banded[at] -
        plan.bodyNeutral[band.bodyVertices[Math.floor(at / 3)] * 3 + (at % 3)],
    );
    const from: number[] = skinHumanBodySurface(
      before,
      band.skin,
      plan.joints,
      bones,
    );
    const to: number[] = skinHumanBodySurface(
      after,
      band.skin,
      plan.joints,
      bones,
    );
    band.bodyVertices.forEach((vertex: number, at: number): void => {
      for (let axis: number = 0; axis < 3; axis++)
        bodyPosed[vertex * 3 + axis] += to[at * 3 + axis] - from[at * 3 + axis];
    });
  }
  return { facePosed, bodyPosed, faceField, bodyField };
}
