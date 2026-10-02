import {
  type IPortraitSkinColourRegion,
  createPortraitSkinColour,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Skin-site colours refuse malformed sites and values without clipping.
 *
 * Scenarios:
 * 1. Each unknown site, gain and strength has an adjacent admitted baseline;
 *    a repeated site refuses as a population.
 * 2. A host missing a site's landmark, with a nonfinite landmark or with no
 *    bizygomatic breadth refuses.
 */
export const test_subject_skin_colour_refusals = (): void => {
  const host = humanFaceFixture().basis.host;
  const region: IPortraitSkinColourRegion = {
    site: "chin",
    gain: [0.8, 0.6, 0.4],
    strength: 0.5,
  };
  const changes: Partial<IPortraitSkinColourRegion>[] = [
    { site: "vertex" as unknown as IPortraitSkinColourRegion["site"] },
    { site: "constructor" as unknown as IPortraitSkinColourRegion["site"] },
    { gain: [-Number.EPSILON, 0.6, 0.4] },
    { gain: [1 + Number.EPSILON, 0.6, 0.4] },
    { strength: -0.01 },
    { strength: 1.01 },
    { strength: NaN },
  ];
  for (const change of changes) {
    TestValidator.predicate(
      "invalid region refuses",
      throwsError(() =>
        createPortraitSkinColour(host, [{ ...region, ...change }]),
      ),
    );
    TestValidator.predicate(
      "adjacent baseline admitted",
      !throwsError(() => createPortraitSkinColour(host, [region])),
    );
  }
  TestValidator.predicate(
    "duplicate site",
    throwsError(
      () => createPortraitSkinColour(host, [region, region]),
      "unique",
    ),
  );
  TestValidator.predicate(
    "missing landmark",
    throwsError(
      () =>
        createPortraitSkinColour(
          { ...host, positions: host.positions.slice(0, 100) },
          [region],
        ),
      "finite reference landmark",
    ),
  );
  TestValidator.predicate(
    "nonfinite landmark",
    throwsError(
      () => {
        const positions = host.positions.map((point) => [...point]);
        positions[199] = [0, Number.NaN, 0];
        createPortraitSkinColour({ ...host, positions }, [region]);
      },
      "finite reference landmark",
    ),
  );
  TestValidator.predicate(
    "no bizygomatic breadth",
    throwsError(() => {
      const positions = host.positions.map((point) => [...point]);
      positions[454] = [...positions[234]];
      createPortraitSkinColour({ ...host, positions }, [region]);
    }, "bizygomatic breadth"),
  );
};
