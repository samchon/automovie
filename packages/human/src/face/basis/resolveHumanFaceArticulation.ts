import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

/**
 * Turn expression weights into the rigid motions of the mandible and globes.
 *
 * The jaw opens by `opening.degrees * w` about the condylar axis point
 * (`pivot landmark + axisOffset`) and translates by `opening.translation * w`
 * at the same time, which is the linear coupling of condylar translation to
 * rotation measured in vivo (Jász 2024: 0.30 mm per mm of incisal opening,
 * R^2 0.998; Chen 2021: about 0.5 mm per degree); protrusion and each
 * laterotrusion add their translations. The sagittal budget is one: the
 * summed opening and protrusion translation may not exceed
 * `translationLimitMetres`, which closes the bottom of Posselt's envelope,
 * where a fully open jaw has no protrusive capacity left. A document past it
 * is refused with the figures rather than clamped, because clamping one
 * control to honour another is a hidden edit of the document.
 *
 * Each eye rotates about its centre landmark by its gaze channels in list
 * order, each `degrees * w` about its authored axis, and shifts by the sum of
 * their `translation * w`, the eccentric drift the source authored beside
 * its lids (Demer and Clark 2019 measured the human eye turning about a
 * varying point rather than a fixed one). No lid weight exists;
 * the lids' gaze coupling is the residual the source authored. Blinks do not
 * rotate the globe: a normal blink shows no Bell's movement (Doane 1980;
 * Takagi 1992), so closure is tissue alone.
 *
 * Landmarks are read from the shaped rest, never from the neutral, so an
 * identity that moves a globe or the jaw pivot moves the joint with it. The
 * result is fresh; inputs are not mutated.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation Drives the mandible and globes as joints from expression channels, coupling rotation and translation and refusing combinations outside the supported envelope.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Forms each owner's rigid motion from the shaped landmarks, the authored axes and degrees, and the translation budget the specification states.
 */
export function resolveHumanFaceArticulation(
  articulation: NonNullable<IAutoMovieHumanFaceBasis["articulation"]>,
  weights: ReadonlyMap<string, number>,
  landmarks: Record<string, IAutoMovieVector3>,
): {
  motions: Map<string, IAutoMovieHumanFaceRigidMotion>;
  jaw: {
    degrees: number;
    translation: IAutoMovieVector3;
    pivot: IAutoMovieVector3;
  };
  eyes: {
    id: string;
    rotation: IAutoMovieQuaternion;
    center: IAutoMovieVector3;
    translation: IAutoMovieVector3;
  }[];
} {
  const weight = (channel: string): number => weights.get(channel) ?? 0;
  const { jaw } = articulation;
  const opening = weight(jaw.opening.channel);
  const protrusion = weight(jaw.protrusion.channel);
  const sagittal = Vector3.add(
    Vector3.scale(Vector3.create(...jaw.opening.translation), opening),
    Vector3.scale(Vector3.create(...jaw.protrusion.translation), protrusion),
  );
  if (Vector3.length(sagittal) > jaw.translationLimitMetres + 1e-12)
    throw new Error(
      "The jaw cannot open and protrude past its condylar translation budget: " +
        `${(Vector3.length(sagittal) * 1000).toFixed(2)} mm requested by ` +
        `${jaw.opening.channel}=${opening} and ${jaw.protrusion.channel}=${protrusion}, ` +
        `${(jaw.translationLimitMetres * 1000).toFixed(2)} mm supported.`,
    );
  const translation = Vector3.add(
    sagittal,
    Vector3.add(
      Vector3.scale(
        Vector3.create(...jaw.laterotrusion.left.translation),
        weight(jaw.laterotrusion.left.channel),
      ),
      Vector3.scale(
        Vector3.create(...jaw.laterotrusion.right.translation),
        weight(jaw.laterotrusion.right.channel),
      ),
    ),
  );
  const degrees = jaw.opening.degrees * opening;
  const pivot = Vector3.add(
    landmarks[jaw.pivot],
    Vector3.create(...jaw.axisOffset),
  );
  const motions = new Map<string, IAutoMovieHumanFaceRigidMotion>();
  motions.set("jaw", {
    rotation: Quaternion.fromAxisAngle(Vector3.create(...jaw.axis), degrees),
    pivot,
    translation,
  });
  const eyes = articulation.eyes.map((eye) => {
    let rotation = Quaternion.identity();
    let shift = Vector3.create();
    for (const gaze of eye.gaze) {
      const w = weight(gaze.channel);
      if (w === 0) continue;
      rotation = Quaternion.multiply(
        Quaternion.fromAxisAngle(
          Vector3.create(...gaze.axis),
          gaze.degrees * w,
        ),
        rotation,
      );
      shift = Vector3.add(
        shift,
        Vector3.scale(Vector3.create(...gaze.translation), w),
      );
    }
    const center = landmarks[eye.center];
    motions.set(eye.id, { rotation, pivot: center, translation: shift });
    return { id: eye.id, rotation, center, translation: shift };
  });
  return { motions, jaw: { degrees, translation, pivot }, eyes };
}
