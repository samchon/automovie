import { Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeRefusal,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { rideSeesawImplementation } from "./internal/rideSeesaw";

/** Construction sizes no source read gives, provisional. */
const ESTIMATE: string =
  "Coarse playground construction estimate; no source read gives it";

/** The beam's front end, at `+z`, or its rear end. */
type BeamEnd = 1 | -1;

/** A rider's hand, capitalised as it appears in a handle id. */
type HandSide = "Left" | "Right";

/**
 * Seat height above the beam's axis, metres (provisional construction
 * estimate).
 */
const SEAT: number = 0.08;

/**
 * A handle's distance inboard of its seat, metres (provisional construction
 * estimate).
 */
const HANDLE: number = 0.3;

/**
 * A handle's height above its seat, metres: above a seated rider's thighs, so
 * the forearms reach it clear of them (provisional construction estimate).
 */
const RISE: number = 0.45;

/** Constructs the seesaw archetype from its recipe. */
export namespace AutoMovieArchetypeSeesaw {
/**
 * A playground seesaw: a pivot post with a beam along `z` balanced on it, a
 * seat at each end and a handle inboard of each seat.
 *
 * The pivot axis runs along `x` at `y = pivot`, `z = 0`, above the ground at `y
 * = 0`. This model draws the fixed post. The beam with its seats and handles is
 * a separate rigid model, `createSeesaw.beam`, whose origin is the pivot, so a
 * rotation of its frame about the pivot axis rocks it
 * (`AutoMovieArchetypeSeesaw.ride`).
 *
 * @param params Fixed dimensions.
 * @param seed The seed for any unfixed dimension.
 * @returns The seesaw's post.
 * @throws {AutoMovieArchetypeRefusal} For a dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeSeesaw.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSeesaw.Affordance, AutoMovieArchetypeSeesaw.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSeesaw.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "seesaw",
      AutoMovieArchetypeSeesaw.UNITS,
      seed,
      params,
    );
  const { pivot, length, mass }: Record<AutoMovieArchetypeSeesaw.Dimension, number> =
    draw.dimensions(AutoMovieArchetypeSeesaw.BANDS);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSeesaw.Affordance,
    AutoMovieArchetypeSeesaw.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "seesaw",
    material: "steel",
    draw,
  });
  builder.box(
    "post",
    Vector3.create(0.2, pivot, 0.2),
    Vector3.create(0, pivot / 2, 0),
    { color: "#c1121f" },
  );
  builder.affordance({
    id: "ground",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: 1,
    depth: length,
  });
  return builder.build(mass);
}
}

/** The seesaw's dimensions and its rocking beam. */
export namespace AutoMovieArchetypeSeesaw {
  /** The ground around the seesaw. */
  export type Affordance = "ground";

  /** Pivot height and beam length in metres, and post mass in kilograms. */
  export type Dimension = "pivot" | "length" | "mass";

  /** Each end's seat and handle on the beam. */
  export type BeamAffordance =
    | "frontSeat"
    | "rearSeat"
    | "frontLeftHandle"
    | "frontRightHandle"
    | "rearLeftHandle"
    | "rearRightHandle";

  /** The beam's length in metres and mass in kilograms. */
  export type BeamDimension = "length" | "mass";

  /** The dimensions the author fixes inside their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The scene's model identifier, `seesaw` when omitted. */
    id?: string;
  }

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    pivot: "m",
    length: "m",
    mass: "kg",
  };

  /** The dimensions' bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    pivot: AutoMovieArchetypeBand.metres(0.45, 0.65, ESTIMATE, true),
    length: AutoMovieArchetypeBand.metres(2.8, 3.8, ESTIMATE, true),
    mass: AutoMovieArchetypeBand.of("kg", 20, 60, ESTIMATE, true),
  };

  /**
   * The beam with its seats and handles as one rigid model whose origin is the
   * pivot: the front seat at `+z`, the rear seat at `-z`, each rider facing the
   * pivot with a handle inboard of the seat.
   *
   * @param seesaw The seesaw whose beam this is.
   * @returns The beam model.
   */
  export function beam(
    seesaw: Pick<AutoMovieArchetype<Affordance, Dimension>, "dimensions">,
  ): AutoMovieArchetype<BeamAffordance, BeamDimension> {
    const length: number = seesaw.dimensions.length!;
    const draw: AutoMovieArchetypeDrawSession<BeamDimension> =
      new AutoMovieArchetypeDrawSession(
        "seesawBeam",
        { length: "m", mass: "kg" },
        undefined,
        {},
      );
    draw.derive("length", length);
    // 12 kg a metre of steel beam: a provisional construction estimate.
    const mass: number = draw.derive("mass", 12 * length);
    const builder: AutoMovieArchetypeBuilder<BeamAffordance, BeamDimension> =
      new AutoMovieArchetypeBuilder({
        name: "seesaw beam",
        material: "steel",
        draw,
      });
    builder.box(
      "beam",
      Vector3.create(0.12, 0.08, length),
      Vector3.create(0, 0, 0),
      { color: "#ffb703" },
    );
    for (const end of [1, -1] as const) {
      const name: string = end > 0 ? "front" : "rear";
      const seatZ: number = end * (length / 2 - 0.15);

      // Each rider faces the pivot: +Z of the seat frame points to -end,
      // so its +X, the frame's line, runs along -end in x.
      builder.affordance({
        id: end > 0 ? "frontSeat" : "rearSeat",
        kind: "seat",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.create(0, SEAT, seatZ - end * 0.15),
          Vector3.create(0, 1, 0),
          Vector3.create(-end, 0, 0),
        ),
        extent: null,
        width: 0.3,
        depth: 0.3,
      });
      const handleZ: number = seatZ - end * HANDLE;
      builder.rod(
        `${name}HandleBar`,
        0.015,
        Vector3.create(-0.15, SEAT + RISE, handleZ),
        Vector3.create(0.15, SEAT + RISE, handleZ),
        { color: "#333333" },
      );
      for (const hand of ["Left", "Right"] as const) {
        // The rider's left lies along -end in x.
        const x: number = (hand === "Left" ? -end : end) * 0.12;
        builder.affordance({
          id: handleId(end, hand),
          kind: "handle",
          symmetry: "round",
          grip: "power",
          frame: AutoMovieArchetypeFrame.facing(
            Vector3.create(x, SEAT + RISE, handleZ),
            Vector3.create(0, 0, end),
            Vector3.create(1, 0, 0),
          ),
          extent: null,
          length: 0.1,
          aperture: 0.03,
        });
      }
    }
    return builder.build(mass);
  }
}

