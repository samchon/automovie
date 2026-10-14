import { tessellate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { type ITessellation } from "@automovie/engine";
import { throwsError } from "../internal/predicates";

/**
 * Primitive tessellation is a runtime geometry boundary. Unknown primitive
 * names must fail at the switch instead of returning an undefined tessellation
 * or surfacing later as an unrelated mesh property access.
 *
 * Scenarios:
 * 1. A forged primitive shape type throws a clear tessellation error.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the runtime tessellator with the existing forged torus discriminator and requires an Error naming both the unknown primitive boundary and torus. It catches undefined return or unrelated later property failures.
 * @evidence contracts/testing.md#independent-expectations The declared primitive union has no torus member, so its runtime discriminator must refuse with the supplied name. This assertion establishes only that unsupported branch, not dimension admission or a valid primitive's geometry.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the original unsupported torus case and both diagnostic fragments. Supported six-shape positive controls and buffer invariants are owned by tessellate-invariants; no additional unsupported cases are fabricated.
 * @evidence contracts/testing.md#execution-ownership The discoverable named unit entry directly invokes portable product tessellation and the existing exception observer with a deliberate runtime type forgery. It installs no consumer, builds no native artifact and starts no host, browser or GPU; it registers no cases.
 */
export function test_geometry_tessellate_shape_type(): void {
  TestValidator.predicate(
    "unknown primitive shape rejects",
    throwsError(
      (): ITessellation => tessellate({ type: "torus" } as never),
      ["unknown primitive shape", "torus"],
    ),
  );
}
