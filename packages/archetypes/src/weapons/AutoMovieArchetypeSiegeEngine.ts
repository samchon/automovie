import { AutoMovieArchetype } from "../core/index";
import { createSiegeEngine as createSiegeEngineImplementation } from "./internal/createSiegeEngine";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeTrack, AutoMovieArchetypeUnits } from "../core";
import { SIEGE_BANDS } from "./constants/SIEGE_BANDS";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { SiegeArm } from "./internal/SiegeArm";

/** Public operations for Auto Movie Archetype Siege Engine. */
export namespace AutoMovieArchetypeSiegeEngine {
  /**
   * A siege engine that throws a stone: a counterweight trebuchet, its arm swung
   * up by a box hanging from its short end, or a mangonel, a traction trebuchet
   * whose short end the crew hauls down, its pull taken as the weight that would
   * pull as hard.
   *
   * The engine stands on its base at the origin, its arm across its posts'
   * crossshaft, the long end toward `+Z` and level at rest. `arm` is the throwing
   * arm's hinge, a positive travel raising the long end; it is cocked by its
   * reverse, the long end down. The unsourced arm/cradle section is designed
   * together to clear model floor zero over every declared angle; fixed
   * base/control stock stays separate. A trebuchet's `counterweight` hangs from
   * the short end on a hinge that turns against the arm, so it stays plumb.
   * `pouch` is the inner floor of the real-section arm-tip cradle, joined to the
   * arm by two folded sling spans, with no independent sling swing. `pin` is the
   * real release rod, its cocked-tip drawbar and fixed guide/trestle. `winch` is
   * the cross-post windlass with its radial crank and axial grip, turning by its
   * ratio as the arm is wound. `frame` is the base the crew stands on. `throwAt`
   * uses the same source launch law and the current pouch origin. Solid composite
   * mass distribution under the drawn total is separate from that law's
   * provisional armMass/counterweight controls.
   *
   * @param params The kind and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, the middle of each band.
   * @returns The engine.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band or
   *   one the kind lacks.
   * @throws {RangeError} If no positive representable moving section or fitting
   *   clears its complete declared angular floor domain.
   */
  export function create(params: AutoMovieArchetypeSiegeEngine.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeSiegeEngine.Affordance,
  AutoMovieArchetypeSiegeEngine.Dimension
> {
    return createSiegeEngineImplementation(params, seed);
  }

  /** The kinds: a counterweight trebuchet and a mangonel, a traction trebuchet. */
  export type Kind = "trebuchet" | "mangonel";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["trebuchet", "mangonel"];

  /**
   * The affordance ids:
   *
   * - `arm`: the throwing arm's hinge on its axle, a positive travel raising the
   *   long end, its reverse cocking it down.
   * - `counterweight`: a trebuchet's hanging box on its pin at the short end,
   *   turning against the arm so it hangs plumb.
   * - `pouch`: where the stone sits at the long end, facing up; it rides the arm.
   * - `pin`: the release pin the crew pulls.
   * - `winch`: the windlass at the posts' foot, turning by its ratio as the arm
   *   is wound down.
   * - `frame`: the base the crew stands on.
   */
  export type Affordance =
    | "arm"
    | "counterweight"
    | "pouch"
    | "pin"
    | "winch"
    | "frame";

  /**
   * The dimensions, metres unless stated:
   *
   * - `armLength`: the arm's long end from the axle; `shortArm`: its short end.
   * - `armMass`, `counterweight`, `projectile`: the beam's, the hanging box's
   *   (or, for a mangonel, the weight that pulls as hard as its crew) and the
   *   stone's, kilograms.
   * - `axleHeight`: the axle above the ground; `frameWidth`: between the posts.
   * - `cocked`: how far the long end is drawn down from level, degrees; `reach`:
   *   how far it rises past level, derived: through its rest, straight up, and
   *   as far again; `release`: the arm's travel at which the stone leaves,
   *   degrees.
   * - `winchRadius`: the windlass's handles' radius; `winchRatio`: its turns per
   *   turn of the arm.
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
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

  /**
   * The parameters: the kind, and any dimension fixed to a value inside its
   * band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which engine. */
    kind: Kind;

    /** The model's id, unique in a scene; `siegeEngine` when absent. */
    id?: string;
  }

  /** The band of each dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = SIEGE_BANDS;

  /** A throw: the arm's swing and the stone's launch from the pouch. */
  export interface IThrow {
    /** The arm's track from the pin's second. */
    track: AutoMovieArchetypeTrack.ITrack<Affordance>;

    /** The film second the stone leaves. */
    second: number;

    /** The pouch's place in the engine's space when the stone leaves. */
    origin: IAutoMovieVector3;

    /**
     * The existing beam-tip tangential-speed approximation, metres per second,
     * square to the arm in its swing plane; it uses armLength and omits the
     * socket's section-radius offset and independent sling motion.
     */
    velocity: IAutoMovieVector3;
  }

  /**
   * The throw from a pin pulled at a second: the arm released from its cocked
   * travel swings under gravity as SiegeArm.pendulum gives it. The stone leaves
   * the section-sized pouch socket at its release travel with the existing
   * armLength-based tangential velocity approximation. The socket's
   * section-radius offset and independent sling motion do not enter that
   * reduced velocity law, whose armMass/counterweight controls are not a
   * calibration of the coarse composite's solid allocation.
   *
   * @param engine A siege engine.
   * @param start The film second the pin is pulled.
   * @returns The throw.
   * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetypeTrack.swing`
   *   refuses: a swing that leaves the arm's range, or a release it never
   *   passes.
   */
  export function throwAt(
    engine: AutoMovieArchetype<Affordance, Dimension>,
    start: number,
  ): IThrow {
    const d: Readonly<Partial<Record<Dimension, number>>> = engine.dimensions;
    const track: AutoMovieArchetypeTrack.ITrack<Affordance> =
      AutoMovieArchetypeTrack.swing(engine, "arm", {
        start,
        release: -d.cocked!,
        seconds: SWING,
        pendulum: SiegeArm.pendulum(d),
        launch: d.release!,
      });
    const launch: AutoMovieArchetypeTrack.ILaunch = track.launch!;
    const posed: AutoMovieArchetype<Affordance, Dimension> = engine.articulate({
      arm: launch.travel,
    });
    const pouch: IAutoMovieVector3 =
      posed.affordance("pouch").frame.translation;
    // The long end at travel a stands at (0, L sin a, L cos a) from the axle, so its velocity is the rate times (0, L cos a, -L sin a).
    const angle: number = launch.travel * AutoMovieArchetypeUnits.DEGREE;
    const rate: number =
      launch.rate * AutoMovieArchetypeUnits.DEGREE * d.armLength!;
    return {
      track,
      second: launch.seconds,
      origin: pouch,
      velocity: { x: 0, y: rate * Math.cos(angle), z: -rate * Math.sin(angle) },
    };
  }

  /**
   * How long a throw's swing is followed, seconds: long enough for any release;
   * a construction bound, no act reads it.
   */
  export const SWING: number = 10;}
