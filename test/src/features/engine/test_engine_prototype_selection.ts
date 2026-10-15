import { selectInstancePrototype } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

const SLOTS: number = 2_000;

interface IChoice {
  id: string;
  model: string;
  weight: number;
}

/** Preserve the authored prototype identity, model spelling and scalar weight. */
const choice: (id: string, weight: number) => IChoice = (
  id: string,
  weight: number,
): IChoice => ({
  id,
  model: `${id}-model`,
  weight,
});

/** A grove drawing from `prototypes`, or from its base model without them. */
const grove: (
  prototypes?: IChoice[],
  seed?: number,
) => {
  id: string;
  seed: number;
  model: string;
  prototypes: IChoice[] | undefined;
} = (
  prototypes?: IChoice[],
  seed: number = 31,
): {
  id: string;
  seed: number;
  model: string;
  prototypes: IChoice[] | undefined;
} => ({
  id: "grove",
  seed,
  model: "oak",
  prototypes,
});

/** The choice each of the first `count` slots draws by weight. */
const draws: (source: ReturnType<typeof grove>, count?: number) => IChoice[] = (
  source: ReturnType<typeof grove>,
  count: number = SLOTS,
): IChoice[] =>
  Array.from(
    { length: count },
    (_: unknown, slot: number): IChoice =>
      selectInstancePrototype(source, slot, undefined),
  );

/** Observe one prototype's frequency without predicting any individual draw. */
const share: (drawn: readonly IChoice[], id: string) => number = (
  drawn: readonly IChoice[],
  id: string,
): number =>
  drawn.filter((value: IChoice): boolean => value.id === id).length /
  drawn.length;

/**
 * One instance slot draws its prototype by the weights its table declares, or
 * takes the one an explicit member names.
 *
 * Every expectation is a property of the declared weights rather than a draw
 * read off an implementation: a lone choice is always drawn, a zero weight is
 * never drawn by weight, shares follow the weights, and scaling every weight by
 * the same power of two changes no slot's choice. A table with no weight at all
 * has nothing to spend, so its slots take the last choice, which is the choice
 * that remains once every earlier one has been passed.
 *
 * Scenarios:
 *
 * 1. A set without a table draws its base model as `default` on every slot, and
 *    a one-entry table draws that entry, the table's own object, on every slot.
 * 2. Weights 1:2:1 are drawn in about those shares. A zero-weight choice between
 *    two others is never drawn while its twin of weight one takes about a third;
 *    a zero-weight first choice is never drawn; a table whose weights are all zero
 *    draws its last choice on every slot; and quadrupling every weight changes no
 *    slot's choice.
 * 3. The same seed draws the same choice on every slot again, and another seed
 *    draws a different choice on most slots.
 * 4. An explicit member takes the entry it names, even one of weight zero, and a
 *    set without a table answers `default`. A name the table lacks refuses that
 *    slot by name, while the twin naming a present entry is answered.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real weighted prototype selector over the original 2000 slots and explicit-name paths, observing base/lone identity, fixed-seed shares, skipped zero weights, all-zero final-choice policy, power-of-two scale invariance, repeatability/reseeding and named refusal.
 * @evidence contracts/testing.md#independent-expectations Literal weights 1:2:1 and equal-weight twins imply .25/.5/.25 and one-third target shares without replaying the selector. Distribution predicates retain their strict .04 boundary alongside nclose; original exact zero/one shares use zero tolerance. This finite fixed-seed witness is not a proof of arbitrary-seed statistical independence.
 * @evidence contracts/testing.md#distinguishing-cases Preserves omitted/single/weighted tables, middle/leading/all zero weights, quadrupled weights, seeds31/32 and explicit zero-weight/missing/present names, including returned table-object identity. Malformed weight admission and empty-table policy are not exercised here.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns literal tables and draw arrays and borrows selected entry identities; no compiled scene, file, native host, renderer, browser or GPU is used and no foreign method is replaced.
 */
