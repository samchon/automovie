import {
  type IAutoMovieHumanFaceBasis,
  assertHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { extendFaceEnvelope } from "../../../scripts/face-review/extendFaceEnvelope";
import { nclose, throwsError } from "../internal/predicates";

/** A selected triangle's height varies; a distant triangle stays outside its support. */
const input = (): Parameters<typeof extendFaceEnvelope>[0] => {
  const indices = [0, 1, 2, 3, 4, 5];
  const surface = {
    id: "skin",
    positions: [
      0, 0, 0,
      0.01, 0, 0,
      0, 0.01, 0,
      0.03, 0, 0,
      0.04, 0, 0,
      0.03, 0.01, 0,
    ],
    indices,
    targets: {
      positive: [2, 0, 0.01, 0],
      negative: [2, 0, -0.002, 0],
    },
    regions: [{ id: "skin/skin", material: "skin", indices, uvs: null }],
  };
  const basis: IAutoMovieHumanFaceBasis = {
    id: "envelope/1",
    channels: [{
      id: "height",
      kind: "shape",
      minimum: -1,
      maximum: 1,
      positive: "positive",
      negative: "negative",
    }],
    surfaces: [surface],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
  assertHumanFaceBasis(basis);
  return {
    basis,
    surface,
    channel: "height",
    measure: (positions) => positions[7] / 0.01,
    interval: [0.4, 3.1],
    guard: () => 0,
    step: 0.5,
    reach: 3,
  };
};

/**
 * Extend a linear height's control domain by its measured reach and geometric guard.
 * The positive height is 1+w and the negative height is 1-0.2w, independently of
 * the implementation. The upper interval 3.1 is reached at w=2.1; the lower 0.4
 * lies at w=3. Source positions and sparse rows must remain caller owned.
 *
 * Scenarios:
 * 1. Both directions extend and the interpolation/end record agrees with hand math.
 * 2. Empty rows or an unreadable measure do not extend; an already reached interval
 *    and the exact reach-one boundary retain the authored endpoints.
 * 3. A slowed or lost measure stops the positive side before its next half-step.
 * 4. Interpolated and terminal guarded faults back off by half-steps; geometric
 *    inversion uses the shared source-normal measure rather than a callback.
 * 5. Unknown, non-shape and one-sided channels refuse. A positive target cannot
 *    be null under the source contract, so no runtime-null branch is fabricated.
 */
export const test_subject_face_envelope_extension = (): void => {
  const direct = input();
  const before = JSON.stringify(direct.surface);
  const result = extendFaceEnvelope(direct);
  TestValidator.predicate(
    "linear interval",
    nclose(result.to[0], -3, 1e-12) && nclose(result.to[1], 2.1, 1e-12) &&
      nclose(result.reached[0], 0.4, 1e-12) && nclose(result.reached[1], 3.1, 1e-12),
  );
  TestValidator.predicate(
    "only the owned channel limits change",
    nclose(direct.basis.channels[0].minimum, -3, 1e-12) &&
      nclose(direct.basis.channels[0].maximum, 2.1, 1e-12),
  );
  TestValidator.equals("source surface remains unchanged", JSON.stringify(direct.surface), before);
  const noMotion = input();
  const other = structuredClone(noMotion.surface);
  other.id = "other";
  other.regions = other.regions.map((region) => ({
    ...region,
    id: "other/skin",
  }));
  noMotion.basis.surfaces.push(other);
  noMotion.surface.targets = {};
  assertHumanFaceBasis(noMotion.basis);
  TestValidator.equals("no rows", extendFaceEnvelope(noMotion).to, [-1, 1]);
  const lost = extendFaceEnvelope({ ...input(), measure: () => NaN });
  TestValidator.predicate("unreadable measurement", lost.reached.every(Number.isNaN));
  TestValidator.equals("unreadable domain", lost.to, [-1, 1]);
  TestValidator.equals("interval already covered", extendFaceEnvelope({ ...input(), interval: [0.9, 1.1] }).to, [-1, 1]);
  TestValidator.equals("reach boundary", extendFaceEnvelope({ ...input(), reach: 1 }).to, [-1, 1]);
  for (const failure of ["slow", "lost"] as const) {
    const state = input();
    const linear = state.measure;
    state.measure = (positions) => {
      const height = linear(positions);
      return height <= 2 ? height : failure === "slow" ? 2 + 0.1 * (height - 2) : NaN;
    };
    const measured = extendFaceEnvelope(state);
    TestValidator.predicate("changed measure ends the positive side", nclose(measured.to[1], 1, 1e-12));
  }
  const guarded = input();
  const linear = guarded.measure;
  guarded.guard = (positions) => linear(positions) > 2.2 ? 1 : 0;
  const backed = extendFaceEnvelope(guarded);
  TestValidator.predicate("interpolated fault backs off", nclose(backed.to[1], 1.1, 1e-12));
  TestValidator.equals("interpolated fault recorded", backed.faults[1], 1);
  const terminal = input();
  terminal.interval = [0.4, 20];
  terminal.guard = (positions) => positions[7] / 0.01 > 3.2 ? 1 : 0;
  TestValidator.predicate("terminal fault backs off", nclose(extendFaceEnvelope(terminal).to[1], 2, 1e-12));
  const short = input();
  short.interval = [0.4, 2.4];
  short.guard = (positions) => positions[7] / 0.01 > 2.2 ? 1 : 0;
  TestValidator.equals("back-off never narrows authored end", extendFaceEnvelope(short).to[1], 1);
  const turned = input();
  turned.surface.targets.positive = [2, 0, -0.006, 0];
  turned.surface.targets.negative = [2, 0, 0.002, 0];
  turned.interval = [-0.2, 3.1];
  TestValidator.predicate("orientation fault backs off", nclose(extendFaceEnvelope(turned).to[1], 1.5, 1e-12));
  for (const mode of ["unknown", "expression", "one-sided"] as const) {
    const state = input();
    if (mode === "unknown") state.channel = "missing";
    if (mode === "expression") state.basis.channels[0].kind = "expression";
    if (mode === "one-sided") state.basis.channels[0].negative = null;
    TestValidator.predicate("unsupported endpoint refuses", throwsError(() => extendFaceEnvelope(state), "two-sided shape"));
  }
  const positiveAcceptsNull: null extends IAutoMovieHumanFaceBasis["channels"][number]["positive"] ? true : false = false;
  TestValidator.equals("positive endpoint is type-enforced", positiveAcceptsNull, false);
};
