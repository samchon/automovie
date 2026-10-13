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
 * Read jaw/eye rig frames under the body's head from the face owner's shaped landmarks and actual articulation resolver. Frames use common source metres with dimensionless unit rotations.
 *
 * Rest rotations are world-aligned identity at the shaped pivot/centre plus head rest shift. Posed positions carry the owner's translated centre through the actual head transform; posed rotations compose head rotation with the owner's turn. These frames describe already-applied face motions and do not skin the mesh again.
 *
 * Absent articulation returns no bones. Eye owners must be the supported leftEye/rightEye identities; unknown names refuse. Source admission supplies valid jaw motion and finite frames. Owner articulation contains authored motion conventions and its own admission, not a new clinical eye/jaw reconstruction or current visual qualification here. Input records remain unchanged and returned frames are owned.
 *
 * @evidence contracts/common.md#principled-implementation Existing shape-only endpoint evaluation and articulation produce the actual jaw/eye centres and motions, composed with the same person head carry.
 * @evidence contracts/common.md#clear-and-simple-design This adapter exposes rig receipts only; shape evaluation, articulation mechanics and head transport retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown eye-owner names refuse instead of guessed mapping, absent articulation stays absent, and bones do not apply a second mesh deformation or certify measured anatomy.
 * @evidence contracts/common.md#meaningful-documentation Prose states rest/posed frame formulas, metre/rotation units, exact supported names and rig-versus-deformation scope.
 * @evidence contracts/performance.md#efficient-algorithms Endpoint-state/rest geometry evaluation pays its actual basis cost, shape channel filtering can search C channels per weighted entry, and final bone frame composition is fixed work per articulated owner.
 * @evidence contracts/performance.md#reuse-equivalent-work The established shape/articulation owners supply the same source rules used by face construction; one head transform serves all resulting bone frames.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shape/weight/motion maps are call-local; only owned bone frames escape without retaining source geometry or a task.
 */
export function resolveHumanPersonFaceBones(
  props: IAutoMovieHumanPersonFaceBonesProps,
): IAutoMovieHumanPersonBone[] {
  const { basis, document, head }: IAutoMovieHumanPersonFaceBonesProps = props;
  if (basis.articulation === undefined) return [];
  const state: ReturnType<typeof humanFaceBasisWeights> = humanFaceBasisWeights(basis, document);
  const shaped: ReturnType<typeof evaluateHumanFaceRest> = evaluateHumanFaceRest(basis, {
    weights: new Map(
      [...state.weights].filter(
        ([id]: [string, number]): boolean => basis.channels.find((c: IAutoMovieHumanPersonFaceBonesProps["basis"]["channels"][number]): boolean => c.id === id)?.kind === "shape",
      ),
    ),
    activations: state.activations.filter((one: typeof state.activations[number]): boolean => one.shapeOnly),
  });
  const { jaw, eyes, motions }: ReturnType<typeof resolveHumanFaceArticulation> = resolveHumanFaceArticulation(
    basis.articulation,
    state.weights,
    shaped.landmarks,
  );
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const frame: (centre: IAutoMovieVector3, translation: IAutoMovieVector3, rotation: IAutoMovieQuaternion) => IAutoMovieHumanPersonBoneFrames = (
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
    ...eyes.map((eye: typeof eyes[number]): IAutoMovieHumanPersonBone => {
      const bone: AutoMovieHumanoidBone | undefined = named[eye.id];
      if (bone === undefined)
        throw new Error(
          "An articulated owner has no humanoid bone to map to: " + eye.id,
        );
      return { bone, ...frame(eye.center, eye.translation, eye.rotation) };
    }),
  ];
}
