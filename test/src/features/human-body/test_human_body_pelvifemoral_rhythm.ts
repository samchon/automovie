import { Quaternion } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  humanBodyBasisWeights,
  resolveHumanBodyCouplings,
  resolveHumanBodyPelvifemoralRhythm,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * A declared pelvifemoral rhythm turns the pelvis with a lifted thigh while
 * the trunk, the other thigh and the hip centres stay where the document put
 * them.
 *
 * The fixture (`humanBodyPelvisFixture`) has its hip centres at
 * (+-0.1, -0.2, 0), axis-aligned rest frames and the curve
 * `[[0, 0], [100, 20]]` into the lumbar joint `spine`. A posterior tilt `T`
 * turns the pelvis by `-T` degrees about +X through the hip centres, so the
 * pelvis joint at the origin, 0.2 m above that axis, lands at
 * `(0, -0.2 + 0.2 cos T, -0.2 sin T)`.
 *
 * Scenarios:
 * 1. Left flexion 50: `T = 10`; the rhythm lists hips -10, spine +10 and both
 *    legs -10 under the rhythm's id, and the coupled pose the correctives
 *    read keeps the document's 50.
 * 2. The build: the pelvis joint moves to the hand-derived point and turns
 *    by -10 about +X; both hip centres, the spine and the right thigh keep
 *    their rest transforms; the left thigh points at (0, -cos 50, sin 50).
 * 3. Shared tilt: left 50 with right 100 gives `T = 20` (the larger), right
 *    150 past the last knot would hold 20 but is refused by the leg's range.
 * 4. No tilt at or below the first knot: flexion -20 and the empty document
 *    list nothing and pose exactly as the same basis without a rhythm.
 * 5. Refusals under both readings, never clamped: left 125 passes and 126
 *    refuses (trunk-relative range); with left 100 (`T = 20`) right -10
 *    passes (pelvic-relative -30) and right -11 refuses; spine 70 passes
 *    (lumbar 90) and 71 refuses.
 * 6. A corrective ramp on left flexion (onset 30, full 60) reads the
 *    document's trunk-relative 45 as one half, not the pelvic-relative 36.
 */
