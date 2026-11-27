/**
 * The motion vocabulary as the reference pages list it: the actions and the
 * lexicon's families, and the grammar.
 */
export interface IMotionReference {
  /** The actions of `AutoMovieMotionHumanActions`, in the package's order. */
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

    /** The exported namespace a lexicon row is taken from, such as `HumanStrike`; null for an action, or a row no namespace exports. */
    namespace: string | null;
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
