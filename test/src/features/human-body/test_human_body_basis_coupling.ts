import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBuild,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, qclose, throwsError } from "../internal/predicates";

type Coupling = NonNullable<IAutoMovieHumanBodyBasis["couplings"]>[number];
type Patch = (basis: IAutoMovieHumanBodyBasis) => void;

/**
 * A declared coupling adds a bounded angle to another joint before the pose
 * is validated, and a corrective ramp reads the sum.
 *
 * The analytic box gains a third bone `chest` above the spine (`joint-spine-2`
 * to a new `joint-neck` at (0,3,0), the spine's ranges and rest copied), so
 * every rest frame is the identity and a spine flexion `s` plus a chest
 * flexion `c` leaves the chest's world rotation at `s + c` degrees about +X.
 * The coupling `rhythm` reads the spine's elevation and adds to the chest's
 * flexion along `[[30, 0], [60, 20], [90, 50]]`.
 *
 * Scenarios:
 * 1. The curve: spine flexion 20 and 30 add nothing, 45 adds 10 (first
 *    segment), 60 adds 20 (a knot), 75 adds 35 (second segment), 90 adds 50
 *    (the last knot), and the empty document leaves the chest at rest.
 * 2. The measure is the swing cone from the rest: with the spine's abduction
 *    widened to 90, flexion 60 with abduction 60 has elevation
 *    `2 acos(cos 30 cos 30) = 2 acos 0.75` and adds `20 + (that - 60)`,
 *    flexion 90 with abduction 90 has elevation 120 and holds the last
 *    ordinate 50, abduction 60 alone adds 20, and with the spine resting at
 *    flexion 20 a document flexion of 50 adds nothing and 65 adds 10.
 * 3. The ordinate adds to what the document wrote: chest flexion 30 with
 *    spine 45 gives 40; a chest entry with only abduction 5 keeps it and
 *    gains flexion 10; a second coupling into the chest's abduction
 *    (`[[30, 0], [90, -6]]`) finds the entry the first added, so spine 90
 *    gives chest flexion 50 and abduction -6; each equals the same explicit
 *    pose on a coupling-free basis.
 * 4. The sum is validated, never clamped: spine 90 with chest 41 (sum 91)
 *    refuses and chest 40 (sum 90) passes; on the abduction coupling,
 *    chest -5 (sum -11) refuses and -4 (sum -10) passes; the document's pose
 *    is unchanged by a build.
 * 5. Admission: a held or root output axis, an ordinate past either side of
 *    the range (the reach shrinking with a rest offset), an unknown source
 *    or output, a self coupling, a chain whose output is another coupling's
 *    source, a duplicate output axis, a blank or duplicate id, a single
 *    knot, a nonzero first ordinate, a negative first abscissa, a
 *    nonincreasing abscissa and a nonfinite knot refuse; the adjacent
 *    admitted twins pass, and an empty table is admitted.
 * 6. A corrective ramp on chest flexion (onset 30, full 60, `fold` moving
 *    the hips-bound vertex 0 by +0.02 in Z) fires on the coupled angle:
 *    spine 90 (chest 50) gives two thirds, spine 45 (chest 10) nothing,
 *    chest 40 with spine 45 (chest 50) two thirds, and the same spine 90 on
 *    a coupling-free basis nothing.
 * 7. A basis without couplings and one with an empty table pose the chest
 *    exactly as the spine alone does.
 */
