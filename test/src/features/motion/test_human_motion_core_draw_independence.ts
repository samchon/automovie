import {
  HumanBreath,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanLayer,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * What one action draws from the seed does not depend on what else the film
 * holds: adding a performer, an action of another person composed before
 * it, or a layer leaves its draws as they were.
 *
 * A film is edited after it is first composed. If every draw came from one
 * stream consumed in order, adding a bystander would change every take
 * already approved. So each draw is keyed by the seed, the performer, the
 * action's id and the quantity (Salmon et al. 2011, counter-based streams).
 *
 * The reading is a wave with variation, anchored `w`, after a short stand:
 * its duration and the seconds from its start to each of its events, which
 * its drawn tempo sets.
 *
 * Scenarios, on the average man as `a` under one seed:
 * 1. The film with `a` alone gives the reference reading.
 * 2. With two more people standing by, the reading is the same to 1e-12 s.
 * 3. With another person composed before `a` who performs a varied wave of
 *    their own, the reading is the same.
 * 4. With that person also breathing under a layer, which draws its rate
 *    and phase, the reading is the same.
 * 5. Under another seed the reading differs by more than a microsecond, so
 *    the equalities above are not those of a quantity that never varies.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each film through the public input and reads the placed wave's duration and event seconds; a draw that shifts when the film gains a person, an action or a layer fails, and so does a reading no seed moves.
 * @evidence contracts/development/testing.md#independent-expectations Equality between runs is a metamorphic relation that needs no expected value; the differing seed guards it against a constant.
 * @evidence contracts/development/testing.md#distinguishing-cases An added performer, an added action composed earlier, an added layer, and a changed seed as the negative case. That a seed repeats is `test_human_motion_grammar_tables`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds five short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, its reason and source, the reading and the 5 scenarios.
 */
export function test_human_motion_core_draw_independence(): void {
  const complaints: string[] = [];
  const bodies: Record<"a" | "b" | "c", IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
    c: motionHumanBody("f-small"),
  };
  const waving = (subject: string, anchor: string): HumanChain =>
    HumanChain.subject(subject)
      .stand({ seconds: 0.3 })
      .gesture({ kind: "wave", manner: { variation: 1 } }, anchor);

  // The wave's duration, then the seconds from its start to each event.
  const read = (
    seed: string,
    subjects: readonly ("a" | "b" | "c")[],
    composition: { node: HumanChain["node"] },
    layers?: Record<string, readonly IHumanLayer[]>,
  ): number[] => {
    const wave: HumanSegment.ISegment | undefined = new HumanPerformance({
      seed,
      performers: subjects.map((subject: "a" | "b" | "c", index: number) => ({
        subject,
        body: bodies[subject],
        at: { x: index * 1.5, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      ...(layers === undefined ? {} : { layers }),
      composition: composition.node,
    })
      .segments("a")
      .find((segment: HumanSegment.ISegment): boolean => segment.id === "w");
    return wave === undefined
      ? []
      : [
          wave.plan.duration,
          ...wave.plan.events.map(
            (event: { name: string; share: number }): number =>
              event.share * wave.plan.duration,
          ),
        ];
  };
  const apart = (one: readonly number[], other: readonly number[]): number =>
    one.length === 0 || one.length !== other.length
      ? Number.POSITIVE_INFINITY
      : Math.max(
          ...one.map((value: number, index: number): number =>
            Math.abs(value - other[index]!),
          ),
        );

  // 1. The reference.
  const alone: number[] = read("take-1", ["a"], waving("a", "w"));
  if (alone.length < 2)
    complaints.push("the reference film places no wave anchored w");

  // 2 to 4. What is added leaves the wave's draws alone.
  for (const [label, reading] of [
    [
      "two people standing by",
      read("take-1", ["a", "b", "c"], waving("a", "w")),
    ],
    [
      "another person's varied wave composed first",
      read("take-1", ["a", "b"], waving("b", "other").with(waving("a", "w"))),
    ],
    [
      "that person also breathing under a layer",
      read("take-1", ["a", "b"], waving("b", "other").with(waving("a", "w")), {
        b: [HumanBreath.layer()],
      }),
    ],
  ] as const) {
    const off: number = apart(alone, reading);
    if (off > 1e-12)
      complaints.push(
        `with ${label} the wave's instants move by ${off.toExponential(2)} s, nothing expected`,
      );
  }

  // 5. The reading is one a seed moves.
  const other: number = apart(alone, read("take-2", ["a"], waving("a", "w")));
  if (!(other > 1e-6))
    complaints.push(
      `under another seed the wave's instants move by ${other.toExponential(2)} s, more than a microsecond expected`,
    );

  TestValidator.equals(
    "an action's draws do not depend on the rest of the film",
    complaints,
    [],
  );
}
