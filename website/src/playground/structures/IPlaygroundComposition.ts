/**
 * A composition as the playground holds it: plain data that the editor
 * changes, the address carries and the adapter turns into a chain of
 * `@automovie/motions`.
 *
 * It names actions and parameters only. Bodies are named by the id of a body
 * the adapter offers, so an address stays short and never carries a
 * skeleton.
 */
export interface IPlaygroundComposition {
  /**
   * The format's version: 1 has people only, 2 adds `objects`.
   * `PlaygroundAddress` reads both and refuses any other.
   */
  version: 1 | 2;

  /** The seed every draw of the performance starts from. */
  seed: string;

  /** The people, who all perform at once. */
  performers: IPlaygroundComposition.IPerformer[];

  /** Actions several people do together, each after every chain above. */
  mutuals: IPlaygroundComposition.IMutual[];

  /** The archetypes placed in the scene, which actions name as props; none when absent. */
  objects?: IPlaygroundComposition.IObject[];
}
export namespace IPlaygroundComposition {
  /** One archetype placed on the floor. */
  export interface IObject {
    /** The prop's subject id, unique in the composition, by which actions name it. */
    subject: string;

    /** The producer's export name in `@automovie/archetypes`, such as `createSeat`. */
    producer: string;

    /** The producer's kind or frame, when it has variants. */
    kind?: string;

    /** The seed its free dimensions are drawn with; the middle of every band when absent. */
    seed?: string;

    /** Dimensions stated outright, by the producer's own names (such as `height`), each within its band; drawn from the seed when absent. */
    params?: Record<string, number>;

    /** Floor point, world metres: x to the left of a person facing +Z. */
    x: number;

    /** Floor point, world metres: z forward. */
    z: number;

    /** Height of its origin above the floor, metres, for an object resting on another, such as a mug on a table; on the floor when absent. */
    y?: number;

    /** Heading about +Y, degrees; ignored when `rotation` is given. */
    yaw: number;

    /** Its whole world rotation, a unit quaternion, for an object that does not stand upright, such as a sword lying on a table; a heading alone (`yaw`) when absent. */
    rotation?: IPlaygroundComposition.IQuaternion;

    /** The person and bone it is worn on at the start, such as a sword in its scabbard at the hip, until a hand draws it; resting where it is placed when absent. */
    worn?: IPlaygroundComposition.IWorn;
  }

  /** A rotation as a unit quaternion. */
  export interface IQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
  }

  /** Where an object is worn, as `IHumanProp.worn` takes it. */
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

    /** Where the action is cut, as `HumanChain.until` takes it; uncut when absent. */
    until?: Record<string, unknown>;

    /** The instant the action is timed to, as `HumanChain.sync` takes it; untimed when absent. */
    sync?: Record<string, unknown>;

    /** Actions performed over this one on other parts of the body; none when absent. */
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
