import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

const SOURCE: string =
  "Wilderness Systems Pungo 120, 2014–15 catalogue: https://media.pelicaninternational.com/m/71514c2752446fc2/original/WS_14_15_Product_Catalog_Mobile_Version.pdf";
const PAINT: string = "#e67e28";
const POLYMER: string = "#353b40";
const v: typeof Vector3.create = Vector3.create;
const WALL: number = 0.012;
const FLOOR: number = -0.14;

/** The canonical producer and authoring contract for a kayak. */
export namespace AutoMovieArchetypeKayak {
  /**
   * A sit-inside kayak based on the published Pungo 120 envelope. The bow points
   * along +Z and Y = 0 is the reference waterline. The cockpit has an opening, a
   * low seat and separate tilted footbraces. The deck and floor share the same
   * hull section family. Wall thickness and the installed seat and brace geometry
   * are staging estimates.
   *
   * @param params Optional scene identity and fixed reference dimensions.
   * @param seed Provenance seed. The reference dimensions are fixed.
   * @returns One enclosed-deck hull with an open cockpit.
   */
  export function create(
    params: AutoMovieArchetypeKayak.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeKayak.Affordance,
    AutoMovieArchetypeKayak.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeKayak.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "kayak",
        AutoMovieArchetypeKayak.UNITS,
        seed,
        params,
      );
    const dimensions: Record<AutoMovieArchetypeKayak.Dimension, number> =
      draw.dimensions(AutoMovieArchetypeKayak.BANDS);
    const builder: Build = new AutoMovieArchetypeBuilder({
      material: "composite",
      name: "sit-inside kayak",
      id: params.id,
      draw,
    });
    hull(builder, dimensions);
    const seat: IAutoMovieVector3 = v(0, FLOOR + 0.094, -0.29);
    const seatDepth: number = 0.32;
    const seatWidth: number = 0.39;
    builder.box(
      "seat-pan",
      v(seatWidth, 0.058, seatDepth),
      { ...seat, y: seat.y - 0.029 },
      {
        color: POLYMER,
      },
    );
    builder.box(
      "seat-back",
      v(seatWidth * 0.84, 0.17, 0.064),
      v(0, seat.y + 0.062, seat.z - seatDepth * 0.48),
      { color: POLYMER, rotation: Quaternion.fromAxisAngle(v(1, 0, 0), -9) },
    );
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright({
        ...seat,
        z: seat.z + seatDepth / 2,
      }),
      extent: null,
      width: seatWidth,
      depth: seatDepth,
    });
    for (const [name, sign] of [
      ["leftFoot", 1],
      ["rightFoot", -1],
    ] as const)
      brace(builder, name, sign);
    return builder.build(dimensions.mass);
  }

  /* Fixed dimension sites and the three contact affordance names. */
  /** The pan and paired footbrace faces. */
  export type Affordance = "seat" | Brace;

  /** The two footbrace faces, one per foot. */
  export type Brace = "leftFoot" | "rightFoot";
  /** Overall and opening dimensions, and hull mass. */
  export type Dimension =
    | "length"
    | "beam"
    | "depth"
    | "cockpitLength"
    | "cockpitWidth"
    | "mass";
  /** A scene identifier and explicit fixed reference figures. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of the catalogue measures. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    beam: "m",
    depth: "m",
    cockpitLength: "m",
    cockpitWidth: "m",
    mass: "kg",
  };
  /** Published envelope, cockpit at the coaming and bare hull mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(3.66, 3.66, SOURCE),
    beam: AutoMovieArchetypeBand.metres(0.74, 0.74, SOURCE),
    depth: AutoMovieArchetypeBand.metres(0.33, 0.33, SOURCE),
    cockpitLength: AutoMovieArchetypeBand.metres(1.45, 1.45, SOURCE),
    cockpitWidth: AutoMovieArchetypeBand.metres(0.56, 0.56, SOURCE),
    mass: AutoMovieArchetypeBand.of("kg", 22, 22, SOURCE),
  };
}

/** One longitudinal family with an unobstructed cockpit inside its deck strips. */
function hull(
  builder: Build,
  d: Readonly<Record<AutoMovieArchetypeKayak.Dimension, number>>,
): void {
  const half: number = d.length / 2;
  const middle: number = d.cockpitLength / 2;
  const rim: number = FLOOR + d.depth;
  const aperture: number = d.cockpitWidth / 2;
  const stations: readonly {
    z: number;
    halfWidth: number;
    bottom: number;
    opening: number;
  }[] = [
    { z: -half, halfWidth: 0.008, bottom: rim - 0.06, opening: 0 },
    {
      z: -half * 0.7,
      halfWidth: d.beam * 0.31,
      bottom: FLOOR * 0.68,
      opening: 0,
    },
    { z: -middle, halfWidth: d.beam * 0.46, bottom: FLOOR, opening: 0 },
    {
      z: -middle * 0.78,
      halfWidth: d.beam / 2,
      bottom: FLOOR,
      opening: aperture,
    },
    {
      z: middle * 0.78,
      halfWidth: d.beam / 2,
      bottom: FLOOR,
      opening: aperture,
    },
    { z: middle, halfWidth: d.beam * 0.44, bottom: FLOOR, opening: 0 },
    {
      z: half * 0.7,
      halfWidth: d.beam * 0.26,
      bottom: FLOOR * 0.59,
      opening: 0,
    },
    { z: half, halfWidth: 0.008, bottom: rim - 0.05, opening: 0 },
  ];
  const ring = (
    s: (typeof stations)[number],
    inner: boolean,
  ): IAutoMovieVector3[] => {
    const w: number = s.halfWidth * (inner ? 0.93 : 1);
    const bottom: number = s.bottom + (inner ? WALL : 0);
    const chine: number = (s.bottom + rim) * 0.46 + (inner ? WALL : 0);
    return [
      v(-w * 0.94, rim, s.z),
      v(-w, chine, s.z),
      v(-w * 0.56, bottom, s.z),
      v(w * 0.56, bottom, s.z),
      v(w, chine, s.z),
      v(w * 0.94, rim, s.z),
    ];
  };
  const sections = stations.map((s) => ({
    ...s,
    outer: ring(s, false),
    inner: ring(s, true),
  }));
  for (let i: number = 0; i + 1 < sections.length; ++i) {
    const first = sections[i]!;
    const next = sections[i + 1]!;
    for (let j: number = 0; j < 5; ++j)
      builder.convex(
        `side-${i}-${j}`,
        [first, next].flatMap((s) => [
          s.outer[j]!,
          s.outer[j + 1]!,
          s.inner[j]!,
          s.inner[j + 1]!,
        ]),
        undefined,
        { color: PAINT },
      );
    for (const [index, sign] of [
      [0, -1],
      [5, 1],
    ] as const) {
      const corners: IAutoMovieVector3[] = [first, next].flatMap((s) => [
        s.outer[index]!,
        v(sign * s.opening, rim, s.z),
      ]);
      builder.convex(
        `deck-${i}-${index}`,
        corners.flatMap((point) => [point, { ...point, y: point.y - WALL }]),
        undefined,
        { color: PAINT },
      );
      if (first.opening !== 0 || next.opening !== 0)
        builder.rod(
          `coaming-${i}-${index}`,
          0.012,
          v(sign * first.opening, rim, first.z),
          v(sign * next.opening, rim, next.z),
          { color: POLYMER },
        );
    }
  }
}

/** Put an angled brace face and foot contact inside the coaming. */
function brace(
  builder: Build,
  id: AutoMovieArchetypeKayak.Brace,
  sign: number,
): void {
  const at: IAutoMovieVector3 = v(sign * 0.16, FLOOR + 0.125, 0.53);
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    v(1, 0, 0),
    -70,
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    rotation,
    v(0, 1, 0),
  );
  const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, v(0, 0, 1));
  builder.box(`${id}-plate`, v(0.105, 0.024, 0.21), at, {
    color: POLYMER,
    rotation,
  });
  builder.affordance({
    id,
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.add(at, Vector3.scale(normal, 0.012)),
      normal,
      toes,
    ),
    extent: null,
    width: 0.21,
    depth: 0.105,
  });
}

type Build = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeKayak.Affordance,
  AutoMovieArchetypeKayak.Dimension
>;
