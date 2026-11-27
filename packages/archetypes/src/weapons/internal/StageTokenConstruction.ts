import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../../core";
import { AutoMovieArchetypeProjectile } from "../AutoMovieArchetypeProjectile";

/*
 * Resolve an inert digital display token.
 *
 * The stored model record and original draw session preserve the silhouette's
 * scene identity, size and material.
 * Parameter kind: The historical profile label.
 * Parameter build: The shape builder for the chosen profile, with its resolved
 * dimensions.
 * Parameter params: The model choice, admitted dimensions and scene identifier.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function StageTokenConstruction(
  kind: AutoMovieArchetypeProjectile.Kind,
  params: Omit<AutoMovieArchetypeProjectile.IParams, "kind">,
  seed: number | undefined,
  build: StageTokenConstruction.Build,
): AutoMovieArchetype<AutoMovieArchetypeProjectile.Affordance, AutoMovieArchetypeProjectile.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeProjectile.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeProjectile.Dimension>(
      "projectile",
      AutoMovieArchetypeProjectile.UNITS,
      seed,
      params,
    );

  // An arrow, a bolt and a round shot are each one read object whole; a band is drawn only for a figure its object does not give.
  const model: {
    name: AutoMovieArchetypeProjectile.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeProjectile.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeProjectile.Model>(
    "model",
    params.model,
    AutoMovieArchetypeProjectile.MODELS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeProjectile.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeProjectile.BANDS[kind], AutoMovieArchetypeProjectile.BANDS),
    ...model.figures,
  };

  // A stone's diameter is the sphere its drawn mass fills at its drawn specific gravity, water being 1000 kg per cubic metre: derived, not drawn.
  if (kind === "stone")
    d.diameter = draw.derive(
      "diameter",
      Math.cbrt((6 * d.mass!) / (Math.PI * d.gravity! * 1000)),
    );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeProjectile.Affordance,
    AutoMovieArchetypeProjectile.Dimension
  > = new AutoMovieArchetypeBuilder({
    material:
      kind === "ball"
        ? "lead"
        : kind === "roundShot"
          ? "iron"
          : kind === "stone"
            ? "stone"
            : "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  return build(builder, d, model.name);
}

/*
 * Resolved digital prop dimensions and optional named reference model.
 */
export namespace StageTokenConstruction {
  /*
   * Builds one digital silhouette and its existing metadata.
   */
  export type Build = (
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeProjectile.Affordance,
      AutoMovieArchetypeProjectile.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeProjectile.Dimension, number>>>,
    model: AutoMovieArchetypeProjectile.Model | undefined,
  ) => AutoMovieArchetype<
    AutoMovieArchetypeProjectile.Affordance,
    AutoMovieArchetypeProjectile.Dimension
  >;
}

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<AutoMovieArchetypeProjectile.Kind, string>> = {
  ball: "musket ball",
  arrow: "arrow",
  bolt: "crossbow bolt",
  roundShot: "round shot",
  grenade: "hand grenade",
  cartridge: "musket cartridge",
  stone: "throwing stone",
};
