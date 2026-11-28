import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedEars as Ears,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieModelPart, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../../internal/nclose";

/** Coordinate roundoff for quaternion rotation of a unit axis. */
const ROTATION_ROUNDOFF: number = 32 * Number.EPSILON;

/**
 * Ear plates admit representable extents before emitting either side.
 *
 * Scenarios:
 * 1. A finite profile at a two-metre withers height forms two known boxes;
 *    an extreme finite diagonal points along the same mirrored unit axes as
 *    its ordinary-scale counterpart.
 * 2. Scaling a finite ratio can exceed binary64 even when all other dimensions
 *    fit. The paired-volume limit distinguishes the two products
 *    because each box can occupy exactly 2^1023 cubic metres, while two
 *    such boxes cannot. The builder stays untouched in either case.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States ordinary bilateral ear plates, equivalent extreme direction and atomic refusal when scale or total volume overflows.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the physical ear profile, enumerates real plates and their axes and compares the builder before and after both refusal cases.
 * @evidence contracts/development/testing.md#independent-expectations The authored two-metre profile gives a paired volume of 1/512. Scaling a direction preserves its normalized axis. Two solids of `2^1023` cubic metres each exceed binary64 capacity.
 */
export function test_archetypes_animals_ear_plate_extent(): void {
  const head: Pick<
    AutoMovieArchetypeQuadrupedBody.IRig,
    "poll" | "nose" | "headRadius"
  > = {
    poll: { x: 0, y: 0, z: 0 },
    nose: { x: 0, y: 0, z: 1 },
    headRadius: 1 / 4,
  };
  const profile: Ears.IProfile = {
    length: 1 / 8,
    width: 1 / 16,
    plateThickness: 1 / 64,
    direction: { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: 0 },
  };
  const target: ReturnType<typeof builder> = builder();
  const prepared: Ears.IPrepared = Ears.prepare(head, 2, profile);
  TestValidator.equals("the two physical plate volumes", prepared.volume, 1 / 512);
  prepared.emit(target, "#8a5a3a");
  const parts: readonly IAutoMovieModelPart[] = target.build(1).parts;
  for (const [id, sign] of [["leftEar", 1], ["rightEar", -1]] as const) {
    const part: IAutoMovieModelPart | undefined = parts.find((item) => item.id === id);
    assert.ok(part?.transform !== null && part?.transform !== undefined);
    const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
    assert.ok(geometry.type === "primitive" && geometry.shape.type === "box");
    TestValidator.predicate(
      `${id} converts each ratio to metres`,
      geometry.shape.width === 1 / 8 &&
        geometry.shape.height === 1 / 4 &&
        geometry.shape.depth === 1 / 32,
    );
    const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(part.transform.rotation, { x: 0, y: 1, z: 0 });
    TestValidator.predicate(
      `${id} preserves its finite diagonal after normalizing`,
      nclose(axis.x, sign * Math.SQRT1_2, ROTATION_ROUNDOFF) &&
        nclose(axis.y, Math.SQRT1_2, ROTATION_ROUNDOFF) &&
        nclose(axis.z, 0, ROTATION_ROUNDOFF),
    );
  }

  const rejected: ReturnType<typeof builder> = builder();
  const before: string = JSON.stringify(rejected.build(1));
  assert.throws(
    () => Ears.lay(rejected, head, 2, { ...profile, length: Number.MAX_VALUE }, "#8a5a3a"),
    (error: unknown): boolean => error instanceof RangeError && error.message.includes("fit in metres"),
  );
  const extent: number = 2 ** 341;
  assert.throws(
    () => Ears.lay(rejected, head, 1, {
      ...profile, length: extent, width: extent, plateThickness: extent,
    }, "#8a5a3a"),
    (error: unknown): boolean => error instanceof RangeError && error.message.includes("ear pair"),
  );
  TestValidator.equals("refused geometry emits neither plate", JSON.stringify(rejected.build(1)), before);
}

/** A real builder with one actual solid so writes are observable. */
function builder(): AutoMovieArchetypeBuilder<never, never> {
  return new AutoMovieArchetypeBuilder<never, never>({
    name: "ear plate fixture",
    draw: new AutoMovieArchetypeDrawSession<never>("ear-plate", {}, undefined),
    material: "skin",
  }).box("marker", { x: 1 / 8, y: 1 / 8, z: 1 / 8 }, { x: 0, y: 0, z: 0 });
}
