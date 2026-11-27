import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The serving vessels' dimensions, in metres and kilograms. */
type Dimension = "height" | "diameter" | "mass";

/** The contact sites shared by the serving vessels. */
type Affordance = "mouth" | "lip" | "handle";

/** One wall outline at each side of the ceramic thickness. */
interface ISection {
  inner: IAutoMovieVector3[];
  outer: IAutoMovieVector3[];
}

/**
 * A dishware-scale porcelain cup and a larger stoneware jug, without their
 * decoration or proprietary profiles.
 */
const CUP: string =
  "BHS tabletop SMART stackable 0.19 L (82 mm, 55 mm, 165 g, https://www.bhs-tabletop.com/en-en/product/smart-cup-stackable-000675511811000000/) and SMART coffee cup 0.18 L (90 mm, 55 mm, 180 g, https://www.bhs-tabletop.com/de-int/produkt/smart-obertasse-000675528511000000-sku-000675526811000000/)";
/**
 * Two tabletop serving jugs of comparable capacity bracket empty mass and
 * height.
 */
const JUG: string =
  "La Poterie de Taizé Cruche 08 (170 mm, 110 mm, 680 g, https://www.lapoteriedetaize.com/en/products/wasserkrug-cruche-08-1-l) and Form & Refine Alcoa Pitcher (210 mm, 110 mm, 900 g, https://formandrefine.com/product/alcoa-pitcher-1l/)";
/** The units written into each archetype's provenance. */
const UNITS: Readonly<Record<Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
  height: "m",
  diameter: "m",
  mass: "kg",
};
/** The size and empty mass of each vessel, bracketed by the cited makers. */
const BANDS: Readonly<
  Record<
    AutoMovieArchetypePourVessel.Kind,
    Readonly<Record<Dimension, IAutoMovieArchetypeBand>>
  >
> = {
  cup: {
    height: AutoMovieArchetypeBand.metres(0.055, 0.055, CUP),
    diameter: AutoMovieArchetypeBand.metres(0.082, 0.09, CUP),
    mass: AutoMovieArchetypeBand.of("kg", 0.165, 0.18, CUP),
  },
  pitcher: {
    height: AutoMovieArchetypeBand.metres(0.17, 0.21, JUG),
    diameter: AutoMovieArchetypeBand.metres(0.11, 0.11, JUG),
    mass: AutoMovieArchetypeBand.of("kg", 0.68, 0.9, JUG),
  },
};

/**
 * Sixteen facets preserve a readable round rim and provide vertices on the
 * contact axes.
 */
const SIDES: number = 16;

/** Constructs the pour vessel archetype from its recipe. */
export namespace AutoMovieArchetypePourVessel {
/**
 * Build a rigid, empty ceramic serving cup or pouring pitcher. Both stand at
 * the base centre with +Y up and a loop handle on the -Z side. The upward
 * `mouth` socket lies at the centre of the open rim. The cup's `lip` is on the
 * +Z inner rim, and the pitcher's is on its +Z projecting spout.
 *
 * The pitcher uses a tapered open body with a spout opposite its handle, a
 * layout documented on Chesapeake Pottery's tankard pitcher at The Met
 * (https://www.metmuseum.org/art/collection/search/768777). The original stage
 * profile uses the dimensions bracketed by CUP and JUG and modelled wall, floor
 * and loop thicknesses. The motion author supplies liquid separately.
 *
 * @param params Vessel kind, scene id and any fixed dimensions.
 * @param seed Draws remaining dimensions. Omit it to use the band midpoints.
 * @returns The model and its three rigid contact sites.
 * @throws {AutoMovieArchetypeRefusal} For an unknown kind or out-of-band fixed
 *   dimension.
 */
export function create(
  params: AutoMovieArchetypePourVessel.IParams,
  seed?: number,
): AutoMovieArchetype<Affordance, Dimension> {
  const kind: AutoMovieArchetypePourVessel.Kind = ArchetypeDraw.choice(
    "pourVessel",
    "kind",
    params.kind,
    AutoMovieArchetypePourVessel.KINDS,
  );
  const draw: AutoMovieArchetypeDrawSession<Dimension> =
    new AutoMovieArchetypeDrawSession("pourVessel", UNITS, seed, params);
  const { height, diameter, mass }: Record<Dimension, number> = draw.dimensions(
    BANDS[kind],
  );
  const pitcher: boolean = kind === "pitcher";
  const builder: AutoMovieArchetypeBuilder<Affordance, Dimension> =
    new AutoMovieArchetypeBuilder({
      material: "ceramic",
      id: params.id,
      name: pitcher ? "pouring pitcher" : "serving cup",
      draw,
    });

  // The same lower outline makes the floor perimeter and the join with the wall.
  const radius: number = diameter / 2;
  const baseRadius: number = radius * 0.9;
  const wall: number = pitcher ? 0.006 : 0.0045;
  const floorHeight: number = pitcher ? 0.009 : 0.005;
  const base: ISection = section(baseRadius, wall, floorHeight, 0);
  const rim: ISection = section(
    radius,
    wall,
    height,
    pitcher ? radius * 0.32 : 0,
  );
  const origin: IAutoMovieVector3 = Vector3.create(0, 0, 0);
  const color: string = pitcher ? "#7ca396" : "#ece2c9";
  builder.convex(
    "floor",
    [
      ...base.outer,
      ...base.outer.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 => ({
          ...point,
          y: 0,
        }),
      ),
    ],
    origin,
    { color },
  );
  for (let i: number = 0; i < SIDES; ++i) {
    const next: number = (i + 1) % SIDES;
    builder.convex(
      `wall-${i}`,
      [
        base.outer[i]!,
        base.outer[next]!,
        base.inner[i]!,
        base.inner[next]!,
        rim.outer[i]!,
        rim.outer[next]!,
        rim.inner[i]!,
        rim.inner[next]!,
      ],
      origin,
      { color },
    );
  }

