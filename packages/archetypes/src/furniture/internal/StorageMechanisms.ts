import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../../core";
import { STORAGE_MODELS } from "../constants/STORAGE_MODELS";
import { StorageConstruction } from "./StorageConstruction";
import { AutoMovieArchetypeStorage } from "../AutoMovieArchetypeStorage";

/** The name each kind's model carries. */
const NAMES: Readonly<Record<AutoMovieArchetypeStorage.Kind, string>> = {
  wardrobe: "wardrobe",
  chest: "chest of drawers",
  filingCabinet: "filing cabinet",
  locker: "locker",
  bookcase: "bookcase",
};

/**
 * Pick the recorded hinge or slide model and use its figures in the saved
 * dimension stream.
 */
function draw<Id extends AutoMovieArchetypeStorage.Affordance>(
  kind: AutoMovieArchetypeStorage.Kind,
  params: Omit<AutoMovieArchetypeStorage.IParams, "kind">,
  seed?: number,
): IDrawn<Id> {
  const session: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStorage.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeStorage.Dimension>(
      "storage",
      AutoMovieArchetypeStorage.UNITS,
      seed,
      params,
    );
  const model: Readonly<Partial<Record<AutoMovieArchetypeStorage.Dimension, number>>> =
    session.model<AutoMovieArchetypeStorage.Model>(
      "model",
      params.model,
      STORAGE_MODELS[kind],
    ).figures;
  const d: Partial<Record<AutoMovieArchetypeStorage.Dimension, number>> = {
    ...session.dimensions(AutoMovieArchetypeStorage.BANDS[kind], AutoMovieArchetypeStorage.BANDS),
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
    params: Omit<AutoMovieArchetypeStorage.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<HingedContact, AutoMovieArchetypeStorage.Dimension> {
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
    params: Omit<AutoMovieArchetypeStorage.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<SlidingContact, AutoMovieArchetypeStorage.Dimension> {
    const { builder, d }: ReturnType<typeof draw<SlidingContact>> =
      draw<SlidingContact>(kind, params, seed);
    StorageConstruction.drawers(builder, d, StorageConstruction.DRAWERS[kind]);
    return builder.build(d.mass!);
  }

  /** The contact ids {@link bookcase} builds or reads. */
  export type BookcaseContact = "push" | "top" | `shelf${number}`;

  /** Build a bookcase with open, visible shelf supports. */
  export function bookcase(
    params: Omit<AutoMovieArchetypeStorage.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<BookcaseContact, AutoMovieArchetypeStorage.Dimension> {
    const { builder, d }: ReturnType<typeof draw<BookcaseContact>> =
      draw<BookcaseContact>("bookcase", params, seed);
    StorageConstruction.bookcase(builder, d);
    return builder.build(d.mass!);
  }
}

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends AutoMovieArchetypeStorage.Affordance> = AutoMovieArchetypeBuilder<
  Id,
  AutoMovieArchetypeStorage.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<AutoMovieArchetypeStorage.Dimension, number>>;

/** A started construction: its builder and its drawn dimensions. */
interface IDrawn<Id extends AutoMovieArchetypeStorage.Affordance> {
  /** The model-space builder for the selected contact ids. */
  builder: Builder<Id>;

  /** The drawn and fixed dimensions in the family's recorded units. */
  d: Dimensions;
}
