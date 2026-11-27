import type { AutoMovieArchetypeStageBayonet } from "../AutoMovieArchetypeStageBayonet";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core/index";
import { AutoMovieArchetypeLongGun } from "../AutoMovieArchetypeLongGun";

/**
 * The bayonet's unread proportions, metres: provisional estimates for a Land
 * Pattern socket bayonet until a measured record is read, such as the
 * Smithsonian's socket-bayonet scabbard (NMAH 1050670), whose page refused
 * automated reading on 2026-11-21, or a Royal Armouries socket bayonet.
 */
const ESTIMATES: Readonly<AutoMovieArchetypeStageBayonet.IEstimates> = {
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
  params: AutoMovieArchetypeStageBayonet.IParams,
): AutoMovieArchetype<
  AutoMovieArchetypeStageBayonet.Affordance,
  AutoMovieArchetypeStageBayonet.Dimension
> {
  const { gun, id = "stageBayonet" }: AutoMovieArchetypeStageBayonet.IParams = params;
  if (
    gun.archetype !== "longGun" ||
    gun.name !== AutoMovieArchetypeLongGun.NAMES.musket ||
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

  const e: Readonly<AutoMovieArchetypeStageBayonet.IEstimates> = ESTIMATES;
  const bore: number = shape.shape.radius + e.gap;
  const outer: number = bore + e.wall;
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStageBayonet.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stageBayonet",
      { blade: "m", socket: "m", bore: "m" },
      undefined,
    );
  draw.derive("blade", e.blade);
  draw.derive("socket", e.socket);
  draw.derive("bore", 2 * bore);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageBayonet.Affordance,
    AutoMovieArchetypeStageBayonet.Dimension
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
