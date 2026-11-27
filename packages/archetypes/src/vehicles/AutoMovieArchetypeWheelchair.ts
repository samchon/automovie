import { type AutoMovieArchetype } from "../core/index";
import { createWheelchair as createWheelchairImplementation } from "./internal/createWheelchair";
import { AutoMovieArchetypeDrawSession, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";
import { WHEELCHAIR_SHEET } from "./WHEELCHAIR_SHEET";

/** Public operations for Auto Movie Archetype Wheelchair. */
export namespace AutoMovieArchetypeWheelchair {
  /**
   * A manual wheelchair: a self-propelled chair on large rear wheels with
   * handrims, or an attendant-propelled transport chair on small ones, each with
   * its seat, back, armrests, footplates and push handles.
   *
   * The chair stands on its wheels with the middle of its rear axle over the
   * origin's line and its seat's front toward `+Z`: the origin is on the floor
   * under the middle of the seat's rear edge. Its outline reads as a wheelchair
   * by the parts a diffusion model needs: the two big rear wheels standing at the
   * overall width, the small front casters, the seat and its reclined back, the
   * armrests and the push handles rising behind. Each rear wheel spins on a
   * `knob` about its axle, and a self-propelled chair's handrim, the `wheel` a
   * hand turns, rides it, so a hand on the rim goes round with the wheel;
   * `rideWheelchair` turns the wheels by the distance.
   *
   * Stage a seated push and release with `wheelchairHandrimFrame` and
   * `HumanHandrimStroke` on a course authored through `rideWheelchair`. A pushing
   * attendant holds the handles with `HumanRide`'s hands or a carry.
   *
   * @param params The kind, its read model and any dimension the author fixes
   *   inside its model's ranges.
   * @param seed The seed that picks the model and draws the footrest's reach and
   *   any overall length its row gives as a range; absent, the first model and
   *   each range's middle.
   * @returns The wheelchair.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its model's
   *   range, or a model the kind does not offer.
   */
  export function create(params?: AutoMovieArchetypeWheelchair.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWheelchair.Affordance, AutoMovieArchetypeWheelchair.Dimension> {
    return createWheelchairImplementation(params, seed);
  }

  /**
   * The kinds: a self-propelled chair on 24-inch rear wheels with handrims, or
   * a transport chair on 14-inch ones, pushed.
   */
  export type Kind = "selfPropelled" | "transport";

  /** Every kind. */
  export const KINDS: readonly Kind[] = ["selfPropelled", "transport"];

  /**
   * A footplate's fore-and-aft depth as drawn, metres: a construction estimate
   * no act reads, the plate's `pedal` affordance stating no depth.
   */
  export const PLATE: number = 0.13;

  /**
   * The seat plane's tilt from level, degrees: 6 on every model of the maker's
   * sheet (Karma Medical 2025 manual wheelchair specification, p. 66).
   */
  export const SEAT_PLANE: number = 6;

  /**
   * A handrim's diameter, metres: the 540 mm bead-seat size of a 24-inch
   * wheelchair wheel, the code handrims are sold under (New Mobility's handrim
   * guide, https://newmobility.com/gear-guide-handrims), seen in search results
   * only; provisional.
   */
  export const RIM: number = 0.54;

  /**
   * The affordance ids:
   *
   * - `seat`: the seat's front edge, facing forward.
   * - `leftHandle`, `rightHandle`: the push handles behind the back.
   * - `leftArm`, `rightArm`: the armrests, pressed on to rise or held.
   * - `leftFootplate`, `rightFootplate`: the footplates.
   * - `leftSpin`, `rightSpin`: each rear wheel's roll about its axle, a positive
   *   travel rolling it forward.
   * - `leftRim`, `rightRim`: a self-propelled chair's handrims, riding their
   *   wheels; a transport chair has none.
   */
  export type Affordance =
    | "seat"
    | "leftHandle"
    | "rightHandle"
    | "leftArm"
    | "rightArm"
    | "leftFootplate"
    | "rightFootplate"
    | "leftSpin"
    | "rightSpin"
    | "leftRim"
    | "rightRim";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `seatWidth`, `seatDepth`: the seat's nominal width and depth.
   * - `seatHeight`: the seat surface's height at its front edge.
   * - `backHeight`: the backrest's height; `backAngle` its recline from upright,
   *   degrees.
   * - `armHeight`: the armrests above the seat.
   * - `footDrop`: the footplates below the seat.
   * - `wheelDiameter`, `casterDiameter`: the rear wheels and the front casters.
   * - `length`, `width`, `height`: the overall sizes, the width across the rear
   *   wheels and the height at the push handles.
   * - `mass`: the total mass, kilograms.
   */
  export type Dimension =
    | "seatWidth"
    | "seatDepth"
    | "seatHeight"
    | "backHeight"
    | "backAngle"
    | "armHeight"
    | "footDrop"
    | "wheelDiameter"
    | "casterDiameter"
    | "length"
    | "width"
    | "height"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    seatWidth: "m",
    seatDepth: "m",
    seatHeight: "m",
    backHeight: "m",
    backAngle: "degrees",
    armHeight: "m",
    footDrop: "m",
    wheelDiameter: "m",
    casterDiameter: "m",
    length: "m",
    width: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, its read model, and any free dimension fixed to a
   * value inside its model's range.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which kind; self-propelled when absent. */
    kind?: Kind;

    /** Which read model of the kind (`MODELS`); drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `wheelchair` when absent. */
    id?: string;
  }

  /**
   * A read model's name: its series, seat width in millimetres and, on 14-inch
   * wheels, its caster in inches, such as `ergo3-460-7`.
   */
  export type Model = string;

  /**
   * Each kind's read models whole, from `WHEELCHAIR_SHEET.ROWS`: every figure a
   * row gives for one seat width, converted to metres.
   */
  export const MODELS: Readonly<
    Record<
      Kind,
      Readonly<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
    >
  > = {
    selfPropelled: models("selfPropelled", 24),
    transport: models("transport", 14),
  };

  /**
   * A kind's models from its rows.
   *
   * @param kind The kind.
   * @param wheel The rear wheel's size, inches.
   * @returns The models by name.
   */
  function models(
    kind: Kind,
    wheel: number,
  ): Readonly<Record<Model, Readonly<Partial<Record<Dimension, number>>>>> {
    const mm: number = AutoMovieArchetypeUnits.MILLIMETRE;
    const out: Record<Model, Partial<Record<Dimension, number>>> = {};
    for (const r of WHEELCHAIR_SHEET.ROWS[kind])
      for (const [seat, width, mass] of r.widths)
        out[`${r.series}-${seat}-${r.caster}`] = {
          seatWidth: seat * mm,
          seatDepth: r.depth * mm,
          seatHeight: r.edge * mm,
          backHeight: r.back * mm,
          backAngle: r.angle,
          armHeight: r.arm * mm,
          wheelDiameter: wheel * AutoMovieArchetypeUnits.INCH,
          casterDiameter: r.caster * AutoMovieArchetypeUnits.INCH,
          width: width * mm,
          height: r.height * mm,
          mass,
          ...(r.length[0] === r.length[1] ? { length: r.length[0] * mm } : {}),
        };
    return out;
  }

  /**
   * The ranges one model's row states inside it: the footrest's reach, and the
   * overall length where a row gives one.
   *
   * @param kind The kind.
   * @param model The model's name.
   * @returns The bands.
   */
  export function ranges(
    kind: Kind,
    model: Model,
  ): Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>> {
    const r: WHEELCHAIR_SHEET.IRow = WHEELCHAIR_SHEET.ROWS[kind].find(
      (row: WHEELCHAIR_SHEET.IRow): boolean =>
        model.startsWith(`${row.series}-`) && model.endsWith(`-${row.caster}`),
    )!;
    const mm: number = AutoMovieArchetypeUnits.MILLIMETRE;
    return {
      footDrop: AutoMovieArchetypeBand.metres(
        r.foot[0] * mm,
        r.foot[1] * mm,
        `${WHEELCHAIR_SHEET.SOURCE}: footrest to seat distance, ${model}`,
      ),
      ...(r.length[0] === r.length[1]
        ? {}
        : {
            length: AutoMovieArchetypeBand.metres(
              r.length[0] * mm,
              r.length[1] * mm,
              `${WHEELCHAIR_SHEET.SOURCE}: overall length with legrest, ${model}`,
            ),
          }),
    };
  }}