/** The handle id at one end of the beam for one of its rider's hands. */
function handleId(end: BeamEnd, hand: HandSide): AutoMovieArchetypeSeesaw.BeamAffordance {
  if (end > 0) return hand === "Left" ? "frontLeftHandle" : "frontRightHandle";
  return hand === "Left" ? "rearLeftHandle" : "rearRightHandle";
}
/** The seesaw's ride and its parameters and readers. */
export namespace AutoMovieArchetypeSeesaw {
  /**
   * A seesaw rocked by its riders' push-offs on the ride's clock: the beam model
   * (`createSeesaw.beam`) turns about the pivot axis, positive lowering the front
   * end at `+z`.
   *
   * The beam is held level while the riders sit, then let go at settle: its front
   * end drops to the ground, the rest angle whose sine is the pivot height over
   * half the beam. Each push-off is a rider's legs driving the low end up: the
   * beam turns from that limit to the other one over `swing` seconds on a
   * minimum-jerk profile, so it leaves and reaches each end at rest.
   *
   * @param seesaw The installed seesaw post.
   * @param placement Its world placement.
   * @param ride The push-off seconds and each rock's duration.
   * @returns The beam's angle, its frame and the low end at each ride second.
   * @throws {AutoMovieArchetypeRefusal} For push-offs out of order, or closer
   *   than one rock.
   */
  export function ride(
    seesaw: AutoMovieArchetype<
      AutoMovieArchetypeSeesaw.Affordance,
      AutoMovieArchetypeSeesaw.Dimension
    >,
    placement: IAutoMovieTransform,
    ride: AutoMovieArchetypeSeesaw.IRideParams,
  ): AutoMovieArchetypeSeesaw.IRideResult {
    return rideSeesawImplementation(seesaw, placement, ride);
  }

  /** When the riders push off and how long a rock takes. */
  export interface IRideParams {
    /**
     * The ride second the beam, held level while the riders sit, is let go; its
     * front end then drops to the ground over one rock.
     */
    settle: number;

    /**
     * Ride seconds of each push-off, ascending, each at least one rock after
     * the previous one or the release; the first raises the front end.
     */
    pushes: readonly number[];

    /** Seconds a rock from one end to the other takes. */
    swing: number;
  }

  /** One rocking seesaw's readers. */
  export interface IRideResult {
    /** The beam's angle with an end on the ground, degrees. */
    limit: number;

    /**
     * The beam's angle at a ride second, degrees, positive with the front end
     * down.
     *
     * @param seconds Ride seconds.
     * @returns The angle.
     */
    angle(seconds: number): number;

    /**
     * The beam model's world frame at a ride second.
     *
     * @param seconds Ride seconds.
     * @returns The frame.
     */
    beam(seconds: number): IAutoMovieTransform;
  }
}
