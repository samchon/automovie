import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { AutoMovieArchetypeBow } from "../AutoMovieArchetypeBow";

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
  kind: AutoMovieArchetypeBow.Kind,
  params: Omit<AutoMovieArchetypeBow.IParams, "kind">,
  seed: number | undefined,
  build: (
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBow.Affordance,
      AutoMovieArchetypeBow.Dimension
    >,
    dimensions: Readonly<Partial<Record<AutoMovieArchetypeBow.Dimension, number>>>,
  ) => AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension>,
): AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBow.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBow.Dimension>(
      "bow",
      AutoMovieArchetypeBow.UNITS,
      seed,
      params,
    );

  // A longbow is one of the three read approximations, its mass and draw whole; a recurve one of the maker's two lengths with its brace band; a horse bow one of the two read bows, drawn at one of its maker's draw weights.
  const model: {
    name: AutoMovieArchetypeBow.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeBow.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeBow.Model>(
    "model",
    params.model,
    AutoMovieArchetypeBow.MODELS[kind],
  );
  const weight: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeBow.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeBow.Weight>(
    "weight",
    params.weight,
    AutoMovieArchetypeBow.WEIGHTS[kind],
  );
  const bands: Readonly<
    Partial<Record<AutoMovieArchetypeBow.Dimension, IAutoMovieArchetypeBand>>
  > = {
    ...AutoMovieArchetypeBow.BANDS[kind],
    ...(model.name === undefined ? {} : AutoMovieArchetypeBow.BRACES[model.name]),
  };
  const d: Partial<Record<AutoMovieArchetypeBow.Dimension, number>> = {
    ...draw.dimensions(bands, AutoMovieArchetypeBow.BANDS),
    ...model.figures,
    ...weight.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBow.Affordance,
    AutoMovieArchetypeBow.Dimension
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
