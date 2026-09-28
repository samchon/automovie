import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * A joint that declares its flexion axis as a landmark line flexes about that
 * line instead of the axis perpendicular to its bone.
 *
 * The analytic box's spine runs up +Y and flexes toward +Z; the declared line
 * through its head is +X turned 20 degrees toward +Y, so the bone is not
 * perpendicular to it, as a thigh leaning out at rest is not perpendicular
 * to the line through both hip centres.
 *
 * Scenarios:
 * 1. Flexed about the declared line, the bone keeps its component along the
 *    line (sin 20) at every angle; flexed about its frame's X, it loses it.
 * 2. At rest the declared axis changes nothing.
 * 3. Admission refuses a line naming a missing landmark or lying within 60
 *    degrees of the bone.
 */
export const test_human_body_flexion_axis = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const angle = (20 * Math.PI) / 180;
  const line = [Math.cos(angle), Math.sin(angle), 0];
  const declared = (
    flexionAxis: [string, string] | undefined,
    extra: [string, number[]][] = [
      ["axis-from", [-0.1 * line[0], 1 - 0.1 * line[1], 0]],
      ["axis-to", [0.1 * line[0], 1 + 0.1 * line[1], 0]],
    ],
  ): IAutoMovieHumanBodyBasis => ({
    ...basis,
    landmarks: {
      ...basis.landmarks,
      ids: [...basis.landmarks.ids, ...extra.map(([id]) => id)],
      positions: [
        ...basis.landmarks.positions,
        ...extra.flatMap(([, at]) => at),
      ],
    },
    joints: basis.joints.map((joint) =>
      joint.bone === "spine" && flexionAxis !== undefined
        ? { ...joint, flexionAxis }
        : joint,
    ),
  });
  const direction = (subject: IAutoMovieHumanBodyBasis, flexion: number) => {
    const built = createHumanBodyBasisBuilder(subject)({
      ...document,
      pose: [{ bone: "spine", flexion, abduction: null, twist: null }],
    });
    const q = built.bones.find((bone) => bone.bone === "spine")!.posed.rotation;
    // the bone's local +Y turned into the world
    return [
      2 * (q.x * q.y - q.w * q.z),
      1 - 2 * (q.x * q.x + q.z * q.z),
      2 * (q.y * q.z + q.w * q.x),
    ];
  };
  const along = (d: number[]) =>
    d[0] * line[0] + d[1] * line[1] + d[2] * line[2];
  const pelvic = declared(["axis-from", "axis-to"]);
  TestValidator.predicate(
    "the declared line keeps the bone's component along it",
    [30, 60, 90].every((flexion) =>
      nclose(along(direction(pelvic, flexion)), Math.sin(angle), 1e-9),
    ) &&
      !nclose(along(direction(declared(undefined), 90)), Math.sin(angle), 0.1),
  );

  const surface = (subject: IAutoMovieHumanBodyBasis) => {
    const part = createHumanBodyBasisBuilder(subject)(document).model.parts[0]!;
    if (part.geometry.type !== "mesh") throw new Error("expected a mesh");
    return part.geometry.mesh.positions;
  };
  TestValidator.equals(
    "at rest the declared axis changes nothing",
    surface(pelvic),
    surface(declared(undefined)),
  );

  const refused = (subject: () => IAutoMovieHumanBodyBasis) => {
    try {
      createHumanBodyBasisBuilder(subject());
      return false;
    } catch {
      return true;
    }
  };
  TestValidator.equals(
    "admission refuses a missing landmark or a line near the bone",
    [
      refused(() => declared(["axis-from", "nowhere"])),
      refused(() => declared(["joint-spine-4", "joint-spine-2"])),
    ],
    [true, true],
  );
};
