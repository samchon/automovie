import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { WHEELCHAIR_SHEET } from "./WHEELCHAIR_SHEET";

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
export function createWheelchair(
  params: createWheelchair.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createWheelchair.Affordance, createWheelchair.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createWheelchair.Dimension> =
    new AutoMovieArchetypeDrawSession<createWheelchair.Dimension>(
      "wheelchair",
      createWheelchair.UNITS,
      seed,
      params,
    );
  const kind: createWheelchair.Kind = ArchetypeDraw.choice(
    "wheelchair",
    "kind",
    params.kind ?? "selfPropelled",
    createWheelchair.KINDS,
  );
  // One read model of the kind whole, then the ranges its own row states inside it.
  const model: {
    name: createWheelchair.Model | undefined;
    figures: Readonly<Partial<Record<createWheelchair.Dimension, number>>>;
  } = draw.model<createWheelchair.Model>(
    "model",
    params.model,
    createWheelchair.MODELS[kind],
  );
  const d: Record<createWheelchair.Dimension, number> = {
    ...draw.dimensions(createWheelchair.ranges(kind, model.name!)),
    ...model.figures,
  } as Record<createWheelchair.Dimension, number>;
  const builder: AutoMovieArchetypeBuilder<
    createWheelchair.Affordance,
    createWheelchair.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "selfPropelled" ? "wheelchair" : "transport wheelchair",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const frame: string = "#55595f";
  const cloth: string = "#2f3a48";
  const tyre: string = "#22262b";
  const half: number = d.seatWidth / 2;
  const wheel: number = d.wheelDiameter / 2;
  const caster: number = d.casterDiameter / 2;
  const tilt: number =
    createWheelchair.SEAT_PLANE * AutoMovieArchetypeUnits.DEGREE;
  const recline: number = d.backAngle * AutoMovieArchetypeUnits.DEGREE;

  // The seat: its front edge at the seat height, the sling falling toward the back by the seat plane angle.
  const frontEdge: IAutoMovieVector3 = v(0, d.seatHeight, d.seatDepth);
  const rearEdge: IAutoMovieVector3 = v(
    0,
    d.seatHeight - d.seatDepth * Math.tan(tilt),
    0,
  );
  builder.box(
    "seat",
    v(d.seatWidth, 0.03, d.seatDepth / Math.cos(tilt)),
    Vector3.scale(Vector3.add(frontEdge, rearEdge), 0.5),
    {
      color: cloth,
      rotation: AutoMovieArchetypeFrame.facing(
        rearEdge,
        v(0, Math.cos(tilt), Math.sin(tilt)),
        v(1, 0, 0),
      ).rotation,
    },
  );

  // The back, reclined from upright by the backrest angle, its top where the push handles leave it.
  const backTop: IAutoMovieVector3 = Vector3.add(
    rearEdge,
    v(0, d.backHeight * Math.cos(recline), -d.backHeight * Math.sin(recline)),
  );
  builder.box(
    "back",
    v(d.seatWidth, d.backHeight, 0.03),
    Vector3.scale(Vector3.add(rearEdge, backTop), 0.5),
    {
      color: cloth,
      rotation: AutoMovieArchetypeFrame.facing(
        rearEdge,
        v(0, Math.cos(recline), -Math.sin(recline)),
        v(1, 0, 0),
      ).rotation,
    },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(frontEdge),
    extent: null,
    depth: d.seatDepth,
    width: d.seatWidth,
    back: d.backHeight,
  });

  // Each side: the frame's upright to the push handle, the armrest, the footplate, the rear wheel and its rim, the caster.
  const handle: number = d.height;
  const sides: readonly (readonly [1 | -1, "left" | "right"])[] = [
    [1, "left"],
    [-1, "right"],
  ];
  for (const [sign, side] of sides) {
    const x: number = sign * half;
    const upright: IAutoMovieVector3 = v(x, handle - 0.014, backTop.z);
    builder.rod(`frame-${side}`, 0.012, v(x, caster * 2, rearEdge.z), upright, {
      color: frame,
    });
    builder.rod(
      `handle-${side}`,
      0.014,
      upright,
      Vector3.add(upright, v(0, 0, -0.12)),
      { color: tyre },
    );
    builder.affordance({
      id: `${side}Handle`,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.add(upright, v(0, 0.014, 0)),
        v(0, 1, 0),
        v(sign, 0, 0),
      ),
      extent: null,
      grip: "power",
    });
    const arm: number = d.seatHeight + d.armHeight;
    builder.rod(`arm-${side}`, 0.015, v(x, arm, 0), v(x, arm, d.seatDepth), {
      color: frame,
    });
    builder.affordance({
      id: `${side}Arm`,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, arm + 0.015, d.seatDepth / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      length: d.seatDepth,
    });
    const plate: IAutoMovieVector3 = v(
      sign * half * 0.5,
      d.seatHeight - d.footDrop,
      d.length - wheel - createWheelchair.PLATE / 2,
    );
    builder.rod(
      `hanger-${side}`,
      0.01,
      v(x, d.seatHeight, d.seatDepth),
      v(x, plate.y, plate.z),
      { color: frame },
    );
    builder.box(
      `footplate-${side}`,
      v(half, 0.01, createWheelchair.PLATE),
      plate,
      { color: tyre },
    );
    builder.affordance({
      id: `${side}Footplate`,
      kind: "pedal",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.add(plate, v(0, 0.005, 0)),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      width: half,
    });

    // The rear wheel at the overall width, its axle under the seat's rear edge; a self-propelled chair's rim just inside it.
    const outer: number = sign * (d.width / 2);
    const centre: IAutoMovieVector3 = v(outer - sign * 0.015, wheel, 0);
    builder.rod(
      `wheel-${side}`,
      wheel,
      v(outer - sign * 0.03, wheel, 0),
      v(outer, wheel, 0),
      { color: tyre, surface: "rubber" },
    );
    builder.box(
      `spoke-${side}`,
      v(0.006, wheel * 1.8, 0.02),
      v(outer - sign * 0.015, wheel, 0),
      { color: frame },
    );
    builder.affordance({
      id: `${side}Spin`,
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(centre, v(1, 0, 0), v(0, 1, 0)),
      extent: null,
      travel: 360,
      parts: [`wheel-${side}`, `spoke-${side}`],
    });
    if (kind === "selfPropelled")
      builder.affordance({
        id: `${side}Rim`,
        kind: "wheel",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.add(centre, v(sign * 0.02, 0, 0)),
          v(-sign, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        radius: createWheelchair.RIM / 2,
        rides: `${side}Spin`,
      });
    builder.rod(
      `caster-${side}`,
      caster,
      v(x - 0.015, caster, d.seatDepth),
      v(x + 0.015, caster, d.seatDepth),
      { color: tyre, surface: "rubber" },
    );
    builder.rod(
      `fork-${side}`,
      0.01,
      v(x, caster, d.seatDepth),
      v(x, d.seatHeight, d.seatDepth),
      { color: frame },
    );
  }
  return builder.build(d.mass, { rests: "rubber" });
}

/** Companion types and bands of {@link createWheelchair}. */
export namespace createWheelchair {
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
  }
}
