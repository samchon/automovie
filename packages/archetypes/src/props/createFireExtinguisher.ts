import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * A 5 lb ABC dry-chemical extinguisher, Buckeye's spec sheet as a search
 * summary quotes it
 * (https://www.webstaurantstore.com/documents/specsheets/4725abc.pdf, read
 * 2026-11-22): 16 3/8 in (0.416 m) tall, a 4 1/4 in (0.108 m) cylinder, 7 1/4
 * in (0.184 m) wide and 9 1/2 lb (4.3 kg) shipped. The valve's proportions, the
 * lever's travel and the pin's pull are provisional construction estimates.
 */
const SIZE: Readonly<createFireExtinguisher.ISize> = {
  height: 0.416,
  diameter: 0.108,
  width: 0.184,
  mass: 4.3,
  lever: 20,
  pin: 0.04,
};

/**
 * A stored-pressure fire extinguisher standing on its base.
 *
 * The cylinder stands along `+Y` from the base's centre at the origin. Its
 * valve sits on top: `handle` is the carrying handle under the valve, the hand
 * closing on it from below; `lever` is the operating lever above it, a hinge
 * the holding hand's fingers squeeze down by `lever` degrees to discharge;
 * `pin` is the safety pin through the valve, a slider pulled out along `+X` by
 * `pin` metres before the lever can move; `ring` is the pin's ring, riding it,
 * where the free hand pulls. `nozzle` is the horn's outlet ahead of the valve,
 * its `+Y` the discharge direction, along `+Z`.
 *
 * @param params The optional scene id.
 * @returns The extinguisher and its contacts, metres.
 */
export function createFireExtinguisher(
  params: createFireExtinguisher.IParams = {},
): AutoMovieArchetype<
  createFireExtinguisher.Affordance,
  createFireExtinguisher.Dimension
> {
  const v: typeof Vector3.create = Vector3.create;
  const r: number = SIZE.diameter / 2;
  const body: number = SIZE.height - 0.08;
  const draw: AutoMovieArchetypeDrawSession<createFireExtinguisher.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "fireExtinguisher",
      { height: "m", diameter: "m", mass: "kg" },
      undefined,
    );
  draw.derive("height", SIZE.height);
  draw.derive("diameter", SIZE.diameter);
  draw.derive("mass", SIZE.mass);
  const builder: AutoMovieArchetypeBuilder<
    createFireExtinguisher.Affordance,
    createFireExtinguisher.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "extinguisher",
    name: "fire extinguisher",
    material: "steel",
    draw,
  });
  // The valve's depth along `Z`, and the handle's run behind it: its middle
  // and its length.
  const valve: number = 0.04;
  const handleAt: number = -0.035;
  const handleLength: number = 0.11;
  // The hand closes on the handle's free run, from the valve's back face to
  // the handle's end, clear of the valve and the pin's ring before it.
  const back: number = -valve / 2;
  const end: number = handleAt - handleLength / 2;
  builder.rod("cylinder", r, v(0, 0, 0), v(0, body, 0), { color: "#b3201b" });
  builder.box("valve", v(0.03, 0.04, valve), v(0, body + 0.02, 0), {
    color: "#3a3a3a",
  });
  builder.box(
    "handle",
    v(0.025, 0.012, handleLength),
    v(0, body + 0.045, handleAt),
    {
      color: "#2a2a2a",
    },
  );
  builder.box("lever", v(0.025, 0.01, 0.11), v(0, body + 0.07, -0.035), {
    color: "#2a2a2a",
  });
  builder.rod(
    "pin",
    0.003,
    v(-0.02, body + 0.055, 0.01),
    v(0.02, body + 0.055, 0.01),
    { color: "#c9ccd0" },
  );
  builder.rod("horn", 0.01, v(0, body + 0.04, 0.02), v(0, body + 0.03, 0.09), {
    color: "#2a2a2a",
  });
  builder.affordance({
    id: "handle",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body + 0.039, (back + end) / 2),
      v(0, -1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    grip: "power",
    aperture: 0.03,
    length: back - end,
  });
  builder.affordance({
    id: "lever",
    kind: "hinge",
    extent: null,
    travel: SIZE.lever,
    parts: ["lever"],
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body + 0.07, 0.015),
      v(1, 0, 0),
      v(0, 0, -1),
    ),
  });
  builder.affordance({
    id: "leverTip",
    kind: "button",
    rides: "lever",
    frame: AutoMovieArchetypeFrame.upright(v(0, body + 0.075, -0.08)),
    extent: null,
  });
  builder.affordance({
    id: "pin",
    kind: "slider",
    extent: null,
    travel: SIZE.pin,
    parts: ["pin"],
    frame: AutoMovieArchetypeFrame.facing(
      v(0.02, body + 0.055, 0.01),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
  });
  builder.affordance({
    id: "ring",
    kind: "handle",
    symmetry: "round",
    rides: "pin",
    frame: AutoMovieArchetypeFrame.facing(
      v(0.035, body + 0.055, 0.01),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.025,
    length: 0.025,
  });
  builder.affordance({
    id: "nozzle",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body + 0.03, 0.09),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(SIZE.mass);
}

/** The inputs, contacts and size of {@link createFireExtinguisher}. */
export namespace createFireExtinguisher {
  /**
   * The carrying handle, the lever and its tip, the pin and its ring, and the
   * nozzle.
   */
  export type Affordance =
    | "handle"
    | "lever"
    | "leverTip"
    | "pin"
    | "ring"
    | "nozzle";

  /** The height, the diameter and the mass. */
  export type Dimension = "height" | "diameter" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `extinguisher` when absent. */
    id?: string;
  }

  /** The extinguisher's size. */
  export interface ISize {
    /** Base to valve top, metres. */
    height: number;

    /** The cylinder's diameter, metres. */
    diameter: number;

    /** The width with the valve, metres. */
    width: number;

    /** The mass, kilograms. */
    mass: number;

    /** The lever's squeeze, degrees. */
    lever: number;

    /** The pin's pull, metres. */
    pin: number;
  }
}
