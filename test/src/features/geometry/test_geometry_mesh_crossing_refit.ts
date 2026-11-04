import {
  type IAutoMovieMeshCrossing,
  type IAutoMovieMeshCrossingOptions,
  type IAutoMovieMeshCrossingQuery,
  createAutoMovieMeshCrossingQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/** Author independent consecutive triangle corners, without a transform implementation. */
function mesh(positions: number[]): IAutoMovieMesh {
  return { positions, indices: null, normals: null, uvs: null, skin: null };
}

/** Apply a test's explicitly authored affine map to each supplied vertex. */
function placed(
  source: IAutoMovieMesh,
  map: (point: readonly number[]) => number[],
): IAutoMovieMesh {
  const positions: number[] = [];
  for (let scalar: number = 0; scalar < source.positions.length; scalar += 3)
    positions.push(...map(source.positions.slice(scalar, scalar + 3)));
  return { ...source, positions };
}

/** A copied world intersection and original triangle pair observed by the classifier. */
interface IWitness {
  /** Independent XYZ copy from the callback's common world frame. */
  point: readonly number[];

  /** Original current-subject ordinal. */
  first: number;

  /** Original fixed-target ordinal. */
  second: number;
}

/**
 * Fixed-partition snapshots use actual world corners and world ordering even
 * under affine, mirrored and independently articulated placement.
 *
 * Scenarios:
 * 1. Literal shear/nonuniform-scale and mirrored world coordinates keep known
 *    flat/transverse intersections, with the independently determined world
 *    cell order and transverse-preferred default witness.
 * 2. Fresh and refitted queries preserve per-point caps, exact callback order,
 *    world witness coordinates and dimensionless tolerance/boolean semantics.
 * 3. Separately addressed seam copies can move apart; the moved triangle keeps
 *    its original ordinal and its newly placed actual plane.
 * 4. A closed tetrahedron reports a known base piercing while a triangle wholly
 *    inside has no surface crossing; refitting introduces no signed certificate.
 * 5. Thirteen mirrored blades change both the preferred partition axis and
 *    world ordering cell, retaining a literal crossing order across leaves.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the supported factory/withPositions/census/boolean APIs and checks independently authored crossing records, world candidate order, transverse preference, callback point caps/order, tolerance, articulated seams and closed-surface crossing versus containment. Compares fresh construction with refit at the same actual world buffers to catch stale boxes/cell, omitted ordinals or a local-space shortcut.
 * @evidence contracts/testing.md#independent-expectations The reference z=0 triangle contains a small flat triangle and is pierced by two vertical blades. Explicit nonsingular affine maps preserve these strict geometric intersections; hand-derived world cell order reverses the blade order under the mirrored map. A raised independently addressed triangle intersects its authored blade, and the tetrahedron probe crosses only its z=0 base. Literal witness identities precede fresh/refit compatibility checks; binary64 witness coordinates use nclose and do not prove CCD or containment.
 * @evidence contracts/testing.md#distinguishing-cases Includes nonuniform scale/shear versus rigid placement and reflection, world ordering across multiple retained leaves, flat versus transverse/default/all-pairs, accepted versus rejected endpoints, exact callback sequence, large interior tolerance, separated seam copies, closed base crossing and noncrossing interior. The ownership companion owns degenerate transitions, empty layouts, malformed positions and snapshot mutation.
 * @evidence contracts/testing.md#execution-ownership The discoverable named portable geometry test owns its affine maps and authored triangles and calls public Engine APIs only. It uses existing scalar predicates and starts no compiler, browser, GPU, process, benchmark or dynamic case registration.
 */
export function test_geometry_mesh_crossing_refit(): void {
  const plane: IAutoMovieMesh = mesh([0, 0, 0, 2, 0, 0, 0, 2, 0]);
  const target: IAutoMovieMesh = mesh([
    0.1, 0.4, 0, 0.3, 0.4, 0, 0.1, 0.6, 0, 0.2, 0.2, -1, 0.2, 0.2, 1, 0.8, 0.2,
    1, 0.8, 0.2, -1, 0.8, 0.2, 1, 1.4, 0.2, 1,
  ]);
  const template: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(target);
  const cases: readonly {
    name: string;
    map: (point: readonly number[]) => number[];
    order: readonly number[];
    cap: (point: readonly number[]) => boolean;
  }[] = [
    {
      name: "nonuniform scale and shear",
      map: (point: readonly number[]): number[] => [
        2 * point[0]! + 0.5 * point[2]!,
        3 * point[1]!,
        0.5 * point[2]!,
      ],
      order: [0, 1, 2],
      cap: (point: readonly number[]): boolean => point[0]! > 0.6,
    },
    {
      name: "mirrored affine world cell order",
      map: (point: readonly number[]): number[] => [
        -2 * point[0]! + 0.5 * point[2]!,
        3 * point[1]!,
        0.5 * point[2]!,
      ],
      order: [2, 1, 0],
      cap: (point: readonly number[]): boolean => {
        return point[0]! < -0.6;
      },
    },
    {
      name: "rigid quarter turn and translation",
      map: (point: readonly number[]): number[] => [
        point[2]! + 4,
        point[1]! - 2,
        -point[0]! + 3,
      ],
      order: [0, 1, 2],
      cap: (point: readonly number[]): boolean => {
        return point[2]! < 2.7;
      },
    },
  ];
  for (const scenario of cases) {
    const world: IAutoMovieMesh = placed(target, scenario.map);
    const subject: IAutoMovieMesh = placed(plane, scenario.map);
    const refitted: IAutoMovieMeshCrossingQuery = template.withPositions(
      world.positions,
    );
    const fresh: IAutoMovieMeshCrossingQuery =
      createAutoMovieMeshCrossingQuery(world);
    const expected: IAutoMovieMeshCrossing[] = scenario.order.map(
      (other: number): IAutoMovieMeshCrossing => ({
        triangle: 0,
        other,
        coplanar: other === 0,
      }),
    );
    const firstTransverse: IAutoMovieMeshCrossing = expected.find(
      (entry: IAutoMovieMeshCrossing): boolean => !entry.coplanar,
    )!;
    TestValidator.equals(
      `${scenario.name} independent full world order`,
      refitted(subject, { allPairs: true }),
      expected,
    );
    TestValidator.equals(
      `${scenario.name} fresh full world order`,
      fresh(subject, { allPairs: true }),
      expected,
    );
    TestValidator.equals(
      `${scenario.name} default transverse preference`,
      refitted(subject),
      [firstTransverse],
    );
    TestValidator.equals(
      `${scenario.name} fresh default preference`,
      fresh(subject),
      [firstTransverse],
    );
    TestValidator.equals(
      `${scenario.name} real witnessed boolean`,
      refitted.crosses(subject),
      true,
    );

    const logs: IWitness[][] = [[], []];
    const capped: IAutoMovieMeshCrossing[] = expected.filter(
      (entry: IAutoMovieMeshCrossing): boolean => entry.other !== 2,
    );
    for (const [index, query] of [refitted, fresh].entries()) {
      const options: IAutoMovieMeshCrossingOptions = {
        allPairs: true,
        acceptTransversePoint: (
          point: readonly number[],
          first: number,
          second: number,
        ): boolean => {
          logs[index]!.push({ point: [...point], first, second });
          return second === 1 && scenario.cap(point);
        },
      };
      TestValidator.equals(
        `${scenario.name} cap removes endpoints not the pair`,
        query(subject, options),
        capped,
      );
      TestValidator.equals(
        `${scenario.name} callback pair order`,
        logs[index]!.map((entry: IWitness): number[] => [
          entry.first,
          entry.second,
        ]),
        scenario.order
          .filter((other: number): boolean => other !== 0)
          .flatMap((other: number): number[][] => [
            [0, other],
            [0, other],
          ]),
      );
    }
    TestValidator.predicate(
      `${scenario.name} same actual world callback coordinates`,
      logs[0]!.every((entry: IWitness, index: number): boolean =>
        entry.point.every((value: number, axis: number): boolean =>
          nclose(value, logs[1]![index]!.point[axis]!, 1e-12),
        ),
      ),
    );
  }

  const blades: number[] = [];
  for (let ordinal: number = 0; ordinal < 13; ordinal++) {
    const x: number = 0.1 + 0.04 * ordinal;
    blades.push(x, 0.2, -1, x, 0.2, 1, x + 0.1, 0.2, 1);
  }
  const partitioned: IAutoMovieMesh = mesh(blades);
  const mirrored: IAutoMovieMesh = placed(partitioned, cases[1]!.map);
  const mirroredPlane: IAutoMovieMesh = placed(plane, cases[1]!.map);
  const crossLeaves: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(partitioned).withPositions(
      mirrored.positions,
    );
  const acrossExpected: IAutoMovieMeshCrossing[] = [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 1, 2, 3,
  ].map(
    (other: number): IAutoMovieMeshCrossing => ({
      triangle: 0,
      other,
      coplanar: false,
    }),
  );

  // Mean world extent is one; blade lows cross cell -1 at original ordinal4.
  TestValidator.equals(
    "refitted multi-leaf world order",
    crossLeaves(mirroredPlane, { allPairs: true }),
    acrossExpected,
  );
  TestValidator.equals(
    "fresh multi-leaf world order",
    createAutoMovieMeshCrossingQuery(mirrored)(mirroredPlane, {
      allPairs: true,
    }),
    acrossExpected,
  );
  TestValidator.equals(
    "multi-leaf default retains first world candidate",
    crossLeaves(mirroredPlane),
    [acrossExpected[0]],
  );

  const onlyBlade: IAutoMovieMesh = mesh(target.positions.slice(9, 18));
  const bladeTemplate: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(onlyBlade);
  const bladeRefit: IAutoMovieMeshCrossingQuery = bladeTemplate.withPositions([
    ...onlyBlade.positions,
  ]);
  TestValidator.equals(
    "zero tolerance retains the strict piercing",
    bladeRefit(plane, { interiorTolerance: 0 }),
    [{ triangle: 0, other: 0, coplanar: false }],
  );
  TestValidator.equals(
    "dimensionless interior margin removes this near-boundary piercing",
    bladeRefit(plane, { interiorTolerance: 0.49 }),
    [],
  );
  TestValidator.equals(
    "boolean retains that margin",
    bladeRefit.crosses(plane, { interiorTolerance: 0.49 }),
    false,
  );

  const seam: IAutoMovieMesh = mesh([
    0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
  ]);
  const articulated: IAutoMovieMesh = {
    ...seam,
    positions: seam.positions.map((value: number, index: number): number =>
      index >= 9 && index % 3 === 2 ? value + 1 : value,
    ),
  };
  const probe: IAutoMovieMesh = mesh([
    0.75, 0.75, 0.5, 0.75, 0.75, 1.5, 0.9, 0.75, 1.5,
  ]);
  const seamTemplate: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(seam);
  TestValidator.equals(
    "original seam planes are below this probe",
    seamTemplate(probe),
    [],
  );
  TestValidator.equals(
    "separately addressed seam moves with its actual module",
    seamTemplate.withPositions(articulated.positions)(probe),
    [{ triangle: 0, other: 1, coplanar: false }],
  );
  TestValidator.equals(
    "fresh articulated seam has the same original witness",
    createAutoMovieMeshCrossingQuery(articulated)(probe),
    [{ triangle: 0, other: 1, coplanar: false }],
  );

  const tetrahedron: IAutoMovieMesh = mesh([
    0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0,
    0, 4, 4, 0, 0, 0, 0, 4, 0, 4, 0,
  ]);
  const throughBase: IAutoMovieMesh = mesh([
    0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5,
  ]);
  const interior: IAutoMovieMesh = mesh([
    0.5, 0.5, 0.5, 0.75, 0.5, 0.5, 0.5, 0.75, 0.5,
  ]);
  const shell: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(tetrahedron);
  for (const scenario of cases) {
    const world: IAutoMovieMesh = placed(tetrahedron, scenario.map);
    const refitted: IAutoMovieMeshCrossingQuery = shell.withPositions(
      world.positions,
    );
    const fresh: IAutoMovieMeshCrossingQuery =
      createAutoMovieMeshCrossingQuery(world);
    const subject: IAutoMovieMesh = placed(throughBase, scenario.map);
    const inside: IAutoMovieMesh = placed(interior, scenario.map);
    TestValidator.equals(
      `${scenario.name} closed base crossing`,
      refitted(subject, { allPairs: true }),
      [{ triangle: 0, other: 0, coplanar: false }],
    );
    TestValidator.equals(
      `${scenario.name} fresh closed base crossing`,
      fresh(subject),
      [{ triangle: 0, other: 0, coplanar: false }],
    );
    TestValidator.equals(
      `${scenario.name} containment is not surface crossing`,
      refitted(inside),
      [],
    );
    TestValidator.equals(
      `${scenario.name} boolean supplies no inside certificate`,
      refitted.crosses(inside),
      false,
    );
  }
}