  // Mount each stub part way into its wall and keep the inner clearance open.
  const bar: number = pitcher ? 0.006 : 0.004;
  const loop: number = pitcher ? 0.066 : 0.034;
  const opening: number = pitcher ? 0.03 : 0.026;
  const center: number = height / 2;
  const low: number = center - loop / 2 - bar;
  const high: number = center + loop / 2 + bar;
  const reach: number = radius + opening + bar;
  for (const mount of [
    { id: "low", height: low },
    { id: "high", height: high },
  ]) {
    const rear: number =
      baseRadius +
      ((radius - baseRadius) * (mount.height - floorHeight)) /
        (height - floorHeight);
    builder.rod(
      `handle-${mount.id}`,
      bar,
      Vector3.create(0, mount.height, -rear + wall / 2),
      Vector3.create(0, mount.height, -reach),
      { color },
    );
  }
  builder.rod(
    "handle",
    bar,
    Vector3.create(0, low, -reach),
    Vector3.create(0, high, -reach),
    { color, round: true },
  );
  builder.affordance({
    id: "handle",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, center, -reach),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "hook",
    aperture: 2 * bar,
    length: loop,
  });
  builder.affordance({
    id: "mouth",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
  });
  builder.affordance({
    id: "lip",
    kind: "ledge",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(
      (pitcher ? rim.outer : rim.inner)[0]!,
    ),
    extent: null,
  });
  return builder.build(mass);
}

  /* Authoring types for the two rigid serving vessels. */
  /**
   * The serving vessel variants admitted by the factory and listed in the
   * catalogue.
   */
  export const KINDS = ["cup", "pitcher"] as const;

  /** The receiving cup or the pouring pitcher. */
  export type Kind = (typeof KINDS)[number];

  /** Select a serving vessel and optionally fix its size and empty mass. */
  export interface IParams {
    /** Which silhouette to construct. */
    kind: Kind;
    /** Unique scene id, defaulting to the producer's id. */
    id?: string;
    /** Vertical distance in metres from the base to the rim. */
    height?: number;
    /** Outside rim diameter in metres across X, excluding the spout. */
    diameter?: number;
    /** Empty vessel mass in kilograms. */
    mass?: number;
  }
}

/**
 * Generate a horizontal ceramic annulus with an optional projecting tip and two
 * spout shoulders at its front.
 */
function section(
  radius: number,
  wall: number,
  y: number,
  spout: number,
): ISection {
  const inner: IAutoMovieVector3[] = [];
  const outer: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < SIDES; ++i) {
    const angle: number = (2 * Math.PI * i) / SIDES;
    const x: number = Math.sin(angle);
    const z: number = Math.cos(angle);
    const extension: number =
      i === 0 ? spout : i === 1 || i === SIDES - 1 ? spout * 0.45 : 0;
    const reach: number = radius + extension;
    inner.push(Vector3.create(x * (reach - wall), y, z * (reach - wall)));
    outer.push(Vector3.create(x * reach, y, z * reach));
  }
  return { inner, outer };
}
