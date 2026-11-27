import { Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieTransform } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeRefusal,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import { rideMovingWalkwayImplementation } from "./internal/rideMovingWalkway";

/** The planning guide read for every autowalk figure below. */
const KONE: string =
  "KONE Planning Guide for Escalators & Autowalks, sections 5.3, 5.4, 5.8 and 5.12 (https://www.kone.co.uk/Images/Escalator%20planning%20guide%20GBIR_tcm45-86614.pdf)";

/** Construction sizes the guide does not give, provisional. */
const ESTIMATE: string =
  "Coarse film-set construction estimate; no source read gives it";

/**
 * Thickness drawn for landing plates and the pallet band, metres (provisional
 * construction estimate).
 */
const PLATE: number = 0.05;

/**
 * Depth of each fixed landing plate drawn beyond a comb, metres (provisional
 * construction estimate).
 */
const LANDING: number = 1;
/** Creates a deterministic moving walkway fixture and exposes its construction parameters. */
export namespace AutoMovieArchetypeMovingWalkway {
  /**
   * A horizontal moving walkway (autowalk): a level pallet band between two
   * combs, flush with the landings at `y = 0`.
   *
   * The entry comb lies across `x` at `z = 0` and the band runs toward `+Z` to
   * the exit comb at `z = length`. The model draws the fixed structure: the
   * landing plates, the band's coarse top surface and the two handrails. The
   * moving pallet band is a separate rigid model, `AutoMovieArchetypeMovingWalkway.belt`,
   * carried along `+Z` or `-Z` by the ride (`AutoMovieArchetypeMovingWalkway.ride`).
   *
   * @param params Fixed dimensions.
   * @param seed The seed for any unfixed dimension.
   * @returns The walkway with its landing, band and handrail contacts.
   * @throws {AutoMovieArchetypeRefusal} For a dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeMovingWalkway.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeMovingWalkway.Affordance,
    AutoMovieArchetypeMovingWalkway.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMovingWalkway.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "movingWalkway",
        AutoMovieArchetypeMovingWalkway.UNITS,
        seed,
        params,
      );
    const {
      length,
      width,
      handrail,
      mass,
    }: Record<AutoMovieArchetypeMovingWalkway.Dimension, number> =
      draw.dimensions(AutoMovieArchetypeMovingWalkway.BANDS);
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeMovingWalkway.Affordance,
      AutoMovieArchetypeMovingWalkway.Dimension
    > = new AutoMovieArchetypeBuilder({
      id: params.id,
      name: "moving walkway",
      material: "steel",
      draw,
    });
    const rail: number =
      width / 2 + AutoMovieArchetypeMovingWalkway.RAIL_OFFSET;
    builder.box(
      "entryLanding",
      Vector3.create(2 * rail, PLATE, LANDING),
      Vector3.create(0, -PLATE / 2, -LANDING / 2),
      { color: "#8a8f96" },
    );
    builder.box(
      "exitLanding",
      Vector3.create(2 * rail, PLATE, LANDING),
      Vector3.create(0, -PLATE / 2, length + LANDING / 2),
      { color: "#8a8f96" },
    );
    builder.box(
      "band",
      Vector3.create(width, PLATE, length),
      Vector3.create(0, -PLATE / 2, length / 2),
      { color: "#4b5058" },
    );
    for (const side of [-1, 1] as const)
      builder.rod(
        side < 0 ? "rightRail" : "leftRail",
        0.04,
        Vector3.create(side * rail, handrail, 0),
        Vector3.create(side * rail, handrail, length),
        { color: "#111111" },
      );

    builder.affordance({
      id: "entryLanding",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, 0, -LANDING / 2),
      ),
      extent: null,
      width,
      depth: LANDING,
    });
    builder.affordance({
      id: "exitLanding",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, 0, length + LANDING / 2),
      ),
      extent: null,
      width,
      depth: LANDING,
    });
    builder.affordance({
      id: "band",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, length / 2)),
      extent: null,
      width,
      depth: length,
    });
    for (const side of [-1, 1] as const)
      builder.affordance({
        id: side < 0 ? "rightHandrail" : "leftHandrail",
        kind: "handle",
        symmetry: "round",
        grip: "power",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.create(side * rail, handrail, length / 2),
          Vector3.create(0, 1, 0),
          Vector3.create(0, 0, 1),
        ),
        extent: null,
        length,
        aperture: 0.08,
      });
    return builder.build(mass);
  }
}

/** The walkway's dimensions and its moving pallet band. */
export namespace AutoMovieArchetypeMovingWalkway {
  /**
   * The two fixed landings, the moving band's resting surface and the two
   * handrails.
   */
  export type Affordance =
    | "entryLanding"
    | "exitLanding"
    | "band"
    | "leftHandrail"
    | "rightHandrail";

  /**
   * Length and pallet width and handrail height in metres, and mass in
   * kilograms.
   */
  export type Dimension = "length" | "width" | "handrail" | "mass";

