import { createAutoMovieMeshRayCaster } from "../../../../packages/engine/src/geometry/createAutoMovieMeshRayCaster";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { rayTriangleTravelOracle } from "../internal/rayTriangleTravelOracle";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { type IAutoMovieMeshRayCaster } from "../../../../packages/engine/src/geometry/IAutoMovieMeshRayCaster";
import { type IAutoMovieMeshRayHit } from "../../../../packages/engine/src/geometry/IAutoMovieMeshRayHit";

/**
 * Rays find the first resident triangle along them, through a hierarchy that
 * must agree with testing every triangle.
 *
 * Scenarios:
 * 1. Two parallel unit squares at z = 1 and z = 3 (two triangles each): a
 *    ray up from the origin inside them meets z = 1 first, at distance 1 for
 *    any direction length; with `minimum` past 1 it meets z = 3; within a
 *    shorter `maximum` it meets none; `blocked` agrees. Winding is
 *    immaterial; an edge belongs to its triangles; a grazing ray and one
 *    outside the squares pass.
 * 2. A field of 200 small triangles: for 300 rays the hierarchy's nearest
 *    distance equals the brute-force one (so the splits lose no triangle),
 *    and a ray parallel to an axis crosses boxes on that axis's plane.
 * 3. Editing caller buffers cannot change a built caster; nonindexed input
 *    finds the same hits; an empty mesh finds none.
 * 4. Incomplete, nonfinite or out-of-range buffers and a zero direction,
 *    nonfinite origin or inverted range refuse.
 * 5. Nearest-hit records retain original triangle ordinals through BVH sorting,
 *    select the lowest ordinal on shared-edge ties, preserve the legacy raw
 *    distance including both zero signs, and own their returned records.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds and queries the actual ray caster, checking nearest travel, range/blocked behavior, winding and grazing cases, hierarchy agreement, copied source ownership, ordinals/ties/raw zero signs and malformed input refusals. It detects lost or reordered resident triangles while preserving valid empty reports.
 * @evidence contracts/testing.md#independent-expectations Unit planes at z=1/3 determine analytic distances and ranges. The seeded 200-triangle/300-ray comparison exhaustively visits uncached triangles with a separate scalar triple-product oracle; it shares the Moller-Trumbore formula family and 1e-18 cutoff, so a common algebraic or threshold mistake can escape parity. Raw zero-sign assertions intentionally test representation ownership rather than approximate quantity.
 * @evidence contracts/testing.md#distinguishing-cases Retains varied direction lengths, minimum/maximum and blocked queries, edges/grazing/misses, all existing random draws, axis-aligned boxes, source mutation, implicit/empty input, invalid buffers/vectors/ranges, original ordinals, lowest-ordinal ties and owned records. No timing, exhaustive geometry-space coverage or GPU visibility is asserted.
 * @evidence contracts/testing.md#execution-ownership The named entry directly executes portable caster source and the existing uncached oracle on unchanged fixtures, including its original deterministic random sequence. It starts no process, browser, GPU or native build, installs no consumer and registers no additional cases.
 */
