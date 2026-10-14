import {
  heightAt,
  isWalkable,
  prepareSpace,
  prepareSurface,
  preparedSurfaceContains,
  surfaceAt,
  surfaceContains,
  surfaceHeightAt,
  validateSpace,
} from "@automovie/engine";
import { IAutoMovieSpace, IAutoMovieSurface, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const v: (x: number, z: number, y?: number) => IAutoMovieVector3 = (x: number, z: number, y: number = 0): IAutoMovieVector3 => ({ x, y, z });

const floor: IAutoMovieSurface = {
  id: "floor",
  kind: "floor",
  polygon: [v(0, 0), v(10, 0), v(10, 10), v(0, 10)],
  anchor: { x: 0, y: 0, z: 0 },
  rampTo: null,
};
/** A table top an actor may not walk on (standable for objects only). */
const deck: IAutoMovieSurface = {
  id: "deck",
  kind: "platform",
  polygon: [v(2, 2), v(4, 2), v(4, 4), v(2, 4)],
  anchor: { x: 2, y: 1, z: 2 },
  rampTo: null,
};
/** A ramp rising 1 → 3 from x=6 to x=10, constant across z. */
const ramp: IAutoMovieSurface = {
  id: "ramp",
  kind: "ramp",
  polygon: [v(6, 0), v(10, 0), v(10, 4), v(6, 4)],
  anchor: { x: 6, y: 1, z: 0 },
  rampTo: { x: 10, y: 3, z: 0 },
};
const tieA: IAutoMovieSurface = {
  id: "tieA",
  kind: "platform",
  polygon: [v(19, 19), v(21, 19), v(21, 21), v(19, 21)],
  anchor: { x: 19, y: 5, z: 19 },
  rampTo: null,
};
const tieB: IAutoMovieSurface = { ...tieA, id: "tieB" };

const space: IAutoMovieSpace = {
  id: "set",
  surfaces: [floor, deck, ramp, tieA, tieB],
  walkable: ["floor", "ramp", "tieA", "tieB"],
};

/**
 * The space height/walkability queries are the ground truth every seam
 * consumes: heights come from the topmost surface at a point (ramps interpolate
 * as planes), walking is only allowed where that topmost surface is walkable,
 * and `isWalkable` can never disagree with `heightAt`.
 *
 * Scenarios:
 *
 * 1. A flat patch reads its anchor height everywhere on its footprint.
 * 2. A ramp interpolates linearly along its axis (hand oracle: 1→3 over x=6..10
 *    gives 2 at x=8, 1.5 at x=7).
 * 3. The ramp plane is constant perpendicular to its axis (same height at any z on
 *    the footprint).
 * 4. Over nothing: `surfaceAt` null, `heightAt` null, `isWalkable` false.
 * 5. The topmost surface wins where patches stack, and when it is a no-go top,
 *    `surfaceAt` still reports it (objects rest there) while `heightAt` reads
 *    null (an actor cannot stand there).
 * 6. An exact height tie keeps the earlier surface in the array.
 * 7. A degenerate ramp axis (rampTo at the anchor's XZ) safely reads as flat.
 * 8. A mis-ordered (bowtie) footprint bounds nothing and contains nothing. Its
 *    ring is read as authored (#1868), so the two lobes cancel to no enclosed
 *    area rather than being canonicalized into the hull that spans them; a
 *    footprint whose points are ordered wrong is refused by `validateSpace`
 *    instead of being silently repaired into a shape nobody wrote.
 * 9. A prepared patch keeps the footprint it was built from: rebinding the source
 *    surface's polygon changes what `surfaceContains` answers and leaves the
 *    caller-owned snapshot alone.
 * 10. A lattice shorter than the grid it declares reads zero rather than `NaN`.
 *     `validateSpace` refuses one, so this is what a hand-built patch reaching
 *     a renderer answers: wrong in a way a reader can see, instead of a number
 *     that poisons every arithmetic downstream of it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls raw/prepared surface membership and height/walkability queries, asserting flat/ramp heights, topmost and tie selection, void/no-go nulls, zero-span ramp fallback, bowtie refusal, independent prepared footprint lifetime after source rebinding, and malformed heightfield fallback plus validation failure.
 * @evidence contracts/testing.md#independent-expectations The stated ramp rises 2 over 4 X units, giving 2 at x=8 and 1.5 at x=7; deck height 1 exceeds floor 0 and an equal-height tie preserves authored order. A symmetric bowtie has zero signed area; replacing a 10-square ring with a unit ring changes containment at (5,5). A stored lattice sample remains 1 while missing samples fall back to 0. These geometric/data facts are independent of returned queries.
 * @evidence contracts/testing.md#distinguishing-cases Ten groups cover flat/sloped/perpendicular height, absence, blocked top, equal-height tie, degenerate ramp, invalid ring, prepared snapshot and short lattice. The prepared path receives selected parity checks rather than every raw case; concavity, holes, full height-rule admission and non-finite arithmetic belong to separate tests.
 * @evidence contracts/testing.md#execution-ownership The named test_space_height_queries entry exercises portable query and admission semantics with local records; it uses no renderer, host or dynamically registered cases and makes no visible terrain claim.
 */
export function test_space_height_queries(): void {
  TestValidator.predicate(
    "flat patch height",
    nclose(heightAt(space, 1, 1)!, 0),
  );
  TestValidator.equals(
    "flat patch surface",
    surfaceAt(space, 1, 1)!.id,
    "floor",
  );

  TestValidator.predicate("ramp mid height", nclose(heightAt(space, 8, 2)!, 2));
  TestValidator.predicate(
    "ramp quarter height",
    nclose(heightAt(space, 7, 1)!, 1.5),
  );
  TestValidator.predicate(
    "ramp constant across z",
    nclose(heightAt(space, 8, 0.5)!, heightAt(space, 8, 3.5)!),
  );

  TestValidator.equals("over nothing surface", surfaceAt(space, 50, 50), null);
  TestValidator.equals("over nothing height", heightAt(space, 50, 50), null);
  TestValidator.equals(
    "over nothing walkable",
    isWalkable(space, 50, 50),
    false,
  );

  TestValidator.equals("topmost wins", surfaceAt(space, 3, 3)!.id, "deck");
  TestValidator.equals(
    "no-go top blocks standing",
    heightAt(space, 3, 3),
    null,
  );
  TestValidator.equals(
    "no-go top not walkable",
    isWalkable(space, 3, 3),
    false,
  );

  TestValidator.equals(
    "tie keeps earlier",
    surfaceAt(space, 20, 20)!.id,
    "tieA",
  );
  TestValidator.equals("walkable on floor", isWalkable(space, 1, 1), true);

  const prepared: ReturnType<typeof prepareSpace> = prepareSpace(space);
  TestValidator.equals(
    "prepared surfaceAt reuses the same topmost decision",
    surfaceAt(space, 3, 3, prepared)!.id,
    "deck",
  );
  TestValidator.predicate(
    "prepared heightAt reuses ramp interpolation",
    nclose(heightAt(space, 8, 2, prepared)!, 2),
  );
  TestValidator.equals(
    "prepared isWalkable agrees with heightAt",
    isWalkable(space, 8, 2, prepared),
    true,
  );

  const degenerate: IAutoMovieSurface = {
    ...ramp,
    rampTo: { x: 6, y: 9, z: 0 },
  };
  TestValidator.predicate(
    "degenerate ramp axis reads flat",
    nclose(surfaceHeightAt(degenerate, 8, 2), 1),
  );

  const bowtie: IAutoMovieSurface = {
    ...floor,
    polygon: [v(0, 0), v(10, 10), v(10, 0), v(0, 10)],
  };
  TestValidator.equals(
    "a self-crossing footprint encloses nothing, so it holds nothing",
    surfaceContains(bowtie, 5, 5),
    false,
  );
  TestValidator.equals(
    "prepared reading of the same ring agrees",
    preparedSurfaceContains(prepareSurface(bowtie), 5, 5),
    false,
  );
  TestValidator.equals(
    "and validation refuses it rather than leaving it to the query",
    validateSpace({ space: { ...space, surfaces: [bowtie] } }).success,
    false,
  );

  const snapshot: IAutoMovieSurface = { ...floor };
  const preparedSnapshot: ReturnType<typeof prepareSurface> = prepareSurface(snapshot);
  snapshot.polygon = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)];
  TestValidator.equals(
    "default surfaceContains rebuilds after surface mutation",
    surfaceContains(snapshot, 5, 5),
    false,
  );
  TestValidator.equals(
    "prepared surface containment keeps its caller-owned footprint snapshot",
    preparedSurfaceContains(preparedSnapshot, 5, 5),
    true,
  );

  const short: IAutoMovieSurface = {
    id: "short",
    kind: "floor",
    polygon: floor.polygon,
    height: {
      kind: "heightfield",
      originX: 0,
      originZ: 0,
      spacingX: 5,
      spacingZ: 5,
      columns: 2,
      rows: 2,
      samples: [1],
    },
  };
  TestValidator.equals(
    "a lattice missing its own samples reads zero rather than NaN",
    namedFacts([
      ["theStoredSample", (): boolean => nclose(surfaceHeightAt(short, 0, 0), 1, 0)],
      ["theMissingOnes", (): boolean => nclose(surfaceHeightAt(short, 10, 10), 0, 0)],
      [
        "andTheValidatorRefusesIt",
        (): boolean =>
          validateSpace({ space: { ...space, surfaces: [short] } }).success ===
          false,
      ],
    ]),
    {
      theStoredSample: true,
      theMissingOnes: true,
      andTheValidatorRefusesIt: true,
    },
  );
}
