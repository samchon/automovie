import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeTrack,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { SIEGE_BANDS } from "./SIEGE_BANDS";
import { SiegeArm } from "./SiegeArm";

/**
 * A siege engine that throws a stone: a counterweight trebuchet, its arm swung up by a box hanging from its short end, or a mangonel, a traction trebuchet whose short end the crew hauls down, its pull taken as the weight that would pull as hard.
 *
 * The engine stands on its base at the origin, its arm across its posts' axle, the long end toward `+Z` and level at rest. `arm` is the throwing arm's hinge, a positive travel raising the long end; it is cocked by its reverse, the long end down. A trebuchet's `counterweight` hangs from the short end on a hinge that turns against the arm, so it stays plumb. `pouch` is where the stone sits, at the long end. `pin` is the release the crew pulls. `winch` is the windlass that hauls the arm down, turning by its ratio as the arm is wound. `frame` is the base the crew stands on. `throwAt` swings the arm from its cocked travel at the pin's second and launches the stone at the release travel.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, the middle of each band.
 * @returns The engine.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band or one the kind lacks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the engine stands, each contact and articulation, and what the throw does.
 * @evidence contracts/development/implementation.md#principled-implementation Draw the dimensions, then lay the frame and arm (`SiegeArm.lay`).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, lay, build.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No crew is built in: the crew are performers composed with its contacts.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One builder pass.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSiegeEngine(
  params: createSiegeEngine.IParams,
  seed?: number | string,
): Archetype<createSiegeEngine.Affordance, createSiegeEngine.Dimension> {
  const draw: ArchetypeDrawSession<createSiegeEngine.Dimension> = new ArchetypeDrawSession<createSiegeEngine.Dimension>(
    "siegeEngine",
    createSiegeEngine.UNITS,
    seed,
    params,
  );
  const kind: createSiegeEngine.Kind = ArchetypeDraw.choice("siegeEngine", "kind", params.kind, createSiegeEngine.KINDS);
  draw.dimensions(createSiegeEngine.BANDS[kind], createSiegeEngine.BANDS);
  // The arm's rise past level: released from its cocked travel it swings through its rest, the long end straight up, and as far again, energy being kept.
  draw.derive("reach", 2 * SiegeArm.REST + draw.values.cocked!);
  const d: Partial<Record<createSiegeEngine.Dimension, number>> = { ...draw.values };
  const builder: ArchetypeBuilder<createSiegeEngine.Affordance, createSiegeEngine.Dimension> = new ArchetypeBuilder({
    id: params.id,
    name: kind,
    draw,
  });
  SiegeArm.lay(builder, d, kind === "trebuchet");
  return builder.build(d.mass!);
}

/**
 * Companion types, bands and the throw of {@link createSiegeEngine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source or its estimate.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The arm, the counterweight, the pouch, the pin, the winch and the frame a crew's act reads (#3486, #3489), and the throw's track and launch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The throw is the arm's own swing under gravity, from the arm's read masses; nothing about it is scripted.
 */
export namespace createSiegeEngine {
  /** The kinds: a counterweight trebuchet and a mangonel, a traction trebuchet. */
  export type Kind = "trebuchet" | "mangonel";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["trebuchet", "mangonel"];

  /**
   * The affordance ids:
   *
   * - `arm`: the throwing arm's hinge on its axle, a positive travel raising the long end, its reverse cocking it down.
   * - `counterweight`: a trebuchet's hanging box on its pin at the short end, turning against the arm so it hangs plumb.
   * - `pouch`: where the stone sits at the long end, facing up; it rides the arm.
   * - `pin`: the release pin the crew pulls.
   * - `winch`: the windlass at the posts' foot, turning by its ratio as the arm is wound down.
   * - `frame`: the base the crew stands on.
   */
  export type Affordance = "arm" | "counterweight" | "pouch" | "pin" | "winch" | "frame";

