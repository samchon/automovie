import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "../core";
import { AutoMovieArchetypeHolster } from "./AutoMovieArchetypeHolster";

/** The readable name of each kind. */
const NAMES: Readonly<Record<AutoMovieArchetypeHolster.Kind, string>> = {
  holster: "belt holster",
  scabbard: "scabbard",
  sheath: "sheath",
  quiver: "quiver",
  pouch: "cartridge box",
};

/**
 * Assemble a display carrier from its stored form.
 *
 * Draw the selected fit, mount height and slot count before attaching that
 * carrier's geometry and scene contacts.
 *
 * @param kind The selected carrier form.
 * @param build Adds the selected carrier geometry and wear contacts.
 * @param params The accepted dimensions and choices of the selected carrier.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function StageCarrierConstruction(
  kind: AutoMovieArchetypeHolster.Kind,
  params: Omit<AutoMovieArchetypeHolster.IParams, "kind">,
  seed: number | undefined,
  build: StageCarrierConstruction.Build,
): AutoMovieArchetype<AutoMovieArchetypeHolster.Affordance, AutoMovieArchetypeHolster.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHolster.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHolster.Dimension>(
      "holster",
      AutoMovieArchetypeHolster.UNITS,
      seed,
      params,
    );

  // The slots a quiver holds, from one to the most its source holds.
  const slotted: AutoMovieArchetypeHolster.ISlots | undefined = AutoMovieArchetypeHolster.SLOTS[kind];
  const capacity: number | undefined = slotted?.capacity;
  const slots: number | undefined =
    params.slots === undefined
      ? (slotted?.slots ?? 0)
      : Array.from(
          { length: capacity ?? 0 },
          (_: unknown, index: number): number => index + 1,
        ).find((count: number): boolean => count === params.slots);
  if (slots === undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "holster",
      axis: "slots",
      value: params.slots,
      feasible:
        capacity === undefined
          ? { kind: "alternatives", values: ["quiver"] }
          : { kind: "range", minimum: 1, maximum: capacity, unit: "" },
      reason:
        capacity === undefined
          ? `a ${kind} has no slots`
          : `a ${kind} holds 1 to ${capacity}, not ${params.slots}`,
      fix:
        capacity === undefined
          ? "leave slots out, or choose a quiver"
          : "give a whole number of slots",
    });
  // A holster rides at one of the maker's three heights; a scabbard or a sheath is made to one blade, its length and width that blade's with the maker's fit.
  const ride: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeHolster.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeHolster.Ride>(
    "model",
    params.model,
    AutoMovieArchetypeHolster.MODELS[kind],
  );
  const blades:
    | Readonly<Partial<Record<AutoMovieArchetypeHolster.Blade, AutoMovieArchetypeHolster.Fitted>>>
    | undefined =
    kind === "scabbard"
      ? AutoMovieArchetypeHolster.BLADES.scabbard
      : kind === "sheath"
        ? AutoMovieArchetypeHolster.BLADES.sheath
        : undefined;
  // The blade is picked by name; its fitted bands are what it gives, so it carries no figures.
  const figures: Partial<
    Record<
      AutoMovieArchetypeHolster.Blade,
      Readonly<Partial<Record<AutoMovieArchetypeHolster.Dimension, number>>>
    >
  > = {};
  if (kind === "scabbard")
    for (const name of AutoMovieArchetypeHolster.SCABBARD_BLADES) figures[name] = {};
  else if (kind === "sheath")
    for (const name of AutoMovieArchetypeHolster.SHEATH_BLADES) figures[name] = {};
  const blade: AutoMovieArchetypeHolster.Blade | undefined =
    draw.model<AutoMovieArchetypeHolster.Blade>(
      "blade",
      params.blade,
      blades === undefined
        ? undefined
        : figures,
    ).name;
  const fitted: Readonly<
    Partial<Record<AutoMovieArchetypeHolster.Dimension, IAutoMovieArchetypeBand>>
  > = blade === undefined || blades === undefined ? {} : blades[blade]!;
  const d: Partial<Record<AutoMovieArchetypeHolster.Dimension, number>> = {
    ...draw.dimensions(
      { ...AutoMovieArchetypeHolster.BANDS[kind], ...fitted },
      {
        ...AutoMovieArchetypeHolster.BANDS,
        ...AutoMovieArchetypeHolster.BLADES.scabbard,
        ...AutoMovieArchetypeHolster.BLADES.sheath,
      },
    ),
    ...ride.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHolster.Affordance,
    AutoMovieArchetypeHolster.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  build(builder, d, slots);
  return builder.build(d.mass!);
}

/** Geometry callback for the display carrier catalogue. */
export namespace StageCarrierConstruction {
  /** Draws one carrier in its own local wear frame. */
  export type Build = (
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeHolster.Affordance,
      AutoMovieArchetypeHolster.Dimension
    >,
    dimensions: Readonly<Partial<Record<AutoMovieArchetypeHolster.Dimension, number>>>,
    slots: number,
  ) => void;

  /** Turn a wear site at the given metres x, y, z toward the actor. */
  export function facingWearer(at: IAutoMovieVector3): IAutoMovieTransform {
    return AutoMovieArchetypeFrame.facing(
      at,
      Vector3.create(-1, 0, 0),
      Vector3.create(0, 0, 1),
    );
  }
}
