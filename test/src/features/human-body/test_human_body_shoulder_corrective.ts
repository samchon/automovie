import {
  createHumanBodyBasisBuilder,
  humanBodyBasisWeights,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose, throwsError } from "../internal/predicates";

/** TT elevation and SO(3) pose kernels drive shoulder tissue without pole ambiguity. */
export const test_human_body_shoulder_corrective = (): void => {
  const { basis, document } = humanBodyShoulderFixture(true);
  basis.correctives ??= [];
  basis.correctives.push(
    {
      id: "elevation",
      inputs: [
        {
          bone: "leftUpperArm",
          axis: "elevation",
          side: "positive",
          onset: 15,
          full: 45,
        },
      ],
      weight: 1,
      target: "elevation",
    },
    {
      id: "forward",
      inputs: [
        {
          shoulder: "leftUpperArm",
          orientation: { plane: 90, elevation: 90, axialRotation: 0 },
          innerDegrees: 0,
          outerDegrees: 60,
        },
      ],
      weight: 1,
      target: "forward",
    },
    {
      id: "rightForward",
      inputs: [
        {
          shoulder: "rightUpperArm",
          orientation: { plane: 90, elevation: 90, axialRotation: 0 },
          innerDegrees: 0,
          outerDegrees: 60,
        },
      ],
      weight: 1,
      target: "rightForward",
    },
    {
      id: "pole",
      inputs: [
        {
          shoulder: "leftUpperArm",
          orientation: { plane: 0, elevation: 180, axialRotation: 30 },
          innerDegrees: 0,
          outerDegrees: 60,
        },
      ],
      weight: 1,
      target: "pole",
    },
    {
      id: "girdle",
      inputs: [
        {
          bone: "leftShoulder",
          axis: "abduction",
          side: "positive",
          onset: 0,
          full: 11,
        },
      ],
      weight: 1,
      target: "girdle",
    },
  );
  for (const name of [
    "elevation",
    "forward",
    "rightForward",
    "pole",
    "girdle",
  ]) {
    basis.surfaces[0].targets[name] = [0, 0, 0, 0.01];
  }
  const build = createHumanBodyBasisBuilder(basis);
  const activated = (
    bone: "leftUpperArm" | "rightUpperArm",
    plane: number,
    elevation: number,
    axialRotation = 0,
  ) => {
    const state = {
      ...document,
      shoulders: [{ bone, plane, elevation, axialRotation }],
    };
    build(state);
    return new Map(
      humanBodyBasisWeights(basis, state).activations.map((one) => [
        one.target,
        one.activation,
      ]),
    );
  };
  const rest = humanBodyBasisWeights(basis, document);
  TestValidator.predicate(
    "A-pose leaves shoulder and coupled girdle ramps off",
    rest.activations.every((one) => nclose(one.activation, 0)),
  );
  TestValidator.predicate(
    "halfway TT elevation activates independently",
    nclose(activated("leftUpperArm", 90, 75).get("elevation")!, 0.5),
  );
  TestValidator.predicate(
    "total 180 elevation drives both humerus and declared girdle",
    nclose(activated("leftUpperArm", 90, 180).get("elevation")!, 1) &&
      nclose(activated("leftUpperArm", 90, 180).get("girdle")!, 1),
  );
  TestValidator.predicate(
    "forward pose kernel distinguishes frontal T and axial rotation",
    nclose(activated("leftUpperArm", 90, 90).get("forward")!, 1) &&
      nclose(activated("leftUpperArm", 0, 90).get("forward")!, 0) &&
      nclose(activated("leftUpperArm", 90, 90, 30).get("forward")!, 0.5),
  );
  TestValidator.predicate(
    "mirrored forward pose activates equally",
    nclose(
      activated("leftUpperArm", 90, 90).get("forward")!,
      activated("rightUpperArm", 90, 90).get("rightForward")!,
    ),
  );
  TestValidator.predicate(
    "pole equivalent triples have identical activation",
    nclose(activated("leftUpperArm", 0, 180, 30).get("pole")!, 1) &&
      nclose(activated("leftUpperArm", 45, 180, -60).get("pole")!, 1) &&
      nclose(activated("leftUpperArm", 90, 180, 30).get("pole")!, 0),
  );
  const stale = structuredClone(basis);
  stale.correctives![0].inputs = [
    {
      bone: "leftUpperArm",
      axis: "flexion",
      side: "positive",
      onset: 0,
      full: 45,
    },
  ];
  TestValidator.predicate(
    "stale fixed-axis shoulder corrective refuses rather than reinterprets",
    throwsError(() => createHumanBodyBasisBuilder(stale), "joint driver"),
  );
};
