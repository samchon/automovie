import { AutoMovieArchetypeWheelchair } from "../AutoMovieArchetypeWheelchair";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeDraw, type AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeUnits } from "../../core";
import "../WHEELCHAIR_SHEET";

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
 * `AutoMovieArchetypeWheelchair.ride` turns the wheels by the distance.
 *
 * Stage a seated push and release with `AutoMovieArchetypeWheelchair.handrimFrame` and
 * `HumanHandrimStroke` on a course authored through `AutoMovieArchetypeWheelchair.ride`. A pushing
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
  params: AutoMovieArchetypeWheelchair.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWheelchair.Affordance, AutoMovieArchetypeWheelchair.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWheelchair.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeWheelchair.Dimension>(
      "wheelchair",
      AutoMovieArchetypeWheelchair.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeWheelchair.Kind = ArchetypeDraw.choice(
    "wheelchair",
    "kind",
    params.kind ?? "selfPropelled",
    AutoMovieArchetypeWheelchair.KINDS,
  );
  // One read model of the kind whole, then the ranges its own row states inside it.
  const model: {
    name: AutoMovieArchetypeWheelchair.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeWheelchair.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeWheelchair.Model>(
    "model",
    params.model,
    AutoMovieArchetypeWheelchair.MODELS[kind],
  );
  const drawn: Partial<Record<AutoMovieArchetypeWheelchair.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeWheelchair.ranges(kind, model.name!)),
    ...model.figures,
  };
  const need = (name: AutoMovieArchetypeWheelchair.Dimension): number => {
    const value: number | undefined = drawn[name];
    if (value === undefined)
      throw new Error(`wheelchair: no band or model figure gives ${name}`);
    return value;
  };
  const d: Record<AutoMovieArchetypeWheelchair.Dimension, number> = {
    seatWidth: need("seatWidth"),
    seatDepth: need("seatDepth"),
    seatHeight: need("seatHeight"),
    backHeight: need("backHeight"),
    backAngle: need("backAngle"),
    armHeight: need("armHeight"),
    footDrop: need("footDrop"),
    wheelDiameter: need("wheelDiameter"),
    casterDiameter: need("casterDiameter"),
    length: need("length"),
    width: need("width"),
    height: need("height"),
    mass: need("mass"),
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeWheelchair.Affordance,
    AutoMovieArchetypeWheelchair.Dimension
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
    AutoMovieArchetypeWheelchair.SEAT_PLANE * AutoMovieArchetypeUnits.DEGREE;
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
      d.length - wheel - AutoMovieArchetypeWheelchair.PLATE / 2,
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
      v(half, 0.01, AutoMovieArchetypeWheelchair.PLATE),
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
        radius: AutoMovieArchetypeWheelchair.RIM / 2,
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
