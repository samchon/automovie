import * as motions from "@automovie/motions";
import type { ReactElement } from "react";

/** One axis or operator as `HUMAN_GRAMMAR` lists it. */
interface IEntry {
  /** Its name. */
  name: string;

  /** The exports that carry it. */
  carriedBy: string;

  /** What it decides. */
  says: string;
}

/**
 * The composition grammar's axes and operators, read from the installed
 * `@automovie/motions` at build time, so the table names the grammar as the
 * package does. A release without `HUMAN_GRAMMAR` gets a sentence instead.
 *
 * @returns The tables, or the sentence.
 */
export function GrammarTable(): ReactElement {
  const grammar: unknown = (motions as Readonly<Record<string, unknown>>)[
    "HUMAN_GRAMMAR"
  ];
  if (typeof grammar !== "object" || grammar === null)
    return (
      <p>
        The installed release composes a sequence of actions per person, people
        in parallel, and a cut with <code>until</code>. Overlays, timing to
        another instant, the named rows of the lexicon and actions done together
        by several people arrive with the composition campaign.
      </p>
    );
  const { axes, operators } = grammar as {
    axes: IEntry[];
    operators: IEntry[];
  };
  const table = (caption: string, rows: IEntry[]): ReactElement => (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th>Name</th>
          <th>Decides</th>
          <th>Carried by</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(
          (row: IEntry): ReactElement => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td>{row.says}</td>
              <td>
                <code>{row.carriedBy}</code>
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
  return (
    <>
      {table("The axes an action is decided on", axes)}
      {table("The operators that join actions", operators)}
    </>
  );
}
