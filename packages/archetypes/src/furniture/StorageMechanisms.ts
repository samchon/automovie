import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { STORAGE_MODELS } from "./STORAGE_MODELS";
import { StorageConstruction } from "./StorageConstruction";
import { createStorage } from "./createStorage";

/** The name each kind's model carries. */
const NAMES: Readonly<Record<createStorage.Kind, string>> = {
  wardrobe: "wardrobe",
  chest: "chest of drawers",
  filingCabinet: "filing cabinet",
  locker: "locker",
  bookcase: "bookcase",
};

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createStorage.Affordance> = AutoMovieArchetypeBuilder<
  Id,
  createStorage.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<createStorage.Dimension, number>>;

/** A started construction: its builder and its drawn dimensions. */
interface IDrawn<Id extends createStorage.Affordance> {
  /** The model-space builder for the selected contact ids. */
  builder: Builder<Id>;

  /** The drawn and fixed dimensions in the family's recorded units. */
  d: Dimensions;
}

/**
 * Pick the recorded hinge or slide model and use its figures in the saved
 * dimension stream.
 */
function draw<Id extends createStorage.Affordance>(
  kind: createStorage.Kind,
  params: Omit<createStorage.IParams, "kind">,
  seed?: number | string,
): IDrawn<Id> {
  const session: AutoMovieArchetypeDrawSession<createStorage.Dimension> =
    new AutoMovieArchetypeDrawSession<createStorage.Dimension>(
      "storage",
      createStorage.UNITS,
      seed,
      params,
    );
  const model: Readonly<Partial<Record<createStorage.Dimension, number>>> =
    session.model<createStorage.Model>(
      "model",
      params.model,
      STORAGE_MODELS[kind],
    ).figures;
  const d: Partial<Record<createStorage.Dimension, number>> = {
    ...session.dimensions(createStorage.BANDS[kind], createStorage.BANDS),
    ...model,
  };
  const builder: Builder<Id> = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });
  return { builder, d };
}

/**
 * Furniture construction selections with hinged, sliding and open storage
 * mechanisms.
 */
export namespace StorageMechanisms {
  /** The contact ids {@link hinged} builds or reads. */
  export type HingedKind = "wardrobe" | "locker";

  /** The contact ids {@link hinged} builds or reads. */
  export type HingedContact =
    | "push"
    | "top"
    | `shelf${number}`
    | "leftDoor"
    | "rightDoor"
    | "leftPull"
    | "rightPull"
    | "door";

  /** Build a hinged wardrobe or locker with the matching supported travel. */
  export function hinged(
    kind: HingedKind,
    params: Omit<createStorage.IParams, "kind">,
    seed?: number | string,
  ): AutoMovieArchetype<HingedContact, createStorage.Dimension> {
    const { builder, d }: ReturnType<typeof draw<HingedContact>> =
      draw<HingedContact>(kind, params, seed);
    StorageConstruction[kind](builder, d);
    return builder.build(d.mass!, kind === "locker" ? { rests: "steel" } : {});
  }

  /** The values {@link sliding} accepts at this place in its signature. */
  export type SlidingKind = "chest" | "filingCabinet";

  /** The contact ids {@link sliding} builds or reads. */
  export type SlidingContact =
    | "push"
    | "top"
    | `drawer${number}`
    | `pull${number}`;

  /** Build a unit with drawers and carried pull grips. */
  export function sliding(
    kind: SlidingKind,
    params: Omit<createStorage.IParams, "kind">,
    seed?: number | string,
  ): AutoMovieArchetype<SlidingContact, createStorage.Dimension> {
    const { builder, d }: ReturnType<typeof draw<SlidingContact>> =
      draw<SlidingContact>(kind, params, seed);
    StorageConstruction.drawers(builder, d, StorageConstruction.DRAWERS[kind]);
    return builder.build(d.mass!);
  }

  /** The contact ids {@link bookcase} builds or reads. */
  export type BookcaseContact = "push" | "top" | `shelf${number}`;

  /** Build a bookcase with open, visible shelf supports. */
  export function bookcase(
    params: Omit<createStorage.IParams, "kind">,
    seed?: number | string,
  ): AutoMovieArchetype<BookcaseContact, createStorage.Dimension> {
    const { builder, d }: ReturnType<typeof draw<BookcaseContact>> =
      draw<BookcaseContact>("bookcase", params, seed);
    StorageConstruction.bookcase(builder, d);
    return builder.build(d.mass!);
  }
}
