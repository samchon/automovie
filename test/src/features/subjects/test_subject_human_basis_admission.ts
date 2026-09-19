import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * One malformed correspondence never reaches a partially admitted facial basis.
 *
 * Scenarios:
 * 1. Every identity, channel envelope and sparse-row boundary has a negative twin.
 * 2. Region omissions, duplication, reversal, UV mismatch and absent material refuse.
 * 3. A neutral-only basis and tiny finite endpoint remain valid adjacent cases.
 */
export const test_subject_human_basis_admission = (): void => {
  const patches: ((basis: IAutoMovieHumanFaceBasis) => void)[] = [
    (b) => {
      // Exact admission: a field the schema does not declare is refused rather
      // than carried along, which is what the removed version discriminator
      // used to demonstrate.
      (b as unknown as Record<string, unknown>).unknown = "field";
    },
    (b) => {
      b.id = " ";
    },
    (b) => {
      b.channels.push({ ...b.channels[0] });
    },
    (b) => {
      b.surfaces[1].id = b.surfaces[0].id;
    },
    (b) => {
      b.materials[1].id = b.materials[0].id;
    },
    (b) => {
      b.surfaces[1].regions[0].id = b.surfaces[0].regions[0].id;
    },
    (b) => {
      b.channels[0].minimum = NaN;
    },
    (b) => {
      b.channels[0].maximum = Infinity;
    },
    (b) => {
      b.channels[0].minimum = 0.1;
    },
    (b) => {
      b.channels[0].maximum = 0;
    },
    (b) => {
      b.channels[0].positive = " ";
    },
    (b) => {
      b.channels[0].negative = null;
    },
    (b) => {
      b.channels[0].negative = "";
    },
    (b) => {
      b.channels[1].negative = "narrow";
    },
    (b) => {
      b.surfaces = [];
    },
    (b) => {
      b.surfaces[0].indices[1] = 0;
    },
    (b) => {
      b.surfaces[0].positions[0] = Infinity;
    },
    (b) => {
      b.surfaces[0].targets.unknown = [0, 1, 0, 0];
    },
    (b) => {
      b.surfaces[0].targets.wide = [];
    },
    (b) => {
      b.surfaces[0].targets.wide = [0, 1, 0];
    },
    (b) => {
      b.surfaces[0].targets.wide[1] = Infinity;
    },
    (b) => {
      b.surfaces[0].targets.wide[0] = 0.5;
    },
    (b) => {
      b.surfaces[0].targets.wide[0] = -1;
    },
    (b) => {
      b.surfaces[0].targets.wide[4] = 1;
    },
    (b) => {
      b.surfaces[0].targets.wide[4] = 4;
    },
    (b) => {
      b.surfaces[0].targets.wide = [0, 0, 0, 0];
    },
    (b) => {
      b.surfaces[0].regions[0].material = "missing";
    },
    (b) => {
      b.surfaces[0].regions[0].indices = [];
    },
    (b) => {
      b.surfaces[0].regions[0].indices.pop();
    },
    (b) => {
      b.surfaces[0].regions[0].uvs!.pop();
    },
    (b) => {
      b.surfaces[0].regions[0].uvs![0] = NaN;
    },
    (b) => {
      b.surfaces[0].regions[1].indices = [0, 1, 2];
    },
    (b) => {
      b.surfaces[0].regions[1].indices = [0, 3, 2];
    },
    (b) => {
      b.surfaces[0].regions.pop();
    },
    (b) => {
      delete b.surfaces[0].targets.narrow;
    },
    (b) => {
      b.surfaces[0].positions = [];
    },
    (b) => {
      b.surfaces[0].positions.pop();
    },
    (b) => {
      b.surfaces[0].indices = [];
    },
    (b) => {
      b.surfaces[0].indices.pop();
    },
    (b) => {
      b.surfaces[0].indices[0] = 0.5;
    },
    (b) => {
      b.surfaces[0].indices[0] = -1;
    },
    (b) => {
      b.surfaces[0].indices[0] = 4;
    },
  ];
  for (const [index, patch] of patches.entries()) {
    const { basis } = humanFaceBasisFixture();
    patch(basis);
    TestValidator.predicate(
      "basis refusal " + index,
      throwsError(() => createHumanFaceBasisBuilder(basis)),
    );
  }
  const neutral = humanFaceBasisFixture();
  neutral.basis.channels = [];
  for (const surface of neutral.basis.surfaces) surface.targets = {};
  TestValidator.equals(
    "neutral-only prior",
    createHumanFaceBasisBuilder(neutral.basis)(neutral.document).parts.length,
    3,
  );
  const tiny = humanFaceBasisFixture();
  tiny.basis.surfaces[0].targets.wide = [0, 1e-12, 0, 0];
  TestValidator.equals(
    "finite nonzero sparse endpoint",
    createHumanFaceBasisBuilder(tiny.basis)(tiny.document).parts.length,
    3,
  );
};
