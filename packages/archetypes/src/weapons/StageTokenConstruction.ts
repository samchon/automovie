import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { createProjectile } from "./createProjectile";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createProjectile.Kind, string>> = {
  ball: "musket ball",
  arrow: "arrow",
  bolt: "crossbow bolt",
  roundShot: "round shot",
  grenade: "hand grenade",
  cartridge: "musket cartridge",
  stone: "throwing stone",
};

/**
 * Resolve an inert digital display token.
 *
 * The stored model record and original draw session preserve the silhouette's
 * scene identity, size and material.
 *
 * @param kind The historical profile label.
 * @param build The shape builder for the chosen profile, with its resolved
 *   dimensions.
 * @param params The model choice, admitted dimensions and scene identifier.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function StageTokenConstruction(
  kind: createProjectile.Kind,
  params: Omit<createProjectile.IParams, "kind">,
  seed: number | undefined,
  build: StageTokenConstruction.Build,
): AutoMovieArchetype<createProjectile.Affordance, createProjectile.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createProjectile.Dimension> =
    new AutoMovieArchetypeDrawSession<createProjectile.Dimension>(
      "projectile",
      createProjectile.UNITS,
      seed,
      params,
    );

  // An arrow, a bolt and a round shot are each one read object whole; a band is drawn only for a figure its object does not give.
  const model: {
    name: createProjectile.Model | undefined;
    figures: Readonly<Partial<Record<createProjectile.Dimension, number>>>;
  } = draw.model<createProjectile.Model>(
    "model",
    params.model,
    createProjectile.MODELS[kind],
  );
  const d: Partial<Record<createProjectile.Dimension, number>> = {
    ...draw.dimensions(createProjectile.BANDS[kind], createProjectile.BANDS),
    ...model.figures,
  };

  // A stone's diameter is the sphere its drawn mass fills at its drawn specific gravity, water being 1000 kg per cubic metre: derived, not drawn.
  if (kind === "stone")
    d.diameter = draw.derive(
      "diameter",
      Math.cbrt((6 * d.mass!) / (Math.PI * d.gravity! * 1000)),
    );
  const builder: AutoMovieArchetypeBuilder<
    createProjectile.Affordance,
    createProjectile.Dimension
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

/** Resolved digital prop dimensions and optional named reference model. */
export namespace StageTokenConstruction {
  /** Builds one digital silhouette and its existing metadata. */
  export type Build = (
    builder: AutoMovieArchetypeBuilder<
      createProjectile.Affordance,
      createProjectile.Dimension
    >,
    d: Readonly<Partial<Record<createProjectile.Dimension, number>>>,
    model: createProjectile.Model | undefined,
  ) => AutoMovieArchetype<
    createProjectile.Affordance,
    createProjectile.Dimension
  >;
}
