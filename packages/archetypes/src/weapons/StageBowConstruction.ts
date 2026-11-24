import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core";
import { createBow } from "./createBow";

/**
 * Prepare the stored digital bow silhouette.
 *
 * Resolve a display model and dimensions on the original draw axes before
 * invoking the selected shape.
 *
 * @param kind The saved profile label.
 * @param build The selected digital shape and contact builder.
 * @param params See the input options of the selected form.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function StageBowConstruction(
  kind: createBow.Kind,
  params: Omit<createBow.IParams, "kind">,
  seed: number | undefined,
  build: (
    builder: AutoMovieArchetypeBuilder<
      createBow.Affordance,
      createBow.Dimension
    >,
    dimensions: Readonly<Partial<Record<createBow.Dimension, number>>>,
  ) => AutoMovieArchetype<createBow.Affordance, createBow.Dimension>,
): AutoMovieArchetype<createBow.Affordance, createBow.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBow.Dimension> =
    new AutoMovieArchetypeDrawSession<createBow.Dimension>(
      "bow",
      createBow.UNITS,
      seed,
      params,
    );

  // A longbow is one of the three read approximations, its mass and draw whole; a recurve one of the maker's two lengths with its brace band; a horse bow one of the two read bows, drawn at one of its maker's draw weights.
  const model: {
    name: createBow.Model | undefined;
    figures: Readonly<Partial<Record<createBow.Dimension, number>>>;
  } = draw.model<createBow.Model>(
    "model",
    params.model,
    createBow.MODELS[kind],
  );
  const weight: {
    figures: Readonly<Partial<Record<createBow.Dimension, number>>>;
  } = draw.model<createBow.Weight>(
    "weight",
    params.weight,
    createBow.WEIGHTS[kind],
  );
  const bands: Readonly<
    Partial<Record<createBow.Dimension, IAutoMovieArchetypeBand>>
  > = {
    ...createBow.BANDS[kind],
    ...(model.name === undefined ? {} : createBow.BRACES[model.name]),
  };
  const d: Partial<Record<createBow.Dimension, number>> = {
    ...draw.dimensions(bands, createBow.BANDS),
    ...model.figures,
    ...weight.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createBow.Affordance,
    createBow.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name:
      kind === "longbow"
        ? "longbow"
        : kind === "recurve"
          ? "recurve bow"
          : kind === "crossbow"
            ? "crossbow"
            : "horse bow",
    draw,
  });
  return build(builder, d);
}
