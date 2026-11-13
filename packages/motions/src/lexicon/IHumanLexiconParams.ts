import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HUMAN_LEXICON_FAMILIES } from "./HUMAN_LEXICON_FAMILIES";

/**
 * The parameters every row of the lexicon leaves open, by family and by the
 * row's export name in its namespace: what an author writes in
 * `registered(row, params)`, read from the row's own law type, so a page or
 * a generator reads the same parameters the checker does. A row's fixed
 * parameters are not among them. A row is registered under its law's
 * `name`, which a type cannot read, so a reader that wants rows by name
 * (`HUMAN_LEXICON_SCHEMAS`) pairs each export with its law at run time.
 *
 * It is derived from `HUMAN_LEXICON_FAMILIES`: each family namespace's
 * members that plan, keyed by their export name, each with the parameters
 * its `plan` takes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the type holds, where it is read from and what it leaves out.
 * @evidence contracts/development/design.md#principled-representation A mapped type over the family namespaces' own law types, merged into one record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One type, read by the schema generator and by authors who want a row's parameters by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row or parameter is restated: everything comes from the laws' types.
 */
export type IHumanLexiconParams = {
  [F in keyof typeof HUMAN_LEXICON_FAMILIES]: IHumanLexiconParams.Merged<
    IHumanLexiconParams.Rows<(typeof HUMAN_LEXICON_FAMILIES)[F][number]>
  >;
};

/**
 * Companion types of {@link IHumanLexiconParams}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each step of the derivation.
 * @evidence contracts/development/design.md#principled-representation Conditional and mapped types over law records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three steps the record is built from.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace IHumanLexiconParams {
  /** The parameters a law record plans with; never for any other member. */
  export type Of<Member> = Member extends {
    name: string;
    plan: (context: IHumanActionContext<infer P>) => unknown;
  }
    ? P
    : never;

  /** A namespace's laws by export name, each with its parameters. */
  export type Space<S> = {
    [K in keyof S as [Of<S[K]>] extends [never] ? never : K]: Of<S[K]>;
  };

  /** Each namespace of a union read as its own `Space`. */
  export type Rows<S> = S extends unknown ? Space<S> : never;

  /** A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object. */
  export type Merged<U> = {
    [K in U extends unknown ? keyof U : never]: U extends unknown
      ? K extends keyof U
        ? U[K]
        : never
      : never;
  };
}
