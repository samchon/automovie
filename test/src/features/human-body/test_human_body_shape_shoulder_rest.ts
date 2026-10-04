import { resolveHumanBodyShapeShoulderRest, createHumanBodyBasisBuilder, resolveHumanBodyCouplings } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Shape-only rest is the common numerical reading used before a performance.
 * The source-rig directions do not claim clinical bone frames or capacity.
 *
 * Scenarios:
 * 1. A sparse elbow offset on each side and both weight signs reads independent
 *    atan2/acos angles while leaving the other arm at its 45 degree rest.
 * 2. The full builder accepts that rest, keeps omitted and explicit-rest arm
 *    transforms equivalent, and applies the independently calculated coupling.
 * 3. Unsupported, nonfinite and outside-domain weights retain their refusal,
 *    while exact domain endpoints and caller-owned inputs remain unchanged.
 */
export const test_human_body_shape_shoulder_rest = (): void => {
  for (const side of ["left", "right"] as const) {
    const { basis, document } = humanBodyShoulderFixture(true);
    const elbow = basis.landmarks.ids.indexOf(`${side}-elbow`);
    basis.channels.push({ id: "elbow", kind: "shape", group: "arms", mirror: null, minimum: -1, maximum: 1, positive: "lift", negative: "lower" });
    basis.landmarks.targets.lift = [elbow, 0, 0.1, 0.1];
    basis.landmarks.targets.lower = [elbow, 0, -0.1, -0.1];
    const evaluate = createHumanBodyBasisBuilder(basis);
    for (const weight of [-1, 0, 1]) {
      const shape = { elbow: weight };
      const before = structuredClone({ basis, shape });
      const rest = resolveHumanBodyShapeShoulderRest(basis, shape);
      const pose = rest.get(`${side}UpperArm`)!;
      const plane = Math.atan2(0.1 * weight, 0.2) * 180 / Math.PI;
      const elevation = Math.acos((0.2 - 0.1 * weight) / Math.hypot(0.2, 0.2 - 0.1 * weight, 0.1 * weight)) * 180 / Math.PI;
      TestValidator.predicate("independent shaped direction", nclose(pose.plane, plane, 1e-9) && nclose(pose.elevation, elevation, 1e-9) && pose.axialRotation === 0);
      TestValidator.predicate("opposite side retains rest", nclose(rest.get(`${side === "left" ? "right" : "left"}UpperArm`)!.elevation, 45, 1e-9));
      const expectedCoupling = Math.max(0, (elevation - 45) * 11 / 135);
      const contributions = resolveHumanBodyCouplings(basis, [], [], rest).contributions;
      TestValidator.predicate("independent coupling from shaped rest", nclose(contributions.find((one) => one.bone === `${side}Shoulder`)?.degrees ?? 0, expectedCoupling, 1e-9));
      const omitted = evaluate({ ...document, shape });
      const explicit = evaluate({ ...document, shape, shoulders: [...rest.values()] });
      const arm = (built: typeof omitted) => built.bones.find((one) => one.bone === `${side}UpperArm`)!.posed.rotation;
      TestValidator.predicate("explicit and omitted rest agree in builder", Object.keys(arm(omitted)).every((axis) => nclose(arm(omitted)[axis as "x" | "y" | "z" | "w"], arm(explicit)[axis as "x" | "y" | "z" | "w"], 1e-9)));
      TestValidator.equals("caller-owned basis and shape preserved", { basis, shape }, before);
    }
    for (const shape of [{ unknown: 1 }, { elbow: NaN }, { elbow: Infinity }, { elbow: 1.01 }, { elbow: -1.01 }] as Record<string, number>[])
      TestValidator.predicate("invalid shape refused", throwsError(() => resolveHumanBodyShapeShoulderRest(basis, shape), "Unsupported or out-of-domain body control"));
  }
};
