import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { FixtureDraw } from "./FixtureDraw";
import { SANITARY_BANDS } from "./constants/SANITARY_BANDS";
import { SanitaryConstruction } from "./SanitaryConstruction";
import { AutoMovieArchetypeBathtub } from "./AutoMovieArchetypeBathtub";
import { AutoMovieArchetypeShower } from "./AutoMovieArchetypeShower";
import { AutoMovieArchetypeToilet } from "./AutoMovieArchetypeToilet";
import { AutoMovieArchetypeWashbasin } from "./AutoMovieArchetypeWashbasin";

/** Constructs the sanitary archetype from its recipe. */
export namespace AutoMovieArchetypeSanitary {
/**
 * Read a saved sanitary recipe and call the corresponding fixed producer.
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
  params: AutoMovieArchetypeSanitary.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSanitary.Affordance, AutoMovieArchetypeSanitary.Dimension> {
  const kind: AutoMovieArchetypeSanitary.Kind = ArchetypeDraw.choice(
    "sanitary",
    "kind",
    params.kind,
    AutoMovieArchetypeSanitary.KINDS,
  );
  return AutoMovieArchetypeSanitary.PRODUCERS[kind](params, seed);
}

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
   * - Washbasin: `rim` (ledge, the top's front edge), `bowl` (surface over the
   *   basin), `tap` (knob, the mixer's lever turned), `lift` (hinge, the lever
   *   lifted, riding `tap`), `spout` (socket, the mixer's mouth facing down);
   * - Toilet: `seat` (seat, facing `+Z`), `lid` (hinge, lowering the lid from
   *   open);
   * - Bathtub: `rim` (ledge, the apron's top edge), `edge` (ledge, the same edge
   *   a step over clears), `top` (surface, the apron's top face), `bottom`
   *   (surface, the well's floor), `seat` (seat, on the well's floor against
   *   its `-X` end, facing `+X`), `backrest` (surface, that end wall's inner
   *   face up to the rim);
   * - Shower: `tray` (surface, the floor), `threshold` (ledge, the front edge),
   *   `entry` (aperture, the opening, its `+Z` into the stall), `seat` (seat,
   *   facing `-X`), `control` (knob, the valve).
   */
  export type Affordance =
    | "rim"
    | "bowl"
    | "tap"
    | "lift"
    | "spout"
    | "seat"
    | "lid"
    | "bottom"
    | "tray"
    | "threshold"
    | "entry"
    | "control"
    | "backrest"
    | "edge"
    | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `rim`: a basin's or a bath's top front edge above the floor.
   * - `basinDepth`: a basin block's depth under its rim.
   * - `width`, `depth`, `length`: the fixture along `X`, out from the wall along
   *   `Z`, and a toilet's bowl front or a bath's length.
   * - `bowlWidth`, `bowlDepth`: a basin's opening.
   * - `tapHeight`, `tapReach`, `tapOutlet`: a basin mixer's, as `createTap`'s
   *   `height`, `reach` and `outlet`.
   * - `seat`: a toilet's or a shower seat's top above the floor.
   * - `seatDepth`: a toilet seat's from its hinge line to its front; a shower
   *   seat's out from its wall.
   * - `tankWidth`, `tankDepth`, `tankTop`: a toilet tank's.
   * - `wellLength`, `wellWidth`, `waterDepth`: a bath well's floor and its depth
   *   of water below the rim.
   * - `interior`, `wallHeight`, `threshold`: a shower's inside, square, its
   *   walls' height and its front step.
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof FixtureDraw.sanitary = FixtureDraw.sanitary;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which fixture. */
    kind: Kind;

    /** The model's id, unique in a scene; `sanitary` when absent. */
    id?: string;
  }

  /** A toilet lid's travel, degrees, as `SanitaryConstruction.LIFT` derives it. */
  export const LIFT: number = SanitaryConstruction.LIFT;

  /**
   * The construction sizes no source read gives, as
   * `SanitaryConstruction.ESTIMATES` names them.
   */
  export const ESTIMATES: typeof SanitaryConstruction.ESTIMATES =
    SanitaryConstruction.ESTIMATES;

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = SANITARY_BANDS;

  /** The fixed producer of each saved kind. */
  export const PRODUCERS = {
    washbasin: AutoMovieArchetypeWashbasin.create,
    toilet: AutoMovieArchetypeToilet.create,
    bathtub: AutoMovieArchetypeBathtub.create,
    shower: AutoMovieArchetypeShower.create,
  } as const satisfies Readonly<
    Record<Kind, (...args: never[]) => AutoMovieArchetype>
  >;
}
