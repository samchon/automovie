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
  /** The format's version; `PlaygroundAddress` refuses any other. */
  version: 1;

  /** The seed every draw of the performance starts from. */
  seed: string;

  /** The people, who all perform at once. */
  performers: IPlaygroundComposition.IPerformer[];

  /** Actions several people do together, each after every chain above. */
  mutuals: IPlaygroundComposition.IMutual[];
}
export namespace IPlaygroundComposition {
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
