import { type Archetype, ArchetypeDraw, type IArchetypeBand } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { FixtureDraw } from "./FixtureDraw";
import { createMicrowave } from "./createMicrowave";
import { createRange } from "./createRange";
import { createRefrigerator } from "./createRefrigerator";
import { createWashingMachine } from "./createWashingMachine";

/**
 * Read a saved appliance recipe and call the corresponding fixed producer.
 *
 * @param params The saved kind and its recorded model, dimensions or identifier.
 * @param seed The seed used by the selected producer under the original draw key.
 * @returns The selected fixture in its original frame.
 * @throws {ArchetypeRefusal} For an unknown kind or a rejected model or dimension.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved recipe and draw namespace.
 * @evidence contracts/development/implementation.md#principled-implementation Resolve the old kind, then let its canonical producer admit the original inputs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One kind check and one dispatch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pass all arguments to the named producer so saved invalid inputs still raise their refusal.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The kind table is bounded.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both entry points run the exact same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The dispatcher keeps no inputs or intermediate state.
 */
export function createAppliance(
  params: createAppliance.IParams,
  seed?: number | string,
): Archetype<createAppliance.Affordance, createAppliance.Dimension> {
  const kind: createAppliance.Kind = ArchetypeDraw.choice(
    "appliance",
    "kind",
    params.kind,
    createAppliance.KINDS,
  );
  return createAppliance.PRODUCERS[kind](params, seed);
}

/**
 * Companion types, constants and bands of {@link createAppliance}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is.
 * @evidence contracts/development/design.md#principled-representation Closed unions; template ids close the numbered shelves, zones and knobs over any count; one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Retains the original recipe shape, measurement tables, and the stable producer for each saved kind.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A door and the handle it carries are two affordances, the handle riding the hinge, as a wardrobe's are.
 */
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
   * - refrigerator: `fridgeDoor`, `freezerDoor` (hinges), `fridgeHandle`, `freezerHandle` (handles riding them), `shelf1` to `shelf4` (stack-tops);
   * - cooker: `top` (stack-top, the hob), `zone1` to `zone4` (stack-tops);
   * - microwave: `door` (hinge without travel), `floor`, `top` (stack-tops);
   * - washingMachine: `door` (hinge), `top` (stack-top).
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
    | "floor";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: the appliance along `+Y`, `+X` and `+Z`, a fridge's depth with its handles.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which appliance. */
    kind: Kind;

    /** The model's id, unique in a scene; `appliance` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = APPLIANCE_BANDS;

  /** The fixed producer of each saved kind. */
  export const PRODUCERS = {
    refrigerator: createRefrigerator,
    cooker: createRange,
    microwave: createMicrowave,
    washingMachine: createWashingMachine,
  } as const satisfies Readonly<Record<Kind, (...args: never[]) => Archetype>>;
}
