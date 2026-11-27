import {
  type AutoMovieArchetype,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { FixtureDraw } from "./internal/FixtureDraw";
import { ServiceCabinet } from "./internal/ServiceCabinet";
import { AutoMovieArchetypeAtm } from "./AutoMovieArchetypeAtm";
import { AutoMovieArchetypePayStation } from "./AutoMovieArchetypePayStation";
import { AutoMovieArchetypeVendingMachine } from "./AutoMovieArchetypeVendingMachine";

/** Constructs the machine archetype from its recipe. */
export namespace AutoMovieArchetypeMachine {
/**
 * Read a saved machine recipe and call the corresponding fixed producer.
 *
 * @param params The saved kind and its recorded model, dimensions or
 *   identifier.
 * @param seed The seed used by the selected producer under the original draw
 *   key.
 * @returns The selected fixture in its original frame.
 * @throws {AutoMovieArchetypeRefusal} For an unknown kind or a rejected model
 *   or dimension.
 */
export function create(
  params: AutoMovieArchetypeMachine.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMachine.Affordance, AutoMovieArchetypeMachine.Dimension> {
  const kind: AutoMovieArchetypeMachine.Kind = ArchetypeDraw.choice(
    "machine",
    "kind",
    params.kind,
    AutoMovieArchetypeMachine.KINDS,
  );

  // Saved recipes may state any model. The canonical draw checks it against this kind's table.
  return AutoMovieArchetypeMachine.PRODUCERS[kind](params, seed);
}

  /** The kinds of machine. */
  export type Kind = "vendingMachine" | "payStation" | "atm";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["vendingMachine", "payStation", "atm"];

  /**
   * The affordance ids:
   *
   * - `front`: the front face, `+Z`.
   * - `side`: the `+X` side face.
   * - `key5`, `cardReader`, `cash`, `receipt`, `screen`: an ATM's No. 5 key (a
   *   button), card reader, cash slot and receipt slot (sockets) and
   *   touchscreen (a surface), each at NCR's read place.
   */
  export type Affordance =
    | "front"
    | "side"
    | "key5"
    | "cardReader"
    | "cash"
    | "receipt"
    | "screen";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the cabinet along `X`, `Y` and `Z`; a pay
   *   station's body, under its spacer and head; a vending machine's width is
   *   its model's.
   * - `mass`: the empty machine, kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof FixtureDraw.machine = FixtureDraw.machine;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which machine. */
    kind: Kind;

    /**
     * A vending machine's model; drawn from the seed when absent. Other kinds
     * have none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `machine` when absent. */
    id?: string;
  }

  /**
   * The vending machines read: Crane's Merchant 4 and Merchant 6, 895 and 1180
   * mm wide.
   */
  export type Model = "Merchant 4" | "Merchant 6";

  /**
   * Each kind's models with the width each gives, metres, the default first: a
   * vending machine's Merchant 4 and Merchant 6; the other kinds have one read
   * model.
   */
  export const MODELS: typeof ServiceCabinet.MODELS = ServiceCabinet.MODELS;

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof ServiceCabinet.BANDS = ServiceCabinet.BANDS;

  /** The fixed producer of each saved kind. */
  export const PRODUCERS = {
    vendingMachine: AutoMovieArchetypeVendingMachine.create,
    payStation: AutoMovieArchetypePayStation.create,
    atm: AutoMovieArchetypeAtm.create,
  } as const satisfies Readonly<
    Record<Kind, (...args: never[]) => AutoMovieArchetype>
  >;
}
