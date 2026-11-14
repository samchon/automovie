import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The accessible car read. */
const ADA: string =
  "2010 ADA Standards 407.4.1 and Table 407.4.1, centered door: door clear width 42 in (1065 mm), inside car 80 in (2030 mm) side to side, 51 in (1295 mm) back wall to front return, 54 in (1370 mm) back wall to inside face of door; a tolerance of minus 5/8 in (16 mm) on the door (https://www.access-board.gov/ada/chapter/ch04/)";

/** The maker's heights read. */
const KONE: string =
  "KONE MonoSpace 4 DX Core and Pro / 300 and 500 DX planning guide: car height 2 100 to 2 400 mm, door height 2 000 to 2 300 mm, centre-opening doors (https://www.kone.co.uk/Images/KONE-MonoSpace-4-DX-Core-and-Pro-Planning-Guide-GBIR_tcm45-139450.pdf)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `wall`, the car's wall and roof thickness; `leaf`, a door leaf's thickness. */
const ESTIMATES: Readonly<{ wall: number; leaf: number }> = {
  wall: 0.05,
  leaf: 0.03,
};

/**
 * A passenger lift's car at a landing: the accessible car with a centred, centre-opening door.
 *
 * The car's floor is at the landing's level, `y = 0`, and the inside face of its closed door lies in the plane `z = 0`, the car behind it toward `-Z` and the landing toward `+Z`; a person enters walking `-Z`. The front returns flank the door at the depth the regulation gives between the door's face and the front return. Each door leaf slides out toward its own side by half the clear width, opening the entrance.
 *
 * The car is built for static use: riding it between floors is standing on a moving support, which no motion law covers yet (#3491). Its hall and car buttons are not declared, since no source read places them across the wall.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The lift car.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, how the doors open, the static use with its missing law, and why no button is declared.
 * @evidence contracts/development/implementation.md#principled-implementation The inside sizes of ADA Table 407.4.1's centred row, the heights of the KONE guide; each leaf half the clear width, sliding that far.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the car's shell, the front returns, the two leaves, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hoistway, landing wall, sill or buttons; the walls' and leaves' thickness are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Nine parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createElevator(
  params: createElevator.IParams = {},
  seed?: number | string,
): Archetype<createElevator.Affordance, createElevator.Dimension> {
  const d: Record<createElevator.Dimension, number> = ArchetypeDraw.dimensions(
    "elevator",
    createElevator.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createElevator.Affordance,
    createElevator.Dimension
  > = new ArchetypeBuilder({
    archetype: "elevator",
    id: params.id,
    name: "lift car",
    dimensions: d,
  });
  const E: typeof ESTIMATES = ESTIMATES;
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width;
  const height: number = d.height;
  const back: number = -d.depth;
  const returns: number = back + d.returnDepth;
  const clear: number = d.door;
  const half: number = clear / 2;
  const middle: number = back / 2;
  const grey: string = "#9aa1a8";
  builder.box(
    "floor",
    v(width + 2 * E.wall, E.wall, d.depth),
    v(0, -E.wall / 2, middle),
    { color: "#5d6166" },
  );
  builder.box(
    "roof",
    v(width + 2 * E.wall, E.wall, d.depth),
    v(0, height + E.wall / 2, middle),
    { color: grey },
  );
  builder.box(
    "back",
    v(width + 2 * E.wall, height, E.wall),
    v(0, height / 2, back - E.wall / 2),
    { color: grey },
  );
  for (const [id, sign] of [
    ["side-left", 1],
    ["side-right", -1],
  ] as const)
    builder.box(
      id,
      v(E.wall, height, d.depth),
      v((sign * (width + E.wall)) / 2, height / 2, middle),
      { color: grey },
    );
  const strip: number = (width - clear) / 2;
  for (const [id, sign] of [
    ["return-left", 1],
    ["return-right", -1],
  ] as const)
    builder.box(
      id,
      v(strip, height, E.wall),
      v(sign * (half + strip / 2), height / 2, returns + E.wall / 2),
      { color: grey },
    );
  builder.box(
    "header",
    v(clear, height - d.doorHeight, E.wall),
    v(0, (height + d.doorHeight) / 2, returns + E.wall / 2),
    { color: grey },
  );
  for (const [id, sign] of [
    ["leftDoor", 1],
    ["rightDoor", -1],
  ] as const) {
    const part: string = `${id}-leaf`;
    const x: number = (sign * half) / 2;
    builder.box(
      part,
      v(half, d.doorHeight, E.leaf),
      v(x, d.doorHeight / 2, E.leaf / 2),
      { color: "#c3c8cd" },
    );
    builder.affordance({
      id,
      kind: "slider",
      frame: ArchetypeFrame.facing(
        v(x, d.doorHeight / 2, E.leaf),
        v(0, 0, 1),
        v(sign, 0, 0),
      ),
      extent: null,
      travel: half,
      parts: [part],
    });
  }
  builder.affordance({
    id: "entrance",
    kind: "aperture",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: clear,
    height: d.doorHeight,
  });
  builder.affordance({
    id: "floor",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, 0, middle)),
    extent: null,
    width,
    depth: d.depth,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createElevator}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The entrance a person passes through, the leaves that clear it and the floor they stand on (#3468 N7).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The door's height band stops at the least car height, so no draw puts the door above the roof.
 */
export namespace createElevator {
  /**
   * The affordance ids:
   *
   * - `entrance`: the door's clear opening, an aperture in the plane of the door's inside face.
   * - `leftDoor`, `rightDoor`: the leaves on `+X` and `-X`, sliders running out along their own side by half the clear width.
   * - `floor`: the car's floor, the surface the riders stand on.
   */
  export type Affordance = "entrance" | "leftDoor" | "rightDoor" | "floor";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: inside the car, side to side.
   * - `depth`: from the back wall to the door's inside face.
   * - `returnDepth`: from the back wall to the front return.
   * - `door`: the door's clear width.
   * - `height`: inside the car.
   * - `doorHeight`: the door's clear height.
   * - `mass`: the car, kilograms.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "returnDepth"
    | "door"
    | "height"
    | "doorHeight"
    | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `elevator` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(2.03, 2.03, ADA),
    depth: ArchetypeBand.metres(1.37, 1.37, ADA),
    returnDepth: ArchetypeBand.metres(1.295, 1.295, ADA),
    door: ArchetypeBand.metres(1.049, 1.065, ADA),
    height: ArchetypeBand.metres(2.1, 2.4, KONE),
    doorHeight: ArchetypeBand.metres(
      2.0,
      2.1,
      `${KONE}; the model stops at the least car height`,
    ),
    mass: ArchetypeBand.of("kg", 500, 1000, ArchetypeBand.TYPICAL_MASS, true),
  };
}
