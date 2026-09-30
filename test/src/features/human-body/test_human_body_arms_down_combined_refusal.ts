import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  createHumanBodyBasisBuilder,
  segmentHumanBodyModel,
  solveHumanBodyArmsDown,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { throwsError } from "../internal/predicates";

/**
 * Two independently clear arm goals can make a new cross-arm collision when
 * worn together; the preset must refuse the combined body.
 *
 * Scenarios:
 * 1. Each 0.3 m arm is 0.04 m wide at its shoulder and widens medially at
 *    its far end. Their rest goals at 45° point apart. Either arm alone at
 *    0° stays away from the other at rest, but both at 0° overlap about X=0.
 * 2. Both independent first-safe goals are 0°, and the final pair is refused
 *    because its built skin adds a crossing absent at the rest pair.
 */
export const test_human_body_arms_down_combined_refusal = (): void => {
  const { basis, document } = humanBodyShoulderFixture();
  const atLandmark = (name: string, values: number[]): void => {
    const at = basis.landmarks.ids.indexOf(name) * 3;
    basis.landmarks.positions.splice(at, 3, ...values);
  };
  const angle = Math.PI / 4;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    atLandmark(`${side}-shoulder`, [sign * 0.25, 3, 0]);
    atLandmark(`${side}-elbow`, [
      sign * (0.25 + 0.3 * Math.sin(angle)),
      3 - 0.3 * Math.cos(angle),
      0,
    ]);
    atLandmark(`${side}-wrist`, [
      sign * (0.25 + 0.6 * Math.sin(angle)),
      3 - 0.6 * Math.cos(angle),
      0,
    ]);
  }
  const faces = [
    [0, 2, 3, 1],
    [4, 5, 7, 6],
    [0, 1, 5, 4],
    [2, 6, 7, 3],
    [0, 4, 6, 2],
    [1, 3, 7, 5],
  ];
  const indices = faces.flatMap(([a, b, c, d]) => [a, b, c, a, c, d]);
  const source = basis.surfaces[0];
  basis.surfaces = (["left", "right"] as const).map((side) => {
    const sign = side === "left" ? 1 : -1;
    const positions: number[] = [];
    for (const z of [-0.02, 0.02])
      for (const y of [-0.3, 0])
        for (const x of y === 0
          ? [-0.02, 0.02]
          : side === "left"
            ? [-0.28, 0.02]
            : [-0.02, 0.28])
          positions.push(
            sign * 0.25 + x * Math.cos(angle) - sign * y * Math.sin(angle),
            3 + sign * x * Math.sin(angle) + y * Math.cos(angle),
            z,
          );
    return {
      ...source,
      id: `${side}-tapered-arm`,
      positions,
      indices,
      targets: structuredClone(source.targets),
      regions: [
        { id: `${side}-arm/skin`, material: "skin", indices, uvs: null },
      ],
      skin: {
        joints: [`${side}UpperArm` as const],
        boneIndices: Array.from({ length: 32 }, () => 0),
        weights: Array.from({ length: 8 }, () => [1, 0, 0, 0]).flat(),
      },
    };
  });
  const build = createHumanBodyBasisBuilder(basis);
  const crosses = (left: number, right: number): boolean => {
    const built = build({
      ...document,
      shoulders: [
        { bone: "leftUpperArm", plane: 0, elevation: left, axialRotation: 0 },
        { bone: "rightUpperArm", plane: 0, elevation: right, axialRotation: 0 },
      ],
    });
    return (
      measureAutoMovieModelCrossings(segmentHumanBodyModel(basis, built).model)
        .length > 0
    );
  };
  TestValidator.equals(
    "separate arm goals are clear but their combination crosses",
    [crosses(45, 45), crosses(0, 45), crosses(45, 0), crosses(0, 0)],
    [false, false, false, true],
  );
  TestValidator.predicate(
    "combined first-safe goals refuse new cross-arm contact",
    throwsError(
      () => solveHumanBodyArmsDown(basis, build, document),
      "cannot combine",
    ),
  );
};