export function test_engine_prototype_selection(): void {
  const lone: IChoice = choice("lone", 3);
  const base: IChoice[] = draws(grove());
  TestValidator.equals(
    "a set with one choice draws it on every slot",
    namedFacts([
      [
        "baseModel",
        (): boolean =>
          base.every(
            (value: IChoice): boolean =>
              value.id === "default" &&
              value.model === "oak" &&
              nclose(value.weight, 1, 0),
          ),
      ],
      [
        "loneEntry",
        (): boolean =>
          draws(grove([lone])).every(
            (value: IChoice): boolean => value === lone,
          ),
      ],
    ]),
    { baseModel: true, loneEntry: true },
  );

  const weighted: IChoice[] = draws(
    grove([choice("a", 1), choice("b", 2), choice("c", 1)]),
  );
  const skipped: IChoice[] = draws(
    grove([choice("a", 1), choice("z", 0), choice("c", 1)]),
  );
  const twin: IChoice[] = draws(
    grove([choice("a", 1), choice("z", 1), choice("c", 1)]),
  );
  const leadingZero: IChoice[] = draws(grove([choice("z", 0), choice("b", 1)]));
  const allZero: IChoice[] = draws(
    grove([choice("x", 0), choice("y", 0), choice("z", 0)]),
  );
  const quadrupled: IChoice[] = draws(
    grove([choice("a", 4), choice("b", 8), choice("c", 4)]),
  );
  TestValidator.equals(
    "a slot draws by the declared weights and never by a zero weight",
    namedFacts([
      [
        "shareA",
        (): boolean => {
          const value: number = share(weighted, "a");
          return nclose(value, 0.25, 0.04) && Math.abs(value - 0.25) < 0.04;
        },
      ],
      [
        "shareB",
        (): boolean => {
          const value: number = share(weighted, "b");
          return nclose(value, 0.5, 0.04) && Math.abs(value - 0.5) < 0.04;
        },
      ],
      [
        "shareC",
        (): boolean => {
          const value: number = share(weighted, "c");
          return nclose(value, 0.25, 0.04) && Math.abs(value - 0.25) < 0.04;
        },
      ],
      ["zeroNeverDrawn", (): boolean => nclose(share(skipped, "z"), 0, 0)],
      [
        "zeroTwinDrawn",
        (): boolean => {
          const value: number = share(twin, "z");
          return nclose(value, 1 / 3, 0.04) && Math.abs(value - 1 / 3) < 0.04;
        },
      ],
      [
        "leadingZeroNeverDrawn",
        (): boolean => nclose(share(leadingZero, "z"), 0, 0),
      ],
      ["allZeroTakesLast", (): boolean => nclose(share(allZero, "z"), 1, 0)],
      [
        "scaleInvariant",
        (): boolean =>
          quadrupled.every(
            (value: IChoice, slot: number): boolean =>
              value.id === weighted[slot]!.id,
          ),
      ],
    ]),
    {
      shareA: true,
      shareB: true,
      shareC: true,
      zeroNeverDrawn: true,
      zeroTwinDrawn: true,
      leadingZeroNeverDrawn: true,
      allZeroTakesLast: true,
      scaleInvariant: true,
    },
  );

  const table: IChoice[] = [choice("a", 1), choice("b", 2), choice("c", 1)];
  const again: IChoice[] = draws(grove(table));
  const reseeded: IChoice[] = draws(grove(table, 32));
  TestValidator.equals(
    "a slot's draw is its seed's",
    namedFacts([
      [
        "repeatable",
        (): boolean =>
          again.every(
            (value: IChoice, slot: number): boolean =>
              value.id === weighted[slot]!.id,
          ),
      ],
      [
        "seedMatters",
        (): boolean =>
          reseeded.filter(
            (value: IChoice, slot: number): boolean =>
              value.id !== again[slot]!.id,
          ).length >
          SLOTS / 2,
      ],
    ]),
    { repeatable: true, seedMatters: true },
  );

  const sleeper: IChoice = choice("sleeper", 0);
  const named: ReturnType<typeof grove> = grove([choice("a", 1), sleeper]);
  TestValidator.equals(
    "an explicit member takes the entry it names or refuses a missing one",
    namedFacts([
      [
        "namedZeroWeight",
        (): boolean => selectInstancePrototype(named, 3, "sleeper") === sleeper,
      ],
      [
        "namedDefault",
        (): boolean =>
          selectInstancePrototype(grove(), 3, "default").id === "default",
      ],
      [
        "missingRefuses",
        (): boolean =>
          throwsError(
            (): IChoice => selectInstancePrototype(named, 3, "ghost"),
            'Instance set "grove" slot 3 references missing prototype "ghost".',
          ),
      ],
      [
        "presentTwinAnswered",
        (): boolean => selectInstancePrototype(named, 3, "a").id === "a",
      ],
    ]),
    {
      namedZeroWeight: true,
      namedDefault: true,
      missingRefuses: true,
      presentTwinAnswered: true,
    },
  );
}
