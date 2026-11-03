import type { IAutoMovieHumanBodyControls } from "../../../../packages/human/src/structures/body/IAutoMovieHumanBodyControls";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { f1, m1 } from "../../../../packages/playground/src/human-parameters/index";
import { HumanPopulationAccess } from "./HumanPopulationAccess";
import { HumanPopulationAnchors } from "./HumanPopulationAnchors";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import { HumanPopulationEnds } from "./HumanPopulationEnds";
import { HumanPopulationSurvey } from "./HumanPopulationSurvey";

type P = IAutoMovieHumanParameters;
type Sex = HumanPopulationSurvey.Sex;
type Variable = HumanPopulationSurvey.Variable;

/**
 * A population end as a full public input set, written from the end's surveyed
 * measures and never from a generated figure.
 */
export namespace HumanPopulationBuild {
  /**
   * An end's public inputs: body controls, head, hands and feet. Inputs the
   * survey does not measure keep the sex's first reference person's value
   * (appearance, pose) or are anchored to a surveyed carrier.
   *
   * @param end The end.
   * @returns The end's inputs.
   */
  export function params(end: HumanPopulationEnds.IEnd): P {
    const sex: Sex = end.sex;
    const x: Record<Variable, number> = HumanPopulationEnds.measures(end);
    const base: P = structuredClone(sex === "female" ? f1 : m1);
    const anchor: (a: HumanPopulationAnchors.IAnchor) => number = (a: HumanPopulationAnchors.IAnchor): number => HumanPopulationAnchors.ratio(sex, a) * x[a.proxy];

    body(base.body.controls, sex, x, anchor);
    head(base, sex, x, anchor);
    extremities(base, sex, x, anchor);

    return base;
  }

  /**
   * Write the body controls: the shape coordinates from the end's body-mass
   * index and muscle, the measured controls from their surveyed measure and the
   * rest from their anchors.
   *
   * @param controls The controls to write.
   * @param sex The surveyed sex.
   * @param x The end's surveyed measures.
   * @param anchor Value of an anchored course.
   */
  function body(
    controls: IAutoMovieHumanBodyControls,
    sex: Sex,
    x: Record<Variable, number>,
    anchor: (a: HumanPopulationAnchors.IAnchor) => number,
  ): void {
    const z: number = HumanPopulationSurvey.Z;
    const [meanBmi, sdBmi]: readonly [number, number] = HumanPopulationSurvey.BMI[sex];
    const bmi: number = x.mass / (x.stature / 1000) ** 2;
    const muscle: HumanPopulationConditional.IMoments = HumanPopulationConditional.moments(
      sex,
      new Map([
        [HumanPopulationConditional.index("stature"), x.stature],
        [HumanPopulationConditional.index("mass"), x.mass],
      ]),
      HumanPopulationConditional.index("bicepsFlexed"),
    );
    const clamp: (v: number) => number = (v: number): number => Math.max(-1, Math.min(1, v));

    controls.fat.value = clamp((bmi - meanBmi) / sdBmi / z);
    controls.masculineFeminine.value = sex === "female" ? 1 : -1;
    controls.muscularity.value = clamp((x.bicepsFlexed - muscle.mean) / muscle.sd / z);
    for (const [key, v] of HumanPopulationAnchors.DIRECT) controls[key].value = x[v];
    for (const key of HumanPopulationAnchors.ANCHORED) controls[key].value = anchor(HumanPopulationAnchors.ANCHORS[key]);
  }

  /**
   * Write the head and face: the survey's head and ear measures, and the face's
   * FaceBase means scaled with the survey's face breadth (widths) or face
   * height (heights and the nasal protrusion).
   *
   * @param base The person to write.
   * @param sex The surveyed sex.
   * @param x The end's surveyed measures.
   * @param anchor Value of an anchored course.
   */
  function head(
    base: P,
    sex: Sex,
    x: Record<Variable, number>,
    anchor: (a: HumanPopulationAnchors.IAnchor) => number,
  ): void {
    const F: (typeof HumanPopulationSurvey.FACE)[Sex] = HumanPopulationSurvey.FACE[sex];
    const survey: HumanPopulationSurvey.ISurvey = HumanPopulationSurvey.SURVEY[sex];
    const widths: number = x.bizygomatic / survey.mean[HumanPopulationConditional.index("bizygomatic")]!;
    const heights: number = x.mentonSellion / survey.mean[HumanPopulationConditional.index("mentonSellion")]!;
    const h: P["head"] = base.head;
    const refs: P[] = HumanPopulationAccess.REFERENCES[sex];
    const mean: (f: (p: P) => number) => number = (f: (p: P) => number): number => refs.reduce((s: number, p: P): number => s + f(p), 0) / refs.length;
    const fissure: number = F.fissureLength * widths;
    const opening: number = mean((p: P): number => p.head.face.eyePair.left.palpebralFissureHeight / p.head.face.eyePair.left.palpebralFissureLength);

    h.length = x.headLength;
    h.cephalicIndex = (100 * x.headBreadth) / x.headLength;
    h.circumference = x.headCircumference;
    h.faceHeight = F.faceHeight * heights;
    h.height = h.faceHeight + anchor(HumanPopulationAnchors.ANCHORS.vertexToNasion);
    h.faceWidth = x.bizygomatic;
    h.mandibularWidth = F.mandibularWidth * widths;
    h.minimumFrontalWidth = F.minimumFrontalWidth * widths;
    h.mouthOpening = mean((p: P): number => p.head.mouthOpening);
    h.mandibularLaterotrusion = mean((p: P): number => p.head.mandibularLaterotrusion);
    for (const eye of [h.face.eyePair.left, h.face.eyePair.right]) {
      eye.palpebralFissureLength = fissure;
      eye.palpebralFissureHeight = fissure * opening;
    }
    h.face.intercanthalWidth = F.intercanthalWidth * widths;
    h.face.nose.width = F.noseWidth * widths;
    h.face.nose.height = F.noseHeight * heights;
    h.face.nose.protrusion = F.noseProtrusion * heights;
    h.face.mouth.width = F.mouthWidth * widths;
    h.face.mouth.upperVermilionHeight = F.upperVermilion * heights;
    h.face.mouth.lowerVermilionHeight = F.lowerVermilion * heights;
    for (const ear of [h.earPair.left, h.earPair.right]) {
      ear.length = x.earLength;
      ear.breadth = anchor(HumanPopulationAnchors.ANCHORS.earBreadth);
      ear.protrusion = x.earProtrusion;
    }
  }

  /**
   * Write both hands and both feet, which share their sex's surveyed values.
   *
   * @param base The person to write.
   * @param sex The surveyed sex.
   * @param x The end's surveyed measures.
   * @param anchor Value of an anchored course.
   */
  function extremities(
    base: P,
    sex: Sex,
    x: Record<Variable, number>,
    anchor: (a: HumanPopulationAnchors.IAnchor) => number,
  ): void {
    const hand: HumanPopulationAccess.IHand = {
      handLength: x.handLength,
      palmLength: x.handLength * HumanPopulationSurvey.PALM[sex],
      handBreadth: x.handBreadth,
      thumbLength: anchor(HumanPopulationAnchors.ANCHORS.thumbLength),
    };
    const foot: HumanPopulationAccess.IFoot = { footLength: x.footLength, footBreadth: x.footBreadth, ankleHeight: x.malleolusHeight };

    base.extremities = { hands: { left: { ...hand }, right: { ...hand } }, feet: { left: { ...foot }, right: { ...foot } } };
  }
}
