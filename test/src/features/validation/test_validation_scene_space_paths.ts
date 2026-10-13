import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { remapSpaceViolations } from "@automovie/production/validation/remapSpaceViolations";

/**
 * A scene reports a space's findings under its space field without changing
 * the original validator result, violation kind, message or source value.
 *
 * Scenarios:
 *
 * 1. A supported space retains its successful validation object.
 * 2. Refusals at the space root and a nested surface gain one scene prefix;
 *    an unrelated path and the original result remain unchanged.
 */
export const test_validation_scene_space_paths = (): void => {
  const accepted: IAutoMovieValidation = { success: true };
  TestValidator.predicate("success identity", remapSpaceViolations(accepted) === accepted);
  const refused: IAutoMovieValidation.IFailure = {
    success: false,
    violations: [
      { kind: "range", severity: "error", path: "$input", expected: "invalid space", value: -1 },
      { kind: "range", severity: "error", path: "$input.surfaces[1].bounds", expected: "invalid bounds", value: 0 },
      { kind: "type", severity: "error", path: "$registry", expected: "missing surface", value: null },
    ],
  };
  const before = structuredClone(refused);
  TestValidator.equals("remapped findings", remapSpaceViolations(refused), {
    success: false,
    violations: before.violations.map((item, index) => ({
      ...item,
      path: ["$input.space", "$input.space.surfaces[1].bounds", "$registry"][index],
    })),
  });
  TestValidator.equals("original findings", refused, before);
};
