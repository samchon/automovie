import { createHumanBodyBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { throwsError } from "../internal/predicates";

/** A basis cannot present old Euler metadata as a TT shoulder contract. */
export const test_human_body_shoulder_admission = (): void => {
  const fixture = humanBodyShoulderFixture(true);
  TestValidator.predicate(
    "measured bilateral TT contract admits",
    !throwsError(() => createHumanBodyBasisBuilder(fixture.basis)),
  );
  const changed = (mutate: (basis: typeof fixture.basis) => void): boolean => {
    const basis = structuredClone(fixture.basis);
    mutate(basis);
    return throwsError(() => createHumanBodyBasisBuilder(basis));
  };
  const left = (basis: typeof fixture.basis) =>
    basis.joints.find((joint) => joint.bone === "leftUpperArm")!;
  const invalid: [string, (basis: typeof fixture.basis) => void][] = [
    [
      "old shoulder missing TT marker",
      (basis) => {
        delete left(basis).shoulder;
      },
    ],
    [
      "rest plane disagrees with landmarks",
      (basis) => {
        left(basis).shoulder!.neutral.plane += 0.1;
      },
    ],
    [
      "rest elevation disagrees with landmarks",
      (basis) => {
        left(basis).shoulder!.neutral.elevation += 0.1;
      },
    ],
    [
      "rest axial zero is not measured",
      (basis) => {
        left(basis).shoulder!.neutral.axialRotation = 1;
      },
    ],
    [
      "obsolete flexion remains mobile",
      (basis) => {
        left(basis).constraint!.flexion = { min: 0, max: 180 };
      },
    ],
    [
      "obsolete abduction sign remains",
      (basis) => {
        left(basis).signs.abduction = 1;
      },
    ],
    [
      "elevation cannot start above hanging",
      (basis) => {
        left(basis).shoulder!.range.elevation.min = 1;
      },
    ],
    [
      "elevation cannot pass overhead",
      (basis) => {
        left(basis).shoulder!.range.elevation.max = 181;
      },
    ],
    [
      "axial range must include zero",
      (basis) => {
        left(basis).shoulder!.range.axialRotation.min = 1;
      },
    ],
    [
      "joint sinus needs three knots",
      (basis) => {
        left(basis).shoulder!.range.envelope.splice(2);
      },
    ],
    [
      "joint sinus planes must increase",
      (basis) => {
        left(basis).shoulder!.range.envelope[1][0] = -180;
      },
    ],
    [
      "joint sinus planes must be canonical",
      (basis) => {
        left(basis).shoulder!.range.envelope.at(-1)![0] = 180;
      },
    ],
    [
      "joint sinus plane below the period",
      (basis) => {
        left(basis).shoulder!.range.envelope[0][0] = -181;
      },
    ],
    [
      "joint sinus plane must be finite",
      (basis) => {
        left(basis).shoulder!.range.envelope[0][0] = Number.NaN;
      },
    ],
    [
      "joint sinus maximum must be finite",
      (basis) => {
        left(basis).shoulder!.range.envelope[0][1] = Number.NaN;
      },
    ],
    [
      "joint sinus maximum must be positive",
      (basis) => {
        left(basis).shoulder!.range.envelope[0][1] = 0;
      },
    ],
    [
      "joint sinus maximum inside total elevation",
      (basis) => {
        left(basis).shoulder!.range.envelope[3][1] = 181;
      },
    ],
    [
      "joint sinus must hold the measured rest",
      (basis) => {
        left(basis).shoulder!.range.envelope[3][1] = 44;
        left(basis).shoulder!.range.envelope[4][1] = 44;
        left(basis).shoulder!.range.envelope[2][1] = 44;
      },
    ],
    [
      "thorax must own upper arm",
      (basis) => {
        left(basis).parent = "spine";
      },
    ],
    [
      "other joint cannot declare TT shoulder",
      (basis) => {
        basis.joints[1].shoulder = structuredClone(left(basis).shoulder);
      },
    ],
    [
      "coupling cannot start below TT A-pose",
      (basis) => {
        basis.couplings![0].curve[0][0] = 41;
      },
    ],
  ];
  for (const [title, mutate] of invalid)
    TestValidator.predicate(title, changed(mutate));
  const kernel = humanBodyShoulderFixture();
  kernel.basis.correctives ??= [];
  kernel.basis.correctives.push({
    id: "poseSpace",
    inputs: [
      {
        shoulder: "leftUpperArm",
        orientation: { plane: 90, elevation: 90, axialRotation: 0 },
        innerDegrees: 0,
        outerDegrees: 60,
      },
    ],
    weight: 1,
    target: "poseSpace",
  });
  kernel.basis.surfaces[0].targets.poseSpace = [0, 0, 0, 0.01];
  TestValidator.predicate(
    "nested pose-space radii admit and leave rest inactive",
    !throwsError(() => createHumanBodyBasisBuilder(kernel.basis)),
  );
  const badKernel = (
    mutate: (
      input: Extract<
        NonNullable<typeof kernel.basis.correctives>[number]["inputs"][number],
        { shoulder: string }
      >,
    ) => void,
  ): boolean => {
    const basis = structuredClone(kernel.basis);
    const input = basis.correctives!.at(-1)!.inputs[0];
    if (!("shoulder" in input)) throw new Error("Expected a shoulder kernel.");
    mutate(input);
    return throwsError(() => createHumanBodyBasisBuilder(basis));
  };
  for (const [title, mutate] of [
    [
      "kernel outer radius must be positive",
      (k) => {
        k.outerDegrees = 0;
      },
    ],
    [
      "kernel inner radius cannot be negative",
      (k) => {
        k.innerDegrees = -1;
      },
    ],
    [
      "kernel inner must be below outer",
      (k) => {
        k.innerDegrees = 60;
      },
    ],
    [
      "kernel radius cannot exceed SO(3) half-turn",
      (k) => {
        k.outerDegrees = 181;
      },
    ],
    [
      "kernel must be off at rest",
      (k) => {
        k.outerDegrees = 180;
      },
    ],
    [
      "kernel plane must be canonical",
      (k) => {
        k.orientation.plane = 180;
      },
    ],
    [
      "kernel centre elevation must be clinical",
      (k) => {
        k.orientation.elevation = 181;
      },
    ],
    [
      "kernel centre axial must be clinical",
      (k) => {
        k.orientation.axialRotation = 91;
      },
    ],
    [
      "kernel centre must lie in the joint sinus",
      (k) => {
        k.orientation = { plane: -90, elevation: 90, axialRotation: 0 };
      },
    ],
    [
      "kernel centre must be finite",
      (k) => {
        k.orientation.plane = Number.NaN;
      },
    ],
  ] as [string, Parameters<typeof badKernel>[0]][])
    TestValidator.predicate(title, badKernel(mutate));
  const duplicate = structuredClone(kernel.basis);
  duplicate.correctives!.at(-1)!.inputs.push({
    shoulder: "leftUpperArm",
    orientation: { plane: 135, elevation: 180, axialRotation: -90 },
    innerDegrees: 0,
    outerDegrees: 60,
  });
  duplicate.correctives!.at(-1)!.inputs[0] = {
    shoulder: "leftUpperArm",
    orientation: { plane: 90, elevation: 180, axialRotation: 0 },
    innerDegrees: 0,
    outerDegrees: 60,
  };
  TestValidator.predicate(
    "physically equivalent pole centres cannot multiply the same corrective",
    throwsError(
      () => createHumanBodyBasisBuilder(duplicate),
      "equivalent shoulder orientation kernels",
    ),
  );
};
