import { growPlanting } from "../../../../packages/engine/src/soft/growPlanting";
import { plantingStateDigest } from "../../../../packages/engine/src/soft/plantingStateDigest";
import { IAutoMoviePruningEnvelope, IAutoMoviePlantingState, IAutoMoviePlantingBranch } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, vclose } from "../internal/predicates";
import { plantingRecipe } from "../internal/softFixtures";
/** A vertical trunk of unit length under one pruning envelope. */
const clipped: (pruning: IAutoMoviePruningEnvelope) => IAutoMoviePlantingState = (pruning: IAutoMoviePruningEnvelope): IAutoMoviePlantingState =>
  growPlanting(plantingRecipe({ pruning }));

/** Verify analytic box/sphere pruning and child survival through emitted branch endpoints and ids.
 *
 * Scenarios:
 *
 * 1. With no envelope the trunk reaches its full length and nothing is marked
 *    pruned.
 * 2. A box whose ceiling sits at `0.75` cuts the trunk exactly there and marks it
 *    pruned; the child emerging at half height survives and the one emerging at
 *    the tip does not.
 * 3. A sphere of radius `0.75` about the origin produces exactly the same cut
 *    through the quadratic root rather than through a slab, exercising both
 *    envelope paths against the same hand-computed endpoint.
 * 4. A branch whose own base already lies outside the envelope is not grown at
 *    all, so an envelope that misses the plant entirely yields nothing and
 *    `null` bounds rather than a stub at the origin.
 * 5. An envelope the whole plant fits inside — of either shape — cuts nothing and
 *    retains the unpruned branch count and flags, with the box trunk endpoint
 *    and sphere diagnostic checked separately; declaring an envelope alone
 *    does not make the pruned flag fire.
 * 6. A cut structure digests differently from an uncut one and reproduces its own
 *    digest, so pruning is carried by the derived record rather than by a flag
 *    nobody reads.

 *
 * @evidence contracts/testing.md#behavioral-verification Real growth output catches changed cut distance, closed envelope membership, child emergence filtering, pruned flags and empty bounds; roomy and missed envelopes distinguish actual cutting from merely declaring an envelope.
 * @evidence contracts/testing.md#independent-expectations A one-metre +Y trunk crosses an authored ceiling/radius at .75; children emerge at .5 and 1, so only the former survives. Digest comparisons are auxiliary 32-bit diagnostics and cannot independently prove geometry identity.
 * @evidence contracts/testing.md#distinguishing-cases Preserve none, cutting box/sphere, outside base, roomy box/sphere and repeat/changed diagnostic cases; scaled visible canopy clearance belongs to installation validation rather than this branch-centreline test.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_planting_pruning_envelope; the exported test owns every envelope case and reads emitted geometry without a renderer or sampled clipping host.
 */
