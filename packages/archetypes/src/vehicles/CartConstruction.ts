import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { CART_MODELS } from "./CART_MODELS";
import { CartFit } from "./CartFit";
import { createCart } from "./createCart";

/**
 * Assemble a land carrier from the historical catalogue.
 *
 * The per-form callback records the supports and geometry after the legacy draw session resolves measured dimensions.
 *
 * @param kind The fixed operating form.
 * @param build The form's measured geometry and contact builder.
 * @param fit Optional preparation of the drawn measurements.
 * @param params The carrier's authored options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the draw and geometry ownership of the land forms.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps model, castor, shaft and free dimension draws in their historical order before building the selected geometry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fit the recorded dimensions if requested, build the form, then compute its properties.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The catalogue and contact builder serve the canonical and legacy authoring inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function CartConstruction(
  kind: createCart.Kind,
  params: Omit<createCart.IParams, "kind">,
  seed: number | string | undefined,
  build: CartConstruction.Build,
  fit?: typeof CartFit.harness,
): AutoMovieArchetype<createCart.Affordance, createCart.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createCart.Dimension> =
    new AutoMovieArchetypeDrawSession<createCart.Dimension>(
      "cart",
      createCart.UNITS,
      seed,
      params,
    );
  // One read model of the kind, among those made for the horse when its height is fixed, then its castors or its shafts, their figures recorded first; the kind's bands and the model's own ranges draw what they leave.
  const model: {
    name: createCart.Model | undefined;
    figures: Readonly<Partial<Record<createCart.Dimension, number>>>;
  } = draw.model<createCart.Model>(
    "model",
    params.model,
    params.model === undefined
      ? CartFit.models(CART_MODELS.figures[kind], { ...params, kind })
      : CART_MODELS.figures[kind],
  );
  draw.model<createCart.Castor>(
    "castor",
    params.castor,
    CART_MODELS.castors[kind],
  );
  draw.model<createCart.Shaft>(
    "shaft",
    params.shaft,
    model.name === undefined ? undefined : CART_MODELS.shafts[model.name],
  );
  draw.dimensions(
    {
      ...createCart.BANDS[kind],
      ...(model.name === undefined ? {} : CART_MODELS.ranges[model.name]),
    },
    createCart.BANDS,
  );
  fit?.(draw);
  const d: Partial<Record<createCart.Dimension, number>> = { ...draw.values };
  const builder: AutoMovieArchetypeBuilder<
    createCart.Affordance,
    createCart.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: createCart.NAMES[kind],
    draw,
  });
  build(builder, d);
  return builder.build(d.mass!, createCart.RESTS[kind]);
}

/**
 * Shared builder signature for canonical land carrier producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two values a geometry owner reads.
 * @evidence contracts/development/design.md#principled-representation Reuses native dimensions and a typed archetype builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A form only receives its builder and resolved dimensions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps units and contacts in the land carrier catalogue.
 */
export namespace CartConstruction {
  /** Adds one carrier form's model-space geometry and contacts. */
  export type Build = (
    builder: AutoMovieArchetypeBuilder<
      createCart.Affordance,
      createCart.Dimension
    >,
    dimensions: Readonly<Partial<Record<createCart.Dimension, number>>>,
  ) => void;
}
