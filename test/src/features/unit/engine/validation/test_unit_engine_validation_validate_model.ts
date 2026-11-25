import { validateModel } from "@automovie/engine";
import type {
  AutoMovieViolationKind,
  IAutoMovieBody,
  IAutoMovieModel,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * `validateModel` admits a coherent model and names each broken rule by its
 * kind and path.
 *
 * Fixture: the standard one-part generated model (a box with a resolved
 * material and a connected rig), mutated one rule at a time.
 *
 * Scenarios:
 *
 * 1. The model, the model without a skeleton, a body of mass 2.5 with an explicit
 *    centre of mass, and a body at the boundary coefficients (friction 0,
 *    restitution 1) are admitted.
 * 2. No parts: type at `.parts`. A box of width 0: range at `.width`. Metallic 2:
 *    range at `.metallic`. A part attached to the undeclared bone `jaw`: type
 *    at `.attachedBone`. A part's material `does-not-exist`: type at
 *    `.material`.
 * 3. Body mass 0, friction 2 and restitution -0.1: range at `.body.mass`,
 *    `.body.friction` and `.body.restitution`.
 * 4. A repeated material id, part id and bone name: type at each second
 *    occurrence.
 */
export function test_unit_engine_validation_validate_model(): void {
  const base: IAutoMovieModel = createModel();
  const validate = (model: IAutoMovieModel): IAutoMovieValidation =>
    validateModel({ model });
  const body = (b: Partial<IAutoMovieBody>): IAutoMovieModel => ({
    ...base,
    body: {
      mass: 1,
      centerOfMass: null,
      friction: 0.5,
      restitution: 0.5,
      ...b,
    },
  });
  const refused = (
    label: string,
    model: IAutoMovieModel,
    kind: AutoMovieViolationKind,
    path: string,
  ): void => {
    const result: IAutoMovieValidation = validate(model);
    TestValidator.predicate(
      label,
      result.success === false && hasViolation(result, kind, path),
    );
  };

  // 1.
  for (const [label, model] of [
    ["standard", base],
    ["object", { ...base, skeleton: null }],
    [
      "body",
      body({
        mass: 2.5,
        centerOfMass: { x: 0, y: 0.3, z: 0 },
        friction: 0.6,
        restitution: 0.2,
      }),
    ],
    ["boundary body", body({ friction: 0, restitution: 1 })],
  ] satisfies [string, IAutoMovieModel][])
    TestValidator.equals(label, validate(model).success, true);

  // 2.
  refused("no parts", { ...base, parts: [] }, "type", ".parts");
  refused(
    "zero width",
    {
      ...base,
      parts: base.parts.map((p) => ({
        ...p,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 0, height: 0.6, depth: 0.2 },
        },
      })),
    },
    "range",
    ".width",
  );
  refused(
    "metallic 2",
    { ...base, materials: base.materials.map((m) => ({ ...m, metallic: 2 })) },
    "range",
    ".metallic",
  );
  refused(
    "undeclared bone",
    { ...base, parts: base.parts.map((p) => ({ ...p, attachedBone: "jaw" })) },
    "type",
    ".attachedBone",
  );
  refused(
    "dangling material",
    {
      ...base,
      parts: base.parts.map((p) => ({ ...p, material: "does-not-exist" })),
    },
    "type",
    ".material",
  );

  // 3.
  refused("mass 0", body({ mass: 0 }), "range", ".body.mass");
  refused("friction 2", body({ friction: 2 }), "range", ".body.friction");
  refused(
    "restitution -0.1",
    body({ restitution: -0.1 }),
    "range",
    ".body.restitution",
  );

  // 4.
  const skeleton: IAutoMovieSkeleton = base.skeleton!;
  const duplicate: IAutoMovieValidation = validate({
    ...base,
    materials: [
      base.materials[0]!,
      { ...base.materials[0]!, name: "duplicate material" },
    ],
    parts: [base.parts[0]!, { ...base.parts[0]!, name: "duplicate part" }],
    skeleton: {
      ...skeleton,
      bones: [
        skeleton.bones[0]!,
        { ...skeleton.bones[1]!, bone: skeleton.bones[0]!.bone },
      ],
    },
  });
  TestValidator.equals("duplicates fail", duplicate.success, false);
  for (const path of [
    "$input.materials[1].id",
    "$input.parts[1].id",
    "$input.skeleton.bones[1].bone",
  ])
    TestValidator.predicate(path, hasViolation(duplicate, "type", path));
}
