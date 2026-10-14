import { validateFaceResult } from "@automovie/engine";
import { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";

/**
 * Admit populated signed face traits at the inclusive limits and valid per-side compositions; this establishes numerical admission rather than visual anatomy.
 *
 * Scenarios:
 * 1. Populated singular leaves, lone left eye, two separate brows, shared eye spacing plus one-side offset and lone right cheek all stay admitted, including -2 jaw width and +2 eye size.
 * 2. Pair spacing without either eye object remains admitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual face validation for populated and spacing-only documents and requires success, catching mistaken exclusive limits or a paired-trait traversal that rejects valid omission/composition.
 * @evidence contracts/testing.md#independent-expectations Authored values and the documented inclusive [-2,2] effective-weight contract determine admission; 0.2 shared spacing plus -0.2 offset is zero. Aggregate success does not independently prove each target was emitted or that a face looks valid.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts both signed endpoints, lone-left/lone-right/two-side inputs, combined spacing and spacing alone; flattening output and out-of-range refusals have separate tests.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns both local documents through the existing identity fixture and invokes no Human geometry, browser, process or native build.
 */
export function test_validation_face_valid(): void {
  const result: IAutoMovieValidation = validateFaceResult(
    makeFace({
      width: 0.3,
      length: -0.2,
      cheeks: { right: { fullness: -0.3 } },
      jaw: { width: -2, chin: { length: 0.4, protrusion: -0.1 } },
      eyes: {
        spacing: 0.2,
        left: { size: 2, width: 0.2, height: 0.1, tilt: 0.6, offset: -0.2 },
      },
      brows: { left: { height: -0.4 }, right: { height: 0.3 } },
      nose: { length: 0.2, width: 0.4, projection: 0.7 },
      mouth: { width: -0.5, height: 0.2, lips: { fullness: 1.1 } },
    }),
  );
  TestValidator.equals("valid face succeeds", result.success, true);

  // spacing alone (no per-eye objects at all) must also flatten and pass
  const spacingOnly: IAutoMovieValidation = validateFaceResult(
    makeFace({ eyes: { spacing: 0.4 } }),
  );
  TestValidator.equals("pair spacing alone valid", spacingOnly.success, true);
}