  /** The moving band's width and length in metres and mass in kilograms. */
  export type BeltDimension = "width" | "length" | "mass";

  /** The dimensions the author fixes inside their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The scene's model identifier, `movingWalkway` when omitted. */
    id?: string;
  }

  /**
   * Lateral distance from the pallet edge to each handrail centre, metres
   * (provisional construction estimate).
   */
  export const RAIL_OFFSET: number = 0.1;

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    handrail: "m",
    mass: "kg",
  };

  /** The dimensions' bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      10,
      250,
      `${KONE}, 5.8 horizontal autowalk lengths`,
    ),
    width: AutoMovieArchetypeBand.metres(
      1,
      1.4,
      `${KONE}, 5.3 horizontal autowalk pallet widths`,
    ),
    handrail: AutoMovieArchetypeBand.metres(
      0.9,
      1.1,
      `${KONE}, 5.12 balustrade heights`,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 3000, 30000, ESTIMATE, true),
  };

  /**
   * The moving pallet band as its own rigid model, the size of the walkway's
   * band, whose `band` surface lies at the same local point as the walkway's,
   * so at rest the two coincide.
   *
   * @param walkway The walkway whose band this is.
   * @returns The band model.
   */
  export function belt(
    walkway: Pick<AutoMovieArchetype<Affordance, Dimension>, "dimensions">,
  ): AutoMovieArchetype<"band", BeltDimension> {
    const length: number = walkway.dimensions.length!;
    const width: number = walkway.dimensions.width!;
    const draw: AutoMovieArchetypeDrawSession<BeltDimension> =
      new AutoMovieArchetypeDrawSession(
        "walkwayBelt",
        { width: "m", length: "m", mass: "kg" },
        undefined,
        {},
      );
    draw.derive("width", width);
    draw.derive("length", length);
    // 40 kg a metre of band: a provisional construction estimate.
    const mass: number = draw.derive("mass", 40 * length);
    const builder: AutoMovieArchetypeBuilder<"band", BeltDimension> =
      new AutoMovieArchetypeBuilder({
        name: "walkway belt",
        material: "aluminium",
        draw,
      });
    builder.box(
      "band",
      Vector3.create(width, PLATE, length),
      Vector3.create(0, -PLATE / 2, length / 2),
      { color: "#3a3f46" },
    );
    builder.affordance({
      id: "band",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, length / 2)),
      extent: null,
      width,
      depth: length,
    });
    return builder.build(mass);
  }
}

/** The moving walkway's ride and its contract. */
export namespace AutoMovieArchetypeMovingWalkway {
  /**
   * A moving walkway's band running at a constant speed, read on the ride's
   * clock: at second 0 the band model (`AutoMovieArchetypeMovingWalkway.belt`) lies on the
   * walkway. The band translates along the walkway's `+Z` running `forward`, or
   * `-Z` running `backward`, and each handrail moves with it.
   *
   * @param walkway The installed walkway.
   * @param placement Its world placement.
   * @param ride The band speed and running direction.
   * @returns The band and handrail frames on the ride's clock.
   * @throws {AutoMovieArchetypeRefusal} For a speed that is not positive or
   *   exceeds EN 115-1's 0.75 m/s.
   */
  export function ride(
    walkway: AutoMovieArchetype<
      AutoMovieArchetypeMovingWalkway.Affordance,
      AutoMovieArchetypeMovingWalkway.Dimension
    >,
    placement: IAutoMovieTransform,
    ride: AutoMovieArchetypeMovingWalkway.IRideParams,
  ): AutoMovieArchetypeMovingWalkway.IRideResult {
    return rideMovingWalkwayImplementation(
      walkway,
      placement,
      ride,
      AutoMovieArchetypeMovingWalkway.RAIL_OFFSET,
    );
  }

  /** The band's running direction along the walkway's axis. */
  export type RideDirection = "forward" | "backward";
  /** How the band runs. */
  export interface IRideParams {
    /** Band speed, m/s, in (0, 0.75]. */
    speed: number;
    /** `forward` runs toward the exit comb at `+Z`; `forward` when absent. */
    direction?: RideDirection;
  }
  /** One running walkway's readers. */
  export interface IRideResult {
    /** The band's signed velocity along the walkway's `+Z`, m/s. */
    velocity: number;
    /**
     * The band model's world frame at a ride second.
     *
     * @param seconds Ride seconds.
     * @returns The frame.
     */
    belt(seconds: number): IAutoMovieTransform;
    /**
     * The handrail point that is `at` metres along the walkway at second 0.
     *
     * @param side The handrail's side, facing `+Z`.
     * @param at Metres from the entry comb at second 0.
     * @param seconds Ride seconds.
     * @returns The handrail point in the world.
     */
    handrail(
      side: AutoMovieHumanSide,
      at: number,
      seconds: number,
    ): IAutoMovieTransform;
  }
}
