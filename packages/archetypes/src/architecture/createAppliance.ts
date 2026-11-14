import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  type IArchetypeBand,
} from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";

/**
 * A kitchen or laundry appliance: a fridge-freezer, a freestanding cooker, a countertop microwave or a front-loading washing machine.
 *
 * Each stands with its back at the origin's `Z`, centred on `X`, its front toward `+Z`; the microwave stands on whatever counter it is set on. Every door is a part on its hinge, so an open door is a moved part:
 *
 * - A fridge-freezer's `fridgeDoor` and `freezerDoor` hinge on its `+X` edge (the right as one faces it) and swing out, each carrying its handle (`fridgeHandle`, `freezerHandle`) near the free edge. The fridge is hollow, with its four glass shelves `shelf1` to `shelf4` from the bottom up, each a `stack-top`; the freezer below is one block.
 * - A cooker's `top` is the hob, a `stack-top`, with its four zones `zone1` to `zone4`, each a `stack-top` a pan is set on, front left, front right, back left and back right as one faces it; `ovenDoor` hinges along its bottom edge and drops forward to level, carrying `ovenHandle`; `knob1` to `knob4` are the zones' knobs on the fascia, left to right as one faces it.
 * - A microwave's `door` hinges on its `-X` edge and swings out; `open` is the door-release button on the control panel; `floor` the cavity's floor and `top` its top, each a `stack-top`.
 * - A washing machine's `door` is the round door hinged on its `-X` edge, carrying `doorHandle`; `dial` is the programme knob; `top` the worktop, a `stack-top`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The appliance.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind stands, which way each door swings and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation Draws the kind's bands, the makers' overall sizes, and hands them to the kind's construction in `ApplianceConstruction`, which places boxes and rods from them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the kind, draw the dimensions, build the kind, state the mass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No inside of a freezer, oven or drum is modelled; every size a sheet does not give is a named estimate (`ApplianceConstruction.ESTIMATES`).
 * @evidence contracts/development/implementation.md#efficient-algorithms At most fourteen parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
  const d: Partial<Record<createAppliance.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "appliance",
      createAppliance.BANDS[kind],
      seed,
      params,
      createAppliance.BANDS,
    );
  const builder: ArchetypeBuilder<
    createAppliance.Affordance,
    createAppliance.Dimension
  > = new ArchetypeBuilder({
    archetype: "appliance",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  ApplianceConstruction[kind](builder, d);
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createAppliance}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is.
 * @evidence contracts/development/design.md#principled-representation Closed unions; template ids close the numbered shelves, zones and knobs over any count; one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The doors an `operate` opens, the handles and knobs a hand meets and the faces a hand sets a thing on (#3468 F2).
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
   * - cooker: `top` (stack-top, the hob), `zone1` to `zone4` (stack-tops), `ovenDoor` (hinge), `ovenHandle` (handle riding it), `knob1` to `knob4` (knobs);
   * - microwave: `door` (hinge), `open` (button), `floor`, `top` (stack-tops);
   * - washingMachine: `door` (hinge), `doorHandle` (handle riding it), `dial` (knob), `top` (stack-top).
   */
  export type Affordance =
    | "fridgeDoor"
    | "freezerDoor"
    | "fridgeHandle"
    | "freezerHandle"
    | `shelf${number}`
    | "top"
    | `zone${number}`
    | "ovenDoor"
    | "ovenHandle"
    | `knob${number}`
    | "door"
    | "doorHandle"
    | "open"
    | "floor"
    | "dial";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: the appliance along `+Y`, `+X` and `+Z`, a fridge's depth with its handles.
   * - `cavityHeight`, `cavityWidth`, `cavityDepth`: a microwave's cavity.
   * - `door`: a washing machine's door diameter.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "cavityHeight"
    | "cavityWidth"
    | "cavityDepth"
    | "door"
    | "mass";

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
}

/** Each kind's readable name. */
const NAMES: Readonly<Record<createAppliance.Kind, string>> = {
  refrigerator: "fridge-freezer",
  cooker: "cooker",
  microwave: "microwave",
  washingMachine: "washing machine",
};
