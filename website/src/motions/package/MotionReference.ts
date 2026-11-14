import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS } from "@automovie/motions";

import type { IMotionReference } from "../structures/IMotionReference";
import { MotionSchemas } from "./MotionSchemas";

/**
 * The motion vocabulary as the reference pages list it, read from the
 * installed `@automovie/motions` while the site is exported: the actions of
 * `HUMAN_ACTIONS`, the lexicon's families and rows from `HUMAN_LEXICON`,
 * each action's and row's parameters from `HUMAN_LEXICON_SCHEMAS` through
 * `MotionSchemas`, and the grammar from `HUMAN_GRAMMAR`. A table the
 * installed release lacks is left empty, so a release that adds one fills
 * the pages with no change here.
 */
export namespace MotionReference {
  /** The package's exports by name, for the tables only some releases have. */
  const EXPORTS: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;

  /**
   * Everything the reference lists.
   *
   * @returns The reference.
   */
  export function read(): IMotionReference {
    const lexicon: unknown = EXPORTS["HUMAN_LEXICON"];
    const families: Record<string, { name: string }[]> =
      typeof lexicon === "object" && lexicon !== null
        ? (lexicon as Record<string, { name: string }[]>)
        : {};
    const rows: Record<string, MotionSchemas.IMember[]> = MotionSchemas.rows();
    const actions: Record<string, MotionSchemas.IMember[]> =
      MotionSchemas.actions();
    const grammar: unknown = EXPORTS["HUMAN_GRAMMAR"];

    // A name without a schema has no parameters to list, which is not the
    // same as a schema that lists none.
    const row: (
      name: string,
      table: Record<string, MotionSchemas.IMember[]>,
    ) => IMotionReference.IRow = (
      name: string,
      table: Record<string, MotionSchemas.IMember[]>,
    ): IMotionReference.IRow => ({
      name,
      parameters: Object.hasOwn(table, name)
        ? table[name]!.map(parameter)
        : null,
    });
    return {
      actions: Object.keys(HUMAN_ACTIONS).map(
        (name: string): IMotionReference.IRow => row(name, actions),
      ),
      families: Object.entries(families).map(
        ([name, members]: [
          string,
          { name: string }[],
        ]): IMotionReference.IFamily => ({
          name,
          rows: members.map(
            (member: { name: string }): IMotionReference.IRow =>
              row(member.name, rows),
          ),
        }),
      ),
      grammar:
        typeof grammar === "object" && grammar !== null
          ? (grammar as IMotionReference["grammar"])
          : null,
    };
  }

  /** One member as the reference lists it. */
  function parameter(
    member: MotionSchemas.IMember,
  ): IMotionReference.IParameter {
    return {
      name: member.name,
      required: member.required,
      type: describe(member.schema, 0),
      description: member.description,
    };
  }

  /** A short description of a schema's type: a set of values, a number's bounds, an object's members. */
  function describe(schema: MotionSchemas.ISchema, depth: number): string {
    const s: MotionSchemas.ISchema = MotionSchemas.resolve(schema);
    if (s.const !== undefined) return JSON.stringify(s.const);
    if (s.enum !== undefined)
      return s.enum.map((v: unknown): string => JSON.stringify(v)).join(" | ");
    if (s.oneOf !== undefined)
      return s.oneOf
        .map((option: MotionSchemas.ISchema): string =>
          describe(option, depth + 1),
        )
        .join(" | ");
    if (s.type === "number" || s.type === "integer") {
      const bounds: string =
        s.minimum !== undefined && s.maximum !== undefined
          ? ` ${s.minimum} to ${s.maximum}`
          : s.minimum !== undefined
            ? ` from ${s.minimum}`
            : s.maximum !== undefined
              ? ` up to ${s.maximum}`
              : "";
      return `${String(s.type)}${bounds}`;
    }
    if (s.type === "array")
      return `${s.items === undefined ? "unknown" : describe(s.items, depth + 1)}[]`;
    if (s.type === "object" && s.properties !== undefined) {
      if (depth >= 1) return "object";
      const kind: MotionSchemas.ISchema | undefined = s.properties["kind"];
      if (kind !== undefined)
        return `{ kind: ${describe(kind, depth + 1)}, … }`;
      return `{ ${Object.keys(s.properties).join(", ")} }`;
    }
    return typeof s.type === "string" ? s.type : "value";
  }
}
