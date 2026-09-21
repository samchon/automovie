import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBuild,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

type JointDriver = {
  bone: "spine" | "hips" | "chest";
  axis: "flexion" | "abduction" | "twist";
  side: "positive" | "negative";
  onset: number;
  full: number;
};

/**
 * A pose corrective fires on a clinical joint ramp and is applied in rest space.
 *
 * The fixture gains a corrective `fold` driven by spine flexion with onset 30
 * and full 60 degrees, moving the hips-bound vertex 0 and the spine-bound
 * vertex 4 by +0.02 in Z.
 *
 * Scenarios:
 * 1. The ramp: a null angle, flexion 30 and extension leave vertex 0; 45
 *    gives half; 60 and 90 give the full displacement.
 * 2. The displacement is added before skinning: at flexion 90 the spine-bound
 *    vertex 4 lands on the rotation of `rest + fold`, not `rotated + fold`.
 * 3. A negative-side driver counts extension from rest; a rest offset
 *    (`neutral.flexion = 20`) shifts the ramp with it; a joint driver
 *    multiplies with a channel driver; a pose on another bone does not arm it.
 * 4. Admission refuses a driver on an unknown bone, on a held axis, on the
 *    unconstrained root, with a negative onset, with `full <= onset`, with
 *    `full` beyond the clinical reach on its side (the reach shrinking with a
 *    rest offset), with a nonfinite bound, or duplicated; a ramp that exactly
 *    reaches the range on either side is admitted.
 * 5. A channel driver's own ramp: with `width` extended to 3, a positive
 *    ramp from 1 to 3 is off at 1, half at 2 and whole at 3; a negative ramp
 *    with only `onset` reaches one at the default `full` of one; admission refuses a ramp
 *    past the envelope on its side, a negative onset, `full <= onset` and a
 *    nonfinite bound, and admits one that ends exactly on the envelope.
 */
