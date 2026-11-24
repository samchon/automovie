import { AutoMovieViewParallelAxis } from "@automovie/engine";
import { AutoMovieHumanBodyLaw } from "@automovie/human";
import type {
  IAutoMovieConstructionParallelAxis,
  IAutoMovieHumanEye,
  IAutoMovieHumanHeadComposer,
  IAutoMovieHumanHeadDome,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieHumanHeadLandmarks,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanParameters,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Original facial sources preserve the made input's spatial measures and each
 * nasal cutter reads its own side's actual alar source.
 *
 * Scenarios:
 *
 * 1. Canthus-to-canthus chords and pupil-aligned openings retain the two distinct
 *    eye dimensions, with the supplied distance between nasal canthi.
 * 2. The generated nose and lip landmarks retain their five Euclidean chords. The
 *    alar poles on the original parts span the supplied alare distance.
 * 3. The two nostril cutters are differences whose material contact belongs to
 *    their own original alae. The selected result requests no raw loft.
 *
 * The facial measurement definitions follow Weinberg et al., 3D Facial Norms,
 * and the fissure endpoints follow Shin et al.,
 * doi:10.1371/journal.pone.0316714.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads one production head lane's selected original study curves, landmarks and native-contact records. It measures their Cartesian endpoints and verifies the reported source identities.
 * @evidence contracts/development/testing.md#independent-expectations The supplied chords and separations set the expected Euclidean distances in the original's declared calibration units. The two nostril operations belong to their respective alar materials by the anatomical side.
 * @evidence contracts/development/testing.md#distinguishing-cases Different left and right lengths and heights detect a copied eye. Both nasal sides, upper and lower unequal lip chords, and the retained original parent identity detect accidental sharing or source substitution.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU scenario on explicitly selected original curves. It requests no whole skin, raw loft, upper head tape or reference asset.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies measurements, original-source scope, units and anatomical ownership.
 */
export function test_human_head_landmarks(): void {
  const parameters: IAutoMovieHumanParameters = {
    body: {
      anatomy: {
        sex: "male",
        stature: 1756.2,
        neckBaseCircumference: 408.4,
        neckCircumference: 397.6,
        cervicaleHeight: 1517.3,
        suprasternaleHeight: 1438.6,
      },
    },
    head: {
      length: 199.5,
      cephalicIndex: (100 * 154.3) / 199.5,
      circumference: 574.4,
      height: 229.5,
      faceHeight: 127.2,
      faceWidth: 137.6,
      mandibularWidth: 104.5,
      minimumFrontalWidth: 111.4,
      mouthOpening: 55.3,
      mandibularLaterotrusion: 10.4,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 28.8, palpebralFissureHeight: 8 },
          right: { palpebralFissureLength: 30, palpebralFissureHeight: 9 },
        },
        intercanthalWidth: 32.7,
        nose: { width: 36.1, height: 56.6, protrusion: 21 },
        mouth: {
          width: 50.9,
          upperVermilionHeight: 7.5,
          lowerVermilionHeight: 8.7,
        },
      },
      earPair: {
        left: { length: 66.8, breadth: 28.9, protrusion: 19.5 },
        right: { length: 67.1, breadth: 29.2, protrusion: 19.5 },
      },
    },
  };
  const head: IAutoMovieHumanHeadLane.IPrepared =
    AutoMovieHumanBodyLaw.prepareSources(parameters).headSource();
  const originals: IAutoMovieHumanHeadComposer.IDefinition = head.originals([
    "fissure.left",
    "fissure.right",
    "nose",
    "nose.ala.left",
    "nose.ala.right",
    "nose.nostril.left",
    "nose.nostril.right",
  ]);
  const plan: IAutoMovieHumanHeadLayout = originals.base.tapeInvariant.plan;
  const face: IAutoMovieHumanParameters["head"]["face"] = parameters.head.face;
  const failures: string[] = [];

  /** Read the Cartesian chord between corresponding original sites. */
  const gap = (a: readonly number[], b: readonly number[]): number =>
    Math.hypot(...a.map((x: number, axis: number): number => x - b[axis]!));

  /** Report a distance outside float round-off in calibration millimetres. */
  const near = (name: string, observed: number, world: number): void => {
    const expected: number = world * plan.scale;
    if (!nclose(observed, expected, 128 * Number.EPSILON * plan.vertex))
      failures.push(`${name}: ${observed} mm, expected ${expected} mm`);
  };

  const nasalCanthi: (readonly number[])[] = [];
  const alarPoles: (readonly number[])[] = [];
  for (const side of ["left", "right"] as const) {
    const fissure: IAutoMovieViewPart | undefined = originals.studies.find(
      (part: IAutoMovieViewPart): boolean => part.name === `fissure.${side}`,
    );
    const chart: IAutoMovieConstructionParallelAxis | null =
      fissure === undefined
        ? null
        : AutoMovieViewParallelAxis.source(fissure.axis);
    if (fissure === undefined || chart === null)
      failures.push(`${side} fissure has no original parallel chart`);
    else {
      // Use the chart's own endpoints. A world-mm endpoint can differ by an
      // ulp after metre serialization, which the angle map reads as an interior point.
      const bottom: number = chart.origin.z.knots[0]!.station * 1000;
      const top: number = chart.origin.z.knots.at(-1)!.station * 1000;
      const span: number = top - bottom;
      if (
        !nclose(bottom, fissure.stations[0]!, Number.EPSILON * span) ||
        !nclose(top, fissure.stations.at(-1)!, Number.EPSILON * span)
      )
        failures.push(
          `${side} fissure stations leave their original chart ends`,
        );
      const temporal: readonly number[] = fissure.axis.at(bottom).origin;
      const nasal: readonly number[] = fissure.axis.at(top).origin;
      const [upper, lower] = [
        fissure.front.positive,
        fissure.front.negative,
      ].map(
        (
          outline: IAutoMovieViewPart.IOutline,
        ): IAutoMovieViewPart.IKnot | undefined =>
          outline.knots.find(
            ({ site }: IAutoMovieViewPart.IKnot): boolean =>
              site === `fissure.${side}.pupil`,
          ),
      );
      const eye: IAutoMovieHumanEye = face.eyePair[side];
      nasalCanthi.push(nasal);
      near(
        `${side} fissure chord`,
        gap(temporal, nasal),
        eye.palpebralFissureLength,
      );
      near(
        `${side} pupil opening`,
        (upper?.value ?? NaN) - (lower?.value ?? NaN),
        eye.palpebralFissureHeight,
      );
      if (!(temporal[1]! > nasal[1]!))
        failures.push(
          `${side} lateral canthus does not rise from the nasal canthus`,
        );
    }

    const ala: IAutoMovieViewPart | undefined = originals.sources.get(
      `nose.ala.${side}`,
    );
    const inlet: IAutoMovieHumanHeadDome.IAttempt | undefined =
      originals.attachments.find(
        ({ name }: IAutoMovieHumanHeadDome.IAttempt): boolean =>
          name === `nose.nostril.${side}`,
      );
    const cutter: IAutoMovieHumanHeadFeatures.IFeature | undefined =
      originals.parts.find(
        ({ part }: IAutoMovieHumanHeadFeatures.IFeature): boolean =>
          part.name === `nose.nostril.${side}`,
      );
    if (ala === undefined) failures.push(`${side} ala is absent`);
    else alarPoles.push(ala.axis.at(ala.stations.at(-1)!).origin);
    if (
      ala === undefined ||
      inlet?.error !== null ||
      inlet.parentSource !== ala ||
      inlet.attachment?.part !== ala ||
      inlet.attachment.parameter === null ||
      cutter?.join !== "diff" ||
      cutter.material !== ala
    )
      failures.push(`${side} nostril does not cut its actual alar original`);
  }

  if (nasalCanthi.length === 2)
    near(
      "nasal canthi",
      gap(nasalCanthi[0]!, nasalCanthi[1]!),
      face.intercanthalWidth,
    );
  if (alarPoles.length === 2)
    near("alar poles", gap(alarPoles[0]!, alarPoles[1]!), face.nose.width);

  const sites: IAutoMovieHumanHeadLandmarks = plan.landmarks;
  near(
    "face height",
    gap(sites.nasion, sites.gnathion),
    parameters.head.faceHeight,
  );
  near("nose height", gap(sites.nasion, sites.subnasale), face.nose.height);
  near(
    "nose protrusion",
    gap(sites.subnasale, sites.pronasale),
    face.nose.protrusion,
  );
  near(
    "upper vermilion chord",
    gap(sites.stomion, sites.labraleSuperius),
    face.mouth.upperVermilionHeight,
  );
  near(
    "lower vermilion chord",
    gap(sites.stomion, sites.labraleInferius),
    face.mouth.lowerVermilionHeight,
  );
  if (originals.sources.size !== 6 || originals.studies.length !== 2)
    failures.push("the selected read changed its published source scope");
  if (originals.lofts.size !== 0 || originals.base.calibrated)
    failures.push(
      "selected original reads triggered a raw loft or upper tape solve",
    );

  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}
