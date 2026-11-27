import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

const HULL: string =
  "Filippi F13: https://www.filippiboats.com/eng/boats/competition/double-pair/f13";
const WEIGHT: string =
  "World Rowing 2x minimum: https://worldrowing.com/technical/equipment-technology/equipment-compliance/";
const OARS: string =
  "Empacher adjustable racing sculls: https://www.empacher.com/en/products/sculls-oars/racing-scull";
const RIG: string =
  "Filippi order form, sculling span and height: https://www.filippiboats.com/application/files/1817/5247/9595/order_form_v25_r2.pdf";

const v: typeof Vector3.create = Vector3.create;
const PAINT: string = "#eeeae0";
const DECK: string = "#a32725";
const CARBON: string = "#282d34";
const WALL: number = 0.009;
const RIM: number = 0.13;
const FLOOR: number = -0.14;
const SEAT: Readonly<{
  y: number;
  depth: number;
  width: number;
  travel: number;
}> = { y: 0.16, depth: 0.24, width: 0.29, travel: 0.48 };
const PLATE: Readonly<{ width: number; depth: number; tilt: number }> = {
  width: 0.11,
  depth: 0.26,
  tilt: 37,
};

/** Constructs the double scull archetype from its recipe. */
export namespace AutoMovieArchetypeDoubleScull {
/**
 * A two-station racing shell. The model's +Z points towards the bow and Y = 0
 * is its reference waterline. Both rowers face aft. The seat and both oars at
 * each station move independently. Seat travel starts at the catch side and
 * increases towards the bow. Oar dimensions come from Empacher and Filippi. The
 * lock heights keep the two hands clear as the handles overlap. The cockpit,
 * rail, blade thickness and hull sections between the measured points are
 * staging estimates.
 *
 * @param params Optional scene identity and fixed figures within the stated
 *   dimensions.
 * @param seed Provenance seed. The reference figures themselves are fixed.
 * @returns Open racing hull, two sliding seats, four footplates and four
 *   sculls.
 */
export function create(
  params: AutoMovieArchetypeDoubleScull.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeDoubleScull.Affordance,
  AutoMovieArchetypeDoubleScull.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDoubleScull.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "doubleScull",
      AutoMovieArchetypeDoubleScull.UNITS,
      seed,
      params,
    );
  const dimensions: Record<AutoMovieArchetypeDoubleScull.Dimension, number> =
    draw.dimensions(AutoMovieArchetypeDoubleScull.BANDS);
  const builder: Build = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "double scull",
    material: "composite",
    draw,
  });
  shell(builder, dimensions.length, dimensions.beam);
  station(builder, "bow", 0.83, dimensions.oarLength);
  station(builder, "stroke", -0.96, dimensions.oarLength);
  return builder.build(dimensions.mass);
}

  /* Fixed reference hull measurements and station contact ids. */
  /** Forward station and rear station. */
  export type Station = "bow" | "stroke";
  /** Side from the seated actor's heading, which faces the stern. */
  export type Side = "Left" | "Right";
  /** Articulation and contact ids, scoped to their respective station. */
  export type Affordance =
    | `${Station}${"Seat" | "Slide"}`
    | `${Station}${Side}${"Foot" | "Handle" | "Sweep" | "Dip" | "BladeTip"}`;
  /** Hull length, waterline beam, one scull's length, and assembled mass. */
  export type Dimension = "length" | "beam" | "oarLength" | "mass";
  /** Model overrides at the reference figures, and scene identity. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject name. */
    id?: string;
  }
  /** Units of the fixed reference dimensions. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    beam: "m",
    oarLength: "m",
    mass: "kg",
  };
  /** The reference hull, rig and assembled reference mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(9.4, 9.4, HULL),
    beam: AutoMovieArchetypeBand.metres(0.33, 0.33, HULL),
    oarLength: AutoMovieArchetypeBand.metres(
      2.9,
      2.9,
      `${OARS}; rigged to ${RIG}`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      32.64,
      32.64,
      `${WEIGHT}; plus four 1.41 kg sculls (${OARS})`,
    ),
  };
}

/**
 * Loft thin polygonal walls along one shared section family, with deck caps
 * outside the two footwells.
 */
function shell(builder: Build, length: number, beam: number): void {
  const sections: readonly { z: number; width: number; bottom: number }[] = [
    { z: -length / 2, width: 0.008, bottom: 0.072 },
    { z: -length * 0.37, width: beam * 0.38, bottom: -0.055 },
    { z: -length * 0.22, width: beam, bottom: FLOOR },
    { z: length * 0.22, width: beam, bottom: FLOOR },
    { z: length * 0.38, width: beam * 0.56, bottom: -0.055 },
    { z: length / 2, width: 0.008, bottom: 0.072 },
  ];
  const wall = (
    s: (typeof sections)[number],
    inset: boolean,
  ): IAutoMovieVector3[] => {
    const half: number = s.width / 2;
    const w: number = inset ? half * 0.92 : half;
    const floor: number = s.bottom + (inset ? WALL : 0);
    const chine: number = inset ? WALL : 0;
    return [
      v(-w * 1.1, RIM, s.z),
      v(-w, chine, s.z),
      v(-w * 0.57, floor, s.z),
      v(w * 0.57, floor, s.z),
      v(w, chine, s.z),
      v(w * 1.1, RIM, s.z),
    ];
  };
  const rings = sections.map((s) => ({
    inner: wall(s, true),
    outer: wall(s, false),
  }));
  for (let i: number = 0; i < rings.length - 1; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let j: number = 0; j < a.outer.length - 1; j++)
      builder.convex(
        `shell-${i}-${j}`,
        [a, b].flatMap((r) => [
          r.outer[j]!,
          r.outer[j + 1]!,
          r.inner[j]!,
          r.inner[j + 1]!,
        ]),
        undefined,
        { color: PAINT },
      );
    if (i !== 2)
      builder.convex(
        `deck-${i}`,
        [a, b]
          .flatMap((r) => [r.outer[0]!, r.outer[5]!])
          .flatMap((point) => [point, { ...point, y: point.y - WALL }]),
        undefined,
        { color: DECK },
      );
  }
}

