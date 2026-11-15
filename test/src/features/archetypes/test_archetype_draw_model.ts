import { ArchetypeDraw, ArchetypeRefusal } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** A made-up producer's dimensions. */
type Dimension = "length" | "mass" | "height";

/** Made-up sizes on one axis, the default first, each with its read figures. */
const SIZES: Readonly<Record<"small" | "large", Readonly<Partial<Record<Dimension, number>>>>> = {
  small: { length: 0.2, mass: 0.1 },
  large: { length: 0.3, mass: 0.2 },
};

/** Made-up heights on a second axis, a dependent one filtered by the size picked. */
const HEIGHTS: Readonly<Record<"low" | "mid" | "high", Readonly<Partial<Record<Dimension, number>>>>> = {
  low: { height: 0.1 },
  mid: { height: 0.2 },
  high: { height: 0.3 },
};

/**
 * A model is one of a variant's read models on a named axis, given or picked whole with its figures; each axis draws on its own stream, a dependent axis picks among the models an earlier pick admits, and a variant without models has none.
 *
 * Scenarios:
 * 1. A model given is kept with its figures; with no seed the first model is picked; the same seed gives the same model on every call; over 200 seeds every pick is one model with exactly its figures, and both models are picked.
 * 2. Two axes of one producer pick on their own streams: over 200 seeds the first axis's picks are the same whether or not a second axis is picked too, and the two axes do not always agree.
 * 3. A dependent axis filtered by the first pick (heights no greater than a size's length) only ever picks an admitted model, and over 200 seeds picks each admitted model.
 * 4. A variant without models, absent or empty, gives no name and no figures; a model given to it, and an unlisted model given to a variant with models, are refused with kind `parameter` on the axis.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `model` and reads its name, figures and refusals; a pick that blends two models, drifts between calls, shares one stream between axes, escapes a filtered list, skips a model, invents one for a variant without models or accepts a stray model is caught.
 * @evidence contracts/development/testing.md#independent-expectations Made-up figures written here; a uniform draw of two or three over 200 seeds draws each with certainty for any practical purpose, and two independent axes agree on far fewer than 200 seeds.
 * @evidence contracts/development/testing.md#distinguishing-cases Given, seedless and picked; one axis and two; a filtered list; absent, empty and stray models.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over a pure function, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_draw_model(): void {
  const findings: string[] = [];

  // 1. One axis.
  const given: { name: "small" | "large" | undefined; figures: Readonly<Partial<Record<Dimension, number>>> } =
    ArchetypeDraw.model("thing", "size", "large", SIZES, 3);
  if (given.name !== "large" || given.figures !== SIZES.large)
    findings.push("a given model was not kept with its figures");
  if (ArchetypeDraw.model("thing", "size", undefined, SIZES, undefined).name !== "small")
    findings.push("the seedless model is not the first");
  const sizes: Set<string> = new Set<string>();
  const heights: Set<string> = new Set<string>();
  let agree: number = 0;
  for (let seed: number = 0; seed < 200; seed++) {
    const size: { name: "small" | "large" | undefined; figures: Readonly<Partial<Record<Dimension, number>>> } =
      ArchetypeDraw.model<"small" | "large", Dimension>("thing", "size", undefined, SIZES, seed);
    if (ArchetypeDraw.model<"small" | "large", Dimension>("thing", "size", undefined, SIZES, seed).name !== size.name)
      findings.push(`seed ${seed}: two calls disagree`);
    if (size.name === undefined || size.figures !== SIZES[size.name])
      findings.push(`seed ${seed}: the figures are no read model's`);
    else sizes.add(size.name);

    // 2. A second axis on its own stream.
    const tone: string | undefined = ArchetypeDraw.model(
      "thing",
      "tone",
      undefined,
      { a: {}, b: {} },
      seed,
    ).name;
    if (ArchetypeDraw.model<"small" | "large", Dimension>("thing", "size", undefined, SIZES, seed).name !== size.name)
      findings.push(`seed ${seed}: a second axis moved the first`);
    if ((tone === "a") === (size.name === "small")) agree++;

    // 3. A dependent axis filtered by the first pick.
    const reach: number = size.figures.length ?? 0;
    const admitted: Partial<Record<"low" | "mid" | "high", Readonly<Partial<Record<Dimension, number>>>>> =
      Object.fromEntries(
        Object.entries(HEIGHTS).filter(
          ([, figures]: [string, Readonly<Partial<Record<Dimension, number>>>]): boolean =>
            (figures.height ?? 0) <= reach,
        ),
      );
    const height: string | undefined = ArchetypeDraw.model(
      "thing",
      "height",
      undefined,
      admitted,
      seed,
    ).name;
    if (height === undefined || (HEIGHTS[height as "low"].height ?? 0) > reach)
      findings.push(`seed ${seed}: the dependent axis escaped its admitted models`);
    else if (size.name === "small") heights.add(height);
  }
  if (sizes.size !== 2) findings.push(`200 seeds picked ${sizes.size} of the two sizes`);
  if (agree === 200) findings.push("two axes always agree, as one stream would");
  if (heights.size !== 2)
    findings.push(`the small size's 200 seeds picked ${heights.size} of its two admitted heights`);

  // 4. No models, and the refusals.
  for (const none of [undefined, {}] as const) {
    const plain: { name: string | undefined; figures: Readonly<Partial<Record<Dimension, number>>> } =
      ArchetypeDraw.model<"small" | "large", Dimension>("thing", "size", undefined, none, 5);
    if (plain.name !== undefined || Object.keys(plain.figures).length !== 0)
      findings.push("a variant without models was given one");
  }
  for (const [label, models, value] of [
    ["a model given to a variant without models", {}, "small"],
    ["an unlisted model", SIZES, "huge"],
  ] as const) {
    try {
      ArchetypeDraw.model("thing", "size", value as "small", models, 1);
      findings.push(`${label} was accepted`);
    } catch (error) {
      if (
        !(error instanceof ArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.axis !== "size"
      )
        findings.push(`${label} was not refused on its axis`);
    }
  }

  TestValidator.equals(
    "a model is one read model whole on its own axis",
    findings,
    [],
  );
}
