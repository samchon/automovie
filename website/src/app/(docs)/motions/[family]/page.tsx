import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { MotionNav } from "../../../../components/motions/MotionNav";
import { MotionUsage } from "../../../../motions/MotionUsage";
import { MotionReference } from "../../../../motions/package/MotionReference";
import type { IMotionReference } from "../../../../motions/structures/IMotionReference";
import { PlaygroundAddress } from "../../../../playground/PlaygroundAddress";

/** What Next passes a page of this route. */
interface IPageProps {
  /** The family's name, or `actions` for the vocabulary's actions. */
  params: Promise<{ family: string }>;
}

/** The page of the vocabulary's own actions, beside the lexicon's families. */
const ACTIONS: string = "actions";

/** Only the families the installed package has get a page. */
export const dynamicParams: boolean = false;

/**
 * One page for the actions and one per family of the installed lexicon.
 *
 * @returns The families.
 */
export function generateStaticParams(): { family: string }[] {
  return [
    { family: ACTIONS },
    ...MotionReference.read().families.map((f: IMotionReference.IFamily) => ({
      family: f.name,
    })),
  ];
}

/**
 * A family page's title.
 *
 * @param props The route's parameters.
 * @returns The metadata.
 */
export async function generateMetadata(props: IPageProps): Promise<Metadata> {
  const { family } = await props.params;
  return { title: family === ACTIONS ? "Actions" : `Motions: ${family}` };
}

/**
 * One family's rows, or the vocabulary's actions: each with what it takes,
 * the scenes that compose it, and a link that tries it in the playground.
 *
 * @param props The route's parameters.
 * @returns The page.
 */
export default async function MotionFamilyPage(
  props: IPageProps,
): Promise<ReactElement> {
  const { family } = await props.params;
  const reference: IMotionReference = MotionReference.read();
  const rows: IMotionReference.IRow[] =
    family === ACTIONS
      ? reference.actions.map(
          (name: string): IMotionReference.IRow => ({
            name,
            parameters: null,
          }),
        )
      : reference.families.find(
          (f: IMotionReference.IFamily): boolean => f.name === family,
        )!.rows;

  return (
    <div className="am-app" data-pagefind-body>
      <header className="am-app-head">
        <h1>{family === ACTIONS ? "Actions" : family}</h1>
        <p className="am-lede">
          {family === ACTIONS
            ? "The vocabulary's actions. Each takes its own parameters, which the package's types state."
            : `A family of the lexicon: ${rows.length} named rows, each appended to a chain by its name.`}
        </p>
      </header>
      <div className="am-motion-layout">
        <MotionNav
          families={reference.families.map((f: IMotionReference.IFamily) => ({
            name: f.name,
            rows: f.rows.length,
          }))}
          actions={reference.actions.length}
          current={family}
        />
        <div className="am-stack">
          <nav aria-label="On this page" className="am-chips">
            {rows.map(
              (row: IMotionReference.IRow): ReactElement => (
                <a
                  key={row.name}
                  className="am-mono am-small"
                  href={`#${row.name}`}
                >
                  {row.name}
                </a>
              ),
            )}
          </nav>
          {rows.map((row: IMotionReference.IRow): ReactElement => {
            const use: MotionUsage.IUse = MotionUsage.of(row.name);
            return (
              <section
                key={row.name}
                id={row.name}
                className="am-panel am-stack"
              >
                <h2 className="am-mono">{row.name}</h2>
                {row.parameters === null ? null : row.parameters.length ===
                  0 ? (
                  <p className="am-muted">It takes no parameter.</p>
                ) : (
                  <div className="am-table-wrap">
                    <table className="am-table">
                      <thead>
                        <tr>
                          <th scope="col">Parameter</th>
                          <th scope="col">Type</th>
                          <th scope="col">Meaning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.parameters.map(
                          (p: IMotionReference.IParameter): ReactElement => (
                            <tr key={p.name}>
                              <td className="am-mono">
                                {p.name}
                                {p.required ? "" : "?"}
                              </td>
                              <td className="am-mono am-small">{p.type}</td>
                              <td>{p.description}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                <p>
                  {use.scenes.length === 0 ? (
                    <span className="am-muted">No scene uses it yet.</span>
                  ) : (
                    <>
                      Used in{" "}
                      {use.scenes.map(
                        (
                          scene: { id: string; title: string },
                          i: number,
                        ): ReactElement => (
                          <span key={scene.id}>
                            {i === 0 ? "" : ", "}
                            <Link href={`/scenes/${scene.id}/`}>
                              {scene.title}
                            </Link>
                          </span>
                        ),
                      )}
                      .
                    </>
                  )}{" "}
                  <Link
                    href={`/playground/${PlaygroundAddress.encode(MotionUsage.trial(row.name))}`}
                  >
                    Try it alone
                  </Link>
                </p>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
