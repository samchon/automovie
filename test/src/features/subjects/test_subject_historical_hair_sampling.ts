import {
  type IAutoMovieHumanFaceGroom,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { sampleHistoricalHair } from "../../../scripts/face-review/sampleHistoricalHair";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Migration observations use the old renderer's metric centreline and preserve
 * their source, without making historical curves part of the new document.
 *
 * Scenarios:
 * 1. A straight 10 mm lock and a three-witness arch retain independent seats,
 *    widths and lengths; the arch's four Catmull-Rom intervals have a hand-derived
 *    length 4*hypot(5.625,4.375) mm, distinct from its control polygon's length.
 * 2. Empty populations yield no samples and output mutation leaves sources intact.
 * 3. A zero-length centreline with rotating width frames refuses as unfit data,
 *    even though its changing width axes form nondegenerate ribbon triangles.
 * 4. A representable extreme guide retains its metric length because the engine
 *    magnitude owner avoids intermediate square overflow.
 */
export const test_subject_historical_hair_sampling = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const model = createHumanFaceBasisBuilder(basis)(document);
  const groom: IAutoMovieHumanFaceGroom = {
    id: "observations",
    basis: basis.id,
    finish: basis.materials[0],
    profile: {
      segments: 4,
      widthScale: 2,
      tipWidth: 1,
      seed: 0,
      fibres: 1,
      coverage: 1,
    },
    cards: [
      {
        part: "first",
        triangle: 0,
        weights: [0.25, 0.25],
        guide: [
          [0, 0, 0],
          [0, 0, 0.01],
        ],
        across: [
          [0, 1, 0],
          [0, 1, 0],
        ],
        width: 0.002,
      },
      {
        part: "first",
        triangle: 0,
        weights: [0.1, 0.2],
        guide: [
          [0, 0, 0],
          [0.01, 0, 0.01],
          [0, 0, 0.02],
        ],
        across: [
          [0, 1, 0],
          [0, 1, 0],
          [0, 1, 0],
        ],
        width: 0.003,
      },
    ],
  };
  const before = JSON.stringify({ model, groom });
  const samples = sampleHistoricalHair({ model, groom });
  TestValidator.equals("two independent locks", samples.length, 2);
  TestValidator.predicate(
    "metric straight length",
    nclose(samples[0].length, 0.01, 1e-12),
  );
  TestValidator.predicate(
    "spline length from four known chords",
    nclose(samples[1].length, 4 * Math.hypot(0.005625, 0.004375), 1e-12),
  );
  TestValidator.predicate(
    "first seat",
    nclose(samples[0].points[0][0], 0.5, 1e-12) &&
      nclose(samples[0].points[0][1], 0.25, 1e-12),
  );
  TestValidator.predicate(
    "second seat",
    nclose(samples[1].points[0][0], 0.3, 1e-12) &&
      nclose(samples[1].points[0][1], 0.2, 1e-12),
  );
  TestValidator.predicate(
    "scaled metric widths",
    nclose(samples[0].width, 0.004) && nclose(samples[1].width, 0.006),
  );
  TestValidator.equals(
    "empty observations",
    sampleHistoricalHair({ model, groom: { ...groom, cards: [] } }),
    [],
  );
  samples[0].points[0][0] = 42;
  TestValidator.equals(
    "sources unchanged",
    JSON.stringify({ model, groom }),
    before,
  );
  TestValidator.predicate(
    "zero length is not a fit observation",
    throwsError(
      () =>
        sampleHistoricalHair({
          model,
          groom: {
            ...groom,
            cards: [
              {
                ...groom.cards[0],
                guide: [
                  [0, 0, 0.002],
                  [0, 0, 0.002],
                ],
                across: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        }),
      "positive measured length",
    ),
  );
  const extreme = sampleHistoricalHair({
    model,
    groom: {
      ...groom,
      cards: [
        {
          ...groom.cards[0],
          width: 1e-8,
          guide: [
            [0, 0, 0],
            [0, 0, 1e155],
          ],
          across: [
            [1, 0, 0],
            [1, 0, 0],
          ],
        },
      ],
    },
  });
  TestValidator.predicate(
    "representable extreme length",
    nclose(extreme[0].length / 1e155, 1, 1e-12),
  );
};
