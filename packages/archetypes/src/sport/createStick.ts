import { type Archetype, ArchetypeDraw } from "../core";
import { StickBuild } from "./StickBuild";
import { createCricketBat } from "./createCricketBat";
import { createFieldHockeyStick } from "./createFieldHockeyStick";
import { createIceHockeyStick } from "./createIceHockeyStick";
import { createLacrosseCrosse } from "./createLacrosseCrosse";

/**
 * Reads a saved stick recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {ArchetypeRefusal} When the saved kind, choice or dimension cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved input and selected model.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the saved kind and use its producer's bands and original seed domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the kind and call the corresponding public producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected producer still validates the original dimensions and choices.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed kind table selects the producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls use the same construction.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStick(
  params: createStick.IParams,
  seed?: number | string,
): Archetype<createStick.Affordance, createStick.Dimension> {
  const kind: createStick.Kind = ArchetypeDraw.choice(
    "stick",
    "kind",
    params.kind,
    createStick.KINDS,
  );
  return createStick.PRODUCERS[kind](params, seed);
}

/**
 * Companion types and bands of {@link createStick}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip both hands take and the face a swing strikes with (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Where a rule gives only a limit, the band is the limit and says so.
 */
export namespace createStick {
  /** The kinds of stick. */
  export type Kind = "iceHockey" | "fieldHockey" | "lacrosse" | "cricketBat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "iceHockey",
    "fieldHockey",
    "lacrosse",
    "cricketBat",
  ];

  /**
   * The affordance ids:
   *
   * - `grip`: where both hands hold the stick.
   * - `blade`: the striking face, its `+Y` out of it.
   * - `pocket`, `scoop`: the lacrosse ball's rest socket and the front edge of the head.
   */
  export type Affordance = "grip" | "blade" | "pocket" | "scoop";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the striking end's bottom to the shaft's or handle's top.
   * - `head`: an ice hockey blade's height, a field hockey head's height, a cricket bat blade's length.
   * - `reach`: an ice hockey blade's length from the heel.
   * - `width`, `depth`: an ice hockey shaft's section, a field hockey stick's diameter, a cricket bat blade's width and depth.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "head"
    | "reach"
    | "width"
    | "depth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof StickBuild.UNITS = StickBuild.UNITS;

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which stick. */
    kind: Kind;

    /** The model's id, unique in a scene; `stick` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof StickBuild.BANDS = StickBuild.BANDS;

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<{
    iceHockey: typeof createIceHockeyStick;
    fieldHockey: typeof createFieldHockeyStick;
    lacrosse: typeof createLacrosseCrosse;
    cricketBat: typeof createCricketBat;
  }> = {
    iceHockey: createIceHockeyStick,
    fieldHockey: createFieldHockeyStick,
    lacrosse: createLacrosseCrosse,
    cricketBat: createCricketBat,
  };
}
