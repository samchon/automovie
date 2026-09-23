import {
  type IAutoMovieHumanFaceContactSummary,
  createHumanFaceBasisBuilder,
  evaluateHumanFaceRest,
  humanFaceBasisWeights,
  measureHumanFaceAperture,
  resolveHumanFaceArticulation,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { articulatedPositions } from "../internal/humanFaceArticulationFixture";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Lip closure is scaled to the aperture it has to close.
 * Scenarios:
 * 1. Apertures read along the opening direction: 0.1 and 0.2 at rest, 1.45
 *    and 1.1 at full opening; the frame is the fixture's axes.
 * 2. Closure alone does nothing at a closed jaw (ratio 0); at full opening
 *    the ratio is 1 and the lower lip seam lands on the upper one.
 * 3. At half opening the ratio is the measured fraction (the 45 degree turn
 *    of the linear delta leaves a small residual gap); the observer receives every summary
 *    and null on a basis without contact.
 * 4. A reference opening that leaves the lips still refuses, and a mandibular
 *    axis along the frame's vertical has no opening frame.
 */
export const test_subject_human_contact_closure = (): void => {
  const { basis, document } = humanFaceContactFixture();
  const seen: (IAutoMovieHumanFaceContactSummary | null)[] = [];
  const build = createHumanFaceBasisBuilder(basis, {
    observe: (summary) => {
      seen.push(summary);
    },
  });
  const mouth = (expression: Record<string, number>) =>
    articulatedPositions(build({ ...document, expression }), "mouth/all");
  const contact = basis.contact!;
  const frameOf = (expression: Record<string, number>) => {
    const state = humanFaceBasisWeights(basis, { shape: {}, expression });
    const rest = evaluateHumanFaceRest(basis, state, new Set(["close"]));
    return measureHumanFaceAperture(
      basis,
      contact,
      evaluateHumanFaceRest(basis, { weights: new Map(), activations: [] }),
      evaluateHumanFaceRest(basis, {
        weights: new Map([["open", 1]]),
        activations: [],
      }),
      rest,
      resolveHumanFaceArticulation(
        basis.articulation!,
        state.weights,
        rest.landmarks,
      ).motions,
    );
  };
  const rest = frameOf({});
  TestValidator.predicate(
    "rest apertures and frame",
    nclose(rest.lips.gap, 0.1) &&
      nclose(rest.incisors.gap, 0.2) &&
      nclose(rest.up.y, 1) &&
      nclose(rest.forward.z, 1) &&
      nclose(rest.closureRatio, 0),
  );
  const open = frameOf({ open: 1 });
  TestValidator.predicate(
    "open apertures",
    nclose(open.lips.gap, 1.45) &&
      nclose(open.incisors.gap, 1.1) &&
      nclose(open.closureRatio, 1),
  );
  const untouched = mouth({ close: 1 });
  TestValidator.equals(
    "closure at a closed jaw moves nothing",
    untouched,
    mouth({}),
  );
  const sealed = mouth({ open: 1, close: 1 });
  TestValidator.predicate(
    "full opening with closure seals the seam",
    [0, 1, 2].every((axis) => nclose(sealed[9 + axis], sealed[axis])),
  );
  const half = frameOf({ open: 0.5 });
  TestValidator.predicate(
    "half opening ratio is the measured fraction",
    nclose(half.closureRatio, (half.lips.gap - 0.1) / 1.35) &&
      nclose(half.closureRatio, (1.45 * Math.SQRT1_2 - 0.05) / 1.35),
  );
  const halfSealed = mouth({ open: 0.5, close: 1 });
  const halfOpen = mouth({ open: 0.5 });
  const gap = (p: number[]): number => p[1] - p[10];
  TestValidator.predicate(
    "half opening closure closes most of the gap",
    Math.abs(gap(halfSealed)) < 0.2 * gap(halfOpen),
  );
  TestValidator.predicate(
    "observer saw every build",
    seen.length === 6 &&
      seen.every((summary) => summary !== null) &&
      nclose(seen[3]!.interlabialMetres, 0) &&
      nclose(seen[3]!.closureRatio, 1) &&
      seen[3]!.passage === null,
  );
  const plain: (IAutoMovieHumanFaceContactSummary | null)[] = [];
  createHumanFaceBasisBuilder(
    { ...basis, contact: undefined },
    { observe: (summary) => void plain.push(summary) },
  )(document);
  TestValidator.equals("no contact reports null", plain, [null, null]);
  const upright = structuredClone(basis);
  upright.articulation!.jaw.axis = [0, 1, 0];
  TestValidator.predicate(
    "a vertical mandibular axis has no opening frame",
    throwsError(
      () => createHumanFaceBasisBuilder(upright),
      "cannot be the vertical",
    ),
  );
  const sealedLips = structuredClone(basis);
  sealedLips.surfaces[1].attachments = [{ owner: "jaw", rows: [4, 1, 5, 1] }];
  TestValidator.predicate(
    "reference opening must part the lips",
    throwsError(
      () => createHumanFaceBasisBuilder(sealedLips),
      "must part the lips",
    ),
  );
};