  /**
   * The dimensions, metres unless stated:
   *
   * - `armLength`: the arm's long end from the axle; `shortArm`: its short end.
   * - `armMass`, `counterweight`, `projectile`: the beam's, the hanging box's (or, for a mangonel, the weight that pulls as hard as its crew) and the stone's, kilograms.
   * - `axleHeight`: the axle above the ground; `frameWidth`: between the posts.
   * - `cocked`: how far the long end is drawn down from level, degrees; `reach`: how far it rises past level, derived: through its rest, straight up, and as far again; `release`: the arm's travel at which the stone leaves, degrees.
   * - `winchRadius`: the windlass's handles' radius; `winchRatio`: its turns per turn of the arm.
   * - `mass`: the whole engine, kilograms.
   */
  export type Dimension =
    | "armLength"
    | "shortArm"
    | "armMass"
    | "counterweight"
    | "projectile"
    | "axleHeight"
    | "frameWidth"
    | "cocked"
    | "reach"
    | "release"
    | "winchRadius"
    | "winchRatio"
    | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    armLength: "m",
    shortArm: "m",
    armMass: "kg",
    counterweight: "kg",
    projectile: "kg",
    axleHeight: "m",
    frameWidth: "m",
    cocked: "degrees",
    reach: "degrees",
    release: "degrees",
    winchRadius: "m",
    winchRatio: "",
    mass: "kg",
  };

  /** The parameters: the kind, and any dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which engine. */
    kind: Kind;

    /** The model's id, unique in a scene; `siegeEngine` when absent. */
    id?: string;
  }

  /** The band of each dimension, by kind. */
  export const BANDS: Readonly<Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>> = SIEGE_BANDS;

  /** A throw: the arm's swing and the stone's launch from the pouch. */
  export interface IThrow {
    /** The arm's track from the pin's second. */
    track: ArchetypeTrack.ITrack<Affordance>;

    /** The film second the stone leaves. */
    second: number;

    /** The pouch's place in the engine's space when the stone leaves. */
    origin: IAutoMovieVector3;

    /** The stone's velocity then, metres per second: the pouch's, square to the arm in the plane of its swing. */
    velocity: IAutoMovieVector3;
  }

  /**
   * The throw from a pin pulled at a second: the arm released from its cocked travel swings under gravity as `SiegeArm.pendulum` gives it, and the stone leaves the pouch when the arm first passes its release travel, at the pouch's velocity then.
   *
   * @param engine A siege engine.
   * @param start The film second the pin is pulled.
   * @returns The throw.
   * @throws {ArchetypeRefusal} As `ArchetypeTrack.swing` refuses: a swing that leaves the arm's range, or a release it never passes.
   */
  export function throwAt(
    engine: Archetype<Affordance, Dimension>,
    start: number,
  ): IThrow {
    const d: Readonly<Partial<Record<Dimension, number>>> = engine.dimensions;
    const track: ArchetypeTrack.ITrack<Affordance> = ArchetypeTrack.swing(engine, "arm", {
      start,
      release: -d.cocked!,
      seconds: SWING,
      pendulum: SiegeArm.pendulum(d),
      launch: d.release!,
    });
    const launch: ArchetypeTrack.ILaunch = track.launch!;
    const posed: Archetype<Affordance, Dimension> = engine.articulate({ arm: launch.travel });
    const pouch: IAutoMovieVector3 = posed.affordance("pouch").frame.translation;
    // The long end at travel a stands at (0, L sin a, L cos a) from the axle, so its velocity is the rate times (0, L cos a, -L sin a).
    const angle: number = launch.travel * ArchetypeUnits.DEGREE;
    const rate: number = launch.rate * ArchetypeUnits.DEGREE * d.armLength!;
    return {
      track,
      second: launch.seconds,
      origin: pouch,
      velocity: { x: 0, y: rate * Math.cos(angle), z: -rate * Math.sin(angle) },
    };
  }

  /** How long a throw's swing is followed, seconds: long enough for any release; a construction bound, no act reads it. */
  export const SWING: number = 10;
}

