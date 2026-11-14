import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  type IArchetypeBand,
} from "../core";
import { SANITARY_BANDS } from "./SANITARY_BANDS";
import { SanitaryConstruction } from "./SanitaryConstruction";

/**
 * A sanitary fixture: a washbasin with its mixer, a toilet, a bath or a transfer shower.
 *
 * Each stands on the floor with its back against the wall at the origin's `Z`, centred on `X`, and is approached from `+Z`; a wall-hung basin stands on a pedestal so the model rests on the floor.
 *
 * - A washbasin's `rim` is the front edge of its top, a ledge a body leans on; `bowl` the basin's opening, a surface the hands wash over; `tap` its mixer's lever, a knob to touch, and `spout` the mixer's mouth, facing down.
 * - A toilet's `seat` is the seat's front edge, the sitter facing `+Z`; `lid` the lid's hinge, the lid standing open against the tank at rest and lowered onto the seat by its travel.
 * - A bath's `rim` is the apron's top edge, a ledge sat on or stepped over; `bottom` the floor of the well, a surface lain on. Its controls are on the room's end wall (ADA 607.5), which is not the bath's: a production places a `createTap` or `createSwitch` there.
 * - A transfer shower is a one-piece stall open at the front: `tray` its floor, `threshold` the front edge stepped over, `entry` the opening, `seat` the folding seat on the `+X` wall facing `-X`, and `control` the valve on the `-X` wall, a knob.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The fixture.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind stands and what each contact is, and where a bath's controls belong.
 * @evidence contracts/development/implementation.md#principled-implementation Draws the kind's cited bands and hands them to the kind's construction in `SanitaryConstruction`, which places boxes and rods from them; every height a person meets is the ADA clause's or the maker's sheet.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the kind, draw the dimensions, build the kind, state the mass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No basin is hollowed and no curve is modelled; the construction sizes no source gives are the named estimates `createSanitary.ESTIMATES`, which place no contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSanitary(
  params: createSanitary.IParams,
  seed?: number | string,
): Archetype<createSanitary.Affordance, createSanitary.Dimension> {
  const kind: createSanitary.Kind = ArchetypeDraw.choice(
    "sanitary",
    "kind",
    params.kind,
    createSanitary.KINDS,
  );
  const d: Partial<Record<createSanitary.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "sanitary",
      createSanitary.BANDS[kind],
      seed,
      params,
      createSanitary.BANDS,
    );
  const builder: ArchetypeBuilder<
    createSanitary.Affordance,
    createSanitary.Dimension
  > = new ArchetypeBuilder({
    archetype: "sanitary",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  SanitaryConstruction[kind](builder, d);
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createSanitary}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and estimate states what it is.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds, contacts and dimensions, and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The heights and contacts the washing, sitting, lying and stepping acts read (#3468 F2: `handToFace` washFace, `sit` on a toilet, `lieDown` in a bath).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A toilet's lid is an articulation with its part, never a flag; the estimates are named, not hidden in the construction.
 */
export namespace createSanitary {
  /** The kinds of fixture. */
  export type Kind = "washbasin" | "toilet" | "bathtub" | "shower";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "washbasin",
    "toilet",
    "bathtub",
    "shower",
  ];

  /**
   * The affordance ids, by kind:
   *
   * - washbasin: `rim` (ledge, the top's front edge), `bowl` (surface over the basin), `tap` (knob, the mixer's lever), `spout` (socket, the mixer's mouth facing down);
   * - toilet: `seat` (seat, facing `+Z`), `lid` (hinge, lowering the lid from open);
   * - bathtub: `rim` (ledge, the apron's top edge), `bottom` (surface, the well's floor);
   * - shower: `tray` (surface, the floor), `threshold` (ledge, the front edge), `entry` (aperture, the opening, its `+Z` into the stall), `seat` (seat, facing `-X`), `control` (knob, the valve).
   */
  export type Affordance =
    | "rim"
    | "bowl"
    | "tap"
    | "spout"
    | "seat"
    | "lid"
    | "bottom"
    | "tray"
    | "threshold"
    | "entry"
    | "control";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `rim`: a basin's or a bath's top front edge above the floor.
   * - `basinDepth`: a basin block's depth under its rim.
   * - `width`, `depth`, `length`: the fixture along `X`, out from the wall along `Z`, and a toilet's bowl front or a bath's length.
   * - `bowlWidth`, `bowlDepth`: a basin's opening.
   * - `tapHeight`, `tapReach`, `tapOutlet`: a basin mixer's, as `createTap`'s `height`, `reach` and `outlet`.
   * - `seat`: a toilet's or a shower seat's top above the floor.
   * - `seatDepth`: a toilet seat's from its hinge line to its front; a shower seat's out from its wall.
   * - `tankWidth`, `tankDepth`, `tankTop`: a toilet tank's.
   * - `wellLength`, `wellWidth`, `waterDepth`: a bath well's floor and its depth of water below the rim.
   * - `interior`, `wallHeight`, `threshold`: a shower's inside, square, its walls' height and its front step.
   * - `control`: a shower valve's height above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "rim"
    | "basinDepth"
    | "width"
    | "depth"
    | "length"
    | "bowlWidth"
    | "bowlDepth"
    | "tapHeight"
    | "tapReach"
    | "tapOutlet"
    | "seat"
    | "seatDepth"
    | "tankWidth"
    | "tankDepth"
    | "tankTop"
    | "wellLength"
    | "wellWidth"
    | "waterDepth"
    | "interior"
    | "wallHeight"
    | "threshold"
    | "control"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which fixture. */
    kind: Kind;

    /** The model's id, unique in a scene; `sanitary` when absent. */
    id?: string;
  }

  /** A toilet lid's travel, degrees, as `SanitaryConstruction.LIFT` derives it. */
  export const LIFT: number = SanitaryConstruction.LIFT;

  /** The construction sizes no source read gives, as `SanitaryConstruction.ESTIMATES` names them. */
  export const ESTIMATES: typeof SanitaryConstruction.ESTIMATES =
    SanitaryConstruction.ESTIMATES;

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = SANITARY_BANDS;
}

/** Each kind's readable name. */
const NAMES: Readonly<Record<createSanitary.Kind, string>> = {
  washbasin: "washbasin",
  toilet: "toilet",
  bathtub: "bath",
  shower: "transfer shower",
};
