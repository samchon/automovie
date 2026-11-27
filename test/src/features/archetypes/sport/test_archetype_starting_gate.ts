import { type AutoMovieArchetype, AutoMovieArchetypePassage, AutoMovieArchetypeRefusal, createHorse, AutoMovieArchetypeStartingGate } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../internal/predicates";

/** The 20-stall Derby gate's 65 feet over its 20 stalls, metres. */
const PITCH: number = (65 * 0.3048) / 20;

/**
 * A starting gate's stalls, its front doors that open together and its rear
 * doors that load each stall.
 *
 * Scenarios:
 *
 * 1. A gate of the default 14 stalls and one of 3 lay their stalls one Derby pitch
 *    apart, centred on the gate's front.
 * 2. One travel of `door0` swings every front leaf out to lie along its partition
 *    toward the run, leaving the rear doors shut.
 * 3. A rear door swings back toward the loading side by itself.
 * 4. A saddle horse's rest footprint, stirrups included, fits a stall's clear
 *    width.
 * 5. A seed rebuilds the same gate, and no stalls, more than twenty or a fraction
 *    refuse on `stalls`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the gate's stall layout, the shared door release, the loading doors, the fit and the refusals the test checks.
 * @evidence contracts/development/testing.md#behavioral-verification Builds and articulates the public producer and reads its contacts and posed parts.
 * @evidence contracts/development/testing.md#independent-expectations Stall middles follow from the read 65 ft over 20 stalls. A leaf hinged at its partition and half the clear width long has its middle a quarter of the clear width ahead of the front at 90 degrees, by its length alone. The clear width is the stall's contact width.
 * @evidence contracts/development/testing.md#distinguishing-cases Default and small gates, closed and open fronts, a follower leaf far from the leader, an independent rear door, the boundary counts 1 and 20 admitted beside 0, 21 and 2.5 refused, and same versus varied seeds.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only spec over the producer's model; drawing is left to review.
 */
export function test_archetype_starting_gate(): void {
  // 1. Stall layout.
  for (const stalls of [3, 14]) {
    const gate: AutoMovieArchetype = AutoMovieArchetypeStartingGate.create(
      stalls === 14 ? {} : { stalls },
      1012,
    );
    const middles: IAutoMovieVector3[] = Array.from(
      { length: stalls },
      (_: unknown, k: number): IAutoMovieVector3 =>
        gate.affordance(`stall${k}`).frame.translation,
    );
    TestValidator.predicate(
      `a gate of ${stalls} lays its stalls one pitch apart about its middle`,
      middles.every(
        (middle: IAutoMovieVector3, k: number): boolean =>
          nclose(middle.x, (k + 0.5 - stalls / 2) * PITCH, 1e-12) &&
          middle.y === 0 &&
          middle.z < 0,
      ) &&
        gate.affordances.filter((a: IAutoMovieAffordance): boolean =>
          a.id.startsWith("stall"),
        ).length === stalls,
    );
  }

  // 2. The shared front release.
  const gate: AutoMovieArchetype = AutoMovieArchetypeStartingGate.create({}, 1012);
  const clear: number = gate.affordance("stall0").width!;
  const open: AutoMovieArchetype = gate.articulate({
    door0: AutoMovieArchetypeStartingGate.SWING,
  });
  for (const index of [0, 1, 27]) {
    const closed: IAutoMovieVector3 = centre(gate, `leaf${index}`);
    const opened: IAutoMovieVector3 = centre(open, `leaf${index}`);
    const side: number = index % 2 === 0 ? -1 : 1;
    const middle: number = (Math.floor(index / 2) + 0.5 - 7) * PITCH;
    TestValidator.predicate(
      `front leaf ${index} lies along its partition toward the run`,
      nclose(closed.z, 0, 1e-12) &&
        vclose(
          opened,
          { x: middle + (side * clear) / 2, y: closed.y, z: clear / 4 },
          1e-9,
        ),
    );
  }
  TestValidator.predicate(
    "the rear doors stay shut when the front opens",
    vclose(centre(open, "rear-leaf5"), centre(gate, "rear-leaf5"), 1e-12),
  );

  // 3. A loading door alone.
  const loading: AutoMovieArchetype = gate.articulate({
    rear5: AutoMovieArchetypeStartingGate.SWING,
  });
  TestValidator.predicate(
    "a rear door swings back to load its stall and the front stays shut",
    centre(loading, "rear-leaf5").z <
      centre(gate, "rear-leaf5").z - clear / 4 &&
      vclose(centre(loading, "leaf0"), centre(gate, "leaf0"), 1e-12),
  );

  // 4. A saddle horse fits a stall.
  const outline: readonly IAutoMovieVector3[] =
    AutoMovieArchetypePassage.footprint(
      createHorse({ withersHeight: 1.8 }),
    ).outline;
  const breadth: number =
    Math.max(...outline.map((p: IAutoMovieVector3): number => p.x)) -
    Math.min(...outline.map((p: IAutoMovieVector3): number => p.x));
  TestValidator.predicate(
    `a saddle horse ${breadth} m across fits a stall ${clear} m clear`,
    breadth < clear,
  );

  // 5. Seeds and refusals.
  TestValidator.equals(
    "a seed rebuilds the same gate",
    JSON.stringify(AutoMovieArchetypeStartingGate.create({}, 1012)),
    JSON.stringify(gate),
  );
  TestValidator.predicate(
    "another seed varies the gate",
    JSON.stringify(AutoMovieArchetypeStartingGate.create({}, 1013)) !== JSON.stringify(gate),
  );
  for (const stalls of [1, 20])
    TestValidator.equals(
      `a gate of ${stalls} stalls builds`,
      AutoMovieArchetypeStartingGate.create({ stalls }).affordances.filter(
        (a: IAutoMovieAffordance): boolean => a.id.startsWith("stall"),
      ).length,
      stalls,
    );
  for (const stalls of [0, 21, 2.5]) {
    let refusal: unknown;
    try {
      AutoMovieArchetypeStartingGate.create({ stalls });
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      `${stalls} stalls refuse`,
      refusal instanceof AutoMovieArchetypeRefusal && refusal.axis === "stalls",
    );
  }
}

/** A part's placed middle, metres in the gate's frame. */
function centre(gate: AutoMovieArchetype, id: string): IAutoMovieVector3 {
  return gate.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === id,
  )!.transform!.translation;
}
