import { TestValidator } from "@nestia/e2e";

import { realizeAutoMovieBicubicAtlas64 } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import type { IAutoMovieBicubicAtlasGeometry } from "../../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry";
import { buildGeometry } from "../../../../packages/viewer/src/buildGeometry";
import { bicubicAtlasRealizationOracle as R } from "../internal/bicubicAtlasRealizationOracle";
import { createBicubicPlaneRecipe } from "../internal/createBicubicPlaneRecipe";
import { nclose } from "../internal/nclose";

const { translatedFaces, squareArea }: typeof R = R;

/**
 * Public atlas realization preserves physical units, ownership and partial budgets.
 * Scenarios:
 * 1. A degree-elevated unit square has area one, positive z normals and metre bounds.
 * 2. Independent coincident charts keep separate render and physical identities.
 * 3. A vertex budget retains a finite complete earlier chart and reports the omitted chart.
 * 4. Cell retention separates domain completeness from approximation qualification.
 * 5. An empty atlas remains incomplete and source-fit warnings do not suppress finite geometry.
 * 6. The generic viewer CPU upload retains an independent chart beside a malformed binding and releases its geometry.
 * 7. A coarse field followed by arithmetic failure cannot report complete processing.
 * 8. Identical quarter cubics translated by station gaps 1 and 0.0001 mm retain station-parallel triangle planes at fine and coarse position requests and two power-of-two scales. Two adjacent station intervals share their actual indices; four declared quarter charts also close the periodic seam.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public engine realizer and generic viewer CPU geometry builder, asserting generated area, direction, metre bounds, physical identity, budget status, retained upload beside an invalid bound patch and disposal. Actual positions and indices independently determine translated-field face planes, signed edge incidence, shared station/periodic boundaries and extrusion area. All translation cases are collected before assertions, so one bad center fan cannot hide other regimes. Normal attributes cannot satisfy the face-plane assertion.
 * @evidence contracts/testing.md#independent-expectations The degree elevation of (u,v,0) has area one and normal (0,0,1), regardless of triangle count. Disconnected control identities remain independent at equal coordinates. For P(u,s)=(x(u),s,z(u)), both analytic and conforming extruded polygon face normals have zero station component; actual bottom-edge length times total station height supplies the PL area. A gamma(64) binary64 arithmetic allowance scales with squared transverse diameter, not gap or an arbitrary angle. Shared control IDs independently require opposed interior edge uses. Cross products at scale 1e200 require local incompletion beside the finite square. These cases certify neither general immersion, source fidelity nor rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Exercises an affine chart, independent coincidence, sufficient and insufficient vertex budgets, strict and coarse cell budgets, subsequent arithmetic failure, orphan compaction, finite CPU upload, empty patches and unqualified source fit. Translated curved fields cover open and periodic course boundaries, adjacent stations, small gaps, coarse requests and powers-of-two scale while preserving coefficients. Malformed admission and phase partition semantics belong to companion tests.
 * @evidence contracts/testing.md#execution-ownership This discoverable named test imports portable engine and viewer CPU builder source and constructs general polynomial squares and translated quarter cubics only. Three buffer construction and disposal start no host, process, browser, GPU or native build; no consumer is installed and no cases are dynamically registered. CPU upload does not prove actual rendered appearance.
 */
