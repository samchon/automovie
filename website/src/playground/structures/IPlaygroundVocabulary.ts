/**
 * What an adapter offers the editor: every list a picker is generated from.
 *
 * The page writes none of these names itself. A new action, family, axis or
 * body appears in the page once the adapter lists it.
 */
export interface IPlaygroundVocabulary {
  /** The actions of the vocabulary, in the package's order. */
  actions: IPlaygroundVocabulary.IAction[];

  /** The lexicon's families of named rows; empty when the package ships no lexicon table. */
  lexicon: IPlaygroundVocabulary.IFamily[];

  /** The mutual actions; empty when the package ships none as data. */
  mutuals: IPlaygroundVocabulary.IMutual[];

  /** The grammar's axes and operators; null when the package ships no grammar table. */
  grammar: IPlaygroundVocabulary.IGrammar | null;

  /** The bodies a performer can take. */
  bodies: IPlaygroundVocabulary.IBody[];

  /** Which operators the adapter can build; the editor disables the others. */
  operators: IPlaygroundVocabulary.IOperators;

  /** The packages behind the adapter with their versions, for a report. */
  packages: Record<string, string>;
}
export namespace IPlaygroundVocabulary {
  /** One action. */
  export interface IAction {
    /** The name a chain appends it by. */
    name: string;

    /** Its parameters as a descriptor, or null while the package exports none; the editor then takes them as JSON. */
    parameters: IParameter[] | null;

    /** Whether it can be performed over a carrier; null when the package does not say. */
    overlay: boolean | null;
  }

  /** One parameter of an action. */
  export interface IParameter {
    /** The parameter's name. */
    name: string;

    /** Whether the action needs it. */
    required: boolean;

    /** The accepted values of a closed set, or null for a free value. */
    values: string[] | null;
  }

  /** One family of the lexicon. */
  export interface IFamily {
    /** The family's name. */
    name: string;

    /** The rows it holds, each appended by its name like an action. */
    rows: string[];
  }

  /** One mutual action. */
  export interface IMutual {
    /** Its name. */
    name: string;

    /** The roles it casts. */
    roles: string[];
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

    /** The export that carries it. */
    carriedBy: string;

    /** What it decides. */
    says: string;
  }

  /** One body. */
  export interface IBody {
    /** The id a performer names it by. */
    id: string;

    /** What the editor shows for it. */
    label: string;
  }

  /** The operators of a composition beyond a sequence of actions. */
  export interface IOperators {
    /** Cutting an action early. */
    until: boolean;

    /** Two things at once with one body. */
    over: boolean;

    /** Timing an action to another instant. */
    sync: boolean;

    /** Appending a row of the lexicon. */
    lexicon: boolean;

    /** An action several people do together. */
    mutual: boolean;
  }
}