export function test_geometry_mesh_ray_caster(): void {
  const mesh: (positions: number[], indices: number[] | null) => IAutoMovieMesh = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const square: (z: number, flip: boolean) => { positions: number[]; indices: number[]; } = (z: number, flip: boolean): { positions: number[]; indices: number[]; }  => {
    const p: number[] = [0, 0, z, 1, 0, z, 1, 1, z, 0, 1, z];
    return {
      positions: p,
      indices: flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3],
    };
  };
  const a: { positions: number[]; indices: number[]; } = square(1, false);
  const b: { positions: number[]; indices: number[]; } = square(3, true);
  const positions: number[] = [...a.positions, ...b.positions];
  const indices: number[] = [...a.indices, ...b.indices.map((i: number): number  => i + 4)];
  const caster: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(mesh(positions, indices));
  const up: number[] = [0, 0, 5];
  TestValidator.predicate(
    "two planes",
    nclose(caster.nearest([0.3, 0.4, 0], up, 10)!, 1) &&
      nclose(caster.nearest([0.3, 0.4, 0], up, 10, 1.5)!, 3) &&
      caster.nearest([0.3, 0.4, 0], up, 0.5) === null &&
      caster.blocked([0.3, 0.4, 0], up, 10) &&
      !caster.blocked([0.3, 0.4, 0], up, 0.5) &&
      nclose(caster.nearest([0.5, 0.5, 0], up, 10)!, 1) &&
      nclose(caster.nearest([1, 1, 0], up, 10)!, 1) &&
      caster.nearest([0.3, 0.4, 1], [1, 0, 0], 10) === null &&
      caster.nearest([2, 2, 0], up, 10) === null &&
      nclose(caster.nearest([0.2, 0.2, 5], [0, 0, -1], 10)!, 2),
  );
  const firstHit: IAutoMovieMeshRayHit | null = caster.nearestHit([0.3, 0.4, 0], up, 10);
  const edgeHit: IAutoMovieMeshRayHit | null = caster.nearestHit([0.5, 0.5, 0], up, 1, 1);
  const laterHit: IAutoMovieMeshRayHit | null = caster.nearestHit([0.3, 0.4, 0], up, 10, 1.5);
  const reverseHit: IAutoMovieMeshRayHit | null = caster.nearestHit([0.2, 0.2, 5], [0, 0, -5], 10);
  TestValidator.predicate(
    "original identities, exact bounds and nonunit directions",
    firstHit !== null &&
      firstHit.triangle === 1 &&
      nclose(firstHit.distance, 1) &&
      edgeHit !== null &&
      edgeHit.triangle === 0 &&
      nclose(edgeHit.distance, 1) &&
      laterHit !== null &&
      laterHit.triangle === 3 &&
      nclose(laterHit.distance, 3) &&
      reverseHit !== null &&
      reverseHit.triangle === 2 &&
      nclose(reverseHit.distance, 2) &&
      caster.nearestHit([0.3, 0.4, 0], up, 0.5) === null,
  );
  const reversePlanes: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(
    mesh(
      [...b.positions, ...a.positions],
      [...b.indices, ...a.indices.map((id: number): number  => id + 4)],
    ),
  );
  const closer: IAutoMovieMeshRayHit | null = reversePlanes.nearestHit([0.3, 0.4, 0], up, 10);
  TestValidator.predicate(
    "a later closer hit resets its original identity",
    closer !== null && closer.triangle === 3 && nclose(closer.distance, 1),
  );
  const spread: number[] = [...a.positions];
  const spreadIndices: number[] = [...a.indices];
  for (const x of [-3, -2, -1, 1, 2, 3]) {
    const base: number = spread.length / 3;
    spread.push(x, 0, 3, x + 0.25, 0, 3, x, 0.25, 3);
    spreadIndices.push(base, base + 1, base + 2);
  }
  const splitCaster: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(mesh(spread, spreadIndices));
  const splitHit: IAutoMovieMeshRayHit | null = splitCaster.nearestHit([0.5, 0.5, 0], up, 10);
  TestValidator.predicate(
    "BVH order never replaces the original shared-edge ordinal",
    splitHit !== null &&
      splitHit.triangle === 0 &&
      nclose(splitHit.distance, 1),
  );
  for (const winding of [
    [0, 1, 2, 0, 2, 1],
    [0, 2, 1, 0, 1, 2],
  ]) {
    const onPlane: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(
      mesh([0, 0, 0, 1, 0, 0, 0, 1, 0], winding),
    );
    const hit: IAutoMovieMeshRayHit | null = onPlane.nearestHit([0.2, 0.2, 0], up, 1);
    const expectedZero: number = winding[1] === 1 ? 0 : -0;
    TestValidator.predicate(
      "metadata ties preserve the legacy raw sign of zero",
      hit !== null &&
        hit.triangle === 0 &&
        Object.is(hit.distance, expectedZero) &&
        Object.is(hit.distance, onPlane.nearest([0.2, 0.2, 0], up, 1)) &&
        onPlane.blocked([0.2, 0.2, 0], up, 1),
    );
  }
  firstHit!.distance = 100;
  firstHit!.triangle = 100;
  const independentHit: IAutoMovieMeshRayHit | null = caster.nearestHit([0.3, 0.4, 0], up, Infinity);
  TestValidator.predicate(
    "returned metadata is independent and retains the existing infinite limit",
    independentHit !== null &&
      independentHit.triangle === 1 &&
      nclose(independentHit.distance, 1),
  );
  // A field of small triangles and random rays against brute force.
  let seed: number = 7;
  const random: () => number = (): number  => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const field: number[] = [];
  for (let t: number = 0; t < 200; ++t) {
    const c: number[] = [random() * 4 - 2, random() * 4 - 2, random() * 4 - 2];
    for (let k: number = 0; k < 3; ++k)
      field.push(
        c[0] + random() * 0.6 - 0.3,
        c[1] + random() * 0.6 - 0.3,
        c[2] + random() * 0.6 - 0.3,
      );
  }
  const fieldCaster: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(mesh(field, null));
  // Decode caller-owned triangle corners once. The independent oracle still
  // visits all 200 triangles for every one of the original 300 rays.
  const oracleTriangles: { a: number[]; ab: number[]; ac: number[]; }[] = Array.from({length:200},(_: unknown,t: number): { a: number[]; ab: number[]; ac: number[]; } =>{
    const a: number[]=field.slice(9*t,9*t+3),b: number[]=field.slice(9*t+3,9*t+6),c: number[]=field.slice(9*t+6,9*t+9);
    return {a,ab:b.map((value: number,axis: number): number =>value-a[axis]!),ac:c.map((value: number,axis: number): number =>value-a[axis]!)};
  });
  const brute: (o: number[], d: number[]) => number | null = (o:number[],d:number[]):number|null=>{
    const length: number=Math.hypot(...d),unit: number[]=d.map((value: number): number =>value/length);
    let best:number|null=null;
    for(const triangle of oracleTriangles){
      const hit: number | null=rayTriangleTravelOracle(o,unit,triangle,20);
      if(hit!==null&&(best===null||hit<best))best=hit;
    }
    return best;
  };
  let agree: boolean = true;
  let hits: number = 0;
  for (let r: number = 0; r < 300; ++r) {
    const o: number[] = [random() * 6 - 3, random() * 6 - 3, random() * 6 - 3];
    const d: number[] =
      r % 10 === 0
        ? [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ][r % 3]!
        : [random() - 0.5, random() - 0.5, random() - 0.5];
    const expected: number | null = brute(o, d);
    const found: number | null = fieldCaster.nearest(o, d, 20);
    if (expected !== null) ++hits;
    if (
      (expected === null) !== (found === null) ||
      (expected !== null && !nclose(found!, expected, 1e-9)) ||
      fieldCaster.blocked(o, d, 20) !== (expected !== null)
    )
      agree = false;
  }
  TestValidator.predicate(
    "hierarchy agrees with brute force",
    agree && hits > 20,
  );
  const editable: IAutoMovieMesh = mesh([...positions], [...indices]);
  const frozen: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(editable);
  editable.positions.fill(100);
  editable.indices!.fill(0);
  const flat: number[] = indices.flatMap((i: number): number[]  => positions.slice(3 * i, 3 * i + 3));
  TestValidator.predicate(
    "snapshots, nonindexed input, empty mesh",
    nclose(frozen.nearest([0.3, 0.4, 0], up, 10)!, 1) &&
      nclose(
        createAutoMovieMeshRayCaster(mesh(flat, null)).nearest(
          [0.3, 0.4, 0],
          up,
          10,
        )!,
        1,
      ) &&
      createAutoMovieMeshRayCaster(mesh([], [])).nearest([0, 0, 0], up, 10) ===
        null,
  );
  const frozenHit: IAutoMovieMeshRayHit | null = frozen.nearestHit([0.3, 0.4, 0], up, 10);
  const implicitHit: IAutoMovieMeshRayHit | null = createAutoMovieMeshRayCaster(mesh(flat, null)).nearestHit(
    [0.3, 0.4, 0],
    up,
    10,
  );
  TestValidator.predicate(
    "metadata owns buffers and respects implicit original triplets",
    frozenHit !== null &&
      frozenHit.triangle === 1 &&
      nclose(frozenHit.distance, 1) &&
      implicitHit !== null &&
      implicitHit.triangle === 1 &&
      nclose(implicitHit.distance, 1) &&
      createAutoMovieMeshRayCaster(mesh([], [])).nearestHit(
        [0, 0, 0],
        up,
        10,
      ) === null &&
      caster.nearestHit([0.3, 0.4, 1], [1, 0, 0], 10) === null,
  );
  const invalid: Parameters<typeof caster.nearestHit>[] = [
    [[0, 0], up, 1],
    [[0, 0, 0], [0, 0], 1],
    [[0, NaN, 0], up, 1],
    [[0, 0, 0], [0, Infinity, 0], 1],
    [[0, 0, 0], [0, 0, 0], 1],
    [[0, 0, 0], up, NaN],
    [[0, 0, 0], up, -1],
    [[0, 0, 0], up, 1, -1],
    [[0, 0, 0], up, 1, NaN],
    [[0, 0, 0], up, 1, 2],
  ];
  for (const args of invalid)
    TestValidator.predicate(
      "nearest-hit admission shares the existing range and vector contract",
      throwsError((): IAutoMovieMeshRayHit | null  => caster.nearestHit(...args), "A ray needs"),
    );
  // Equal nonzero components point along (1,1,1), independently of scale.
  // From (-.3,-.4,0), z=1 is met at (.7,.6,1), a sqrt(3)-metre chord.
  const scales: number[] = [1, 1e308, Number.MAX_VALUE, Number.MIN_VALUE];
  const readings: { scale: number; nearest: number | null; hit: IAutoMovieMeshRayHit | null; reverse: IAutoMovieMeshRayHit | null; miss: IAutoMovieMeshRayHit | null; }[] = scales.map((scale: number): { scale: number; nearest: number | null; hit: IAutoMovieMeshRayHit | null; reverse: IAutoMovieMeshRayHit | null; miss: IAutoMovieMeshRayHit | null; }  => ({
    scale,
    nearest: caster.nearest([-0.3, -0.4, 0], [scale, scale, scale], 10),
    hit: caster.nearestHit([-0.3, -0.4, 0], [scale, scale, scale], 10),
    reverse: caster.nearestHit([1.3, 1.4, 2], [-scale, -scale, -scale], 10),
    miss: caster.nearestHit([2, 2, 0], [scale, scale, scale], 10),
  }));
  TestValidator.predicate(
    `finite direction scale preserves the unit metric: ${JSON.stringify(readings)}`,
    readings.every(
      (one: { scale: number; nearest: number | null; hit: IAutoMovieMeshRayHit | null; reverse: IAutoMovieMeshRayHit | null; miss: IAutoMovieMeshRayHit | null; }): boolean  =>
        one.nearest !== null &&
        one.hit !== null &&
        one.reverse !== null &&
        nclose(one.nearest, Math.sqrt(3), 1e-12) &&
        nclose(one.hit.distance, Math.sqrt(3), 1e-12) &&
        nclose(one.reverse.distance, Math.sqrt(3), 1e-12) &&
        one.reverse.triangle === 1 &&
        one.hit.triangle === 0 &&
        one.miss === null,
    ),
  );
  const smallestNormal: number = 2 ** -1022;
  for (const scale of [
    smallestNormal - Number.MIN_VALUE,
    smallestNormal,
    smallestNormal + Number.MIN_VALUE,
  ])
    for (const sign of [-1, 1]) {
      const origin: number[] = [0.3, 0.4, sign > 0 ? 0 : 2];
      const direction: number[] = [0, 0, sign * scale];
      const hit: IAutoMovieMeshRayHit | null = caster.nearestHit(origin, direction, 10);
      TestValidator.predicate(
        "both sides of the IEEE normal boundary keep axial metric and ownership",
        hit !== null &&
          hit.triangle === 1 &&
          nclose(hit.distance, 1) &&
          Object.is(hit.distance, caster.nearest(origin, direction, 10)) &&
          nclose(direction[2], sign * scale, 0),
      );
    }
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): IAutoMovieMeshRayCaster  => createAutoMovieMeshRayCaster(mesh([0, 0], null)),
      "complete triangle",
    ) &&
      throwsError(
        (): IAutoMovieMeshRayCaster  =>
          createAutoMovieMeshRayCaster(
            mesh([0, 0, 0, 1, 0, 0, 0, 1, NaN], null),
          ),
        "complete triangle",
      ) &&
      throwsError(
        (): IAutoMovieMeshRayCaster  => createAutoMovieMeshRayCaster(mesh(positions, [0, 1, 99])),
        "complete triangle",
      ) &&
      throwsError((): number | null  => caster.nearest([0, 0, 0], [0, 0, 0], 1), "nonzero") &&
      throwsError((): number | null  => caster.nearest([0, NaN, 0], up, 1), "nonzero") &&
      throwsError((): number | null  => caster.nearest([0, 0, 0], up, 1, 2), "minimum") &&
      throwsError((): boolean  => caster.blocked([0, 0], up, 1), "nonzero"),
  );
}
