import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type {
  IAutoMovieHumanFaceBasisArticulation as IAutoMovieHumanFaceBasisArticulationImported,
  IAutoMovieHumanFaceBasisEye as IAutoMovieHumanFaceBasisEyeImported,
} from "../../index";
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
 * @evidence contracts/common.md#principled-implementation Admitted expression weights scale authored jaw rotation/translation and ordered eye gaze quaternions around identity-shaped landmarks. Sagittal opening/protrusion translation is compared with the source budget plus the existing 1e-12 metre numerical slack; lateral shifts are separate. These endpoint paths approximate motion, not patient-specific trajectories.
 * @evidence contracts/common.md#clear-and-simple-design One resolver supplies motions and numeric joint summaries to both native pose and editor reporting; attachment blending and contact admission remain separate downstream owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source translation budget and eye gaze order are explicit supported behavior. No clamping edits controls, blink globe motion remains omitted, and admission premises for landmarks/axes/finite weights do not establish clinical anatomy or all-mixture safety.
 * @evidence contracts/common.md#meaningful-documentation Prose gives degrees/metres, pivot-plus-axisOffset, shaped joint centres, ordered gaze, authored translation budget and the limits of fitted endpoint/blink motion.
 * @evidence contracts/performance.md#efficient-algorithms Work follows G registered gaze entries plus fixed jaw controls, O(G); quaternion/vector construction is fixed-size per active entry and sparse weights use map lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work The same resolver serves geometry and summaries; joint motions are computed once per supplied weight/landmark state, with no cache that could survive changed identity centres.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh motion maps and eye summaries scale with registered eyes; all intermediate vectors/quaternions are local and no input mutation or external resource occurs.
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
  const weight: (channel: string) => number = (channel: string): number =>
    weights.get(channel) ?? 0;
  const { jaw }: IAutoMovieHumanFaceBasisArticulationImported = articulation;
  const opening: number = weight(jaw.opening.channel);
  const protrusion: number = weight(jaw.protrusion.channel);
  const sagittal: IAutoMovieVector3 = Vector3.add(
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
  const translation: IAutoMovieVector3 = Vector3.add(
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
  const degrees: number = jaw.opening.degrees * opening;
  const pivot: IAutoMovieVector3 = Vector3.add(
    landmarks[jaw.pivot],
    Vector3.create(...jaw.axisOffset),
  );
  const motions: Map<string, IAutoMovieHumanFaceRigidMotion> = new Map<
    string,
    IAutoMovieHumanFaceRigidMotion
  >();
  motions.set("jaw", {
    rotation: Quaternion.fromAxisAngle(Vector3.create(...jaw.axis), degrees),
    pivot,
    translation,
  });
  const eyes: {
    id: string;
    rotation: IAutoMovieQuaternion;
    center: IAutoMovieVector3;
    translation: IAutoMovieVector3;
  }[] = articulation.eyes.map(
    (
      eye: IAutoMovieHumanFaceBasisEyeImported,
    ): {
      id: string;
      rotation: IAutoMovieQuaternion;
      center: IAutoMovieVector3;
      translation: IAutoMovieVector3;
    } => {
      let rotation: IAutoMovieQuaternion = Quaternion.identity();
      let shift: IAutoMovieVector3 = Vector3.create();
      for (const gaze of eye.gaze) {
        const w: number = weight(gaze.channel);
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
      const center: IAutoMovieVector3 = landmarks[eye.center];
      motions.set(eye.id, { rotation, pivot: center, translation: shift });
      return { id: eye.id, rotation, center, translation: shift };
    },
  );
  return { motions, jaw: { degrees, translation, pivot }, eyes };
}
