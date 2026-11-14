import {
  type Archetype,
  createDrinkware,
  createFood,
  createTableware,
} from "@automovie/archetypes";
import { physicalShapePairDistance } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalProfile,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** How far one collider may enter another and still count as resting on it: #3501's 1e-6 m. */
const OVERLAP: number = 1e-6;

/** The least signed distance between any collider of one placed archetype and any of another: negative when they overlap. */
function apart(
  a: Archetype,
  at: IAutoMovieTransform,
  b: Archetype,
  bt: IAutoMovieTransform,
): number {
  const pose = (t: IAutoMovieTransform): IAutoMoviePhysicalProfile.ITransform => ({
    position: t.translation,
    rotation: t.rotation,
  });
  let least: number = Infinity;
  for (const p of a.shapes())
    for (const q of b.shapes())
      least = Math.min(
        least,
        physicalShapePairDistance(pose(at), p, pose(bt), q),
      );
  return least;
}

/** The frame an archetype stands at when its origin is seated on a `stack-top` of another archetype standing at `under`. */
function seated(
  under: IAutoMovieTransform,
  top: IAutoMovieAffordance,
): IAutoMovieTransform {
  return {
    translation: {
      x: under.translation.x + top.frame.translation.x,
      y: under.translation.y + top.frame.translation.y,
      z: under.translation.z + top.frame.translation.z,
    },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
}

/**
 * Plates stack on one another's `top`, and a cup and food rest on a plate's `top`, without one collider entering another.
 *
 * Scenarios:
 * 1. Five dinner plates of five seeds, each standing on the `top` of the one below: every pair is at least -1e-6 m apart, and each plate touches the one beneath, the pair less than 1e-6 m apart.
 * 2. The same for five side plates, for five platters, and for a cup on a saucer.
 * 3. A loaf, an apple and a drumstick each on a platter's `top`: each rests on it, neither entering nor floating.
 * 4. The negative case: a plate set a millimetre lower than the `top` it should stand on enters the plate beneath, and the measure reports it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces plates, a cup and food, seats each on the `stack-top` beneath and measures every pair of colliders with the engine's signed distance; a `top` below or above the face, a foot that sinks into the plate beneath, or a stacked thing that floats is caught.
 * @evidence contracts/development/testing.md#independent-expectations The 1e-6 m is #3501's acceptance for stacked plates; seating a thing's origin on a `stack-top` is the support convention of `AutoMovieAffordanceKind`; the distances are the engine's exact convex distance, not the archetypes'.
 * @evidence contracts/development/testing.md#distinguishing-cases Every plate kind, the cup and each food on the face; a plate a millimetre low is the overlap the measure must see; the sizes belong to the band tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_props_stacking(): void {
  const findings: string[] = [];
  const origin: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };

  // 1. and 2. A stack: each thing on the top of the one below.
  const stack = (name: string, things: readonly Archetype[]): void => {
    const frames: IAutoMovieTransform[] = [origin];
    for (let k: number = 1; k < things.length; k++)
      frames.push(
        seated(
          frames[k - 1]!,
          things[k - 1]!.affordances.find(
            (a: IAutoMovieAffordance): boolean => a.id === "top",
          )!,
        ),
      );
    for (let i: number = 0; i < things.length; i++)
      for (let j: number = i + 1; j < things.length; j++) {
        const gap: number = apart(things[i]!, frames[i]!, things[j]!, frames[j]!);
        if (gap < -OVERLAP)
          findings.push(`${name}: ${i} and ${j} overlap by ${-gap} m`);
        if (j === i + 1 && gap > OVERLAP)
          findings.push(`${name}: ${j} floats ${gap} m above ${i}`);
      }
  };
  for (const kind of ["plate", "sidePlate", "platter"] as const)
    stack(
      kind,
      [0, 1, 2, 3, 4].map(
        (seed: number): Archetype => createTableware({ kind }, seed),
      ),
    );
  stack("cup on saucer", [
    createTableware({ kind: "saucer" }, 3),
    createDrinkware({ kind: "cup" }, 3),
  ]);

  // 3. Food on a platter.
  for (const kind of createFood.KINDS)
    stack(`${kind} on a platter`, [
      createTableware({ kind: "platter" }, 5),
      createFood({ kind }, 5),
    ]);

  // 4. A plate a millimetre low enters the plate beneath.
  const lower: ReturnType<typeof createTableware> = createTableware(
    { kind: "plate" },
    6,
  );
  const sunk: IAutoMovieTransform = seated(origin, lower.affordance("top"));
  sunk.translation.y -= 0.001;
  if (
    !(
      apart(lower, origin, createTableware({ kind: "plate" }, 7), sunk) <
      -OVERLAP
    )
  )
    findings.push("a plate a millimetre low was not seen to overlap");
  TestValidator.equals("plates and what they hold stack cleanly", findings, []);
}
