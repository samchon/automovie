import type { Metadata } from "next";
import type { ReactElement } from "react";

import { MotionCatalogue } from "../../../components/motions/MotionCatalogue";
import { MotionNav } from "../../../components/motions/MotionNav";
import { SceneCard } from "../../../components/scenes/SceneCard";
import { MotionReference } from "../../../motions/package/MotionReference";
import type { IMotionReference } from "../../../motions/structures/IMotionReference";
import { SCENES } from "../../../scenes/SCENES";
import { SceneStatus } from "../../../scenes/package/SceneStatus";
import type { IScene } from "../../../scenes/structures/IScene";

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
  const examples: IScene[] = SCENES.filter(
    (scene: IScene): boolean =>
      scene.featured !== undefined &&
      scene.hidden !== true &&
      scene.takes.length > 0 &&
      SceneStatus.of(scene).kind === "plays",
  ).sort(
    (left: IScene, right: IScene): number => left.featured! - right.featured!,
  );
  return (
    <main className="am-app am-library" data-pagefind-body>
      <header className="am-app-head">
        <h1>Motions</h1>
        <p className="am-lede">
          Browse the action vocabulary by family. Open a movement to find the
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
          {examples.length > 0 && (
            <details className="am-motion-examples" open>
              <summary>Featured scenes</summary>
              <ul className="am-scene-grid">
                {examples.map(
                  (scene: IScene): ReactElement => (
                    <SceneCard key={scene.id} scene={scene} />
                  ),
                )}
              </ul>
            </details>
          )}
          <MotionCatalogue
            groups={[
              { name: "actions", rows: reference.actions },
              ...reference.families,
            ].map((family: IMotionReference.IFamily) => ({
              name: family.name,
              motions: family.rows.map(
                (row: IMotionReference.IRow): string => row.name,
              ),
            }))}
          />
          {reference.grammar === null ? null : (
            <details>
              <summary>Motion grammar</summary>
              {(["axes", "operators"] as const).map(
                (part: "axes" | "operators"): ReactElement => (
                  <div key={part} className="am-table-wrap">
                    <table className="am-table">
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
                  </div>
                ),
              )}
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
