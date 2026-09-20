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
};
