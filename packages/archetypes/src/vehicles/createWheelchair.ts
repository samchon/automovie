import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A manual wheelchair: a self-propelled chair on large rear wheels with handrims, or an attendant-propelled transport chair on small ones, each with its seat, back, armrests, footplates and push handles.
 *
 * The chair stands on its wheels with the middle of its rear axle over the origin's line and its seat's front toward `+Z`: the origin is on the floor under the middle of the seat's rear edge. Its outline reads as a wheelchair by the parts a diffusion model needs: the two big rear wheels standing at the overall width, the small front casters, the seat and its reclined back, the armrests and the push handles rising behind. Each rear wheel spins on a `knob` about its axle, and a self-propelled chair's handrim, the `wheel` a hand turns, rides it, so a hand on the rim goes round with the wheel; `rideWheelchair` turns the wheels by the distance.
 *
 * A seated person's own stroke on the handrims is no motion law yet (#3468's mobility family), so a self-propelled ride is staged as moving the chair with its rims turning, and a pushing attendant holds the handles with `HumanRide`'s hands or a carry.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The wheelchair.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chair's origin and front, the recognising parts, what turns, and which act has no law.
 * @evidence contracts/development/implementation.md#principled-implementation Boxes and rods from the maker's figures: the seat at its front-edge height and tilted back by the seat plane angle, the back at the backrest angle from upright, the armrests their height above the seat, the footplates their distance below it with their front edge at the overall length ahead of the rear wheels' back, the rear wheels at the overall width, the casters under the seat's front and the push handles at the overall height; grips state no aperture, so a grasp reads the drawn colliders; each armrest runs the seat's depth over the seat's side, each push handle's grip is on its top where it leaves the back, at the overall height, the handle's rearward length drawn as a construction estimate, and the two footplates share the seat's width, their front edge at the overall length; part thicknesses are construction estimates no act reads; and the handrim is not drawn (no ring primitive), so a hand on it closes on the wheel; the rim spins about the axle with the wheel's knob.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, then the seat and back, the arms and handles, the footplates, and the wheels.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The handrim's radius is the 540 mm rim's, read in search results only and marked provisional; the casters do not swivel.
 * @evidence contracts/development/implementation.md#efficient-algorithms About twenty parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createWheelchair(
  params: createWheelchair.IParams = {},
  seed?: number | string,
): Archetype<createWheelchair.Affordance, createWheelchair.Dimension> {
  const kind: createWheelchair.Kind = ArchetypeDraw.choice(
    "wheelchair",
    "kind",
    params.kind ?? "selfPropelled",
    createWheelchair.KINDS,
  );
  const d: Record<createWheelchair.Dimension, number> = ArchetypeDraw.dimensions(
    "wheelchair",
    createWheelchair.BANDS[kind],
    seed,
    params,
    createWheelchair.BANDS,
  );
  const builder: ArchetypeBuilder<
    createWheelchair.Affordance,
    createWheelchair.Dimension
  > = new ArchetypeBuilder({
    archetype: "wheelchair",
    id: params.id,
    name: kind === "selfPropelled" ? "wheelchair" : "transport wheelchair",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const frame: string = "#55595f";
  const cloth: string = "#2f3a48";
  const tyre: string = "#22262b";
  const half: number = d.seatWidth / 2;
  const wheel: number = d.wheelDiameter / 2;
  const caster: number = d.casterDiameter / 2;
  const tilt: number = (createWheelchair.SEAT_PLANE * Math.PI) / 180;
  const recline: number = (d.backAngle * Math.PI) / 180;

  // The seat: its front edge at the seat height, the sling falling toward the back by the seat plane angle.
  const frontEdge: IAutoMovieVector3 = v(0, d.seatHeight, d.seatDepth);
  const rearEdge: IAutoMovieVector3 = v(0, d.seatHeight - d.seatDepth * Math.tan(tilt), 0);
  builder.box("seat", v(d.seatWidth, 0.03, d.seatDepth / Math.cos(tilt)), Vector3.scale(Vector3.add(frontEdge, rearEdge), 0.5), {
    color: cloth,
    rotation: ArchetypeFrame.facing(rearEdge, v(0, Math.cos(tilt), Math.sin(tilt)), v(1, 0, 0)).rotation,
  });

  // The back, reclined from upright by the backrest angle, its top where the push handles leave it.
  const backTop: IAutoMovieVector3 = Vector3.add(rearEdge, v(0, d.backHeight * Math.cos(recline), -d.backHeight * Math.sin(recline)));
  builder.box("back", v(d.seatWidth, d.backHeight, 0.03), Vector3.scale(Vector3.add(rearEdge, backTop), 0.5), {
    color: cloth,
    rotation: ArchetypeFrame.facing(rearEdge, v(0, Math.cos(recline), -Math.sin(recline)), v(1, 0, 0)).rotation,
  });
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.upright(frontEdge),
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
    builder.rod(`frame-${side}`, 0.012, v(x, caster * 2, rearEdge.z), upright, { color: frame });
    builder.rod(`handle-${side}`, 0.014, upright, Vector3.add(upright, v(0, 0, -0.12)), { color: tyre });
    builder.affordance({
      id: `${side}Handle`,
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(Vector3.add(upright, v(0, 0.014, 0)), v(0, 1, 0), v(sign, 0, 0)),
      extent: null,
      grip: "power",
    });
    const arm: number = d.seatHeight + d.armHeight;
    builder.rod(`arm-${side}`, 0.015, v(x, arm, 0), v(x, arm, d.seatDepth), { color: frame });
    builder.affordance({
      id: `${side}Arm`,
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(x, arm + 0.015, d.seatDepth / 2), v(0, 1, 0), v(0, 0, 1)),
      extent: null,
      grip: "power",
      length: d.seatDepth,
    });
    const plate: IAutoMovieVector3 = v(sign * half * 0.5, d.seatHeight - d.footDrop, d.length - wheel - createWheelchair.PLATE / 2);
    builder.rod(`hanger-${side}`, 0.01, v(x, d.seatHeight, d.seatDepth), v(x, plate.y, plate.z), { color: frame });
    builder.box(`footplate-${side}`, v(half, 0.01, createWheelchair.PLATE), plate, { color: tyre });
    builder.affordance({
      id: `${side}Footplate`,
      kind: "pedal",
      frame: ArchetypeFrame.facing(Vector3.add(plate, v(0, 0.005, 0)), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      width: half,
    });

    // The rear wheel at the overall width, its axle under the seat's rear edge; a self-propelled chair's rim just inside it.
    const outer: number = sign * (d.width / 2);
    const centre: IAutoMovieVector3 = v(outer - sign * 0.015, wheel, 0);
    builder.rod(`wheel-${side}`, wheel, v(outer - sign * 0.03, wheel, 0), v(outer, wheel, 0), { color: tyre });
    builder.box(`spoke-${side}`, v(0.006, wheel * 1.8, 0.02), v(outer - sign * 0.015, wheel, 0), { color: frame });
    builder.affordance({
      id: `${side}Spin`,
      kind: "knob",
      frame: ArchetypeFrame.facing(centre, v(1, 0, 0), v(0, 1, 0)),
      extent: null,
      travel: 360,
      parts: [`wheel-${side}`, `spoke-${side}`],
    });
    if (kind === "selfPropelled")
      builder.affordance({
        id: `${side}Rim`,
        kind: "wheel",
        frame: ArchetypeFrame.facing(Vector3.add(centre, v(sign * 0.02, 0, 0)), v(-sign, 0, 0), v(0, 0, 1)),
        extent: null,
        grip: "power",
        radius: createWheelchair.RIM / 2,
        rides: `${side}Spin`,
      });
    builder.rod(`caster-${side}`, caster, v(x - 0.015, caster, d.seatDepth), v(x + 0.015, caster, d.seatDepth), { color: tyre });
    builder.rod(`fork-${side}`, 0.01, v(x, caster, d.seatDepth), v(x, d.seatHeight, d.seatDepth), { color: frame });
  }
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createWheelchair}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, from one maker's sheet of its 24-inch and 14-inch models.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions sitting, transferring, pushing and wheeling read: the seat, the back, the arms, the footplates, the handles and the wheels.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A figure read only in search results is a marked constant.
 */
export namespace createWheelchair {
  /** The kinds: a self-propelled chair on 24-inch rear wheels with handrims, or a transport chair on 14-inch ones, pushed. */
  export type Kind = "selfPropelled" | "transport";

  /** Every kind. */
  export const KINDS: readonly Kind[] = ["selfPropelled", "transport"];

  /** A footplate's fore-and-aft depth as drawn, metres: a construction estimate no act reads, the plate's `pedal` affordance stating no depth. */
  export const PLATE: number = 0.13;

  /** The seat plane's tilt from level, degrees: 6 on every model of the maker's sheet (Karma Medical 2025 manual wheelchair specification, p. 66). */
  export const SEAT_PLANE: number = 6;

  /** A handrim's diameter, metres: the 540 mm bead-seat size of a 24-inch wheelchair wheel, the code handrims are sold under (New Mobility's handrim guide, https://newmobility.com/gear-guide-handrims), seen in search results only; provisional. */
  export const RIM: number = 0.54;

  /**
   * The affordance ids:
   *
   * - `seat`: the seat's front edge, facing forward.
   * - `leftHandle`, `rightHandle`: the push handles behind the back.
   * - `leftArm`, `rightArm`: the armrests, pressed on to rise or held.
   * - `leftFootplate`, `rightFootplate`: the footplates.
   * - `leftSpin`, `rightSpin`: each rear wheel's roll about its axle, a positive travel rolling it forward.
   * - `leftRim`, `rightRim`: a self-propelled chair's handrims, riding their wheels; a transport chair has none.
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
   * - `backHeight`: the backrest's height; `backAngle` its recline from upright, degrees.
   * - `armHeight`: the armrests above the seat.
   * - `footDrop`: the footplates below the seat.
   * - `wheelDiameter`, `casterDiameter`: the rear wheels and the front casters.
   * - `length`, `width`, `height`: the overall sizes, the width across the rear wheels and the height at the push handles.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which kind; self-propelled when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `wheelchair` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = ((): Readonly<Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>> => {
    const sheet: string =
      "Karma Medical 2025 global manual wheelchair specification, pp. 66-67, Ergo 2, Ergo 3, S-Ergo 115 and S-Ergo 125 (https://www.karmamedical.com/wp-content/uploads/2021/05/2025-Karma-Medical-Global-Manual-Wheelchair-Specification.pdf)";
    const m = (minimum: number, maximum: number, what: string): IArchetypeBand =>
      ArchetypeBand.metres(minimum, maximum, `${sheet}: ${what}`);
    const shared: Readonly<Record<"seatWidth" | "backHeight" | "backAngle" | "armHeight" | "footDrop" | "casterDiameter", IArchetypeBand>> = {
      seatWidth: m(0.4, 0.51, "nominal seat width"),
      backHeight: m(0.43, 0.435, "backrest height"),
      backAngle: ArchetypeBand.of("degrees", 12, 20, `${sheet}: backrest angle`),
      armHeight: m(0.22, 0.23, "armrest to seat distance"),
      footDrop: m(0.355, 0.46, "footrest to seat distance"),
      casterDiameter: m(7 * 0.0254, 7 * 0.0254, "front caster, 7 in"),
    };
    return {
      selfPropelled: {
        ...shared,
        seatDepth: m(0.42, 0.435, "nominal seat depth of the 24-inch models"),
        seatHeight: m(0.485, 0.495, "seat surface height at the front edge of the 24-inch models"),
        wheelDiameter: m(24 * 0.0254, 24 * 0.0254, "rear wheel, 24 in"),
        length: m(1.0, 1.03, "overall length with legrest of the 24-inch models"),
        width: m(0.58, 0.695, "overall width of the 24-inch models"),
        height: m(0.905, 0.935, "overall height of the 24-inch models"),
        mass: ArchetypeBand.of("kg", 13.6, 14.6, `${sheet}: total mass of the 24-inch models`),
      },
      transport: {
        ...shared,
        seatDepth: m(0.43, 0.435, "nominal seat depth of the 14-inch models"),
        seatHeight: m(0.435, 0.5, "seat surface height at the front edge of the 14-inch models"),
        wheelDiameter: m(14 * 0.0254, 14 * 0.0254, "rear wheel, 14 in"),
        length: m(1.01, 1.03, "overall length with legrest of the 14-inch models"),
        width: m(0.575, 0.675, "overall width of the 14-inch models"),
        height: m(0.885, 0.935, "overall height of the 14-inch models"),
        mass: ArchetypeBand.of("kg", 11.8, 13.1, `${sheet}: total mass of the 14-inch models`),
      },
    };
  })();
}
