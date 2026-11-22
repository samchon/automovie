import {
  type AutoMovieArchetypeFracture,
  createDoor,
  createDrinkware,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A breakable archetype's threshold rides its model body's `contact.fracture`, which `validateModel` admits only as a finite energy above zero, and an archetype that does not break serialises as it did.
 *
 * Scenarios:
 * 1. An empty and a full beer bottle carry 40 J and 30 J as `body.contact.fracture` (Bolliger et al. 2009), a hinged door 80 J (ASTM F476's lowest ram level, US 11280110 B1); a part-filled bottle, a mug and a sliding door carry none.
 * 2. Each of them passes `validateModel`; the same bottle with its fracture set to 0, -1, NaN or Infinity is refused.
 * 3. A sliding door, which declares no fracture set, never breaks, even at 10 kJ.
 * 4. No archetype's serialised model carries its fracture sets or its parts' masses: a mug's and a bottle's JSON have no `fractures` or `masses` key, so an archetype without fracture sets serialises as before.
 * 5. A hit's fragments and remainder each pass `validateModel`, and carry no fracture of their own: a piece does not break again.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the thresholds off the real producers' model bodies, puts four bad energies through the engine's admission, breaks the bottle and the door and admits their pieces; a threshold on the wrong kind, a zero threshold admitted, a sliding door that breaks or a fracture record leaking into the serialised model is caught.
 * @evidence contracts/development/testing.md#independent-expectations The energies are the cited figures, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Three breakable and three unbreakable archetypes, four refused energies, and the pieces of two breaks.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_fracture_contact(): void {
  const findings: string[] = [];
  const momentum: { x: number; y: number; z: number } = { x: 0, y: 0, z: 2 };
  const cases: readonly [string, IAutoMovieModel, number | undefined][] = [
    [
      "an empty beer bottle",
      createDrinkware({ kind: "beerBottle", fill: 0 }),
      40,
    ],
    [
      "a full beer bottle",
      createDrinkware({ kind: "beerBottle", fill: 1 }),
      30,
    ],
    ["a hinged door", createDoor({ kind: "hinged" }), 80],
    [
      "a half-full beer bottle",
      createDrinkware({ kind: "beerBottle", fill: 0.5 }),
      undefined,
    ],
    ["a mug", createDrinkware({ kind: "mug" }), undefined],
    ["a sliding door", createDoor({ kind: "sliding" }), undefined],
  ];

  // 1 and 2. The thresholds and their admission.
  for (const [label, model, fracture] of cases) {
    if (model.body?.contact?.fracture !== fracture)
      findings.push(
        `${label} carries ${model.body?.contact?.fracture} J, not ${fracture} J`,
      );
    if (!validateModel({ model }).success)
      findings.push(`${label} is not admitted`);
  }
  const bottle: IAutoMovieModel = JSON.parse(
    JSON.stringify(createDrinkware({ kind: "beerBottle", fill: 0 })),
  ) as IAutoMovieModel;
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const model: IAutoMovieModel = {
      ...bottle,
      body: {
        ...bottle.body!,
        contact: { ...bottle.body!.contact, fracture: bad },
      },
    };
    if (validateModel({ model }).success)
      findings.push(`a fracture of ${bad} J is admitted`);
  }

  // 3. A sliding door never breaks.
  if (
    createDoor({ kind: "sliding" }).broken({ energy: 10000, momentum }) !== null
  )
    findings.push("a sliding door breaks");

  // 4. The serialised models.
  for (const [label, model] of [
    ["a mug", createDrinkware({ kind: "mug" })],
    ["an empty beer bottle", createDrinkware({ kind: "beerBottle", fill: 0 })],
  ] as const) {
    const keys: string[] = Object.keys(
      JSON.parse(JSON.stringify(model)) as object,
    );
    if (keys.includes("fractures") || keys.includes("masses"))
      findings.push(`${label} serialises ${keys.join(", ")}`);
  }

  // 5. The pieces.
  const inspect = <I extends string, D extends string>(
    label: string,
    broken: AutoMovieArchetypeFracture.IPieces<I, D> | null,
  ): void => {
    if (broken === null) {
      findings.push(`${label} does not break`);
      return;
    }
    const pieces: { id: string; model: IAutoMovieModel; again: boolean }[] = [
      ...(broken.remainder === null
        ? []
        : [
            {
              id: "remainder",
              model: broken.remainder,
              again:
                broken.remainder.broken({ energy: 10000, momentum }) !== null,
            },
          ]),
      ...broken.fragments.map(
        (
          f: AutoMovieArchetypeFracture.IPiece<D, I>,
        ): { id: string; model: IAutoMovieModel; again: boolean } => ({
          id: f.id,
          model: f.archetype,
          again: f.archetype.broken({ energy: 10000, momentum }) !== null,
        }),
      ),
    ];
    for (const piece of pieces) {
      if (!validateModel({ model: piece.model }).success)
        findings.push(`${label}'s ${piece.id} is not admitted`);
      if (piece.again) findings.push(`${label}'s ${piece.id} breaks again`);
      if (piece.model.body?.contact?.fracture !== undefined)
        findings.push(
          `${label}'s ${piece.id} carries a ${piece.model.body.contact.fracture} J threshold`,
        );
    }
  };
  inspect(
    "the bottle",
    createDrinkware({ kind: "beerBottle", fill: 1 }).broken({
      energy: 30,
      momentum,
    }),
  );
  inspect(
    "the door",
    createDoor({ kind: "hinged" }).broken({ energy: 80, momentum }),
  );
  TestValidator.equals(
    "a threshold rides the body and is admitted only as an energy",
    findings,
    [],
  );
}
