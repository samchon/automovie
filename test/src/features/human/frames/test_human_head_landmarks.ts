import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewParallelAxis,
} from "@automovie/engine";
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
 * nasal cutter reads its own side of the actual nasal source.
 *
 * Scenarios:
 *
 * 1. Canthus-to-canthus chords and pupil-aligned openings retain the two distinct
 *    eye dimensions, with the supplied distance between nasal canthi.
 * 2. The generated nose and lip landmarks retain their five Euclidean chords. The
 *    lateral guides on the native nose span the supplied alare distance.
 * 3. The original nose owns both apertures. Each lining attaches on its named
 *    side. The selected result requests no raw loft.
 *
 * The facial measurement definitions follow Weinberg et al., 3D Facial Norms,
 * and the fissure endpoints follow Shin et al.,
 * doi:10.1371/journal.pone.0316714.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads one production head lane's selected original study curves, landmarks and native-contact records. It measures their Cartesian endpoints and verifies the reported source identities.
 * @evidence contracts/development/testing.md#independent-expectations The supplied chords and separations set the expected Euclidean distances in the original's declared calibration units. The measured alare chord reads the actual lateral conic guides and the two nostril contacts lie on their named sides.
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
  const inletAxes: (readonly number[])[] = [];
  const nose: IAutoMovieViewPart | undefined = originals.sources.get("nose");
  const alare: IAutoMovieViewPart.IKnot | undefined =
    nose?.side.positive.knots.find((knot) => knot.site === "nose.alare");
  const nasalSource =
    nose === undefined ? null : AutoMovieLoftViewSource.create(nose)?.source;
  if (
    nose === undefined ||
    alare === undefined ||
    nasalSource === null ||
    nasalSource === undefined
  )
    failures.push("the original has no lateral alare section");
  else {
    const values = AutoMovieLoftViewRead.values(nasalSource, alare.station);
    if (typeof values === "string" || values.touch === undefined)
      failures.push("the alare section has no original conic supports");
    else {
      const section = AutoMovieLoftSectionNative.phase(values);
      const left = section(Math.atan2(values.extents[1]!, values.touch[1]!)).p;
      const right = section(
        Math.atan2(-values.extents[3]!, values.touch[3]!),
      ).p;
      near("alare", gap(left, right), face.nose.width);
    }
  }
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
    if (inlet !== undefined) {
      const { along, extents } = inlet.definition;
      inletAxes.push(along);
      near(
        `${side} aperture length`,
        extents[0] + extents[2],
        (12.5 * face.nose.width) / 34.35,
      );
      near(
        `${side} aperture width`,
        extents[1] + extents[3],
        (8.6 * face.nose.width) / 34.35,
      );
    }
    if (
      nose === undefined ||
      inlet?.error !== null ||
      inlet.parentSource !== nose ||
      inlet.attachment?.part !== nose ||
      inlet.attachment.parameter === null ||
      !(inlet.attachment.point[2] * (side === "left" ? 1 : -1) > 0) ||
      cutter?.join !== "diff" ||
      cutter.port === undefined ||
      cutter.port.loop.shape?.length !== cutter.port.rails.length ||
      cutter.material !== nose
    )
      failures.push(
        `${side} nostril does not cut its side of the original nose`,
      );
  }

  if (nasalCanthi.length === 2)
    near(
      "nasal canthi",
      gap(nasalCanthi[0]!, nasalCanthi[1]!),
      face.intercanthalWidth,
    );
  if (inletAxes.length === 2) {
    const left = inletAxes[0]!;
    const right = inletAxes[1]!;
    const dot: number = left.reduce((value, x, k) => value + x * right[k]!, 0);
    if (!nclose(dot, Math.cos((78.09 * Math.PI) / 180), 16 * Number.EPSILON))
      failures.push("the original aperture axes lose their interaxial angle");
  }

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
  const expectedSources: string[] = [
    "head.mass",
    "nose",
    "nose.nostril.left",
    "nose.nostril.right",
  ];
  if (
    originals.sources.size !== expectedSources.length ||
    !expectedSources.every((name) => originals.sources.has(name)) ||
    originals.studies.length !== 2
  )
    failures.push("the selected read changed its published source scope");
  if (
    originals.closureAttempt.state !== "unrequested" ||
    originals.sources.get("head.mass") !== head.source.tapeInvariant.part
  )
    failures.push(
      "selected original reads requested the upper tape or changed the lower host",
    );
  const lipOriginal = head.originals(["lip.upper"]);
  const raw: IAutoMovieHumanHeadComposer.IRaw = lipOriginal.prepareRaw([
    "lip.upper",
    "lip.upper",
  ]);
  const upperRaw = raw.lofts.get("lip.upper");
  if (
    raw.lofts.size !== 1 ||
    upperRaw === undefined ||
    upperRaw.chain === null ||
    raw.diagnostics.length !== upperRaw.diagnostics.length
  )
    failures.push("the selected raw scope changed its lip loft or diagnostics");

  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}
