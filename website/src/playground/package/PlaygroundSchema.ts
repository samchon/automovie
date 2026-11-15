import { MotionSchemas } from "../../motions/package/MotionSchemas";
import type { IPlaygroundVocabulary } from "../structures/IPlaygroundVocabulary";

/**
 * The parameters of each lexicon row and each vocabulary action as the
 * editor's fields, read from the installed package's `HUMAN_LEXICON_SCHEMAS`
 * through `MotionSchemas`, the reader the motion reference uses too: a
 * member whose schema is a closed set becomes a choice, a number a number
 * with its bounds, a text a text, a boolean a switch, and anything
 * structured a JSON field.
 */
export namespace PlaygroundSchema {
  /**
   * Every row's fields, by row name.
   *
   * @returns The fields; empty when the installed package ships no row schemas.
   */
  export function rows(): Record<string, IPlaygroundVocabulary.IParameter[]> {
    return fields(MotionSchemas.rows());
  }

  /**
   * Every action's fields, by action name.
   *
   * @returns The fields; empty when the installed package ships no action schemas.
   */
  export function actions(): Record<
    string,
    IPlaygroundVocabulary.IParameter[]
  > {
    return fields(MotionSchemas.actions());
  }

  /** The fields of every name's members. */
  function fields(
    table: Record<string, MotionSchemas.IMember[]>,
  ): Record<string, IPlaygroundVocabulary.IParameter[]> {
    return Object.fromEntries(
      Object.entries(table).map(
        ([name, members]: [string, MotionSchemas.IMember[]]): [
          string,
          IPlaygroundVocabulary.IParameter[],
        ] => [name, members.map(field)],
      ),
    );
  }

  /** One member as a field. */
  function field(
    member: MotionSchemas.IMember,
  ): IPlaygroundVocabulary.IParameter {
    const s: MotionSchemas.ISchema = member.schema;
    const base: Pick<
      IPlaygroundVocabulary.IParameter,
      "name" | "required" | "description"
    > = {
      name: member.name,
      required: member.required,
      description: member.description,
    };
    const choices: string[] | null = closed(s);
    if (choices !== null) return { ...base, kind: "choice", values: choices };
    if (s.type === "number" || s.type === "integer")
      return {
        ...base,
        kind: "number",
        values: [],
        integer: s.type === "integer",
        ...(s.minimum === undefined ? {} : { minimum: s.minimum }),
        ...(s.maximum === undefined ? {} : { maximum: s.maximum }),
      };
    if (s.type === "string") return { ...base, kind: "text", values: [] };
    if (s.type === "boolean") return { ...base, kind: "switch", values: [] };
    return { ...base, kind: "json", values: [] };
  }

  /** The values of a closed set of strings, or null when the schema is not one. */
  function closed(s: MotionSchemas.ISchema): string[] | null {
    if (
      s.enum !== undefined &&
      s.enum.every((v: unknown): boolean => typeof v === "string")
    )
      return s.enum as string[];
    if (s.oneOf === undefined) return null;
    const values: unknown[] = s.oneOf.map(
      (option: MotionSchemas.ISchema): unknown =>
        MotionSchemas.resolve(option).const,
    );
    return values.every((v: unknown): boolean => typeof v === "string")
      ? (values as string[])
      : null;
  }
}
