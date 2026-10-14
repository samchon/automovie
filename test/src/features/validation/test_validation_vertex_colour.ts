import { validateModel } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../internal/predicates";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * RGB is a complete finite multiplier, never a partial or HDR buffer.
 *
 * Scenarios:
 * 1. Omission and exact zero/one boundaries are admitted.
 * 2. Empty, incomplete and extra tuples refuse at the colour buffer.
 * 3. Negative, above-one, NaN and infinite channels refuse at that channel;
 *    replacing only that channel with a boundary value restores validity.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates actual models carrying omitted or explicit vertex RGB buffers and inspects located cardinality/range findings. A partial or overlong buffer cannot pass as a complete per-vertex multiplier, and repairing the single bad channel must restore acceptance.
 * @evidence contracts/testing.md#independent-expectations Three authored vertices require nine RGB components, each finite within [0,1]; omitted colors are permitted by the mesh contract. Expected paths and boundaries come from that contract, without using validator output as an expected buffer or claiming rendered color correctness.
 * @evidence contracts/testing.md#distinguishing-cases Covers omission, complete zero/one boundaries, empty/partial/extra triples and just-outside endpoints plus NaN/infinities. Replacing only channel four with zero proves adjacent acceptance; texture color space and GPU interpolation belong to other owners.
 * @evidence contracts/testing.md#execution-ownership The named unit directly invokes portable model admission with the existing authored triangle fixture. It acquires no decoder, viewer or GPU and owns its local malformed-buffer cases without dynamic registration.
 */
export function test_validation_vertex_colour(): void {
  const mesh: IAutoMovieMesh = vertexColourMesh();
  const { colors: _colors, ...bare }: IAutoMovieMesh = mesh;
  const check: (colors: number[]) => ReturnType<typeof validateModel> = (colors: number[]): ReturnType<typeof validateModel> =>
    validateModel({ model: vertexColourModel([{ ...mesh, colors }]) });
  TestValidator.equals(
    "omitted colours",
    validateModel({ model: vertexColourModel([bare]) }).success,
    true,
  );
  TestValidator.equals("boundary colours", check(mesh.colors!).success, true);
  for (const colors of [[], [1, 0], [1, 0, 0], [...mesh.colors!, 1, 1, 1]])
    TestValidator.predicate(
      "unaligned colour buffer",
      hasViolation(
        check(colors),
        "type",
        "$input.parts[0].geometry.mesh.colors",
      ),
    );
  for (const value of [
    -Number.EPSILON,
    1 + Number.EPSILON,
    NaN,
    Infinity,
    -Infinity,
  ]) {
    const colors: number[] = [...mesh.colors!];
    colors[4] = value;
    TestValidator.predicate(
      "invalid colour scalar",
      hasViolation(
        check(colors),
        "range",
        "$input.parts[0].geometry.mesh.colors[4]",
      ),
    );
    colors[4] = 0;
    TestValidator.equals("adjacent valid scalar", check(colors).success, true);
  }
}