export const test_human_body_basis_coupling = (): void => {
  const rhythm: Coupling = {
    id: "rhythm",
    source: { bone: "spine", measure: "elevation" },
    output: { bone: "chest", axis: "flexion" },
    curve: [
      [30, 0],
      [60, 20],
      [90, 50],
    ],
  };
  const retraction: Coupling = {
    id: "retraction",
    source: { bone: "spine", measure: "elevation" },
    output: { bone: "chest", axis: "abduction" },
    curve: [
      [30, 0],
      [90, -6],
    ],
  };
  const withChest = (couplings?: Coupling[], patch?: Patch) => {
    const fixture = humanBodyBasisFixture();
    fixture.basis.landmarks.ids.push("joint-neck");
    fixture.basis.landmarks.positions.push(0, 3, 0);
    fixture.basis.joints.push({
      ...structuredClone(fixture.basis.joints[1]),
      bone: "chest",
      parent: "spine",
      head: "joint-spine-2",
      tail: "joint-neck",
    });
    if (couplings !== undefined) fixture.basis.couplings = couplings;
    patch?.(fixture.basis);
    return fixture;
  };
  const chestOf = (built: IAutoMovieHumanBodyBuild): IAutoMovieQuaternion =>
    built.bones.find((one) => one.bone === "chest")!.posed.rotation;
  const aboutX = (degrees: number): IAutoMovieQuaternion => {
    const half = (degrees * Math.PI) / 360;
    return { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) };
  };
  const spine = (
    flexion: number | null,
    abduction: number | null = null,
  ): IAutoMovieJointPose => ({
    bone: "spine",
    flexion,
    abduction,
    twist: null,
  });
  const chest = (
    flexion: number | null,
    abduction: number | null = null,
  ): IAutoMovieJointPose => ({
    bone: "chest",
    flexion,
    abduction,
    twist: null,
  });

  // 1. the curve, read off the chest's world rotation about +X
  const coupled = withChest([rhythm]);
  const build = createHumanBodyBasisBuilder(coupled.basis);
  for (const [title, flexion, addition] of [
    ["below the first knot", 20, 0],
    ["at the first knot", 30, 0],
    ["inside the first segment", 45, 10],
    ["at a knot", 60, 20],
    ["inside the second segment", 75, 35],
    ["at the last knot", 90, 50],
  ] as const)
    TestValidator.predicate(
      title,
      qclose(
        chestOf(build({ ...coupled.document, pose: [spine(flexion)] })),
        aboutX(flexion + addition),
      ),
    );
  TestValidator.predicate(
    "the empty document leaves the chest at rest",
    qclose(chestOf(build(coupled.document)), aboutX(0)),
  );

  // 2. the measure is the swing cone from the rest; each case equals the
  // explicit chest pose on a coupling-free basis
  const wide: Patch = (basis) => {
    basis.joints[1].constraint!.abduction = { min: -90, max: 90 };
  };
  const twin = (pose: IAutoMovieJointPose[], patch?: Patch) => {
    const plain = withChest(undefined, patch);
    return chestOf(
      createHumanBodyBasisBuilder(plain.basis)({ ...plain.document, pose }),
    );
  };
  const swung = withChest([rhythm], wide);
  const swing = createHumanBodyBasisBuilder(swung.basis);
  const combined = (2 * Math.acos(0.75) * 180) / Math.PI;
  for (const [title, pose, addition] of [
    ["flexion and abduction combine", [spine(60, 60)], 20 + (combined - 60)],
    ["held past the last knot", [spine(90, 90)], 50],
    ["abduction alone elevates", [spine(null, 60)], 20],
  ] as const)
    TestValidator.predicate(
      title,
      qclose(
        chestOf(swing({ ...swung.document, pose: [...pose] })),
        twin([...pose, chest(addition)], wide),
      ),
    );
  const offset: Patch = (basis) => {
    basis.joints[1].neutral.flexion = 20;
  };
  const rested = withChest([rhythm], offset);
  const rest = createHumanBodyBasisBuilder(rested.basis);
  TestValidator.predicate(
    "elevation counts from the rest angle",
    qclose(
      chestOf(rest({ ...rested.document, pose: [spine(50)] })),
      twin([spine(50)], offset),
    ) &&
      qclose(
        chestOf(rest({ ...rested.document, pose: [spine(65)] })),
        twin([spine(65), chest(10)], offset),
      ),
  );

  // 3. addition to the document's own angle, and a second coupling
  TestValidator.predicate(
    "adds to an explicit chest flexion",
    qclose(
      chestOf(build({ ...coupled.document, pose: [spine(45), chest(30)] })),
      aboutX(85),
    ),
  );
  TestValidator.predicate(
    "keeps the other axes of an existing entry",
    qclose(
      chestOf(
        build({ ...coupled.document, pose: [spine(45), chest(null, 5)] }),
      ),
      twin([spine(45), chest(10, 5)]),
    ),
  );
  const both = withChest([rhythm, retraction]);
  const pair = createHumanBodyBasisBuilder(both.basis);
  TestValidator.predicate(
    "a second coupling finds the entry the first added",
    qclose(
      chestOf(pair({ ...both.document, pose: [spine(90)] })),
      twin([spine(90), chest(50, -6)]),
    ),
  );

  // 4. the sum is validated, and the document is left alone
  for (const [title, pose, refused] of [
    ["sum past the flexion range", [spine(90), chest(41)], true],
    ["sum on the flexion range", [spine(90), chest(40)], false],
    ["sum past the abduction range", [spine(90), chest(null, -5)], true],
    ["sum on the abduction range", [spine(90), chest(null, -4)], false],
  ] as const)
    TestValidator.equals(
      title,
      throwsError(() => pair({ ...both.document, pose: [...pose] }), "chest"),
      refused,
    );
  const document = { ...both.document, pose: [spine(90), chest(20)] };
  const before = JSON.stringify(document);
  pair(document);
  TestValidator.equals(
    "the document is not mutated",
    JSON.stringify(document),
    before,
  );

  // 5. admission
  const held: Patch = (basis) => {
    basis.joints[2].constraint!.twist = null;
    basis.joints[2].signs.twist = null;
  };
  const chestOffset: Patch = (basis) => {
    basis.joints[2].neutral.flexion = 20;
  };
  const curve = (...knots: [number, number][]): Coupling => ({
    ...rhythm,
    curve: knots,
  });
  const backward: Coupling = {
    ...rhythm,
    id: "backward",
    source: { bone: "chest", measure: "elevation" },
    output: { bone: "spine", axis: "flexion" },
  };
  const twist: Coupling = {
    ...rhythm,
    output: { bone: "chest", axis: "twist" },
    curve: [
      [30, 0],
      [90, 10],
    ],
  };
  const cases: [string, Coupling[], Patch | undefined, boolean][] = [
    ["held output axis", [twist], held, true],
    ["open output axis", [twist], undefined, false],
    [
      "root output",
      [{ ...rhythm, output: { bone: "hips", axis: "flexion" } }],
      undefined,
      true,
    ],
    [
      "ordinate past the positive range",
      [curve([30, 0], [90, 91])],
      undefined,
      true,
    ],
    [
      "ordinate on the positive range",
      [curve([30, 0], [90, 90])],
      undefined,
      false,
    ],
    [
      "ordinate past the negative range",
      [curve([30, 0], [90, -31])],
      undefined,
      true,
    ],
    [
      "ordinate on the negative range",
      [curve([30, 0], [90, -30])],
      undefined,
      false,
    ],
    [
      "reach shrinks with the rest offset",
      [curve([30, 0], [90, 71])],
      chestOffset,
      true,
    ],
    [
      "reach with the rest offset",
      [curve([30, 0], [90, 70])],
      chestOffset,
      false,
    ],
    [
      "unknown source",
      [{ ...rhythm, source: { bone: "leftUpperArm", measure: "elevation" } }],
      undefined,
      true,
    ],
    [
      "unknown output",
      [{ ...rhythm, output: { bone: "neck", axis: "flexion" } }],
      undefined,
      true,
    ],
    [
      "self coupling",
      [{ ...rhythm, output: { bone: "spine", axis: "flexion" } }],
      undefined,
      true,
    ],
    ["chain through the output", [rhythm, backward], undefined, true],
    ["chain declared first", [backward, rhythm], undefined, true],
    ["the backward coupling alone", [backward], undefined, false],
    [
      "duplicate output axis",
      [rhythm, { ...rhythm, id: "again" }],
      undefined,
      true,
    ],
    ["two output axes", [rhythm, retraction], undefined, false],
    ["blank id", [{ ...rhythm, id: " " }], undefined, true],
    [
      "duplicate id",
      [rhythm, { ...retraction, id: "rhythm" }],
      undefined,
      true,
    ],
    ["single knot", [curve([30, 0])], undefined, true],
    ["nonzero first ordinate", [curve([30, 1], [90, 50])], undefined, true],
    ["negative first abscissa", [curve([-1, 0], [90, 50])], undefined, true],
    ["zero first abscissa", [curve([0, 0], [90, 50])], undefined, false],
    ["repeated abscissa", [curve([30, 0], [30, 50])], undefined, true],
    [
      "decreasing abscissa",
      [curve([30, 0], [90, 50], [60, 20])],
      undefined,
      true,
    ],
    [
      "nonfinite abscissa",
      [curve([30, 0], [Number.POSITIVE_INFINITY, 50])],
      undefined,
      true,
    ],
    ["nonfinite ordinate", [curve([30, 0], [90, Number.NaN])], undefined, true],
    ["empty table", [], undefined, false],
  ];
  for (const [title, couplings, patch, refused] of cases) {
    const fixture = withChest(couplings, patch);
    TestValidator.equals(
      title,
      throwsError(() => createHumanBodyBasisBuilder(fixture.basis)),
      refused,
    );
  }

  // 6. a corrective ramp reads the coupled angle
  const folded: Patch = (basis) => {
    basis.correctives!.push({
      id: "fold",
      inputs: [
        {
          bone: "chest",
          axis: "flexion",
          side: "positive",
          onset: 30,
          full: 60,
        },
      ],
      weight: 1,
      target: "fold",
    });
    basis.surfaces[0].targets.fold = [0, 0, 0, 0.02];
  };
  const order = [...new Set(coupled.basis.surfaces[0].regions[0].indices)];
  const z0 = (built: IAutoMovieHumanBodyBuild): number => {
    const geometry = built.model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    return geometry.mesh.positions[order.indexOf(0) * 3 + 2];
  };
  const ramped = withChest([rhythm], folded);
  const ramp = createHumanBodyBasisBuilder(ramped.basis);
  const restZ = z0(ramp(ramped.document));
  for (const [title, pose, expected] of [
    ["fires on the coupled angle", [spine(90)], 0.02 * (2 / 3)],
    ["stays off below the onset", [spine(45)], 0],
    [
      "adds the document's angle to the coupled one",
      [spine(45), chest(40)],
      0.02 * (2 / 3),
    ],
  ] as const)
    TestValidator.predicate(
      title,
      nclose(
        z0(ramp({ ...ramped.document, pose: [...pose] })) - restZ,
        expected,
      ),
    );
  const unramped = withChest(undefined, folded);
  TestValidator.predicate(
    "without the coupling the same spine angle arms nothing",
    nclose(
      z0(
        createHumanBodyBasisBuilder(unramped.basis)({
          ...unramped.document,
          pose: [spine(90)],
        }),
      ),
      restZ,
    ),
  );

  // 7. no couplings, absent or empty, is the spine alone
  const empty = withChest([]);
  TestValidator.predicate(
    "an absent and an empty table both leave the chest to the document",
    qclose(twin([spine(90)]), aboutX(90)) &&
      qclose(
        chestOf(
          createHumanBodyBasisBuilder(empty.basis)({
            ...empty.document,
            pose: [spine(90)],
          }),
        ),
        aboutX(90),
      ),
  );
};