export const test_human_body_basis_pose_corrective = (): void => {
  const withFold = (
    input: JointDriver,
    extra?: (basis: IAutoMovieHumanBodyBasis) => void,
  ) => {
    const fixture = humanBodyBasisFixture();
    fixture.basis.correctives!.push({
      id: "fold",
      inputs: [input],
      weight: 1,
      target: "fold",
    });
    fixture.basis.surfaces[0].targets.fold = [0, 0, 0, 0.02, 4, 0, 0, 0.02];
    extra?.(fixture.basis);
    return fixture;
  };
  const order = [
    ...new Set(humanBodyBasisFixture().basis.surfaces[0].regions[0].indices),
  ];
  const at = (built: IAutoMovieHumanBodyBuild, vertex: number) => {
    const geometry = built.model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    const i = order.indexOf(vertex) * 3;
    const p = geometry.mesh.positions;
    return { x: p[i], y: p[i + 1], z: p[i + 2] };
  };
  const spine = (flexion: number | null): IAutoMovieJointPose[] => [
    { bone: "spine", flexion, abduction: null, twist: null },
  ];
  const flexion = (onset: number, full: number): JointDriver => ({
    bone: "spine",
    axis: "flexion",
    side: "positive",
    onset,
    full,
  });

  // 1. the ramp on the hips-bound vertex, which skinning leaves in place
  const ramp = withFold(flexion(30, 60));
  const build = createHumanBodyBasisBuilder(ramp.basis);
  const z0 = (pose?: IAutoMovieJointPose[]) =>
    at(build({ ...ramp.document, pose }), 0).z;
  const restZ = z0();
  for (const [title, angle, expected] of [
    ["null angle is rest", null, 0],
    ["below onset", 30, 0],
    ["half way", 45, 0.01],
    ["at full", 60, 0.02],
    ["clamped beyond full", 90, 0.02],
    ["extension does not arm a flexion driver", -30, 0],
  ] as const)
    TestValidator.predicate(title, nclose(z0(spine(angle)) - restZ, expected));

  // 2. rest-space application on the spine-bound vertex
  const rest4 = at(build(ramp.document), 4);
  const bent4 = at(build({ ...ramp.document, pose: spine(90) }), 4);
  TestValidator.predicate(
    "fold is rotated with the bone",
    vclose(bent4, { x: rest4.x, y: 1 - (rest4.z + 0.02), z: rest4.y - 1 }),
  );

  // 3. negative side, rest offset, product with a channel, other bone
  const extension = withFold({ ...flexion(0, 30), side: "negative" });
  const extend = createHumanBodyBasisBuilder(extension.basis);
  TestValidator.predicate(
    "negative side counts extension",
    nclose(
      at(extend({ ...extension.document, pose: spine(-15) }), 0).z - restZ,
      0.01,
    ) &&
      nclose(
        at(extend({ ...extension.document, pose: spine(15) }), 0).z,
        restZ,
      ),
  );
  const offset = withFold(flexion(30, 60), (basis) => {
    basis.joints[1].neutral.flexion = 20;
  });
  const shifted = createHumanBodyBasisBuilder(offset.basis);
  TestValidator.predicate(
    "the ramp counts from the rest angle",
    nclose(at(shifted({ ...offset.document, pose: spine(50) }), 0).z, restZ) &&
      nclose(
        at(shifted({ ...offset.document, pose: spine(65) }), 0).z - restZ,
        0.01,
      ),
  );
  const mixed = withFold(flexion(30, 60), (basis) => {
    basis.correctives![1].inputs.push({ channel: "width", side: "positive" });
  });
  const mix = createHumanBodyBasisBuilder(mixed.basis);
  TestValidator.predicate(
    "joint and channel drivers multiply",
    nclose(
      at(mix({ ...mixed.document, shape: { width: 0.5 }, pose: spine(60) }), 0)
        .z - restZ,
      0.01,
    ) && nclose(at(mix({ ...mixed.document, pose: spine(60) }), 0).z, restZ),
  );
  const plain = humanBodyBasisFixture();
  const hips: IAutoMovieJointPose[] = [
    { bone: "hips", flexion: 90, abduction: null, twist: null },
  ];
  TestValidator.predicate(
    "another bone does not arm the driver",
    vclose(
      at(build({ ...ramp.document, pose: hips }), 0),
      at(
        createHumanBodyBasisBuilder(plain.basis)({
          ...plain.document,
          pose: hips,
        }),
        0,
      ),
    ),
  );

  // 4. admission
  const held = (basis: IAutoMovieHumanBodyBasis): void => {
    basis.joints[1].constraint!.twist = null;
    basis.joints[1].signs.twist = null;
  };
  const raised = (basis: IAutoMovieHumanBodyBasis): void => {
    basis.joints[1].neutral.flexion = 20;
  };
  const doubled = (basis: IAutoMovieHumanBodyBasis): void => {
    basis.correctives![1].inputs.push({ ...basis.correctives![1].inputs[0] });
  };
  const cases: [
    string,
    JointDriver,
    ((basis: IAutoMovieHumanBodyBasis) => void) | undefined,
    boolean,
  ][] = [
    ["unknown bone", { ...flexion(0, 10), bone: "chest" }, undefined, true],
    ["held axis", { ...flexion(0, 5), axis: "twist" }, held, true],
    [
      "unconstrained root",
      { ...flexion(0, 10), bone: "hips" },
      undefined,
      true,
    ],
    ["negative onset", flexion(-1, 10), undefined, true],
    ["full at onset", flexion(10, 10), undefined, true],
    ["full beyond positive reach", flexion(0, 91), undefined, true],
    ["full at positive reach", flexion(0, 90), undefined, false],
    [
      "full beyond negative reach",
      { ...flexion(0, 31), side: "negative" },
      undefined,
      true,
    ],
    [
      "full at negative reach",
      { ...flexion(0, 30), side: "negative" },
      undefined,
      false,
    ],
    ["reach shrinks with the rest offset", flexion(0, 75), raised, true],
    [
      "nonfinite full",
      { ...flexion(0, Number.POSITIVE_INFINITY), axis: "abduction" },
      undefined,
      true,
    ],
    ["duplicate joint drivers", flexion(0, 10), doubled, true],
  ];
  for (const [title, input, extra, refused] of cases) {
    const fixture = withFold(input, extra);
    TestValidator.equals(
      title,
      throwsError(() => createHumanBodyBasisBuilder(fixture.basis)),
      refused,
    );
  }

  // 5. a channel driver's weight ramp
  const weighted = (
    driver: {
      side: "positive" | "negative";
      onset?: number;
      full?: number;
    },
    minimum = -1,
    maximum = 3,
  ) => {
    const fixture = humanBodyBasisFixture();
    fixture.basis.channels[0].minimum = minimum;
    fixture.basis.channels[0].maximum = maximum;
    fixture.basis.correctives!.push({
      id: "fold",
      inputs: [{ channel: "width", ...driver }],
      weight: 1,
      target: "fold",
    });
    fixture.basis.surfaces[0].targets.fold = [0, 0, 0, 0.02];
    return fixture;
  };
  const upper = weighted({ side: "positive", onset: 1, full: 3 });
  const lower = weighted({ side: "negative", onset: 0.5 }, -2, 1);
  const zOf = (
    fixture: ReturnType<typeof weighted>,
    shape: Record<string, number>,
  ) =>
    at(
      createHumanBodyBasisBuilder(fixture.basis)({
        ...fixture.document,
        shape,
      }),
      0,
    ).z;
  // against the same basis with the fold driven by `tall`, absent from the
  // shape, so the difference is the ramp alone
  const zOff = (fixture: ReturnType<typeof weighted>, width: number) =>
    zOf(fixture, { width }) -
    zOf(
      {
        ...fixture,
        basis: {
          ...fixture.basis,
          correctives: fixture.basis.correctives!.map((corrective) =>
            corrective.id === "fold"
              ? {
                  ...corrective,
                  inputs: [{ channel: "tall", side: "positive" as const }],
                }
              : corrective,
          ),
        },
      },
      { width },
    );
  for (const [title, fixture, width, expected] of [
    ["off at the ramp's onset", upper, 1, 0],
    ["half way along the weight", upper, 2, 0.01],
    ["whole at the envelope", upper, 3, 0.02],
    ["a positive ramp ignores the negative side", upper, -1, 0],
    ["a negative ramp with only an onset", lower, -0.75, 0.01],
    ["whole at the default full", lower, -1, 0.02],
    ["and held past it", lower, -2, 0.02],
  ] as const)
    TestValidator.predicate(title, nclose(zOff(fixture, width), expected));
  for (const [title, fixture, refused] of [
    [
      "past the positive envelope",
      weighted({ side: "positive", full: 3.5 }),
      true,
    ],
    [
      "ends on the envelope",
      weighted({ side: "negative", onset: 0, full: 1 }),
      false,
    ],
    [
      "past the negative envelope",
      weighted({ side: "negative", full: 1.5 }),
      true,
    ],
    [
      "negative weight onset",
      weighted({ side: "positive", onset: -0.5 }),
      true,
    ],
    [
      "weight full at onset",
      weighted({ side: "positive", onset: 2, full: 2 }),
      true,
    ],
    [
      "nonfinite weight full",
      weighted({ side: "positive", full: Number.NaN }),
      true,
    ],
  ] as const)
    TestValidator.equals(
      title,
      throwsError(() => createHumanBodyBasisBuilder(fixture.basis)),
      refused,
    );
};