export function test_geometry_bicubic_atlas_realization(): void {
  const recipe: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
  const original: string = JSON.stringify(recipe);
  const generated: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(recipe);
  TestValidator.equals("affine complete", generated.complete, true);
  TestValidator.equals(
    "affine approximation",
    generated.approximationQualified,
    true,
  );
  let area: number = 0;
  for (let i: number = 0; i < generated.mesh.indices!.length; i += 3) {
    const ids: number[] = generated.mesh.indices!.slice(i, i + 3);
    const points: number[][] = ids.map((id: number): number[] =>
      generated.mesh.positions.slice(id * 3, id * 3 + 3),
    );
    const determinant: number =
      (points[1]![0]! - points[0]![0]!) * (points[2]![1]! - points[0]![1]!) -
      (points[1]![1]! - points[0]![1]!) * (points[2]![0]! - points[0]![0]!);
    TestValidator.predicate("positive winding", determinant > 0);
    area += determinant / 2;
  }
  TestValidator.predicate("unit square area in metres", nclose(area, 1, 1e-12));
  for (let i: number = 0; i < generated.mesh.positions.length; i += 3) {
    TestValidator.predicate(
      "metre square bounds",
      generated.mesh.positions[i]! >= 0 &&
        generated.mesh.positions[i]! <= 1 &&
        generated.mesh.positions[i + 1]! >= 0 &&
        generated.mesh.positions[i + 1]! <= 1 &&
        nclose(generated.mesh.positions[i + 2]!, 0, 1e-12),
    );
    TestValidator.predicate(
      "own analytic normal",
      nclose(generated.mesh.normals![i]!, 0) &&
        nclose(generated.mesh.normals![i + 1]!, 0) &&
        nclose(generated.mesh.normals![i + 2]!, 1),
    );
  }
  TestValidator.equals(
    "input remains unchanged",
    JSON.stringify(recipe),
    original,
  );

  const independent: IAutoMovieBicubicAtlasGeometry =
    createBicubicPlaneRecipe();
  independent.controls.push(
    ...independent.controls.map(
      (point: {
        x: number;
        y: number;
        z: number;
      }): { x: number; y: number; z: number } => ({ ...point }),
    ),
  );
  independent.patches.push({
    id: "coincident-independent",
    controlIds: Array.from(
      { length: 16 },
      (_: unknown, i: number): number => i + 16,
    ),
  });
  const doubled: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(independent);
  const firstIds: Set<number> = new Set(
    doubled.primitiveRanges
      .filter(
        (range: (typeof doubled.primitiveRanges)[number]): boolean =>
          range.patch === "plane",
      )
      .flatMap((range: (typeof doubled.primitiveRanges)[number]): number[] =>
        doubled.mesh.indices!.slice(
          range.firstTriangle * 3,
          (range.firstTriangle + range.triangleCount) * 3,
        ),
      ),
  );
  const secondIds: number[] = doubled.primitiveRanges
    .filter(
      (range: (typeof doubled.primitiveRanges)[number]): boolean =>
        range.patch === "coincident-independent",
    )
    .flatMap((range: (typeof doubled.primitiveRanges)[number]): number[] =>
      doubled.mesh.indices!.slice(
        range.firstTriangle * 3,
        (range.firstTriangle + range.triangleCount) * 3,
      ),
    );
  TestValidator.predicate(
    "independent chart indices",
    firstIds.size > 0 &&
      secondIds.length > 0 &&
      secondIds.every((id: number): boolean => !firstIds.has(id)),
  );
  TestValidator.equals(
    "independent physical identities",
    new Set(doubled.mesh.physicalVertices!.vertices).size,
    doubled.mesh.positions.length / 3,
  );
  independent.maxVertices = 5;
  const partial: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(independent);
  TestValidator.equals("vertex budget is partial", partial.complete, false);
  TestValidator.predicate(
    "complete earlier chart survives",
    partial.primitiveRanges.length > 0 &&
      partial.primitiveRanges.every(
        (range: (typeof partial.primitiveRanges)[number]): boolean =>
          range.patch === "plane",
      ) &&
      nclose(squareArea(partial), 1, 1e-12),
  );
  TestValidator.predicate(
    "vertex gap is explicit",
    partial.diagnostics.some((message: string): boolean =>
      message.includes("maxVertices"),
    ),
  );

  const curved: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
  curved.controls[5]!.z = 1;
  curved.maxCells = 1;
  const strict: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(curved);
  TestValidator.equals(
    "strict budget leaves explicit gap",
    strict.complete,
    false,
  );
  curved.cellBudgetPolicy = "retain-coarse";
  const coarse: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(curved);
  TestValidator.equals("coarse retains whole domain", coarse.complete, true);
  TestValidator.equals(
    "coarse is unqualified",
    coarse.approximationQualified,
    false,
  );
  TestValidator.predicate(
    "coarse finite geometry survives",
    coarse.mesh.indices!.length > 0 &&
      coarse.mesh.positions.every(Number.isFinite),
  );
  TestValidator.equals(
    "retained coarse population",
    coarse.counts.retainedCoarseCells,
    1,
  );

  const arithmetic: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
  arithmetic.controls = arithmetic.controls.map(
    (
      point: { x: number; y: number; z: number },
      i: number,
    ): { x: number; y: number; z: number } => ({
      x: point.x * 1e200,
      y: point.y * 1e200,
      z: i === 5 ? 1e200 : 0,
    }),
  );
  arithmetic.controls.push(...createBicubicPlaneRecipe().controls);
  arithmetic.patches.push({
    id: "finite-independent",
    controlIds: Array.from(
      { length: 16 },
      (_: unknown, i: number): number => i + 16,
    ),
  });
  arithmetic.cellBudgetPolicy = "retain-coarse";
  arithmetic.maxCells = 2;
  const failedArithmetic: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(arithmetic);
  TestValidator.equals(
    "coarse warning cannot conceal emission failure",
    failedArithmetic.complete,
    false,
  );
  TestValidator.predicate(
    "finite independent triangles survive arithmetic failure",
    failedArithmetic.mesh.indices!.length > 0 &&
      nclose(squareArea(failedArithmetic), 1, 1e-12),
  );
  TestValidator.predicate(
    "arithmetic gap remains explicit",
    failedArithmetic.diagnostics.some((message: string): boolean =>
      message.includes("arithmetic-unprocessed"),
    ),
  );
  TestValidator.predicate(
    "failed unreferenced vertices cannot contaminate bounds",
    failedArithmetic.mesh.positions.every(
      (value: number): boolean => Math.abs(value) <= 1,
    ),
  );
  TestValidator.predicate(
    "retained indices use compacted render vertices",
    failedArithmetic.mesh.indices!.every(
      (index: number): boolean =>
        index >= 0 && index < failedArithmetic.mesh.positions.length / 3,
    ),
  );
  TestValidator.predicate(
    "physical owner IDs survive render compaction",
    failedArithmetic.mesh.physicalVertices!.sources.every(
      (source: { domain: string; id: number }): boolean => source.id >= 3,
    ),
  );
  const ownedRanges: typeof failedArithmetic.primitiveRanges =
    failedArithmetic.primitiveRanges.filter(
      (range: (typeof failedArithmetic.primitiveRanges)[number]): boolean =>
        range.triangleCount > 0,
    );
  let ownedTriangles: number = 0;
  const contiguousOwnership: boolean = ownedRanges.every(
    (range: (typeof ownedRanges)[number]): boolean => {
      const firstTriangle: number = ownedTriangles;
      ownedTriangles += range.triangleCount;
      return (
        range.patch === "finite-independent" &&
        range.firstTriangle === firstTriangle
      );
    },
  );
  TestValidator.predicate(
    "triangle ownership keeps ordinals",
    ownedRanges.length > 0 &&
      contiguousOwnership &&
      ownedTriangles * 3 === failedArithmetic.mesh.indices!.length,
  );
  const arithmeticUpload: ReturnType<typeof buildGeometry> =
    buildGeometry(arithmetic);
  try {
    TestValidator.predicate(
      "independent chart uploads after arithmetic omission",
      Array.from(arithmeticUpload.getAttribute("position").array).every(
        Number.isFinite,
      ),
    );
  } finally {
    arithmeticUpload.dispose();
  }

  const empty: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
  empty.patches = [];
  TestValidator.equals(
    "empty is incomplete",
    realizeAutoMovieBicubicAtlas64(empty).complete,
    false,
  );
  recipe.sourceFit = {
    qualified: false,
    maximumResidual: null,
    unqualifiedPatches: ["plane"],
    diagnostics: ["no independent source observations"],
  };
  const unqualified: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(recipe);
  TestValidator.equals(
    "unqualified fit retains complete field",
    unqualified.complete,
    true,
  );
  TestValidator.predicate(
    "unqualified fit retains square",
    unqualified.mesh.indices!.length > 0 &&
      nclose(squareArea(unqualified), 1, 1e-12),
  );
  TestValidator.predicate(
    "source fit warning survives",
    unqualified.diagnostics.some((message: string): boolean =>
      message.includes("source-fit unqualified"),
    ),
  );

  const display: IAutoMovieBicubicAtlasGeometry = createBicubicPlaneRecipe();
  display.patches.push({ id: "invalid", controlIds: [-1] });
  display.boundaryAuthorities = [{ id: "existing", controlIds: [0, 1, 2, 3] }];
  display.boundaryBindings = [
    {
      patch: "invalid",
      side: 0,
      authority: "existing",
      start: 0,
      end: 1,
      normalFan: "invalid-bank",
    },
  ];
  const uploaded: ReturnType<typeof buildGeometry> = buildGeometry(display);
  let disposed: number = 0;
  uploaded.addEventListener("dispose", (): void => {
    disposed++;
  });
  try {
    const position: ReturnType<typeof uploaded.getAttribute> =
      uploaded.getAttribute("position");
    TestValidator.predicate(
      "independent CPU upload survives malformed binding",
      position.count > 0 && Array.from(position.array).every(Number.isFinite),
    );
    TestValidator.equals(
      "CPU upload retains processing qualification",
      uploaded.userData.automovieAtlasRealization.complete,
      false,
    );
    TestValidator.predicate(
      "CPU upload retains local diagnostics",
      uploaded.userData.automovieAtlasRealization.diagnostics.length > 0,
    );
  } finally {
    uploaded.dispose();
  }
  TestValidator.equals("owned CPU geometry releases", disposed, 1);

  const observations: {
    scale: number;
    gapMm: number;
    toleranceMm: number;
    periodic: boolean;
    complete: boolean;
    immutable: boolean;
    owned: boolean;
    faces?: ReturnType<typeof translatedFaces>;
    failure?: string;
  }[] = [];
  for (const scale of [1, 2 ** -8, 2 ** 8])
    for (const gap of [1, 0.0001])
      for (const tolerance of [0.05, 0.5])
        for (const periodic of [false, true]) {
          const radius: number = scale,
            height: number = gap * scale,
            k: number = (4 / 3) * Math.tan(Math.PI / 8);
          const quarter: [number, number][] = [
            [1, 0],
            [1, k],
            [k, 1],
            [0, 1],
          ];
          const columns: number = periodic ? 12 : 4;
          const controls: IAutoMovieBicubicAtlasGeometry["controls"] =
            Array.from(
              { length: 7 * columns },
              (
                _: unknown,
                id: number,
              ): IAutoMovieBicubicAtlasGeometry["controls"][number] => {
                const column: number = id % columns,
                  quadrant: number = periodic ? Math.floor(column / 3) : 0,
                  p: [number, number] =
                    quarter[periodic ? column % 3 : column]!;
                const xz: [number, number] =
                  quadrant === 0
                    ? p
                    : quadrant === 1
                      ? [-p[1], p[0]]
                      : quadrant === 2
                        ? [-p[0], -p[1]]
                        : [p[1], -p[0]];
                return {
                  x: xz[0] * radius * 0.001,
                  y: (Math.floor(id / columns) / 3) * height * 0.001,
                  z: xz[1] * radius * 0.001,
                };
              },
            );
          const translated: IAutoMovieBicubicAtlasGeometry = {
            type: "bicubic-atlas",
            topologyDomain: "general-translated-quarter",
            controls,
            patches: [0, 1].flatMap(
              (interval: number): IAutoMovieBicubicAtlasGeometry["patches"] =>
                Array.from(
                  { length: periodic ? 4 : 1 },
                  (
                    _: unknown,
                    quarter: number,
                  ): IAutoMovieBicubicAtlasGeometry["patches"][number] => ({
                    id: `interval-${interval}-quarter-${quarter}`,
                    controlIds: Array.from(
                      { length: 16 },
                      (_unused: unknown, slot: number): number =>
                        (interval * 3 + Math.floor(slot / 4)) * columns +
                        (periodic
                          ? (quarter * 3 + (slot % 4)) % columns
                          : slot % 4),
                    ),
                  }),
                ),
            ),
            tolerance: tolerance * scale * 0.001,
            maxCells: 2048,
            maxVertices: 8192,
          };
          const snapshot: string = JSON.stringify(translated);
          const record: (typeof observations)[number] = {
            scale,
            gapMm: height,
            toleranceMm: tolerance * scale,
            periodic,
            complete: false,
            immutable: false,
            owned: false,
          };
          try {
            const output: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
              realizeAutoMovieBicubicAtlas64(translated);
            record.complete =
              output.complete &&
              output.approximationQualified &&
              output.counts.omittedZeroAreaTriangles === 0;
            record.immutable = JSON.stringify(translated) === snapshot;
            record.owned =
              new Set(
                output.primitiveRanges
                  .filter(
                    (range: (typeof output.primitiveRanges)[number]): boolean =>
                      range.triangleCount > 0,
                  )
                  .map(
                    (range: (typeof output.primitiveRanges)[number]): string =>
                      range.patch,
                  ),
              ).size === translated.patches.length;
            record.faces = translatedFaces(
              output.mesh.positions,
              output.mesh.indices!,
              radius * 0.001,
              height * 0.001,
              periodic,
            );
          } catch (failure: unknown) {
            record.failure =
              failure instanceof Error ? failure.message : String(failure);
          }
          observations.push(record);
        }
  console.log(
    JSON.stringify({
      schema: "generic-atlas-translated-face-regression-v1",
      observations,
    }),
  );
  for (const record of observations) {
    TestValidator.predicate(
      "translated curved charts retain complete immutable owned geometry",
      record.failure === undefined &&
        record.complete &&
        record.immutable &&
        record.owned &&
        record.faces?.finite === true,
    );
    TestValidator.predicate(
      "translated curved face planes introduce no station-axis tilt",
      record.faces?.flatAlongStation === true,
    );
    TestValidator.predicate(
      "translated curved faces retain orientation and extrusion area",
      record.faces?.oriented === true && record.faces.areaMatchesBoundary,
    );
    TestValidator.predicate(
      "adjacent and periodic charts retain opposed shared boundary indices",
      record.faces?.conforming === true &&
        record.faces.middleEdges > 0 &&
        (!record.periodic || record.faces.seamEdges > 0),
    );
  }
}
