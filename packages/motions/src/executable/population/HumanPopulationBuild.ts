import {
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanSex,
  type IAutoMovieHumanBodyAnatomy,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

import { HumanPopulationAccess } from "./HumanPopulationAccess";
import { HumanPopulationAnchors } from "./HumanPopulationAnchors";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import { HumanPopulationEnds } from "./HumanPopulationEnds";
import { HumanPopulationSurvey } from "./HumanPopulationSurvey";
import { f1, m1 } from "./human-parameters/index";

type P = IAutoMovieHumanParameters;
type Sex = HumanPopulationSurvey.Sex;
type Variable = HumanPopulationSurvey.Variable;

/**
 * A population end as a full public input set, written from the end's surveyed
 * measures and never from a generated figure.
 */
export namespace HumanPopulationBuild {
  /**
   * An end's public inputs: body measures, head, hands and feet. Inputs the
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
    const anchor: (a: HumanPopulationAnchors.IAnchor) => number = (
      a: HumanPopulationAnchors.IAnchor,
    ): number => HumanPopulationAnchors.ratio(sex, a) * x[a.proxy];

    base.body.anatomy = {};
    body(base.body.anatomy, sex, x, anchor);
    head(base, sex, x, anchor);
    extremities(base, sex, x, anchor);

    return base;
  }

  /**
   * Write the body measures: the sex, the measured fields from their surveyed
   * measure, the rest from their anchors, and the fat percentage the end's
   * body mass index implies by Deurenberg et al.'s relation (1991: percent fat
   * = 1.2 BMI + 0.23 age - 10.8 male - 5.4) at ANSUR 1988's mean age of the sex.
   *
   * @param anatomy The record to write.
   * @param sex The surveyed sex.
   * @param x The end's surveyed measures.
   * @param anchor Value of an anchored course.
   */
  function body(
    anatomy: IAutoMovieHumanBodyAnatomy,
    sex: Sex,
    x: Record<Variable, number>,
    anchor: (a: HumanPopulationAnchors.IAnchor) => number,
  ): void {
    const k: 0 | 1 = sex === "female" ? 0 : 1;
    const bmi: number = x.mass / (x.stature / 1000) ** 2;

    anatomy.sex =
      sex === "female" ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male;
    anatomy.bodyFatPercentage =
      1.2 * bmi + 0.23 * AutoMovieHumanBodyAnatomy.MEAN_AGE[k] - 10.8 * k - 5.4;
    for (const [key, v] of HumanPopulationAnchors.DIRECT) anatomy[key] = x[v];
    for (const key of HumanPopulationAnchors.ANCHORED)
      anatomy[key] = anchor(HumanPopulationAnchors.ANCHORS[key]);
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
    const F: (typeof HumanPopulationSurvey.FACE)[Sex] =
      HumanPopulationSurvey.FACE[sex];
    const survey: HumanPopulationSurvey.ISurvey =
      HumanPopulationSurvey.SURVEY[sex];
    const widths: number =
      x.bizygomatic /
      survey.mean[HumanPopulationConditional.index("bizygomatic")]!;
    const heights: number =
      x.mentonSellion /
      survey.mean[HumanPopulationConditional.index("mentonSellion")]!;
    const h: P["head"] = base.head;
    const refs: P[] = HumanPopulationAccess.REFERENCES[sex];
    const mean: (f: (p: P) => number) => number = (
      f: (p: P) => number,
    ): number =>
      refs.reduce((s: number, p: P): number => s + f(p), 0) / refs.length;
    const fissure: number = F.fissureLength * widths;
    const opening: number = mean(
      (p: P): number =>
        p.head.face.eyePair.left.palpebralFissureHeight /
        p.head.face.eyePair.left.palpebralFissureLength,
    );

    h.length = x.headLength;
    h.cephalicIndex = (100 * x.headBreadth) / x.headLength;
    h.circumference = x.headCircumference;
    h.faceHeight = F.faceHeight * heights;
    h.height =
      h.faceHeight + anchor(HumanPopulationAnchors.ANCHORS.vertexToNasion);
    h.faceWidth = x.bizygomatic;
    h.mandibularWidth = F.mandibularWidth * widths;
    h.minimumFrontalWidth = F.minimumFrontalWidth * widths;
    h.mouthOpening = mean((p: P): number => p.head.mouthOpening);
    h.mandibularLaterotrusion = mean(
      (p: P): number => p.head.mandibularLaterotrusion,
    );
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
    const foot: HumanPopulationAccess.IFoot = {
      footLength: x.footLength,
      footBreadth: x.footBreadth,
      ankleHeight: x.malleolusHeight,
    };

    base.extremities = {
      hands: { left: { ...hand }, right: { ...hand } },
      feet: { left: { ...foot }, right: { ...foot } },
    };
  }
}
