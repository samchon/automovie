import {
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyFrame,
  AutoMovieHumanFootBones,
  AutoMovieHumanFootConstruction,
  AutoMovieHumanLegBones,
  AutoMovieHumanLegSources,
} from "@automovie/human";
import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodyFrame,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanFootConstruction,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanLegBones,
  IAutoMovieHumanLegSources,
  IAutoMovieHumanParameters,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import PEOPLE from "../../internal/MOTION_HUMAN_PEOPLE.json";
import { nclose } from "../../internal/nclose";

/**
 * Public lower-limb measures read through one independent side's originals.
 *
 * 1. The leg tape puts equal reaches at four sides of the calf's circle, whose
 *    diameter times pi is the supplied circumference.
 * 2. The foot's medial metatarsal is at the supplied ball distance and the fifth
 *    head is behind it. All five distinct toes advance from their roots and the
 *    longest tip reaches the supplied foot length.
 * 3. The standalone exported foot builder publishes the two hosts and ten toe
 *    chains from the same independent nominal rules.
 * 4. At 1700 mm stature the shared frame's posterior neck skin lies 42 mm behind
 *    the ankles and the neutral pelvic datum lies 62 mm ahead. The calibration
 *    scale applies equally to both offsets.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the regional production factories and reads their site law, foot datum and toe apex controls.
 * @evidence contracts/development/testing.md#independent-expectations The circumference is pi times the diameter. The first MTP is the public heel-to-ball site. The Maestro cascade puts the fifth head farther back. Heel-to-longest-toe distance defines the supplied foot length. Hasegawa's ankle-relative C7 bone and hip coordinates are 30 and 62 mm. The 72 mm posterior transfer gives the nominal skin position.
 * @evidence contracts/development/testing.md#distinguishing-cases Separate calf and metatarsal tapes, five ordered toes, a requested foot support and the measured length.
 * @evidence contracts/development/testing.md#execution-ownership Uses one regional leg and foot source from a public ANSUR survey fixture and made foot dimensions. Reads no person mesh or render.
 * @evidence contracts/development/common.md#meaningful-documentation Names the tape, source geometry and independent physical checks.
 */
export function test_human_independent_lower_limb(): void {
  const parameters: IAutoMovieHumanParameters = PEOPLE["m-average"]
    .params as IAutoMovieHumanParameters;
  const measures: IAutoMovieHumanBodyMeasures =
    AutoMovieHumanBodyAnatomy.resolve(parameters);
  const dimensions: IAutoMovieHumanFootFrame.IDimensions = {
    length: 270,
    breadth: 103,
    ankle: 70,
  };
  const feet: IAutoMovieHumanFootConstruction.IInputs = {
    left: dimensions,
    right: dimensions,
    fat: 0,
    muscularity: 0,
    scale: 1,
  };
  const bones: IAutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({
    stature: measures.stature,
    scale: 1,
    ankleHeight: dimensions.ankle,
    medial: 1.125,
    hipForward: 0,
    ankleForward: 0,
  });
  const source: IAutoMovieHumanLegSources.IOutput =
    AutoMovieHumanLegSources.create({
      side: "left",
      rest: {
        ...bones,
        shift: [0, bones.ankle[2]],
        foot: AutoMovieHumanFootBones.of(dimensions, 1).bones,
      },
      feet,
      measures,
      scale: 1,
      crotch: measures.glutealFurrowHeight + 10,
      diagnostics: [],
    });
  const calf = source.law("calf");
  const [front, lateral, back, medial] = calf.edges;
  TestValidator.predicate(
    "a centred calf section reads its tape",
    nclose(front, lateral) &&
      nclose(front, -back) &&
      nclose(lateral, -medial) &&
      nclose(Math.PI * (front - back), measures.calfCircumference),
  );

  const foot = source.foot();
  const span: readonly number[] = foot.metatarsal!.span;
  const tips: number[] = source
    .toes()
    .map(({ toe }): number =>
      toe.apex.reduce(
        (sum: number, coordinate: number, i: number): number =>
          sum + (coordinate - foot.heel[i]!) * foot.along[i]!,
        0,
      ),
    );
  TestValidator.predicate(
    "the Brannock site and five toe reaches are independently supported",
    span[0]! < span[1]! &&
      nclose(span[1]!, measures.ballOfFootLength) &&
      tips.length === 5 &&
      tips.every(
        (tip: number, index: number): boolean =>
          tip > span[0]! && (index === 0 || tip < tips[index - 1]!),
      ) &&
      nclose(Math.max(...tips), dimensions.length),
  );

  const standalone: IAutoMovieHumanBodyCalibration =
    AutoMovieHumanFootConstruction.add(
      {
        stature: measures.stature,
        chains: [],
        events: [],
        poles: [],
        apertures: [],
        eyes: [],
        diagnostics: [],
      },
      feet,
    );
  TestValidator.predicate(
    "both standalone foot paths publish their host and five toe chains",
    standalone.chains.length === 12 &&
      standalone.chains.every((chain): boolean => chain.layers.length > 1),
  );

  const nominal: IAutoMovieHumanBodyMeasures = { ...measures, stature: 1700 };
  const frame: IAutoMovieHumanBodyFrame.IOutput =
    AutoMovieHumanBodyFrame.create(nominal, 1);
  const scaled: IAutoMovieHumanBodyFrame.IOutput =
    AutoMovieHumanBodyFrame.create(nominal, 2);
  TestValidator.predicate(
    "the ankle-relative skin datums use the world position and calibration scale",
    nclose(frame.cervicale, -42) &&
      nclose(frame.perineum, 62) &&
      nclose(scaled.cervicale, -84) &&
      nclose(scaled.perineum, 124),
  );
}
