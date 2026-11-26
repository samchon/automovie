import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
} from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { FixtureDraw } from "./FixtureDraw";
import { AutoMovieArchetypeMicrowave } from "./AutoMovieArchetypeMicrowave";
import { AutoMovieArchetypeRange } from "./AutoMovieArchetypeRange";
import { AutoMovieArchetypeRefrigerator } from "./AutoMovieArchetypeRefrigerator";
import { AutoMovieArchetypeWashingMachine } from "./AutoMovieArchetypeWashingMachine";

/**
 * Read a saved appliance recipe and call the corresponding fixed producer.
 *
 * @param params The saved kind and its recorded model, dimensions or
 *   identifier.
 * @param seed The seed used by the selected producer under the original draw
 *   key.
 * @returns The selected fixture in its original frame.
 * @throws {AutoMovieArchetypeRefusal} For an unknown kind or a rejected model
 *   or dimension.
 */
export function createAppliance(
  params: createAppliance.IParams,
  seed?: number,
): AutoMovieArchetype<createAppliance.Affordance, createAppliance.Dimension> {
  const kind: createAppliance.Kind = ArchetypeDraw.choice(
    "appliance",
    "kind",
    params.kind,
    createAppliance.KINDS,
  );
  return createAppliance.PRODUCERS[kind](params, seed);
}

/** Companion types, constants and bands of {@link createAppliance}. */
export namespace createAppliance {
  /** The kinds of appliance. */
  export type Kind = "refrigerator" | "cooker" | "microwave" | "washingMachine";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "refrigerator",
    "cooker",
    "microwave",
    "washingMachine",
  ];

  /**
   * The affordance ids, by kind:
   *
   * - Refrigerator: `fridgeDoor`, `freezerDoor` (hinges), `fridgeHandle`,
   *   `freezerHandle` (handles riding them), `shelf1` to `shelf4`
   *   (stack-tops);
   * - Cooker: `top` (stack-top, the hob), `zone1` to `zone4` (stack-tops);
   * - Microwave: `door` (hinge without travel), `floor`, `top` (stack-tops);
   * - WashingMachine: `door` and its riding `doorHandle`, fixed `drumAperture`,
   *   `loadApproach`, `loadAlign`, `loadOpening`, `drumEntry`, and `drumSeat`,
   *   and `top` (stack-top).
   */
  export type Affordance =
    | "fridgeDoor"
    | "freezerDoor"
    | "fridgeHandle"
    | "freezerHandle"
    | `shelf${number}`
    | "top"
    | `zone${number}`
    | "door"
    | "floor"
    | "doorHandle"
    | "drumAperture"
    | "loadApproach"
    | "loadAlign"
    | "loadOpening"
    | "drumEntry"
    | "drumSeat";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: the appliance along `+Y`, `+X` and `+Z`, a
   *   fridge's depth with its handles.
   * - `pullHeight`: a fridge door's handle above the floor.
   * - `cavityHeight`, `cavityWidth`, `cavityDepth`: a microwave's cavity.
   * - `door`: a washing machine's door diameter.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "pullHeight"
    | "cavityHeight"
    | "cavityWidth"
    | "cavityDepth"
    | "door"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof FixtureDraw.appliance = FixtureDraw.appliance;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which appliance. */
    kind: Kind;

    /** The model's id, unique in a scene; `appliance` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = APPLIANCE_BANDS;

  /** The fixed producer of each saved kind. */
  export const PRODUCERS = {
    refrigerator: AutoMovieArchetypeRefrigerator.create,
    cooker: AutoMovieArchetypeRange.create,
    microwave: AutoMovieArchetypeMicrowave.create,
    washingMachine: AutoMovieArchetypeWashingMachine.create,
  } as const satisfies Readonly<
    Record<Kind, (...args: never[]) => AutoMovieArchetype>
  >;
}