export function test_planting_pruning_envelope(): void {
  const free: IAutoMoviePlantingState = clipped({ kind: "none" });
  TestValidator.equals(
    "an unpruned structure reaches its full length",
    namedFacts([
      ["end", (): boolean => vclose(free.branches[0].end, { x: 0, y: 1, z: 0 })],
      ["flag", (): boolean => free.branches.every((branch: IAutoMoviePlantingBranch): boolean => branch.pruned === false)],
      ["count", (): boolean => free.branches.length === 7],
    ]),
    { end: true, flag: true, count: true },
  );

  const boxed: IAutoMoviePlantingState = clipped({
    kind: "box",
    min: { x: -1, y: -1, z: -1 },
    max: { x: 1, y: 0.75, z: 1 },
  });
  TestValidator.equals(
    "a box cuts the trunk at its slab crossing and drops what grows past it",
    namedFacts([
      ["end", (): boolean => vclose(boxed.branches[0].end, { x: 0, y: 0.75, z: 0 })],
      ["pruned", (): boolean => boxed.branches[0].pruned === true],
      [
        "survivor",
        (): boolean => boxed.branches.some((branch: IAutoMoviePlantingBranch): boolean => branch.id === "trunk/a"),
      ],
      [
        "dropped",
        (): boolean => boxed.branches.every((branch: IAutoMoviePlantingBranch): boolean => branch.id !== "trunk/b"),
      ],
      [
        "survivorBase",
        (): boolean =>
          vclose(
            boxed.branches.filter((branch: IAutoMoviePlantingBranch): boolean => branch.id === "trunk/a")[0].start,
            { x: 0, y: 0.5, z: 0 },
          ),
      ],
    ]),
    {
      end: true,
      pruned: true,
      survivor: true,
      dropped: true,
      survivorBase: true,
    },
  );

  const balled: IAutoMoviePlantingState = clipped({
    kind: "sphere",
    center: { x: 0, y: 0, z: 0 },
    radius: 0.75,
  });
  TestValidator.equals(
    "a sphere cuts at the quadratic root, to the same place",
    namedFacts([
      ["end", (): boolean => vclose(balled.branches[0].end, { x: 0, y: 0.75, z: 0 })],
      ["pruned", (): boolean => balled.branches[0].pruned === true],
      [
        "dropped",
        (): boolean => balled.branches.every((branch: IAutoMoviePlantingBranch): boolean => branch.id !== "trunk/b"),
      ],
    ]),
    { end: true, pruned: true, dropped: true },
  );

  const missed: IAutoMoviePlantingState = clipped({
    kind: "box",
    min: { x: 4, y: 4, z: 4 },
    max: { x: 5, y: 5, z: 5 },
  });
  const elsewhere: IAutoMoviePlantingState = clipped({
    kind: "sphere",
    center: { x: 9, y: 9, z: 9 },
    radius: 1,
  });
  TestValidator.equals(
    "a base outside the envelope grows nothing at all",
    namedFacts([
      ["box", (): boolean => missed.branches.length === 0 && missed.bounds === null],
      [
        "sphere",
        (): boolean => elsewhere.branches.length === 0 && elsewhere.bounds === null,
      ],
    ]),
    { box: true, sphere: true },
  );

  const roomy: IAutoMoviePlantingState = clipped({
    kind: "box",
    min: { x: -4, y: -4, z: -4 },
    max: { x: 4, y: 4, z: 4 },
  });
  const wide: IAutoMoviePlantingState = clipped({
    kind: "sphere",
    center: { x: 0, y: 0, z: 0 },
    radius: 10,
  });
  TestValidator.equals(
    "an envelope the plant fits inside cuts nothing",
    namedFacts([
      ["count", (): boolean => roomy.branches.length === 7],
      ["flag", (): boolean => roomy.branches.every((branch: IAutoMoviePlantingBranch): boolean => branch.pruned === false)],
      ["end", (): boolean => vclose(roomy.branches[0].end, { x: 0, y: 1, z: 0 })],
      ["sphereCount", (): boolean => wide.branches.length === 7],
      ["sphereFlag", (): boolean => wide.branches.every((branch: IAutoMoviePlantingBranch): boolean => !branch.pruned)],
      [
        "sameAsUnpruned",
        (): boolean => plantingStateDigest(wide) === plantingStateDigest(free),
      ],
    ]),
    {
      count: true,
      flag: true,
      end: true,
      sphereCount: true,
      sphereFlag: true,
      sameAsUnpruned: true,
    },
  );

  TestValidator.equals(
    "a cut structure digests differently from an uncut one",
    namedFacts([
      [
        "differs",
        (): boolean => plantingStateDigest(boxed) !== plantingStateDigest(free),
      ],
      [
        "stable",
        (): boolean =>
          plantingStateDigest(
            clipped({
              kind: "box",
              min: { x: -1, y: -1, z: -1 },
              max: { x: 1, y: 0.75, z: 1 },
            }),
          ) === plantingStateDigest(boxed),
      ],
    ]),
    { differs: true, stable: true },
  );
}
