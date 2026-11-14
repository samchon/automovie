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
  // Read through a record, so the bundler does not take the member for a
  // named import a release may lack.
  const exported: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;
  const grammar: unknown = exported["HUMAN_GRAMMAR"];
  if (typeof grammar !== "object" || grammar === null)
    return (
      <p>
        The installed release composes a sequence of actions per person, people
        in parallel, a cut with <code>until</code>, actions two people do
        together with <code>HumanChain.pair</code>, and anchors other actions
        name. Overlays (<code>over</code>), timing to another instant (
        <code>sync</code>) and the named rows of the lexicon arrive with the
        composition campaign.
      </p>
    );
  const { axes, operators }: { axes: IEntry[]; operators: IEntry[] } =
    grammar as { axes: IEntry[]; operators: IEntry[] };
  const table: (caption: string, rows: IEntry[]) => ReactElement = (
    caption: string,
    rows: IEntry[],
  ): ReactElement => (
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
