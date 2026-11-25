import { Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import { createLongGun } from "./createLongGun";

/**
 * The bayonet's unread proportions, metres: provisional estimates for a Land
 * Pattern socket bayonet until a measured record is read, such as the
 * Smithsonian's socket-bayonet scabbard (NMAH 1050670), whose page refused
 * automated reading on 2026-11-21, or a Royal Armouries socket bayonet.
 */
const ESTIMATES: Readonly<createStageBayonet.IEstimates> = {
  blade: 0.43,
  socket: 0.1,
  crank: 0.02,
  width: 0.022,
  wall: 0.0015,
  gap: 0.0005,
};

/** Authored mass of the inert stand-in, in kilograms. */
const MASS: number = 0.12;

/**
 * Fit an inert socket bayonet to a separately generated musket's muzzle.
 *
 * The blade runs along `+Y` from its shoulder at the origin to the `tip`. The
 * socket tube lies one crank toward `-Z`, behind the shoulder, with its bore
 * sized from the musket's barrel. Its `socket` frame shares the blade's axes
 * and sits on the tube's axis at its front end, so placing it on the musket's
 * `bayonet` frame slides the tube over the muzzle and hangs the blade below the
 * barrel, parallel to it. The `handle` is the tube a hand closes on to draw or
 * fix the bayonet.
 *
 * @param params A generated musket and an optional bayonet id.
 * @returns The bayonet and its model-space contact frames, in metres.
 * @throws {AutoMovieArchetypeRefusal} If the gun is not a generated musket with
 *   a barrel, or the ids coincide.
 */
export function createStageBayonet(
  params: createStageBayonet.IParams,
): AutoMovieArchetype<
  createStageBayonet.Affordance,
  createStageBayonet.Dimension
> {
  const { gun, id = "stageBayonet" }: createStageBayonet.IParams = params;
  if (
    gun.archetype !== "longGun" ||
    gun.name !== createLongGun.NAMES.musket ||
    id === gun.id
  )
    throw refuse(gun.id);
  const barrel: IAutoMovieModelPart | undefined = gun.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "barrel",
  );
  const shape: IAutoMovieModelPart["geometry"] | undefined = barrel?.geometry;
  if (
    shape?.type !== "primitive" ||
    (shape.shape.type !== "capsule" && shape.shape.type !== "cylinder") ||
    !(shape.shape.radius > 0)
  )
    throw refuse(gun.id);

  const e: Readonly<createStageBayonet.IEstimates> = ESTIMATES;
  const bore: number = shape.shape.radius + e.gap;
  const outer: number = bore + e.wall;
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<createStageBayonet.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stageBayonet",
      { blade: "m", socket: "m", bore: "m" },
      undefined,
    );
  draw.derive("blade", e.blade);
  draw.derive("socket", e.socket);
  draw.derive("bore", 2 * bore);
  const builder: AutoMovieArchetypeBuilder<
    createStageBayonet.Affordance,
    createStageBayonet.Dimension
  > = new AutoMovieArchetypeBuilder({
    id,
    name: "socket bayonet stage prop",
    material: "foam",
    draw,
  });

  // Four wall slabs stand for the open tube so its bore stays clear for the muzzle.
  for (const [side, x, z] of [
    ["left", bore + e.wall / 2, -e.crank],
    ["right", -bore - e.wall / 2, -e.crank],
    ["upper", 0, -e.crank - bore - e.wall / 2],
    ["lower", 0, -e.crank + bore + e.wall / 2],
  ] as const)
    builder.box(
      `socket-${side}`,
      x === 0 ? v(2 * outer, e.socket, e.wall) : v(e.wall, e.socket, 2 * outer),
      v(x, -e.socket / 2, z),
      { color: "#8d9096" },
    );
  builder.box(
    "crank",
    v(e.width / 2, 0.02, e.crank),
    v(0, -0.01, -e.crank / 2),
    {
      color: "#8d9096",
    },
  );
  builder.convex(
    "blade",
    [
      v(-e.width / 2, 0, -0.003),
      v(e.width / 2, 0, -0.003),
      v(0, 0, 0.006),
      v(0, e.blade, 0),
    ],
    undefined,
    { color: "#c4c7cc" },
  );

  builder.affordance({
    id: "socket",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, -e.crank)),
    extent: null,
  });
  builder.affordance({
    id: "handle",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -e.socket / 2, -e.crank),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * outer,
    length: e.socket,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(v(0, e.blade, 0)),
    extent: null,
  });
  return builder.build(MASS);
}

/** The musket input and the bayonet's contacts. */
export namespace createStageBayonet {
  /**
   * The socket that mates with the musket's bayonet frame, the tube a hand
   * holds, and the blade's tip.
   */
  export type Affordance = "socket" | "handle" | "tip";

  /** The blade length, the socket length and the socket's bore diameter, metres. */
  export type Dimension = "blade" | "socket" | "bore";

  /** The separately generated musket the socket fits and the bayonet's own id. */
  export interface IParams {
    /** A `createLongGun` musket whose barrel the socket slides over. */
    gun: ReturnType<typeof createLongGun>;

    /** The bayonet's own id, distinct from the musket's id. */
    id?: string;
  }

  /** The bayonet's provisional proportions, metres. */
  export interface IEstimates {
    /** The blade, shoulder to tip. */
    blade: number;

    /** The socket tube's length. */
    socket: number;

    /** The offset between the socket's axis and the blade's. */
    crank: number;

    /** The blade's width at the shoulder. */
    width: number;

    /** The socket tube's wall thickness. */
    wall: number;

    /** The clearance between the barrel and the socket's bore. */
    gap: number;
  }

  /**
   * A gallery reference fitted to the default musket.
   *
   * @returns A fresh musket input for standalone bayonet inspection.
   */
  export function REFERENCE(): Readonly<IParams> {
    return {
      gun: createLongGun({ kind: "musket", id: "bayonet-reference-musket" }),
    };
  }
}

/** Describe a gun the bayonet cannot fit. */
function refuse(gunId: string | undefined): AutoMovieArchetypeRefusal {
  return new AutoMovieArchetypeRefusal({
    kind: "parameter",
    archetype: "stageBayonet",
    axis: "gun",
    value: gunId,
    feasible: null,
    reason:
      "a socket bayonet needs a separate generated musket with a round barrel",
    fix: "supply a createLongGun musket and a distinct bayonet id",
  });
}
