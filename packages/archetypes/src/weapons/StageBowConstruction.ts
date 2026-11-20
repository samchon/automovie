import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  type IArchetypeBand,
} from "../core";
import { createBow } from "./createBow";

/**
 * Prepare the stored digital bow silhouette.
 *
 * Resolve a display model and dimensions on the original draw axes before invoking the selected shape.
 *
 * @param kind The saved profile label.
 * @param build The selected digital shape and contact builder.
 * @param params See the input options of the selected form.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the model-space digital silhouette and shared catalogue.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves saved models, dimension precedence, identity and form names.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One draw, one builder, one selected form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function StageBowConstruction(
  kind: createBow.Kind,
  params: Omit<createBow.IParams, "kind">,
  seed: number | string | undefined,
  build: (
    builder: ArchetypeBuilder<createBow.Affordance, createBow.Dimension>,
    dimensions: Readonly<Partial<Record<createBow.Dimension, number>>>,
  ) => Archetype<createBow.Affordance, createBow.Dimension>,
): Archetype<createBow.Affordance, createBow.Dimension> {
  const draw: ArchetypeDrawSession<createBow.Dimension> =
    new ArchetypeDrawSession<createBow.Dimension>(
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
  const bands: Readonly<Partial<Record<createBow.Dimension, IArchetypeBand>>> =
    {
      ...createBow.BANDS[kind],
      ...(model.name === undefined ? {} : createBow.BRACES[model.name]),
    };
  const d: Partial<Record<createBow.Dimension, number>> = {
    ...draw.dimensions(bands, createBow.BANDS),
    ...model.figures,
    ...weight.figures,
  };
  const builder: ArchetypeBuilder<createBow.Affordance, createBow.Dimension> =
    new ArchetypeBuilder({
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
