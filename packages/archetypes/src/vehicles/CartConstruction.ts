import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { CART_MODELS } from "./CART_MODELS";
import { CartFit } from "./CartFit";
import { AutoMovieArchetypeCart } from "./AutoMovieArchetypeCart";

/**
 * Assemble a land carrier from the historical catalogue.
 *
 * The per-form callback records the supports and geometry after the legacy draw
 * session resolves measured dimensions.
 *
 * @param kind The fixed operating form.
 * @param build The form's measured geometry and contact builder.
 * @param fit Optional preparation of the drawn measurements.
 * @param params The carrier's authored options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function CartConstruction(
  kind: AutoMovieArchetypeCart.Kind,
  params: Omit<AutoMovieArchetypeCart.IParams, "kind">,
  seed: number | undefined,
  build: CartConstruction.Build,
  fit?: typeof CartFit.harness,
): AutoMovieArchetype<AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCart.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeCart.Dimension>(
      "cart",
      AutoMovieArchetypeCart.UNITS,
      seed,
      params,
    );
  // One read model of the kind, among those made for the horse when its height is fixed, then its castors or its shafts, their figures recorded first; the kind's bands and the model's own ranges draw what they leave.
  const model: {
    name: AutoMovieArchetypeCart.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeCart.Model>(
    "model",
    params.model,
    params.model === undefined
      ? CartFit.models(CART_MODELS.figures[kind], { ...params, kind })
      : CART_MODELS.figures[kind],
  );
  draw.model<AutoMovieArchetypeCart.Castor>(
    "castor",
    params.castor,
    CART_MODELS.castors[kind],
  );
  draw.model<AutoMovieArchetypeCart.Shaft>(
    "shaft",
    params.shaft,
    model.name === undefined ? undefined : CART_MODELS.shafts[model.name],
  );
  draw.dimensions(
    {
      ...AutoMovieArchetypeCart.BANDS[kind],
      ...(model.name === undefined ? {} : CART_MODELS.ranges[model.name]),
    },
    AutoMovieArchetypeCart.BANDS,
  );
  fit?.(draw);
  const d: Partial<Record<AutoMovieArchetypeCart.Dimension, number>> = { ...draw.values };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: AutoMovieArchetypeCart.NAMES[kind],
    draw,
  });
  build(builder, d);
  return builder.build(d.mass!, AutoMovieArchetypeCart.RESTS[kind]);
}

/** Shared builder signature for canonical land carrier producers. */
export namespace CartConstruction {
  /** Adds one carrier form's model-space geometry and contacts. */
  export type Build = (
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    dimensions: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ) => void;
}
