import { AutoMovieMotionHumanActions, AutoMovieMotionHumanGrammar } from "@automovie/motions";
import { MotionInventory } from "./MotionInventory";

import type { IMotionReference } from "../structures/IMotionReference";

/**
 * The motion vocabulary as the reference pages list it, read from the
 * installed `@automovie/motions` while the site is exported: the actions of
 * `AutoMovieMotionHumanActions`, the lexicon's families and rows from `HUMAN_LEXICON`,
 * and the grammar from `AutoMovieMotionHumanGrammar`. A table the
 * installed release lacks is left empty, so a release that adds one fills
 * the pages with no change here.
 */
export namespace MotionReference {

  /**
   * Everything the reference lists.
   *
   * @returns The reference.
   */
  export function read(): IMotionReference {
    const lexicon: unknown = MotionInventory.lexicon();
    const families: Record<string, { name: string }[]> =
      typeof lexicon === "object" && lexicon !== null
        ? (lexicon as Record<string, { name: string }[]>)
        : {};
    const grammar: unknown = AutoMovieMotionHumanGrammar;

    // A row is the same law object its namespace exports, such as
    // `HumanStrike.jab`, so the first namespace holding it names it.
    const row = (name: string, law?: unknown): IMotionReference.IRow => ({
      name,
      namespace: law === undefined ? null : MotionInventory.namespace(law),
    });
    return {
      actions: Object.keys(AutoMovieMotionHumanActions).map(
        (name: string): IMotionReference.IRow => row(name),
      ),
      families: Object.entries(families).map(
        ([name, members]: [
          string,
          { name: string }[],
        ]): IMotionReference.IFamily => ({
          name,
          rows: members.map(
            (member: { name: string }): IMotionReference.IRow =>
              row(member.name, member),
          ),
        }),
      ),
      grammar:
        typeof grammar === "object" && grammar !== null
          ? (grammar as IMotionReference["grammar"])
          : null,
    };
  }
}
