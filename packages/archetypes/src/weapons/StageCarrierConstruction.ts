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
import { createHolster } from "./createHolster";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createHolster.Kind, string>> = {
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
  kind: createHolster.Kind,
  params: Omit<createHolster.IParams, "kind">,
  seed: number | undefined,
  build: StageCarrierConstruction.Build,
): AutoMovieArchetype<createHolster.Affordance, createHolster.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createHolster.Dimension> =
    new AutoMovieArchetypeDrawSession<createHolster.Dimension>(
      "holster",
      createHolster.UNITS,
      seed,
      params,
    );

  // The slots a quiver holds, from one to the most its source holds.
  const slotted: createHolster.ISlots | undefined = createHolster.SLOTS[kind];
  const capacity: number | undefined = slotted?.capacity;
  const slots: number =
    slotted === undefined ? 0 : (params.slots ?? slotted.slots);
  if (
    params.slots !== undefined &&
    (capacity === undefined ||
      !Number.isInteger(params.slots) ||
      params.slots < 1 ||
      params.slots > capacity)
  )
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
    figures: Readonly<Partial<Record<createHolster.Dimension, number>>>;
  } = draw.model<createHolster.Ride>(
    "model",
    params.model,
    createHolster.MODELS[kind],
  );
  const blades:
    | Readonly<Partial<Record<createHolster.Blade, createHolster.Fitted>>>
    | undefined =
    kind === "scabbard"
      ? createHolster.BLADES.scabbard
      : kind === "sheath"
        ? createHolster.BLADES.sheath
        : undefined;
  // The blade is picked by name; its fitted bands are what it gives, so it carries no figures.
  const blade: createHolster.Blade | undefined =
    draw.model<createHolster.Blade>(
      "blade",
      params.blade,
      blades === undefined
        ? undefined
        : (Object.fromEntries(
            Object.keys(blades).map(
              (name: string): [string, Readonly<Record<never, number>>] => [
                name,
                {},
              ],
            ),
          ) as Readonly<
            Record<
              createHolster.Blade,
              Readonly<Partial<Record<createHolster.Dimension, number>>>
            >
          >),
    ).name;
  const fitted: Readonly<
    Partial<Record<createHolster.Dimension, IAutoMovieArchetypeBand>>
  > = blade === undefined || blades === undefined ? {} : blades[blade]!;
  const d: Partial<Record<createHolster.Dimension, number>> = {
    ...draw.dimensions(
      { ...createHolster.BANDS[kind], ...fitted },
      {
        ...createHolster.BANDS,
        ...createHolster.BLADES.scabbard,
        ...createHolster.BLADES.sheath,
      },
    ),
    ...ride.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createHolster.Affordance,
    createHolster.Dimension
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
      createHolster.Affordance,
      createHolster.Dimension
    >,
    dimensions: Readonly<Partial<Record<createHolster.Dimension, number>>>,
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
