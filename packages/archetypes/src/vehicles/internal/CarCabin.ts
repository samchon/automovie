import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import { AutoMovieArchetypeCar } from "../AutoMovieArchetypeCar";
import { CarBody } from "./CarBody";

/*
 * A car's cabin: its doors with their windows and openings, its seats with
 * their reclining backs, and the driver's controls, all placed on `CarBody`'s
 * layout.
 */
export namespace CarCabin {
  /*
   * The doors: the front pair; the rear pair on a sedan, a hatchback and a
   * pickup; a van's sliding door on its kerb side. Each hinged door has its
   * handle and the opening behind it, and each side window slides down into its
   * door with an opening that grows above it.
   * Parameter builder: The car under construction.
   * Parameter l: The layout.
   */
  export function doors(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCar.Affordance,
      AutoMovieArchetypeCar.Dimension
    >,
    l: CarBody.ILayout,
  ): void {
    door(builder, l, "driver", l.side, l.door, l.pillar, true);
    door(builder, l, "passenger", -l.side, l.door, l.pillar, true);
    if (l.kind !== "van") {
      door(builder, l, "rearLeft", 1, l.pillar, l.back, false);
      door(builder, l, "rearRight", -1, l.pillar, l.back, false);
      return;
    }

    // The van's sliding door, behind the bulkhead on the kerb side.
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const kerb: number = -l.side;
    const width: number = l.d.sideDoorWidth!;
    const height: number = l.d.sideDoorHeight!;
    const start: number = CarBody.bulkhead(l);
    const middle: number = start - width / 2;
    const x: number = kerb * l.half;
    builder.box(
      "door-sliding",
      v(0.04, height, width),
      v(x, l.floor + height / 2, middle),
      {
        color: DOOR,
      },
    );
    builder.affordance({
      id: "slidingDoor",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, l.floor + height / 2, middle),
        v(kerb, 0, 0),
        v(0, 0, -1),
      ),
      extent: null,
      grip: "hook",
      travel: width,
      parts: ["door-sliding"],
    });
    builder.affordance({
      id: "slidingAperture",
      kind: "aperture",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, l.floor, middle),
        v(0, 1, 0),
        v(0, 0, -kerb),
      ),
      extent: null,
      width,
      height,
    });
  }

  /*
   * The seats: the front pair and, except in a van, the rear bench, each with
   * its back on a reclining hinge.
   * Parameter builder: The car under construction.
   * Parameter l: The layout.
   */
  export function seats(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCar.Affordance,
      AutoMovieArchetypeCar.Dimension
    >,
    l: CarBody.ILayout,
  ): void {
    const reference: IAutoMovieVector3 = l.reference;
    seat(
      builder,
      l,
      "driverSeat",
      "driver",
      AutoMovieEngineVector3.create(reference.x, l.surface, reference.z),
      0.5,
    );
    seat(
      builder,
      l,
      "passengerSeat",
      "passenger",
      AutoMovieEngineVector3.create(-reference.x, l.surface, reference.z),
      0.5,
    );
    if (l.kind !== "van")
      seat(
        builder,
        l,
        "rearSeat",
        "rear",
        AutoMovieEngineVector3.create(
          0,
          l.surface,
          l.door -
            AutoMovieArchetypeCar.REAR_DOOR +
            AutoMovieArchetypeCar.REAR_SGRP,
        ),
        l.d.width! - 0.3,
      );
  }

  /*
   * The driver's controls: the steering wheel and the accelerator. The brake,
   * the gear lever, the mirror and the belt grip are not built until a source
   * places them.
   * Parameter builder: The car under construction.
   * Parameter l: The layout.
   */
  export function controls(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCar.Affordance,
      AutoMovieArchetypeCar.Dimension
    >,
    l: CarBody.ILayout,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const d: Readonly<
      Partial<Record<AutoMovieArchetypeCar.Dimension, number>>
    > = l.d;
    const sx: number = l.reference.x;
    const tilt: number = d.steeringAngle! * AutoMovieArchetypeUnits.DEGREE;
    const axis: IAutoMovieVector3 = v(0, Math.sin(tilt), -Math.cos(tilt));
    const hub: IAutoMovieVector3 = l.wheel;
    builder.rod(
      "steering-rim",
      d.steeringDiameter! / 2,
      AutoMovieEngineVector3.subtract(hub, AutoMovieEngineVector3.scale(axis, 0.015)),
      AutoMovieEngineVector3.add(hub, AutoMovieEngineVector3.scale(axis, 0.015)),
      { color: DARK },
    );
    builder.rod(
      "steering-column",
      0.02,
      AutoMovieEngineVector3.subtract(hub, AutoMovieEngineVector3.scale(axis, 0.3)),
      hub,
      { color: GREY },
    );
    builder.rod(
      "steering-spoke",
      0.008,
      AutoMovieEngineVector3.add(
        hub,
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(axis, 0.02),
          v(-d.steeringDiameter! / 2, 0, 0),
        ),
      ),
      AutoMovieEngineVector3.add(
        hub,
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(axis, 0.02),
          v(d.steeringDiameter! / 2, 0, 0),
        ),
      ),
      { color: METAL },
    );
    builder.affordance({
      id: "wheel",
      kind: "wheel",
      frame: AutoMovieArchetypeFrame.facing(hub, axis, v(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: 0.03,
      radius: d.steeringDiameter! / 2,
      travel: d.lockTurns! * 180,
      parts: ["steering-rim", "steering-spoke"],
    });

    // The right grasp is on the rim and turns with the same column. The rim's
    // round section is wrapped alike from any side, like a rail.
    const rim: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      hub,
      v(-d.steeringDiameter! / 2, 0, 0),
    );
    builder.affordance({
      id: "rightSteeringGrip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        rim,
        axis,
        AutoMovieEngineVector3.cross(axis, v(-1, 0, 0)),
      ),
      extent: null,
      grip: "power",
      aperture: 0.03,
      rides: "wheel",
    });

    // A sole can bear on the modeled floor either side of the seat center.
    // Share the accelerator heel's longitudinal station in the front row.
    // The floor never travels, so these points bind no part.
    for (const [id, x] of [
      ["driverLeftRest", sx + AutoMovieArchetypeCar.FOOT],
      ["passengerLeftRest", -sx + AutoMovieArchetypeCar.FOOT],
      ["passengerRightRest", -sx - AutoMovieArchetypeCar.FOOT],
    ] as const)
      builder.affordance({
        id,
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright(v(x, l.floor, l.heel.z)),
        extent: null,
      });

    // The accelerator on the pedal plane at the ball of foot under the right foot; its plate faces the sole, out of the plane toward the seat.
    const slope: number = l.pedal * AutoMovieArchetypeUnits.DEGREE;
    const sole: IAutoMovieVector3 = v(0, Math.cos(slope), -Math.sin(slope));
    const at: IAutoMovieVector3 = v(
      sx - AutoMovieArchetypeCar.FOOT,
      l.ball.y,
      l.ball.z,
    );
    builder.box("pedal-accelerator", v(0.05, 0.01, 0.08), at, {
      color: DARK,
      rotation: AutoMovieArchetypeFrame.facing(at, sole, v(1, 0, 0)).rotation,
    });
    builder.affordance({
      id: "accelerator",
      kind: "pedal",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.add(at, AutoMovieEngineVector3.scale(sole, 0.005)),
        sole,
        v(1, 0, 0),
      ),
      extent: null,
      width: 0.05,
      depth: 0.08,
      travel: d.pedalTravel!,
      parts: ["pedal-accelerator"],
    });
  }
}

