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
 * at the same time. Lindauer et al. 1995 observed both movements from initial
 * opening (https://pubmed.ncbi.nlm.nih.gov/7771361/); Jasz et al. 2024 found
 * a roughly linear translation/opening relation in the first 5 mm only
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC11026373/). Scaling one authored
 * endpoint across the whole range is this rig's approximation, not a measured
 * patient-specific trajectory. Protrusion and each laterotrusion add their
 * translations. The sagittal budget is one: the
 * summed opening and protrusion translation may not exceed
 * `translationLimitMetres`, an authored supported-combination boundary rather
 * than a universal clinical limit. A document past it
 * is refused with the figures rather than clamped, because clamping one
 * control to honour another is a hidden edit of the document.
 *
 * Each eye rotates about its centre landmark by its gaze channels in list
 * order, each `degrees * w` about its authored axis, and shifts by the sum of
 * their `translation * w`, the eccentric drift the source authored beside
 * its lids. Demer and Clark 2019 measured a varying eccentric rotation point
 * and gaze-dependent globe translation (https://pubmed.ncbi.nlm.nih.gov/31239125/),
 * which this fitted linear endpoint path does not predict. No lid weight exists;
 * the lids' gaze coupling is the residual the source authored. This rig leaves
 * globe blink motion at zero. Doane 1980 and Takagi 1992 report no large upward
 * Bell movement in normal spontaneous blinks
 * (https://pubmed.ncbi.nlm.nih.gov/7369314/ and
 * https://pubmed.ncbi.nlm.nih.gov/1473450/), but Riggs et al. 1987 measured
 * smaller nasal/downward rotations and retraction
 * (https://iovs.arvojournals.org/article.aspx?articleid=2160135). The omitted
 * small motion is a stated limit, not evidence that the globe is immobile.
 *
 * Landmarks are read from the shaped rest, never from the neutral, so an
 * identity that moves a globe or the jaw pivot moves the joint with it. The
 * result is fresh; inputs are not mutated.
 *
 * @evidence contracts/common.md#principled-implementation The jaw rotates by opening.degrees * w about the condylar axis point (pivot landmark plus axis offset) and translates by the summed opening, protrusion and laterotrusion translations, each scaled by its weight; each eye rotates about its own centre by its gaze channels in list order and shifts by the summed translations. The combined sagittal translation is checked against the authored budget and a document past it is refused with the figures instead of clamped. Landmarks are read from the shaped rest, so an identity that moves the pivot moves the joint. Scaling one authored endpoint across the range is this rig's approximation, as the docs state.
 * @evidence contracts/common.md#clear-and-simple-design Weights to rigid motions, in one function with the budget check first.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamping: clamping one control to honour another would hide an edit of the document.
 * @evidence contracts/common.md#meaningful-documentation States the motions, the budget, the landmark source, and the limits of the linear endpoint path with the sources it does and does not follow.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres for pivots and translations, degrees for angles, unit quaternions for rotations.
 * @evidence contracts/anatomy.md#anatomical-source The function carries no measured value of its own: the endpoints (degrees, translations, axes, budget) are authored in the basis and applied linearly, so their kind is set by convention. It applies the qualitative findings of the cited sources that were read as abstracts: Lindauer, Sabol, Isaacson and Davidovitch 1995 (Am J Orthod Dentofacial Orthop; normal subjects, Dolphin digitizer) found translation and rotation of the condyle together at the start of opening and no centre of rotation at the condylar head; Jasz et al. 2024 (BDJ Open; 46 healthy volunteers, ultrasonic motion analyser) found translation present from the first millimetre with a regression slope of 0.3044 over the first 5 mm; Demer and Clark 2019 (Prog Brain Res; MRI of volunteers) found the eye rotating eccentrically about a varying point anterior to the globe centre; Doane 1980 (Am J Ophthalmol; high-speed cinematography), Takagi et al. 1992 (Doc Ophthalmol; search coil) and Riggs et al. 1987 (Invest Ophthalmol Vis Sci; visual persistence) found no large upward globe rotation in normal blinks, with transient nasalward and downward rotation of 1 to 2 degrees and under 1 mm of retraction in the last. It departs from all of them: one linear endpoint path replaces the individually varying instantaneous jaw centre and the varying eye rotation point, and blink globe motion is zero.
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
