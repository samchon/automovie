import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { evaluateHumanFaceRest } from "../../face/basis/evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "../../face/basis/humanFaceBasisWeights";
import { resolveHumanFaceArticulation } from "../../face/basis/resolveHumanFaceArticulation";
import type { IAutoMovieHumanPersonBone } from "../structures/IAutoMovieHumanPersonBone";
import type { IAutoMovieHumanPersonBoneFrames } from "../structures/IAutoMovieHumanPersonBoneFrames";
import type { IAutoMovieHumanPersonFaceBonesProps } from "../structures/IAutoMovieHumanPersonFaceBonesProps";

/**
 * The jaw and the two eyes as bones under the body's `head`, with the rest
 * and posed frames the face document asks for.
 *
 * The face moves its mandible and globes by rigid motions it resolves from
 * the expression channels (`resolveHumanFaceArticulation`): the jaw turns
 * about the condylar axis point and translates with it, each eye turns about
 * its centre and drifts a little. These are what the rig's `jaw`, `leftEye`
 * and `rightEye` bones are, so they are read from the same resolver and the
 * same shaped landmarks the face builder reads, not restated. A bone's frame
 * is world aligned at rest (identity rotation, at the shaped joint centre
 * carried into the body's rest frame by the head transform's shift); posed,
 * it is the joint centre after the motion's own translation, carried by the
 * head's rigid transform, with the head's change of orientation composed
 * with the motion's turn. So a bone follows the head exactly when the face
 * makes no motion, and turns relative to the head by exactly the face's
 * angle when it does.
 *
 * A basis without articulation has no such bones and returns none. Names
 * follow the humanoid vocabulary (`jaw`, `leftEye`, `rightEye`), matching
 * the face's owners `jaw`, `leftEye` and `rightEye`; a basis whose owners
 * are named otherwise is refused because the mapping would be a guess.
 * The bones are the rig of the assembled person, in the head's parent
 * relation; they neither skin nor deform anything, since the face builder has
 * already applied these motions to its surfaces.
 */
export function resolveHumanPersonFaceBones(
  props: IAutoMovieHumanPersonFaceBonesProps,
): IAutoMovieHumanPersonBone[] {
  const { basis, document, head } = props;
  if (basis.articulation === undefined) return [];
  const state = humanFaceBasisWeights(basis, document);
  const shaped = evaluateHumanFaceRest(basis, {
    weights: new Map(
      [...state.weights].filter(
        ([id]) => basis.channels.find((c) => c.id === id)?.kind === "shape",
      ),
    ),
    activations: state.activations.filter((one) => one.shapeOnly),
  });
  const { jaw, eyes, motions } = resolveHumanFaceArticulation(
    basis.articulation,
    state.weights,
    shaped.landmarks,
  );
  const identity = Quaternion.identity();
  const frame = (
    centre: IAutoMovieVector3,
    translation: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieHumanPersonBoneFrames => ({
    rest: {
      position: {
        x: centre.x + head.shift.x,
        y: centre.y + head.shift.y,
        z: centre.z + head.shift.z,
      },
      rotation: identity,
    },
    posed: {
      position: head.point({
        x: centre.x + translation.x,
        y: centre.y + translation.y,
        z: centre.z + translation.z,
      }),
      rotation: Quaternion.multiply(head.rotation, rotation),
    },
  });
  const named: Record<string, AutoMovieHumanoidBone> = {
    leftEye: "leftEye",
    rightEye: "rightEye",
  };
  return [
    {
      bone: "jaw",
      ...frame(jaw.pivot, jaw.translation, motions.get("jaw")!.rotation),
    },
    ...eyes.map((eye) => {
      const bone = named[eye.id];
      if (bone === undefined)
        throw new Error(
          "An articulated owner has no humanoid bone to map to: " + eye.id,
        );
      return { bone, ...frame(eye.center, eye.translation, eye.rotation) };
    }),
  ];
}
