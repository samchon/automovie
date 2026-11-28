import {
  AutoMovieArchetypeBookcase,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeSeat,
  AutoMovieArchetypeStorage,
  AutoMovieArchetypeTable,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Covers rounding of catalogue inches and metre-scale contact placements. */
const METRE_TOLERANCE: number = 1e-12;

/**
 * Reads seeded and default furniture contacts through the public producers.
 *
 * Scenarios:
 *
 * 1. A default dining seat uses midpoint bands. Numeric seed 31 repeats the same
 *    physical dimensions within those bands.
 * 2. A default bench has two usable places on one 1.22 metre surface.
 * 3. A service counter selects its first nominal dimension by default and a named
 *    36-inch length explicitly. Its use and stack affordances share the
 *    physical top. A nominal counter length on a dining table refuses.
 * 4. The original saved bookcase kind and its named owner give the same shelf
 *    geometry with the same numeric seed and scene ID.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the numeric seed, midpoint, multi-place, catalogue, refusal and saved-route cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public factories and reads generated dimensions, contacts and transformed sites. Compares one saved route with the corresponding named producer.
 * @evidence contracts/development/testing.md#independent-expectations Uses measured seating bands, two 0.61 metre bench places and the inch conversion for catalogue lengths. Checks the repeatability of a given numeric seed without defining a new expected random sequence.
 */
export function test_archetype_furniture_public_routes(): void {
  const dining: ReturnType<typeof AutoMovieArchetypeSeat.create> =
    AutoMovieArchetypeSeat.create({ kind: "dining" });
  const sampled: ReturnType<typeof AutoMovieArchetypeSeat.create> =
    AutoMovieArchetypeSeat.create({ kind: "dining" }, 31);
  const repeated: ReturnType<typeof AutoMovieArchetypeSeat.create> =
    AutoMovieArchetypeSeat.create({ kind: "dining" }, 31);
  const sampledHeight: number = sampled.affordance("seat").frame.translation.y;
  TestValidator.predicate(
    "dining sit height follows its default or numeric draw",
    nclose(
      dining.affordance("seat").frame.translation.y,
      0.4435,
      METRE_TOLERANCE,
    ) &&
      sampledHeight >= 0.43 &&
      sampledHeight <= 0.457 &&
      nclose(
        sampledHeight,
        repeated.affordance("seat").frame.translation.y,
        METRE_TOLERANCE,
      ),
  );
  TestValidator.predicate(
    "an explicit bar-stool height retains its physical footrest",
    nclose(
      AutoMovieArchetypeSeat.create({
        kind: "barStool",
        seatHeight: 0.78,
      }).affordance("footrest").frame.translation.y,
      0.78 - 0.4435,
      METRE_TOLERANCE,
    ),
  );

  const bench: ReturnType<typeof AutoMovieArchetypeSeat.create> =
    AutoMovieArchetypeSeat.create({ kind: "bench" });
  TestValidator.predicate(
    "bench place sites fall under the centres of both places",
    nclose(bench.affordance("seat").width!, 1.22, METRE_TOLERANCE) &&
      vclose(
        bench.site("seat", 0.25).translation,
        { x: -0.305, y: 0.4575, z: 0 },
        METRE_TOLERANCE,
      ) &&
      vclose(
        bench.site("seat", 0.75).translation,
        { x: 0.305, y: 0.4575, z: 0 },
        METRE_TOLERANCE,
      ),
  );

  const standard: ReturnType<typeof AutoMovieArchetypeTable.create> =
    AutoMovieArchetypeTable.create({ kind: "serviceCounter" });
  const counter: ReturnType<typeof AutoMovieArchetypeTable.create> =
    AutoMovieArchetypeTable.create({
      kind: "serviceCounter",
      size: "length36",
    });
  const stack = counter.affordance("stack");
  TestValidator.predicate(
    "service-counter sizes agree with the physical and stack top spans",
    nclose(standard.affordance("top").width!, 30 * 0.0254, METRE_TOLERANCE) &&
      nclose(counter.affordance("top").width!, 36 * 0.0254, METRE_TOLERANCE) &&
      vclose(
        stack.frame.translation,
        counter.affordance("top").frame.translation,
        METRE_TOLERANCE,
      ) &&
      nclose(
        Math.max(...stack.extent!.map((point): number => point.x)),
        18 * 0.0254,
        METRE_TOLERANCE,
      ),
  );
  assert.throws(
    (): unknown =>
      AutoMovieArchetypeTable.create({ kind: "dining", size: "length30" }),
    (error: unknown): boolean =>
      error instanceof AutoMovieArchetypeRefusal && error.axis === "size",
  );

  const saved: ReturnType<typeof AutoMovieArchetypeStorage.create> =
    AutoMovieArchetypeStorage.create({ kind: "bookcase", id: "shelves" }, 31);
  const direct: ReturnType<typeof AutoMovieArchetypeBookcase.create> =
    AutoMovieArchetypeBookcase.create({ id: "shelves" }, 31);
  TestValidator.equals(
    "both routes retain the scene ID",
    [saved.id, direct.id],
    ["shelves", "shelves"],
  );
  TestValidator.predicate(
    "the saved bookcase route retains the named owner's shelf",
    vclose(
      saved.affordance("shelf1").frame.translation,
      direct.affordance("shelf1").frame.translation,
      METRE_TOLERANCE,
    ) &&
      nclose(
        saved.dimensions.height!,
        direct.dimensions.height!,
        METRE_TOLERANCE,
      ),
  );
}
