import type { AutoMovieArchetypeCourse } from "@automovie/archetypes";
import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanImpulse,
} from "@automovie/interface";

/**
 * A composition as the playground holds it: plain data that the editor changes,
 * the address carries and the adapter turns into a chain of
 * `@automovie/motions`.
 *
 * It names actions, parameters and authored impulses. Bodies are named by the
 * id of a body the adapter offers, so an address stays short and never carries
 * a skeleton.
 */
export interface IPlaygroundComposition {
  /**
   * The format's version: 1 has people only, 2 adds `objects`, and 3 adds
   * authored impulses. `PlaygroundAddress` reads all three.
   */
  version: 1 | 2 | 3;

  /** The seed every draw of the performance starts from. */
  seed: string;

  /** The people, who all perform at once. */
  performers: IPlaygroundComposition.IPerformer[];

  /** Actions several people do together, each after every chain above. */
  mutuals: IPlaygroundComposition.IMutual[];

  /**
   * The archetypes placed in the scene, which actions name as props; none when
   * absent.
   */
  objects?: IPlaygroundComposition.IObject[];

  /**
   * Authored impulses in world newton seconds at film seconds, as the public
   * performance input takes them; none when absent. Only the serializable
   * impulse form is offered here, not a sustained force callback.
   */
  forces?: IAutoMovieMotionHumanImpulse[];

  /**
   * Named cue tracks an action syncs to or reads, such as a trumpet's `charge`;
   * none when absent. Each ridden animal also publishes its own gait changes as
   * the track `<subject>:gaits`.
   */
  cues?: Readonly<Record<string, readonly IPlaygroundComposition.ICue[]>>;
}
export namespace IPlaygroundComposition {
  /** One named instant of a cue track. */
  export interface ICue {
    /** The instant's name, by which an action addresses it. */
    name: string;

    /** Its film second. */
    seconds: number;
  }

  /** One archetype placed on the floor. */
  export interface IObject {
    /**
     * The prop's subject id, unique in the composition, by which actions name
     * it.
     */
    subject: string;

    /**
     * The producer's export name in `@automovie/archetypes`, such as
     * `createSeat`.
     */
    producer: string;

    /** The producer's kind, frame or format when it has variants. */
    kind?: string;

    /**
     * The seed its free dimensions are drawn with; the middle of every band
     * when absent.
     */
    seed?: number;

    /**
     * Dimensions stated outright, by the producer's own names (such as
     * `height`), each within its band, and named read models (such as a sword's
     * `model` or a scabbard's `blade`); drawn from the seed when absent.
     */
    params?: Record<string, number | string>;

    /** Floor point, world metres: x to the left of a person facing +Z. */
    x: number;

    /** Floor point, world metres: z forward. */
    z: number;

    /**
     * Height of its origin above the floor, metres, for an object resting on
     * another, such as a mug on a table; on the floor when absent.
     */
    y?: number;

    /** Heading about +Y, degrees; ignored when `rotation` is given. */
    yaw: number;

    /**
     * Its whole world rotation, a unit quaternion, for an object that does not
     * stand upright, such as a sword lying on a table; a heading alone (`yaw`)
     * when absent.
     */
    rotation?: IPlaygroundComposition.IQuaternion;

    /**
     * The person and bone it is worn on at the start, such as a sword in its
     * scabbard at the hip, until a hand draws it; resting where it is placed
     * when absent.
     */
    worn?: IPlaygroundComposition.IWorn;

    /**
     * Whether it is a fixture, such as a fixed ladder or a wall bar, which
     * hands grip and never carry (`IAutoMovieMotionHumanProp.fixed`); a free
     * object when absent.
     */
    fixed?: boolean;

    /** A native vehicle course starting at this placement. */
    course?: Omit<AutoMovieArchetypeCourse.ICourse, "start">;

    /** Native joint states named at film seconds, interpolated between keys. */
    joints?: Record<string, readonly IJointKey[]>;

    /** The performer whose opening aidWalk action moves this floor aid. */
    aidWalk?: IAidWalk;

    /**
     * The carrier this blade starts seated in, such as a sword in a worn
     * scabbard, as `HumanSheath.of` stages it; free when absent. A sheathed
     * object takes no `worn`.
     */
    sheath?: IPlaygroundComposition.ISheath;
  }

  /** The walker of a floor aid. */
  export interface IAidWalk {
    /** The performer's subject. */
    subject: string;
  }

  /** A film-time value in an articulation's own unit. */
  export interface IJointKey {
    /** Film seconds. */
    seconds: number;

    /** The articulation's travel, in its own unit. */
    value: number;
  }

  /**
   * A blade seated in a carrier object, as
   * `IAutoMovieMotionHumanSheath.IParams` takes it with the carrier's subject.
   */
  export interface ISheath {
    /** The carrier object's subject id. */
    carrier: string;

    /** The carrier's mouth socket id, such as `mouth`. */
    mouth: string;

    /** The blade's tip affordance id, such as `point`. */
    tip: string;

    /** The blade's handle affordance id, such as `grip`. */
    handle: string;

    /** How far the drawn tip clears the mouth, metres; positive. */
    clearance: number;
  }

  /** A rotation as a unit quaternion. */
  export interface IQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
  }

  /** Where an object is worn, as `IAutoMovieMotionHumanProp.worn` takes it. */
  export interface IWorn {
    /** The wearer's subject id. */
    subject: string;

    /** The bone it rides, such as `hips`. */
    bone: string;

    /** Its frame in the bone's posed frame: metres and a unit quaternion. */
    offset: {
      position: { x: number; y: number; z: number };
      rotation: IPlaygroundComposition.IQuaternion;
    };
  }

  /** One person and what they do, in order. */
  export interface IPerformer {
    /** The subject id, unique in the composition. */
    subject: string;

    /** The id of one of the adapter's bodies. */
    body: string;

    /** Starting floor point, world metres: x to the left of a person facing +Z. */
    x: number;

    /** Starting floor point, world metres: z forward. */
    z: number;

    /** Starting heading about +Y, degrees; 0 faces +Z. */
    yaw: number;

    /** Skill, which changes timing, path and balance. */
    proficiency: Proficiency;

    /** The person's actions, one after another. */
    actions: IAction[];
  }

  /** The skill levels a performer takes. */
  export type Proficiency = "novice" | "amateur" | "trained" | "elite";

  /** One action of a chain. */
  export interface IAction {
    /** The action's name in the vocabulary or the lexicon. */
    name: string;

    /** Its parameters, as the action's own parameter type spells them. */
    params: Record<string, unknown>;

    /** A stable id other actions sync to or cut on; none when absent. */
    anchor?: string;

    /**
     * Where the action is cut, as `AutoMovieMotionHumanChain.until` takes it; uncut when
     * absent. Saved legacy shapes are normalized when the address is read.
     */
    until?: IAutoMovieIntent.IUntil;

    /**
     * The instant the action is timed to, as `AutoMovieMotionHumanChain.sync` takes it;
     * untimed when absent.
     */
    sync?: Record<string, unknown>;

    /**
     * Actions performed over this one on other parts of the body; none when
     * absent.
     */
    over?: IAction[];
  }

  /** One mutual action and its cast. */
  export interface IMutual {
    /** The mutual action's name. */
    name: string;

    /** The subject cast in each role. */
    cast: Record<string, string>;

    /** The shared parameters. */
    params: Record<string, unknown>;
  }
}
