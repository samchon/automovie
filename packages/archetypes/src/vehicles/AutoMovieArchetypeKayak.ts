import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
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
import { AutoMovieArchetypeKayakData } from "./internal/AutoMovieArchetypeKayakData";


/** The canonical producer and authoring contract for a kayak. */
export namespace AutoMovieArchetypeKayak {
  /**
   * Build a sit-inside kayak with an open cockpit and fixed footbraces.
   *
   * The bow points along local `+Z` and the reference waterline is `Y = 0`.
   * The `seat` faces the bow. `leftFoot` is on `+X` and `rightFoot` on `-X`,
   * both tilted inside the cockpit. The dimensions follow the Pungo 120.
   * Wall thickness, seat installation, and brace geometry are staging estimates.
   *
   * @param params Optional scene ID and explicit reference figures, in
   *   metres or kilograms as listed in {@link UNITS}.
   * @param seed Optional seed for the factory. The dimension bands are fixed.
   * @returns The enclosed-deck hull, open cockpit, seat, and footbrace faces.
   * @throws {AutoMovieArchetypeRefusal} For a value other than the fixed figure.
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
    const seat: IAutoMovieVector3 = AutoMovieArchetypeKayakData.v(0, FLOOR + 0.094, -0.29);
    const seatDepth: number = 0.32;
    const seatWidth: number = 0.39;
    builder.box(
      "seat-pan",
      AutoMovieArchetypeKayakData.v(seatWidth, 0.058, seatDepth),
      { ...seat, y: seat.y - 0.029 },
      {
        color: POLYMER,
      },
    );
    builder.box(
      "seat-back",
      AutoMovieArchetypeKayakData.v(seatWidth * 0.84, 0.17, 0.064),
      AutoMovieArchetypeKayakData.v(0, seat.y + 0.062, seat.z - seatDepth * 0.48),
      { color: POLYMER, rotation: AutoMovieEngineQuaternion.fromAxisAngle(AutoMovieArchetypeKayakData.v(1, 0, 0), -9) },
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
  /**
   * The forward-facing seat and the two footbrace faces inside the cockpit.
   */
  export type Affordance = "seat" | Brace;

  /**
   * Foot contact faces. `leftFoot` is on local `+X` and `rightFoot` on `-X`.
   */
  export type Brace = "leftFoot" | "rightFoot";
  /**
   * Overall and cockpit dimensions in metres and bare hull mass in kilograms.
   */
  export type Dimension =
    | "length"
    | "beam"
    | "depth"
    | "cockpitLength"
    | "cockpitWidth"
    | "mass";
  /**
   * Optional scene ID and values equal to the fixed figures in {@link BANDS}.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * Scene subject ID. Defaults to `kayak`.
     */
    id?: string;
  }
  /**
   * Units of the fixed hull, cockpit and mass figures.
   */
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
  /**
   * Fixed Pungo 120 envelope, cockpit opening and bare hull mass.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(3.66, 3.66, AutoMovieArchetypeKayakData.SOURCE),
    beam: AutoMovieArchetypeBand.metres(0.74, 0.74, AutoMovieArchetypeKayakData.SOURCE),
    depth: AutoMovieArchetypeBand.metres(0.33, 0.33, AutoMovieArchetypeKayakData.SOURCE),
    cockpitLength: AutoMovieArchetypeBand.metres(1.45, 1.45, AutoMovieArchetypeKayakData.SOURCE),
    cockpitWidth: AutoMovieArchetypeBand.metres(0.56, 0.56, AutoMovieArchetypeKayakData.SOURCE),
    mass: AutoMovieArchetypeBand.of("kg", 22, 22, AutoMovieArchetypeKayakData.SOURCE),
  };
}

const PAINT: string = "#e67e28";
const POLYMER: string = "#353b40";
const WALL: number = 0.012;
const FLOOR: number = -0.14;

/*
 * One longitudinal family with an unobstructed cockpit inside its deck strips.
 */
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
      AutoMovieArchetypeKayakData.v(-w * 0.94, rim, s.z),
      AutoMovieArchetypeKayakData.v(-w, chine, s.z),
      AutoMovieArchetypeKayakData.v(-w * 0.56, bottom, s.z),
      AutoMovieArchetypeKayakData.v(w * 0.56, bottom, s.z),
      AutoMovieArchetypeKayakData.v(w, chine, s.z),
      AutoMovieArchetypeKayakData.v(w * 0.94, rim, s.z),
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
        AutoMovieArchetypeKayakData.v(sign * s.opening, rim, s.z),
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
          AutoMovieArchetypeKayakData.v(sign * first.opening, rim, first.z),
          AutoMovieArchetypeKayakData.v(sign * next.opening, rim, next.z),
          { color: POLYMER },
        );
    }
  }
}

/*
 * Put an angled brace face and foot contact inside the coaming.
 */
function brace(
  builder: Build,
  id: AutoMovieArchetypeKayak.Brace,
  sign: number,
): void {
  const at: IAutoMovieVector3 = AutoMovieArchetypeKayakData.v(sign * 0.16, FLOOR + 0.125, 0.53);
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    AutoMovieArchetypeKayakData.v(1, 0, 0),
    -70,
  );
  const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    rotation,
    AutoMovieArchetypeKayakData.v(0, 1, 0),
  );
  const toes: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, AutoMovieArchetypeKayakData.v(0, 0, 1));
  builder.box(`${id}-plate`, AutoMovieArchetypeKayakData.v(0.105, 0.024, 0.21), at, {
    color: POLYMER,
    rotation,
  });
  builder.affordance({
    id,
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.add(at, AutoMovieEngineVector3.scale(normal, 0.012)),
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