/*
 * A door's colour.
 */
const DOOR: string = "#355c7a";

/*
 * A seat's colour.
 */
const CLOTH: string = "#6f7f93";

/*
 * Glass's colour.
 */
const GLASS: string = "#a9c4d6";

/*
 * A dark trim's colour.
 */
const DARK: string = "#22262b";

/*
 * A grey trim's colour.
 */
const GREY: string = "#55595f";

/*
 * Bright metal's colour.
 */
const METAL: string = "#c9ccd1";

/*
 * The body's colour.
 */
const BODY: string = "#3f6c8f";

/*
 * Add one hinged door: its leaf, handle and middle pillar, its hinge, handle
 * and opening, and its sliding window with the window's opening.
 * Parameter builder: The car under construction.
 * Parameter l: The layout.
 * Parameter role: The door's name in its ids.
 * Parameter sign: The side it is on, 1 for `+X`.
 * Parameter hinge: The station of its front edge, where it is hinged.
 * Parameter end: The station of its rear edge.
 * Parameter pillar: Whether a middle pillar stands at its rear edge.
 */
function door(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCar.Affordance,
    AutoMovieArchetypeCar.Dimension
  >,
  l: CarBody.ILayout,
  role: "driver" | "passenger" | "rearLeft" | "rearRight",
  sign: number,
  hinge: number,
  end: number,
  pillar: boolean,
): void {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const x: number = sign * l.half;
  const part: string = `door-${PART[role]}`;
  const panel: number = 0.04;
  builder.box(
    part,
    v(panel, l.belt - l.floor, hinge - end),
    v(x, (l.belt + l.floor) / 2, (hinge + end) / 2),
    { color: DOOR },
  );
  const handle: IAutoMovieVector3 = v(
    x + sign * 0.03,
    l.belt - AutoMovieArchetypeCar.HANDLE.drop,
    end + AutoMovieArchetypeCar.HANDLE.aft,
  );
  builder.rod(
    `door-handle-${PART[role]}`,
    0.01,
    v(handle.x, handle.y, handle.z + AutoMovieArchetypeCar.HANDLE.length / 2),
    v(handle.x, handle.y, handle.z - AutoMovieArchetypeCar.HANDLE.length / 2),
    { color: METAL },
  );
  if (pillar)
    builder.rod(
      `pillar-mid-${PART[role]}`,
      0.03,
      v(sign * (l.half - 0.03), l.belt, end),
      v(sign * (l.half - 0.03), l.top - 0.04, end),
      { color: BODY },
    );
  builder.affordance({
    id: `${role}Door`,
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      v(x, (l.belt + l.floor) / 2, hinge),
      v(0, -sign, 0),
      v(0, 0, -1),
    ),
    extent: null,
    travel: l.d.doorSwing!,
    parts: [part, `door-handle-${PART[role]}`],
  });
  builder.affordance({
    id: `${role}DoorHandle`,
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(handle, v(sign, 0, 0), v(0, 0, 1)),
    extent: null,
    grip: "hook",
    aperture: 0.02,
    length: AutoMovieArchetypeCar.HANDLE.length,
    rides: `${role}Door`,
  });
  builder.affordance({
    id: `${role}Aperture`,
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      v(x, l.floor, (hinge + end) / 2),
      v(0, 1, 0),
      v(0, 0, sign),
    ),
    extent: null,
    width: hinge - end,
    height: l.window - l.floor,
  });
  if (role === "rearLeft" || role === "rearRight")
    builder.affordance({
      id: `${role}Sill`,
      kind: "surface",
      materialPart: "floor",
      frame: AutoMovieArchetypeFrame.facing(
        v(x - (sign * panel) / 2, l.floor, (hinge + end) / 2),
        v(0, 1, 0),
        v(0, 0, sign),
      ),
      extent: null,
      width: hinge - end,
      depth: panel,
    });

  // The window between the door's edges, sliding down into the door.
  const forward: number = hinge - 0.03;
  const length: number = forward - (end + 0.03);
  const height: number = l.window - l.belt;
  const middle: number = (forward + end + 0.03) / 2;
  const glass: string = `window-${PART[role]}`;
  builder.box(
    glass,
    v(0.01, height, length),
    v(x, l.belt + height / 2, middle),
    { color: GLASS, density: 0.5 },
  );
  builder.affordance({
    id: `${role}Window`,
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(x, l.window, middle),
      v(sign, 0, 0),
      v(0, -1, 0),
    ),
    extent: null,
    travel: height,
    parts: [glass],
    rides: `${role}Door`,
  });
  builder.affordance({
    id: `${role}WindowOpening`,
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      v(x, l.window, middle),
      v(0, 1, 0),
      v(0, 0, sign),
    ),
    extent: null,
    width: length,
    height,
    rides: `${role}Window`,
  });
}

