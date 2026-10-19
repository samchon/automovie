import { TestValidator } from "@nestia/e2e";

import { admitAutoMovieBicubicAtlas } from "../../../../packages/engine/src/geometry/admitAutoMovieBicubicAtlas";
import { tessellateAutoMovieBicubicAtlas64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieBicubicAtlas64";
import { realizeAutoMovieBicubicAtlas64 } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import type { IAutoMovieBicubicAtlasGeometry } from "../../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry";
import { createBicubicPlaneRecipe } from "../internal/createBicubicPlaneRecipe";
import { nclose } from "../internal/nclose";

/**
 * Canonical declarations fail locally while unrelated valid polynomial charts survive.
 * Scenarios:
 * 1. Sparse coefficient references, invalid bound patches and duplicate authorities retain an independent chart.
 * 2. Conflicting canonical endpoints omit every incident chart with an explicit reason.
 * 3. Matching declared endpoints and reversed intervals remain supported.
 * 4. A constructed shared corner propagates into an incident unbound chart's field and physical identity.
 * 5. The direct streaming API refuses incomplete canonical coefficient registries.
 * 6. Complete legacy edges inherit canonical fields under reversal and patch permutation; equivalent differently named fields survive with an explicit transport limitation.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises structural admission, public realization and direct atlas streaming using affine Bernstein nets. Assertions observe retained unit-square area and complete triangle ownership, omitted patch status, conflict diagnostics, exact declared physical correspondence and projected PL interpolation against a separately derived bicubic value. They catch global rejection, sparse-reference leaks and hidden endpoint substitution without requiring a center vertex or a fixed triangle count.
 * @evidence contracts/testing.md#independent-expectations Sixteen dense indices define a patch and four dense indices define a cubic authority. A shared corner cannot simultaneously have z=0 and z=1; unrelated control identities retain their area-one square. Replacing only a square's first corner with z=1 gives z=(1-u)^3(1-v)^3, hence 1/64 at its center. Barycentric evaluation of the returned triangles must approximate that independent value within the declared position request. Equality checks validate declared aliases only and establish no general embedding or source-fidelity claim.
 * @evidence contracts/testing.md#distinguishing-cases Covers sparse references, duplicate authority names, an invalid patch's binding, exact endpoint conflict, matching endpoints, reversed intervals, bound/unbound corners and complete edges, patch permutation and equivalent differently named fields beside independent charts. Global budgets and approximation semantics belong to realization tests.
 * @evidence contracts/testing.md#execution-ownership This discoverable entry imports portable engine source and authors general unit-square coefficient recipes. No Human data, host, process, browser, GPU, foreign-method replacement or native build is used; all cases are owned here.
 */
export function test_geometry_bicubic_atlas_admission(): void {
  const two: () => IAutoMovieBicubicAtlasGeometry =
    (): IAutoMovieBicubicAtlasGeometry => {
      const recipe: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
      recipe.controls.push(
        ...recipe.controls.map(
          (point: {
            x: number;
            y: number;
            z: number;
          }): { x: number; y: number; z: number } => ({
            ...point,
            x: point.x + 2,
          }),
        ),
      );
      recipe.patches.push({
        id: "independent",
        controlIds: Array.from(
          { length: 16 },
          (_: unknown, i: number): number => i + 16,
        ),
      });
      return recipe;
    };
  const binds: (recipe: IAutoMovieBicubicAtlasGeometry) => void = (
    recipe: IAutoMovieBicubicAtlasGeometry,
  ): void => {
    recipe.boundaryAuthorities = [{ id: "bottom", controlIds: [0, 1, 2, 3] }];
    recipe.boundaryBindings = [
      {
        patch: "plane",
        side: 0,
        authority: "bottom",
        start: 0,
        end: 1,
        normalFan: "bank",
      },
    ];
  };
  const localFailure: (
    recipe: IAutoMovieBicubicAtlasGeometry,
    reason: string,
  ) => void = (
    recipe: IAutoMovieBicubicAtlasGeometry,
    reason: string,
  ): void => {
    const generated: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
      realizeAutoMovieBicubicAtlas64(recipe);
    TestValidator.equals(
      `${reason}: partial status`,
      generated.complete,
      false,
    );
    let area: number = 0;
    for (let i: number = 0; i < generated.mesh.indices!.length; i += 3) {
      const p: number[][] = generated.mesh
        .indices!.slice(i, i + 3)
        .map((id: number): number[] =>
          generated.mesh.positions.slice(id * 3, id * 3 + 3),
        );
      area +=
        ((p[1]![0]! - p[0]![0]!) * (p[2]![1]! - p[0]![1]!) -
          (p[1]![1]! - p[0]![1]!) * (p[2]![0]! - p[0]![0]!)) /
        2;
    }
    TestValidator.predicate(
      `${reason}: independent square survives`,
      generated.mesh.indices!.length > 0 && nclose(area, 1, 1e-12),
    );
    const owned: (typeof generated.primitiveRanges)[number][] =
      generated.primitiveRanges.filter(
        (range: (typeof generated.primitiveRanges)[number]): boolean =>
          range.triangleCount > 0,
      );
    let ordinal: number = 0;
    for (const range of owned) {
      TestValidator.predicate(
        `${reason}: independent triangle ownership`,
        range.patch === "independent" && range.firstTriangle === ordinal,
      );
      ordinal += range.triangleCount;
    }
    TestValidator.equals(
      `${reason}: retained ownership covers every triangle`,
      ordinal * 3,
      generated.mesh.indices!.length,
    );
    TestValidator.predicate(
      `${reason}: independent physical region`,
      generated.mesh.positions.every(
        (value: number, i: number): boolean =>
          Number.isFinite(value) && (i % 3 !== 0 || value >= 2),
      ),
    );
    TestValidator.predicate(
      `${reason}: explicit diagnostic`,
      generated.diagnostics.length > 0,
    );
  };
  const sparse: IAutoMovieBicubicAtlasGeometry = two();
  binds(sparse);
  const sparseIds: number[] = new Array<number>(4);
  sparseIds[0] = 0;
  sparseIds[2] = 2;
  sparseIds[3] = 3;
  sparse.boundaryAuthorities![0]!.controlIds = sparseIds as unknown as [
    number,
    number,
    number,
    number,
  ];
  localFailure(sparse, "sparse authority");
  TestValidator.predicate(
    "admitted IDs stay dense integers",
    admitAutoMovieBicubicAtlas(sparse).controls.every(Number.isSafeInteger),
  );
  const invalidPatch: IAutoMovieBicubicAtlasGeometry = two();
  binds(invalidPatch);
  invalidPatch.patches[0]!.controlIds[0] = -1;
  localFailure(invalidPatch, "invalid incident patch");
  const duplicate: IAutoMovieBicubicAtlasGeometry = two();
  binds(duplicate);
  duplicate.boundaryAuthorities!.push({
    id: "bottom",
    controlIds: [16, 17, 18, 19],
  });
  localFailure(duplicate, "duplicate authority");

  const conflict: IAutoMovieBicubicAtlasGeometry = two();
  binds(conflict);
  conflict.controls.push(
    ...Array.from(
      { length: 4 },
      (_: unknown, i: number): { x: number; y: number; z: number } => ({
        x: 0,
        y: i / 3,
        z: 1,
      }),
    ),
  );
  conflict.boundaryAuthorities!.push({
    id: "left",
    controlIds: [32, 33, 34, 35],
  });
  conflict.boundaryBindings!.push({
    patch: "plane",
    side: 3,
    authority: "left",
    start: 0,
    end: 1,
    normalFan: "left-bank",
  });
  localFailure(conflict, "canonical endpoint conflict");
  TestValidator.predicate(
    "conflicting authority is named",
    realizeAutoMovieBicubicAtlas64(conflict).diagnostics.some(
      (message: string): boolean =>
        message.includes("canonical-coefficient-conflict"),
    ),
  );
  for (let i: number = 32; i < 36; i++) conflict.controls[i]!.z = 0;
  TestValidator.equals(
    "compatible endpoints retain both charts",
    realizeAutoMovieBicubicAtlas64(conflict).complete,
    true,
  );
  conflict.boundaryBindings![1]!.start = 1;
  conflict.boundaryBindings![1]!.end = 0;
  conflict.boundaryAuthorities![1]!.controlIds.reverse();
  TestValidator.equals(
    "reversed authority and interval agree",
    realizeAutoMovieBicubicAtlas64(conflict).complete,
    true,
  );

  const mixed: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
  mixed.tolerance = 0.001;
  mixed.maxCells = 4096;
  mixed.maxVertices = 16384;
  mixed.controls.push(
    ...mixed.controls.map(
      (point: {
        x: number;
        y: number;
        z: number;
      }): { x: number; y: number; z: number } => ({
        x: -point.x,
        y: -point.y,
        z: 0,
      }),
    ),
  );
  mixed.patches.push({
    id: "unbound-neighbor",
    controlIds: Array.from({ length: 16 }, (_: unknown, i: number): number =>
      i === 0 ? 0 : i + 16,
    ),
  });
  mixed.controls.push(
    ...Array.from(
      { length: 4 },
      (_: unknown, i: number): { x: number; y: number; z: number } => ({
        x: i / 3,
        y: 0,
        z: 1,
      }),
    ),
  );
  mixed.boundaryAuthorities = [
    { id: "lifted-bottom", controlIds: [32, 33, 34, 35] },
  ];
  mixed.boundaryBindings = [
    {
      patch: "plane",
      side: 0,
      authority: "lifted-bottom",
      start: 0,
      end: 1,
      normalFan: "lifted-bank",
    },
  ];
  const joined: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(mixed);
  const aliases: Set<number | null> = new Set();
  for (let i: number = 0; i < joined.mesh.positions.length / 3; i++) {
    const p: number[] = joined.mesh.positions.slice(i * 3, i * 3 + 3);
    if (nclose(p[0]!, 0) && nclose(p[1]!, 0)) {
      TestValidator.predicate(
        "canonical shared corner position",
        nclose(p[2]!, 1),
      );
      aliases.add(joined.mesh.physicalVertices!.vertices[i]!);
    }
  }
  TestValidator.equals(
    "declared corner keeps one physical identity",
    aliases.size,
    1,
  );
  const observed: number[] = [];
  for (const range of joined.primitiveRanges)
    if (range.patch === "unbound-neighbor")
      for (
        let t: number = range.firstTriangle;
        t < range.firstTriangle + range.triangleCount;
        t++
      ) {
        const p: number[][] = joined.mesh
          .indices!.slice(t * 3, t * 3 + 3)
          .map((id: number): number[] =>
            joined.mesh.positions.slice(id * 3, id * 3 + 3),
          );
        const ax: number = p[1]![0]! - p[0]![0]!,
          ay: number = p[1]![1]! - p[0]![1]!,
          bx: number = p[2]![0]! - p[0]![0]!,
          by: number = p[2]![1]! - p[0]![1]!,
          determinant: number = ax * by - ay * bx;
        if (determinant === 0) continue;
        const x: number = -0.5 - p[0]![0]!,
          y: number = -0.5 - p[0]![1]!,
          b: number = (x * by - y * bx) / determinant,
          c: number = (ax * y - ay * x) / determinant,
          a: number = 1 - b - c;
        if (
          [a, b, c].every(
            (weight: number): boolean => weight >= -64 * Number.EPSILON,
          )
        )
          observed.push(a * p[0]![2]! + b * p[1]![2]! + c * p[2]![2]!);
      }
  TestValidator.equals(
    "constructed neighbor remains complete",
    joined.complete,
    true,
  );
  TestValidator.predicate(
    "neighbor PL approximates constructed corner field",
    observed.length > 0 &&
      observed.every((z: number): boolean =>
        nclose(z, 1 / 64, mixed.tolerance + 1e-12),
      ),
  );

  for (const reversed of [false, true]) {
    const adjacent: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
    adjacent.tolerance = 0.1;
    adjacent.maxCells = 256;
    adjacent.maxVertices = 4096;
    adjacent.controls.push(
      ...Array.from(
        { length: 16 },
        (_: unknown, i: number): { x: number; y: number; z: number } => ({
          x: 1 + (i % 4) / 3,
          y: reversed ? 1 - Math.floor(i / 4) / 3 : Math.floor(i / 4) / 3,
          z: 0,
        }),
      ),
    );
    adjacent.patches.push({
      id: "adjacent",
      controlIds: Array.from({ length: 16 }, (_: unknown, i: number): number =>
        i % 4 === 0
          ? (reversed ? 3 - Math.floor(i / 4) : Math.floor(i / 4)) * 4 + 3
          : i + 16,
      ),
    });
    adjacent.controls.push(
      ...[0, 1, 1, 0].map(
        (z: number, i: number): { x: number; y: number; z: number } => ({
          x: 1,
          y: i / 3,
          z,
        }),
      ),
    );
    adjacent.boundaryAuthorities = [
      { id: "joint", controlIds: [32, 33, 34, 35] },
    ];
    adjacent.boundaryBindings = [
      {
        patch: "plane",
        side: 1,
        authority: "joint",
        start: 0,
        end: 1,
        normalFan: "explicit",
      },
    ];
    const forward: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
      realizeAutoMovieBicubicAtlas64(adjacent);
    TestValidator.equals("complete shared edge", forward.complete, true);
    const edgeOwners: Map<
      string,
      { owner: Set<number | null>; count: number }
    > = new Map();
    for (let i: number = 0; i < forward.mesh.positions.length / 3; i++)
      if (nclose(forward.mesh.positions[i * 3]!, 1, 1e-12)) {
        const key: string = `${forward.mesh.positions[i * 3 + 1]}:${forward.mesh.positions[i * 3 + 2]}`;
        const observed: { owner: Set<number | null>; count: number } =
          edgeOwners.get(key) ?? { owner: new Set(), count: 0 };
        observed.owner.add(forward.mesh.physicalVertices!.vertices[i]!);
        observed.count++;
        edgeOwners.set(key, observed);
      }
    TestValidator.predicate(
      "bound and legacy normal banks share positions",
      [...edgeOwners.values()].every(
        (value: { owner: Set<number | null>; count: number }): boolean =>
          value.owner.size === 1 && value.count >= 2,
      ),
    );
    TestValidator.predicate(
      "canonical cubic midpoint",
      [...edgeOwners.keys()].some((key: string): boolean => {
        const values: number[] = key.split(":").map(Number);
        return nclose(values[0]!, 0.5) && nclose(values[1]!, 0.75);
      }),
    );
    adjacent.patches.reverse();
    const backward: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
      realizeAutoMovieBicubicAtlas64(adjacent);
    const ordered: (values: number[]) => number[][] = (
      values: number[],
    ): number[][] =>
      Array.from(
        { length: values.length / 3 },
        (_: unknown, i: number): number[] => values.slice(i * 3, i * 3 + 3),
      ).sort(
        (a: number[], b: number[]): number =>
          a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]!,
      );
    const before: number[][] = ordered(forward.mesh.positions),
      after: number[][] = ordered(backward.mesh.positions);
    TestValidator.predicate(
      "patch permutation preserves generated field",
      before.length === after.length &&
        before.every((point: number[], i: number): boolean =>
          point.every((value: number, axis: number): boolean =>
            nclose(value, after[i]![axis]!, 1e-12),
          ),
        ),
    );
    adjacent.boundaryAuthorities.push({
      id: "equivalent-joint",
      controlIds: [32, 33, 34, 35],
    });
    adjacent.boundaryBindings.push({
      patch: "adjacent",
      side: 3,
      authority: "equivalent-joint",
      start: reversed ? 1 : 0,
      end: reversed ? 0 : 1,
      normalFan: "second-explicit",
    });
    const equivalent: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
      realizeAutoMovieBicubicAtlas64(adjacent);
    TestValidator.equals(
      "different equivalent authority retains geometry",
      equivalent.complete,
      true,
    );
    TestValidator.predicate(
      "equivalent field is finite",
      equivalent.mesh.indices!.length > 0 &&
        equivalent.mesh.positions.every(Number.isFinite),
    );
    TestValidator.predicate(
      "inter-authority transport limitation is explicit",
      equivalent.diagnostics.some((message: string): boolean =>
        message.includes("canonical-relation-unqualified"),
      ),
    );
  }

  const direct: tessellateAutoMovieBicubicAtlas64.Input = {
    topologyDomain: "direct",
    controlsMm: [[0, 0, 0]],
    patches: [],
    toleranceMm: 1,
    maxCells: 1,
    maxVerticesPerChunk: 3,
    boundaryAuthorities: [
      {
        id: "sparse",
        controlIds: new Array<number>(4) as unknown as [
          number,
          number,
          number,
          number,
        ],
      },
    ],
  };
  let refused: boolean = false;
  try {
    tessellateAutoMovieBicubicAtlas64(direct).next();
  } catch (error) {
    refused = error instanceof Error;
  }
  TestValidator.predicate("direct stream refuses sparse authority", refused);
}
