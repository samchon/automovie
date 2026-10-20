import { TestValidator } from "@nestia/e2e";

import { realizeAutoMovieBicubicAtlas64 as realize } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import type { IAutoMovieBicubicAtlasGeometry as Atlas } from "../../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry";
import { createBicubicPlaneRecipe } from "../internal/createBicubicPlaneRecipe";
import { nclose } from "../internal/nclose";

/**
 * Actual atlas corner parameters survive shared vertices and local omissions.
 * Scenarios:
 * 1. Adjacent affine squares share position indices while local edge u is 1/0.
 * 2. Omitting retention allocates no parameter output and preserves geometry.
 * 3. A vertex budget, empty atlas and zero-area omission retain aligned buffers.
 * 4. A malformed retention request is refused before emitting geometry.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public realizer with general polynomial squares and checks actual triangle-corner coordinates, shared indices, disabled output and incomplete/empty output alignment.
 * @evidence contracts/testing.md#independent-expectations The two degree-elevated affine maps are (u,v,0) and (1+u,v,0), so their shared edge has different local u values at identical position indices. These equations are independent of tessellation and triangle count; the cases do not certify curved inverse accuracy or visual appearance.
 * @evidence contracts/testing.md#distinguishing-cases Covers enabled/disabled output, adjacent chart ambiguity, resource partial output, no patches, exactly collapsed geometry and a malformed flag. Existing atlas realization tests own area, normal and budget semantics.
 * @evidence contracts/testing.md#execution-ownership This discoverable portable geometry unit test calls source directly and starts no Human generator, viewer, host, browser, GPU or native build. No cases are dynamically registered.
 */
export function test_geometry_bicubic_atlas_corner_parameters(): void {
  const recipe: Atlas = createBicubicPlaneRecipe();
  const second: number[] = [];
  for (let row: number = 0; row < 4; ++row)
    for (let column: number = 0; column < 4; ++column) {
      if (column === 0) second.push(4*row+3);
      else {
        second.push(recipe.controls.length);
        recipe.controls.push({x: 1+column/3, y: row/3, z: 0});
      }
    }
  recipe.patches.push({id: "second", controlIds: second});
  const output: ReturnType<typeof realize> = realize(recipe, {retainTriangleParameters: true});
  TestValidator.equals("both affine charts complete", output.complete, true);
  TestValidator.equals("one actual pair per index corner", output.triangleParameters!.length, output.mesh.indices!.length*2);
  const edge: Map<number, Set<number>> = new Map();
  for (const range of output.primitiveRanges)
    for (let triangle: number = range.firstTriangle; triangle < range.firstTriangle+range.triangleCount; ++triangle)
      for (let corner: number = 0; corner < 3; ++corner) {
        const at: number = 3*triangle+corner;
        const index: number = output.mesh.indices![at]!;
        const u: number = output.triangleParameters![2*at]!;
        const v: number = output.triangleParameters![2*at+1]!;
        const x: number = output.mesh.positions[3*index]!;
        const y: number = output.mesh.positions[3*index+1]!;
        TestValidator.predicate("actual affine chart coordinates",
          u >= 0 && u <= 1 && v >= 0 && v <= 1 &&
          nclose(x, (range.patch === "second" ? 1 : 0)+u, 1e-12) &&
          nclose(y, v, 1e-12));
        if (nclose(x, 1, 1e-12)) {
          let values: Set<number> | undefined = edge.get(index);
          if (values === undefined) { values = new Set(); edge.set(index, values); }
          values.add(u);
        }
      }
  TestValidator.predicate("shared render indices retain distinct incident chart coordinates",
    [...edge.values()].filter((values: Set<number>): boolean => values.has(0) && values.has(1)).length >= 2);
  const disabled: ReturnType<typeof realize> = realize(recipe);
  TestValidator.equals("disabled output absent", disabled.triangleParameters, undefined);
  TestValidator.equals("retention does not change indices", disabled.mesh.indices, output.mesh.indices);
  TestValidator.predicate("retention does not change positions or normals",
    disabled.mesh.positions.length === output.mesh.positions.length &&
    disabled.mesh.positions.every((value: number, i: number): boolean => nclose(value, output.mesh.positions[i]!, 0)) &&
    disabled.mesh.normals!.length === output.mesh.normals!.length &&
    disabled.mesh.normals!.every((value: number, i: number): boolean => nclose(value, output.mesh.normals![i]!, 0)));
  recipe.maxVertices = 5;
  const partial: ReturnType<typeof realize> = realize(recipe, {retainTriangleParameters: true});
  TestValidator.equals("budget remains partial", partial.complete, false);
  TestValidator.equals("partial buffer follows retained triangles", partial.triangleParameters!.length, partial.mesh.indices!.length*2);
  const empty: Atlas = createBicubicPlaneRecipe();
  empty.patches = [];
  const noPatches: ReturnType<typeof realize> = realize(empty, {retainTriangleParameters: true});
  TestValidator.equals("empty requested buffer", noPatches.triangleParameters!.length, 0);
  const collapsed: Atlas = createBicubicPlaneRecipe();
  collapsed.controls = collapsed.controls.map((): Atlas["controls"][number] => ({x: 0, y: 0, z: 0}));
  const omitted: ReturnType<typeof realize> = realize(collapsed, {retainTriangleParameters: true});
  TestValidator.predicate("exactly collapsed triangles omitted", omitted.counts.omittedZeroAreaTriangles > 0);
  TestValidator.equals("omission does not publish corner pairs", omitted.triangleParameters!.length, 0);
  let refused: boolean = false;
  try { realize(recipe, {retainTriangleParameters: "yes" as unknown as boolean}); }
  catch (cause: unknown) { refused = cause instanceof Error && cause.message.includes("boolean"); }
  TestValidator.equals("malformed request refused", refused, true);
}