/*
 * Add one seat: a cushion and a back, its `seat` affordance on the cushion's
 * front edge facing forward, and the back's reclining hinge where `recline` is
 * positive.
 * Parameter builder: The car under construction.
 * Parameter l: The layout.
 * Parameter id: The seat's affordance id.
 * Parameter name: Its name in part ids.
 * Parameter reference: The middle of the cushion's surface under the seating
 * reference point, which lies 0.1 m ahead of the back.
 * Parameter width: The cushion's width.
 */
function seat(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCar.Affordance,
    AutoMovieArchetypeCar.Dimension
  >,
  l: CarBody.ILayout,
  id: "driverSeat" | "passengerSeat" | "rearSeat",
  name: string,
  reference: IAutoMovieVector3,
  width: number,
): void {
  const depth: number = 0.48;
  const rear: number = reference.z - 0.1;
  builder.box(
    `cushion-${name}`,
    AutoMovieEngineVector3.create(width, 0.12, depth),
    AutoMovieEngineVector3.create(reference.x, reference.y - 0.06, rear + depth / 2),
    { color: CLOTH, density: 0.2 },
  );
  builder.box(
    `backrest-${name}`,
    AutoMovieEngineVector3.create(width, 0.6, 0.1),
    AutoMovieEngineVector3.create(reference.x, reference.y + 0.3, rear - 0.05),
    { color: CLOTH, density: 0.2 },
  );
  builder.affordance({
    id,
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(
      AutoMovieEngineVector3.create(reference.x, reference.y, rear + depth),
    ),
    extent: null,
    depth,
    width,
    back: 0.6,
  });

  // A back whose recline is 0 does not recline, so it has no hinge: a hinge's travel must be positive.
  if (l.d.recline! > 0)
    builder.affordance({
      id: `${id}Back`,
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(reference.x, reference.y, rear),
        AutoMovieEngineVector3.create(-1, 0, 0),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      travel: l.d.recline!,
      parts: [`backrest-${name}`],
    });
}

/*
 * Each door's name in part ids, as the front doors' were before the rear doors
 * came.
 */
const PART: Readonly<
  Record<"driver" | "passenger" | "rearLeft" | "rearRight", string>
> = {
  driver: "driver",
  passenger: "passenger",
  rearLeft: "rear-left",
  rearRight: "rear-right",
};
