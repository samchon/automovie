/**
 * The motion vocabulary as the reference pages list it: the actions and the
 * lexicon's families, each action and row with its parameters, and the
 * grammar.
 */
export interface IMotionReference {
  /** The actions of `HUMAN_ACTIONS`, in the package's order, each with its parameters from the action's schema. */
  actions: IMotionReference.IRow[];

  /** The lexicon's families, in the package's order; empty when the release has no lexicon. */
  families: IMotionReference.IFamily[];

  /** The grammar's axes and operators; null when the release has no grammar table. */
  grammar: IMotionReference.IGrammar | null;
}
export namespace IMotionReference {
  /** One family of the lexicon. */
  export interface IFamily {
    /** Its name, such as `gait`. */
    name: string;

    /** Its rows. */
    rows: IRow[];
  }

  /** One action of the vocabulary or row of the lexicon. */
  export interface IRow {
    /** The name a chain appends it by. */
    name: string;

    /** Its parameters from its schema; null when the release ships no schema for it. */
    parameters: IParameter[] | null;
  }

  /** One parameter of an action or a row. */
  export interface IParameter {
    /** Its name. */
    name: string;

    /** Whether the action or row needs it. */
    required: boolean;

    /** Its type in short: a set of values, a number's bounds, an object's members. */
    type: string;

    /** What it means, from the law's own documentation. */
    description: string;
  }

  /** The grammar as data. */
  export interface IGrammar {
    /** The axes an action is decided on. */
    axes: IEntry[];

    /** The operators that join actions. */
    operators: IEntry[];
  }

  /** One axis or operator. */
  export interface IEntry {
    /** Its name. */
    name: string;

    /** The exports that carry it. */
    carriedBy: string;

    /** What it decides. */
    says: string;
  }
}
