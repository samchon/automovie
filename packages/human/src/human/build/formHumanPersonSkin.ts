import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import type { IAutoMovieHumanPersonFormedSkin } from "../structures/IAutoMovieHumanPersonFormedSkin";
import type { IAutoMovieHumanPersonSkinFrame } from "../structures/IAutoMovieHumanPersonSkinFrame";
import type { IAutoMovieHumanPersonSkinPlan } from "../structures/IAutoMovieHumanPersonSkinPlan";

/**
 * Form a one-skin person's posed skin from both partitions' evaluations.
 *
 * The face producer's skin arrives by vertex (`readHumanPersonFaceRest` reads
 * it back from a built model). Each head vertex takes its face position plus the head carry's rest shift. A shared
 * sample instead takes its face position plus the body's own displacement of
 * that sample, which already contains the carry, so both formulas meet at the
 * cut. The head cells are posed with the generation's one weight map through
 * the body's skinning and bones. The body cells keep the body builder's
 * posing, and each shared sample takes the head-side result, one value on
 * both halves. A band body vertex adds the face producer's displacement of it
 * in the rest frame, carried by the rigid skinning transform the body gave
 * that vertex. The largest step each partition's field asked of the boundary
 * is reported, not corrected.
 */
export function formHumanPersonSkin(
  plan: IAutoMovieHumanPersonSkinPlan,
  frame: IAutoMovieHumanPersonSkinFrame,
): IAutoMovieHumanPersonFormedSkin {
  const { shift, bodyRest, bones } = frame;
  const raw = frame.faceRest.head;
  let faceField = 0;
  let bodyField = 0;
  const rest = raw.map((value, at) => value + shift[at % 3]);
  for (const [vertex, own] of plan.bodyOfFace) {
    const at = plan.restRows.get(own)!;
    const faceStep = [0, 1, 2].map(
      (axis) => raw[vertex * 3 + axis] - plan.faceNeutral[vertex * 3 + axis],
    );
    const bodyStep = [0, 1, 2].map(
      (axis) => bodyRest[at * 3 + axis] - plan.bodyNeutral[own * 3 + axis],
    );
    faceField = Math.max(faceField, Math.hypot(...faceStep));
    bodyField = Math.max(
      bodyField,
      Math.hypot(...bodyStep.map((step, axis) => step - shift[axis])),
    );
    for (let axis = 0; axis < 3; axis++)
      rest[vertex * 3 + axis] = raw[vertex * 3 + axis] + bodyStep[axis];
  }
  const facePosed = skinHumanBodySurface(
    rest,
    plan.headSkin,
    plan.joints,
    bones,
  );
  const bodyPosed = frame.bodyPosed.slice();
  plan.sharedBody.forEach((vertex, at) => {
    for (let axis = 0; axis < 3; axis++)
      bodyPosed[vertex * 3 + axis] = facePosed[plan.sharedFace[at] * 3 + axis];
  });
  const band = plan.band;
  const bandRest = frame.faceRest.band;
  if (
    band !== undefined &&
    bandRest !== undefined &&
    band.bodyVertices.length > 0
  ) {
    // the band's body side: the face producer's displacement of each appended
    // vertex, added in the rest frame and carried by the same rigid skinning
    // transform the body builder gave that vertex
    const banded = new Array<number>(band.bodyVertices.length * 3).fill(0);
    // only the view vertices the band part draws carry the producer's value
    const drawn = new Set(band.sources);
    band.viewBodyVertices.forEach((bodyVertex, viewVertex) => {
      const slot = band.slots.get(bodyVertex);
      if (slot === undefined || !drawn.has(viewVertex)) return;
      for (let axis = 0; axis < 3; axis++)
        banded[slot * 3 + axis] = bandRest[viewVertex * 3 + axis];
    });
    const before = bodyRest.slice(plan.sharedBody.length * 3);
    const after = before.map(
      (value, at) =>
        value +
        banded[at] -
        plan.bodyNeutral[band.bodyVertices[Math.floor(at / 3)] * 3 + (at % 3)],
    );
    const from = skinHumanBodySurface(before, band.skin, plan.joints, bones);
    const to = skinHumanBodySurface(after, band.skin, plan.joints, bones);
    band.bodyVertices.forEach((vertex, at) => {
      for (let axis = 0; axis < 3; axis++)
        bodyPosed[vertex * 3 + axis] += to[at * 3 + axis] - from[at * 3 + axis];
    });
  }
  return { facePosed, bodyPosed, faceField, bodyField };
}
