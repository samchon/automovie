import type { IAutoMovieHumanLoftAperture } from "../../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftAperture } from "../../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanHeadEyeMargin } from "../AutoMovieHumanHeadEyeMargin";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/**
 * Attachment sites from the head lane's own profile and planned eye margins.
 * These replace the old radial head's observations without building another
 * skin. A published eye site does not establish that a lid or trim exists.
 *
 * @evidence contracts/common.md#principled-implementation Reads the generating median profile and each eye's own margin curve; no emitted geometry supplies an attachment.
 * @evidence contracts/common.md#clear-and-simple-design Owns attachment publication separately from the lane's tree and the skeleton's joint references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses one construction for both sides with their own inputs, without reference coordinates or a person branch.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes generating attachment sites from proof of realized anatomy and states calibration units.
 * @evidence contracts/performance.md#efficient-algorithms One bounded profile scan and two bounded degree-three margin scans replace observations on a second head assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work The lane's existing layout and eye records supply every reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned fixed-size sites survive the call; the sampled curve points are local.
 */
export namespace AutoMovieHumanHeadAnchors {
  /** Profile pitch in world mm, converted once per offset to calibration mm. */
  const PITCH: number = 0.25;

  /** Phases per complete planned margin, preserving its existing observation convention. */
  const PHASES: number = 720;

  /**
   * Publish the head's attachment sites in calibration millimetres.
   *
   * The glabella is the most anterior profile point over the eye line in
   * its 45 mm forehead window. Nasion is the same generating nasofrontal
   * landmark that owns n-sn, not the deepest nasofrontal point (sellion).
   * Ear roots are absent until the realized
   * ear module can publish their actual shared boundary.
   *
   * @evidence contracts/common.md#principled-implementation Reads the generating n that owns the public n-sn distance, and evaluates P and planned Fourier margins directly for the other observations. The forehead's finite pitch remains an observation limit; a profile minimum is not renamed nasion.
   * @evidence contracts/common.md#clear-and-simple-design Returns only sites later consumers actually read and omits unavailable ear roots.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reconstruct old head chains, project onto triangles, or disguise an absent lid as a realized opening.
   * @evidence contracts/common.md#meaningful-documentation Gives units, window definitions, sampling limits and the meaning of absent ear roots.
   * @evidence contracts/performance.md#efficient-algorithms Evaluates a fixed 51 mm window at 0.25 mm and two 720-phase order-three curves, independent of mesh density.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumes the lane's single layout and already placed globe records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Profile and margin samples are call-owned; the returned record contains five attachment sites.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, eyes: readonly IAutoMovieHumanBodyCalibration.IEye[]): IAutoMovieHumanBodyCalibration.IHeadLandmarks {
    if (!(plan.scale > 0) || !Number.isFinite(plan.scale) || !Number.isFinite(plan.eye))
      throw new Error("Head attachment observation needs a finite positive scale and finite eye height");
    if (!(plan.eye + PITCH * plan.scale > plan.eye))
      throw new Error("Head attachment profile has no representable sampling height above the eye");
    if (!plan.landmarks.nasion.every(Number.isFinite)) throw new Error("Head attachment nasion is not finite");
    const points: [number, number, number][] = [];
    // Iterate in world offsets: an extreme scale cannot make the loop's
    // increment disappear through floating-point rounding at a tall eye.
    for (let offset: number = -6; offset <= 45; offset += PITCH) {
      const y: number = plan.eye + offset * plan.scale;
      const x: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, y);
      if (!Number.isFinite(x) || !Number.isFinite(y))
        throw new Error(`Head attachment profile is not finite at eye offset ${offset} mm`);
      points.push([x, y, 0]);
    }
    // The fixed offset window includes the eye line, so the forehead
    // search is nonempty. Its sampling limitation is independent of n.
    const forehead: [number, number, number][] = points.filter((p: [number, number, number]): boolean => p[1] >= plan.eye);
    const glabella: [number, number, number] = forehead.reduce((a: [number, number, number], b: [number, number, number]): [number, number, number] => b[0] > a[0] ? b : a);
    const nasion: [number, number, number] = [plan.landmarks.nasion[0], plan.landmarks.nasion[1], 0];

    /** The lateral extreme of one side's planned margin, not an emitted lid vertex. */
    const exocanthion: (side: "left" | "right", sign: 1 | -1) => [number, number, number] = (side: "left" | "right", sign: 1 | -1): [number, number, number] => {
      const eye: IAutoMovieHumanBodyCalibration.IEye | undefined = eyes.find((item: IAutoMovieHumanBodyCalibration.IEye): boolean => item.side === side);
      if (eye === undefined) throw new Error(`Head attachment observation has no ${side} globe frame`);
      const margin: IAutoMovieHumanLoftAperture = AutoMovieHumanHeadEyeMargin.margin(plan, AutoMovieHumanHeadPrior.PRIOR.face, eye, plan[side], sign);
      let best: [number, number, number] = [0, 0, 0];
      for (let i: number = 0; i < PHASES; i++) {
        const p: number[] = AutoMovieHumanLoftAperture.evaluate(margin, (2 * Math.PI * i) / PHASES);
        if (Math.abs(p[2]!) > Math.abs(best[2])) best = [p[0]!, p[1]!, p[2]!];
      }
      return best;
    };
    return {
      vertex: [plan.centre, plan.vertex, 0],
      glabella,
      nasion,
      exocanthion: { left: exocanthion("left", 1), right: exocanthion("right", -1) },
    };
  }
}
