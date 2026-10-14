import type { IAutoMovieMesh } from "@automovie/interface";
import { exportModelToGLB } from "@automovie/render/node";
import {
  type Accessor,
  type Document,
  type Mesh,
  NodeIO,
  type Primitive,
} from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * The generic static serializer must not discard resident RGB either.
 *
 * Scenarios:
 * 1. Binary round-trip carries VEC3 linear colour for the coloured part.
 * 2. The bare neighbour emits no colour attribute and remains a separate node.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual static GLB exporter and independently reads its bytes with NodeIO, checking the first primitive's VEC3 COLOR_0 values and the bare neighbor's omitted color attribute.
 * @evidence contracts/testing.md#independent-expectations The authored RGB array supplies the expected component order and binary-fraction values; nclose uses zero tolerance to retain exact equality for these Float32-representable samples, and VEC3/null expectations are literals.
 * @evidence contracts/testing.md#distinguishing-cases Places colored and color-omitted triangles in one exported model so discarding RGB or manufacturing a color attribute on the bare primitive is observable; separate-node transforms are not inspected here.
 * @evidence contracts/testing.md#execution-ownership Owns an asynchronous in-memory GLB round trip through the real serializer and reader, opens no output file and creates no renderer; the portable runner owns execution, and decoded attributes do not constitute visual validation.
 */
export async function test_render_vertex_colour_export(): Promise<void> {
  const colored: IAutoMovieMesh = vertexColourMesh();
  const { colors: _colors, ...bare }: IAutoMovieMesh = colored;
  const doc: Document = await new NodeIO().readBinary(
    await exportModelToGLB(vertexColourModel([colored, bare])),
  );
  const primitives: Primitive[] = doc
    .getRoot()
    .listMeshes()
    .map((m: Mesh): Primitive => m.listPrimitives()[0]!);
  const colors: Accessor = primitives[0]!.getAttribute("COLOR_0")!;
  TestValidator.equals("RGB type", colors.getType(), "VEC3");
  TestValidator.predicate(
    "binary RGB values",
    colors.getArray()!.length === colored.colors!.length &&
      Array.from(colors.getArray()!).every(
        (value: unknown, index: number): boolean =>
          typeof value === "number" &&
          nclose(value, colored.colors![index]!, 0),
      ),
  );
  TestValidator.equals(
    "bare attribute omitted",
    primitives[1]!.getAttribute("COLOR_0"),
    null,
  );
}