/**
 * Build one seat on two rails, the angled feet and a pair of articulated
 * sculls.
 */
function station(
  builder: Build,
  id: AutoMovieArchetypeDoubleScull.Station,
  at: number,
  oarLength: number,
): void {
  const slide: AutoMovieArchetypeDoubleScull.Affordance = `${id}Slide`;
  const coaster: string = `${id}-seat`;
  const front: number = at - SEAT.depth / 2;
  const railY: number = SEAT.y - 0.045;
  for (const side of [-1, 1])
    builder.box(
      `${id}-rail-${side}`,
      v(0.023, 0.035, SEAT.travel + SEAT.depth),
      v(side * 0.105, railY, at + SEAT.travel / 2),
      { color: CARBON },
    );
  builder.box(
    coaster,
    v(SEAT.width, 0.03, SEAT.depth),
    v(0, SEAT.y - 0.015, at),
    {
      color: CARBON,
    },
  );
  builder.affordance({
    id: slide,
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, railY, at),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    travel: SEAT.travel,
    parts: [coaster],
  });
  builder.affordance({
    id: `${id}Seat`,
    kind: "seat",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, SEAT.y, front),
      v(0, 1, 0),
      v(-1, 0, 0),
    ),
    extent: null,
    depth: SEAT.depth,
    width: SEAT.width,
    rides: slide,
  });
  const footRotation = Quaternion.fromAxisAngle(v(1, 0, 0), PLATE.tilt);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    footRotation,
    v(0, 1, 0),
  );
  const along: IAutoMovieVector3 = Quaternion.rotateVector(
    footRotation,
    v(0, 0, -1),
  );
  for (const [side, sign] of [
    ["Left", -1],
    ["Right", 1],
  ] as const) {
    const name: `${AutoMovieArchetypeDoubleScull.Station}${typeof side}` = `${id}${side}`;
    const foot: IAutoMovieVector3 = v(sign * 0.067, -0.015, at - 0.47);
    builder.box(`${name}-footplate`, v(PLATE.width, 0.024, PLATE.depth), foot, {
      color: CARBON,
      rotation: footRotation,
    });
    builder.affordance({
      id: `${name}Foot`,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.add(foot, Vector3.scale(normal, 0.012)),
        normal,
        along,
      ),
      extent: null,
      width: PLATE.width,
      depth: PLATE.depth,
    });
    scull(builder, name, at - 0.035, sign, oarLength);
  }
}

/**
 * A scull's swivel, dip, shaft, blade and handle are attached to the same
 * oarlock pivot.
 */
function scull(
  builder: Build,
  name: `${AutoMovieArchetypeDoubleScull.Station}${AutoMovieArchetypeDoubleScull.Side}`,
  z: number,
  sign: number,
  length: number,
): void {
  const inboard: number = 0.88;
  const bladeLength: number = 0.44;
  const gripLength: number = 0.115;
  const bladeEnd: number = length - inboard;
  const pivot: IAutoMovieVector3 = v(
    sign * 0.795,
    SEAT.y + (sign < 0 ? 0.26 : 0.16),
    z,
  );
  const at = (distance: number): IAutoMovieVector3 =>
    Vector3.add(pivot, v(sign * distance, 0, 0));
  const along: IAutoMovieVector3 = v(sign, 0, 0);
  const up: IAutoMovieVector3 = v(0, 1, 0);
  const turn: AutoMovieArchetypeDoubleScull.Affordance = `${name}Sweep`;
  const dip: AutoMovieArchetypeDoubleScull.Affordance = `${name}Dip`;
  const grip: string = `${name}-grip`;
  const shaft: string = `${name}-shaft`;
  const blade: string = `${name}-blade`;
  builder.rod(`${name}-rigger`, 0.016, v(sign * 0.17, RIM, z + 0.24), pivot, {
    color: CARBON,
  });
  builder.rod(grip, 0.017, at(-inboard), at(-inboard + gripLength), {
    color: CARBON,
  });
  builder.rod(
    shaft,
    0.019,
    at(-inboard + gripLength),
    at(bladeEnd - bladeLength),
    {
      color: CARBON,
    },
  );
  builder.box(
    blade,
    v(bladeLength, 0.22, 0.012),
    at(bladeEnd - bladeLength / 2),
    {
      color: DECK,
    },
  );
  builder.affordance({
    id: turn,
    kind: "wheel",
    frame: AutoMovieArchetypeFrame.facing(pivot, v(0, -sign, 0), v(0, 0, 1)),
    extent: null,
    travel: 60,
  });
  builder.affordance({
    id: dip,
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(pivot, v(0, 0, sign), along),
    extent: null,
    travel: 15,
    reverse: 20,
    parts: [grip, shaft, blade],
    rides: turn,
  });
  builder.affordance({
    id: `${name}Handle`,
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      at(-inboard + gripLength / 2),
      up,
      Vector3.scale(along, -1),
    ),
    extent: null,
    grip: "power",
    aperture: 0.034,
    length: gripLength,
    rides: dip,
  });
  builder.affordance({
    id: `${name}BladeTip`,
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(at(bladeEnd), along, v(0, 0, 1)),
    extent: null,
    width: 0.012,
    depth: 0.22,
    rides: dip,
  });
}

type Build = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeDoubleScull.Affordance,
  AutoMovieArchetypeDoubleScull.Dimension
>;