export const test_human_body_pelvifemoral_rhythm = (): void => {
  const { basis, document } = humanBodyPelvisFixture();
  const leg = (
    bone: "leftUpperLeg" | "rightUpperLeg" | "spine",
    flexion: number,
  ): IAutoMovieJointPose => ({
    bone,
    flexion,
    abduction: null,
    twist: null,
  });
  const lifted = resolveHumanBodyPelvifemoralRhythm(basis, [
    leg("leftUpperLeg", 50),
  ]);
  TestValidator.equals(
    "a 50 degree lift tilts by one fifth into root, lumbar and both hips",
    lifted.contributions.map((one) => [one.coupling, one.bone, one.degrees]),
    [
      ["pelvifemoral", "hips", -10],
      ["pelvifemoral", "spine", 10],
      ["pelvifemoral", "leftUpperLeg", -10],
      ["pelvifemoral", "rightUpperLeg", -10],
    ],
  );
  TestValidator.equals(
    "the validated pose holds the pelvic-relative angles",
    lifted.joints.map((one) => [one.bone, one.flexion]),
    [
      ["leftUpperLeg", 40],
      ["hips", -10],
      ["spine", 10],
      ["rightUpperLeg", -10],
    ],
  );
  TestValidator.equals(
    "the coupled pose keeps the document's trunk-relative angle",
    resolveHumanBodyCouplings(basis, [leg("leftUpperLeg", 50)]).joints,
    [leg("leftUpperLeg", 50)],
  );
  TestValidator.equals(
    "the editor's contribution list carries the rhythm",
    resolveHumanBodyCouplings(basis, [
      leg("leftUpperLeg", 50),
    ]).contributions.map((one) => one.degrees),
    [-10, 10, -10, -10],
  );

  const build = createHumanBodyBasisBuilder(basis);
  const pose = (joints: IAutoMovieJointPose[]) =>
    build({ ...document, pose: joints });
  const posed = pose([leg("leftUpperLeg", 50)]);
  const bone = (name: string) =>
    posed.bones.find((one) => one.bone === name)!.posed;
  const rad = (10 * Math.PI) / 180;
  TestValidator.predicate(
    "the pelvis joint turns about the hip centres",
    vclose(
      bone("hips").position,
      { x: 0, y: -0.2 + 0.2 * Math.cos(rad), z: -0.2 * Math.sin(rad) },
      1e-9,
    ),
  );
  const pelvisUp = Quaternion.rotateVector(bone("hips").rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  TestValidator.predicate(
    "the pelvis leans back by the tilt",
    vclose(pelvisUp, { x: 0, y: Math.cos(rad), z: -Math.sin(rad) }, 1e-9),
  );
  for (const [name, at] of [
    ["leftUpperLeg", { x: 0.1, y: -0.2, z: 0 }],
    ["rightUpperLeg", { x: -0.1, y: -0.2, z: 0 }],
    ["spine", { x: 0, y: 1, z: 0 }],
  ] as const)
    TestValidator.predicate(
      `${name} keeps its joint centre`,
      vclose(bone(name).position, at, 1e-9),
    );
  const down = (name: string) =>
    Quaternion.rotateVector(bone(name).rotation, { x: 0, y: 1, z: 0 });
  const f = (50 * Math.PI) / 180;
  TestValidator.predicate(
    "the lifted thigh reaches its trunk-relative direction",
    vclose(
      down("leftUpperLeg"),
      { x: 0, y: -Math.cos(f), z: Math.sin(f) },
      1e-9,
    ),
  );
  TestValidator.predicate(
    "the other thigh and the trunk keep their directions",
    vclose(down("rightUpperLeg"), { x: 0, y: -1, z: 0 }, 1e-9) &&
      vclose(down("spine"), { x: 0, y: 1, z: 0 }, 1e-9),
  );

  TestValidator.equals(
    "the bilateral lift shares the larger side's tilt",
    resolveHumanBodyPelvifemoralRhythm(basis, [
      leg("leftUpperLeg", 50),
      leg("rightUpperLeg", 100),
    ]).contributions[0].degrees,
    -20,
  );
  TestValidator.predicate(
    "past the last knot is still judged by the leg's range",
    throwsError(() => pose([leg("rightUpperLeg", 150)]), "clinical ranges"),
  );

  const plain = createHumanBodyBasisBuilder({
    ...basis,
    id: "analytic-pelvis/plain",
    pelvifemoral: undefined,
  });
  for (const joints of [[leg("leftUpperLeg", -20)], []]) {
    TestValidator.equals(
      `no tilt for ${JSON.stringify(joints)}`,
      resolveHumanBodyPelvifemoralRhythm(basis, joints).contributions.length,
      0,
    );
    const a = pose(joints).bones;
    const b = plain({
      ...document,
      basis: "analytic-pelvis/plain",
      pose: joints,
    }).bones;
    TestValidator.equals(`poses as without a rhythm`, a, b);
  }

  const refuses = (joints: IAutoMovieJointPose[]): boolean =>
    throwsError(() => pose(joints), "clinical ranges");
  TestValidator.predicate(
    "trunk-relative range end passes",
    !refuses([leg("leftUpperLeg", 125)]),
  );
  TestValidator.predicate(
    "trunk-relative range end refuses one past",
    refuses([leg("leftUpperLeg", 126)]),
  );
  TestValidator.predicate(
    "the other hip's pelvic-relative extension end passes",
    !refuses([leg("leftUpperLeg", 100), leg("rightUpperLeg", -10)]),
  );
  TestValidator.predicate(
    "the other hip's pelvic-relative extension refuses one past",
    refuses([leg("leftUpperLeg", 100), leg("rightUpperLeg", -11)]),
  );
  TestValidator.predicate(
    "the lumbar joint's end with the tilt passes",
    !refuses([leg("leftUpperLeg", 100), leg("spine", 70)]),
  );
  TestValidator.predicate(
    "the lumbar joint refuses one past with the tilt",
    refuses([leg("leftUpperLeg", 100), leg("spine", 71)]),
  );

  const ramped = structuredClone(basis);
  ramped.correctives = [
    {
      id: "fold",
      inputs: [
        {
          bone: "leftUpperLeg",
          axis: "flexion",
          side: "positive",
          onset: 30,
          full: 60,
        },
      ],
      weight: 1,
      target: "fold",
    },
  ];
  ramped.surfaces[0].targets.fold = [0, 0, 0, 0.02];
  const request: Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose"> = {
    shape: {},
    pose: [leg("leftUpperLeg", 45)],
  };
  TestValidator.predicate(
    "a hip ramp reads the trunk-relative angle",
    nclose(
      humanBodyBasisWeights(ramped, request).activations.find(
        (one) => one.target === "fold",
      )!.activation,
      0.5,
    ),
  );
};
