import { AutoMovieMotionHumanGrammar } from "@automovie/motions";
import type { ReactElement } from "react";

/** One axis or operator as `AutoMovieMotionHumanGrammar` lists it. */
interface IEntry {
  /** Its name. */
  name: string;

  /** The exports that carry it. */
  carriedBy: string;

  /** What it decides. */
  says: string;
}

/** A row's classes, as Nextra's Markdown table draws a row. */
const ROW: string =
  "x:m-0 x:border-t x:border-gray-300 x:p-0 x:dark:border-gray-600 x:even:bg-gray-100 x:even:dark:bg-gray-600/20";

/** A cell's classes, as Nextra's Markdown table draws a cell. */
const CELL: string =
  "x:m-0 x:border x:border-gray-300 x:px-4 x:py-2 x:dark:border-gray-600";

/**
 * The composition grammar's axes and operators, read from the installed
 * `@automovie/motions` at build time, so the table names the grammar as the
 * package does.
 *
 * @returns The tables.
 */
export function GrammarTable(): ReactElement {
  const {
    axes,
    operators,
  }: { axes: readonly IEntry[]; operators: readonly IEntry[] } = AutoMovieMotionHumanGrammar;
  // The classes are those Nextra gives a Markdown table, so these tables are
  // drawn like the page's others and scroll inside themselves on a phone.
  const table: (caption: string, rows: readonly IEntry[]) => ReactElement = (
    caption: string,
    rows: readonly IEntry[],
  ): ReactElement => (
    <>
      <p className="am-table-title">{caption}</p>
      <table
        aria-label={caption}
        className="nextra-scrollbar x:block x:overflow-x-auto x:p-0"
      >
        <thead>
          <tr className={ROW}>
            <th className={`${CELL} x:font-semibold`}>Name</th>
            <th className={`${CELL} x:font-semibold`}>Decides</th>
            <th className={`${CELL} x:font-semibold`}>Carried by</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(
            (row: IEntry): ReactElement => (
              <tr key={row.name} className={ROW}>
                <td className={CELL}>
                  <code>{row.name}</code>
                </td>
                <td className={CELL}>{row.says}</td>
                <td className={CELL}>
                  <code>{row.carriedBy}</code>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </>
  );
  return (
    <>
      {table("The axes an action is decided on", axes)}
      {table("The operators that join actions", operators)}
    </>
  );
}
