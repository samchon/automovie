import {
  type IPortraitEyebrowFlowProfile,
  parseHumanFaceDocument,
  replaceHumanFaceRegion,
  resolveHumanFaceDocument,
  serializeHumanFaceDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Eyebrow flow witnesses belong to the source eye; the numerical density seed
 * can still be edited independently on each side.
 *
 * Scenarios:
 * 1. Source longitudinal flow witnesses and an edited density seed survive
 *    the public document round trip; a nonnumeric seed refuses admission.
 * 2. Left scalar replacement retains source flow and an unrelated trait;
 *    a new two-witness array refuses. Clearing restores inheritance.
 * 3. Missing a required upper-root direction refuses at JSON admission.
 */
export const test_subject_human_brow_flow_document = (): void => {
  const source = humanFaceFixture();
  source.controls = { noseWidth: 0.1 };
  const flow: IPortraitEyebrowFlowProfile = {
    sections: [0, 0.5, 1].map((at) => ({
      at,
      lower: { tip: 0.8 - at * 0.4, outwardBend: at * 4 },
      upper: { tip: 0.7 - at * 0.4, outwardBend: at * 3 },
    })),
  };
  source.basis.recipe.eye.browProfile = {
    ...source.basis.recipe.eye.browProfile!,
    flow: structuredClone(flow),
  };
  const common = replaceHumanFaceRegion({
    document: source,
    basisId: source.basis.id,
    region: "eye",
    value: { browProfile: { densitySeed: 0 } },
  });
  const loaded = parseHumanFaceDocument(serializeHumanFaceDocument(common));
  TestValidator.equals(
    "flow round trip",
    resolveHumanFaceDocument(loaded).recipe.eye.browProfile!.flow,
    flow,
  );
  const left = { sections: [flow.sections[0], flow.sections[2]] };
  TestValidator.equals(
    "density seed round trip",
    resolveHumanFaceDocument(loaded).recipe.eye.browProfile!.densitySeed,
    0,
  );
  const paired = replaceHumanFaceRegion({
    document: loaded,
    basisId: source.basis.id,
    region: "eye",
    side: "left",
    value: { browProfile: { densitySeed: 7 } },
  });
  TestValidator.predicate(
    "left free flow refuses",
    throwsError(
      () =>
        replaceHumanFaceRegion({
          document: loaded,
          basisId: source.basis.id,
          region: "eye",
          side: "left",
          value: { browProfile: { flow: left } } as never,
        }),
      "source geometry array",
    ),
  );
  const resolved = resolveHumanFaceDocument(paired);
  TestValidator.equals(
    "independent left density seed",
    resolved.left.eye.browProfile!.densitySeed,
    7,
  );
  TestValidator.equals(
    "right density seed inherits",
    resolved.right.eye.browProfile!.densitySeed,
    0,
  );
  TestValidator.equals(
    "left keeps source flow",
    resolved.left.eye.browProfile!.flow,
    flow,
  );
  TestValidator.equals(
    "right untouched",
    resolved.right.eye.browProfile!.flow,
    flow,
  );
  TestValidator.equals(
    "unrelated trait retained",
    paired.controls,
    source.controls,
  );
  TestValidator.equals("caller unchanged", source.detail, undefined);
  const cleared = replaceHumanFaceRegion({
    document: paired,
    basisId: source.basis.id,
    region: "eye",
    side: "left",
    value: undefined,
  });
  TestValidator.equals(
    "clear inherits common",
    resolveHumanFaceDocument(cleared).left.eye.browProfile!.flow,
    flow,
  );
  const malformed = JSON.parse(serializeHumanFaceDocument(common));
  delete malformed.basis.recipe.eye.browProfile.flow.sections[0].upper;
  TestValidator.predicate(
    "incomplete flow rejected",
    throwsError(() => parseHumanFaceDocument(JSON.stringify(malformed))),
  );
  const invalidSeed = JSON.parse(serializeHumanFaceDocument(common));
  invalidSeed.detail.eye.browProfile.densitySeed = "0";
  TestValidator.predicate(
    "nonnumeric saved density seed refuses",
    throwsError(() => parseHumanFaceDocument(JSON.stringify(invalidSeed))),
  );
};
