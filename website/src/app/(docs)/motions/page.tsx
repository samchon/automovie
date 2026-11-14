import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { MotionNav } from "../../../components/motions/MotionNav";
import { MotionReference } from "../../../motions/package/MotionReference";
import type { IMotionReference } from "../../../motions/structures/IMotionReference";

export const metadata: Metadata = {
  title: "Motions",
  description:
    "The pieces scenes are composed from: the actions of @automovie/motions, the lexicon's named rows by family, and the grammar that joins them.",
};

/**
 * The motion reference's overview, written while the site is exported from
 * the installed `@automovie/motions`.
 *
 * @returns The page.
 */
export default function MotionsPage(): ReactElement {
  const reference: IMotionReference = MotionReference.read();
  const rows: number = reference.families.reduce(
    (sum: number, f: IMotionReference.IFamily): number => sum + f.rows.length,
    0,
  );
  return (
    <main className="am-app" data-pagefind-body>
      <header className="am-app-head">
        <h1>Motions</h1>
        <p className="am-lede">
          The pieces every scene is composed from. A scene chains them per
          person; this reference lists each one with what it takes and the
          scenes that use it.
        </p>
      </header>
      <div className="am-motion-layout">
        <MotionNav
          families={reference.families.map(
            (f: IMotionReference.IFamily): { name: string; rows: number } => ({
              name: f.name,
              rows: f.rows.length,
            }),
          )}
          actions={reference.actions.length}
          current={null}
        />
        <div className="am-stack">
          <p>
            <Link href="/motions/actions/">
              {reference.actions.length} actions
            </Link>{" "}
            make up the vocabulary
            {reference.families.length === 0
              ? ". The lexicon of named rows arrives with the composition campaign (#3392)."
              : `, and the lexicon names ${rows} rows in ${reference.families.length} families that compose them.`}
          </p>
          {reference.families.length === 0 ? null : (
            <ul className="am-family-grid">
              {reference.families.map(
                (family: IMotionReference.IFamily): ReactElement => (
                  <li key={family.name} className="am-roadmap-item">
                    <Link href={`/motions/${family.name}/`}>
                      <strong>{family.name}</strong>
                    </Link>
                    <span className="am-muted am-small">
                      {family.rows.length} rows:{" "}
                      {family.rows
                        .slice(0, 6)
                        .map((r: IMotionReference.IRow): string => r.name)
                        .join(", ")}
                      {family.rows.length > 6 ? ", …" : ""}
                    </span>
                  </li>
                ),
              )}
            </ul>
          )}
          {reference.grammar === null ? null : (
            <>
              <h2>The grammar</h2>
              {(["axes", "operators"] as const).map(
                (part: "axes" | "operators"): ReactElement => (
                  <table key={part} className="am-table">
                    <caption>
                      {part === "axes"
                        ? "The axes an action is decided on"
                        : "The operators that join actions"}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Decides</th>
                        <th scope="col">Carried by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reference.grammar![part].map(
                        (entry: IMotionReference.IEntry): ReactElement => (
                          <tr key={entry.name}>
                            <td className="am-mono">{entry.name}</td>
                            <td>{entry.says}</td>
                            <td className="am-mono">{entry.carriedBy}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                ),
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
