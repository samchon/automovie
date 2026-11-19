"use client";

import Link from "next/link";
import { type Dispatch, type ReactElement, type SetStateAction, useState } from "react";

import { BakedClient } from "../baked/BakedClient";
import { SceneView } from "../components/scenes/SceneView";
import { useSceneClock } from "../components/scenes/useSceneClock";
import { Transport } from "../components/stage/Transport";
import { TransportKeys } from "../components/stage/TransportKeys";
import type { MotionIndex } from "../motions/package/MotionIndex";
import type { IMotionReference } from "../motions/structures/IMotionReference";
import type { SceneClock } from "../scenes/SceneClock";
import type { IScenePlayer } from "../scenes/structures/IScenePlayer";

/**
 * One motion: its take in the 3D player, alone or in the first scene that
 * performs it, beside its name and family; then its parameters, the scenes
 * that use it and the motions next to it in its family.
 *
 * @param props The motion's page data.
 * @returns The page.
 */
export default function MotionMovie(props: { detail: MotionIndex.IDetail }): ReactElement {
  const { detail }: { detail: MotionIndex.IDetail } = props;
  const clock: SceneClock = useSceneClock();
  const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
  return (
    <main className="am-app am-scene-page am-motion-page" data-pagefind-body>
      <header className="am-scene-head">
        <nav aria-label="Breadcrumb" className="am-crumbs">
          <Link href="/motions/">Motions</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/motions/#${detail.category.id}`}>{detail.category.title}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/motions/#family-${detail.family.name}`}>{detail.family.label}</Link>
        </nav>
        <h1 className="am-motion-name">{detail.name}</h1>
        <p>
          {detail.family.name === "actions"
            ? "An action of the core vocabulary. A chain appends it by name, with the parameters below."
            : `A named row of the ${detail.family.label.toLowerCase()} family: an action with some parameters fixed, fitted, refused and checked as that action is.`}
        </p>
      </header>

      <div className="am-scene-layout">
        <div>
          {detail.play === null ? (
            <div className="am-motion-empty">
              <p>
                No scene performs this motion yet, and it needs a partner, a
                prop or a parameter a trial alone cannot supply.
              </p>
            </div>
          ) : (
            <TransportKeys clock={clock} label="Motion player">
              <SceneView
                scene={detail.play.record}
                take={0}
                clock={clock}
                orbit
                label={detail.play.label}
                baked={detail.play.baked ?? undefined}
                poster={
                  detail.play.baked === null
                    ? undefined
                    : BakedClient.address(detail.play.baked, detail.play.record.id, "svg")
                }
                onLoad={(take: IScenePlayer): void => {
                  clock.duration = take.duration;
                  clock.fps = take.fps;
                  clock.seek(clock.time);
                  setReady(true);
                }}
              />
              <div className="am-scene-controls">
                {ready ? <Transport clock={clock} /> : null}
              </div>
              <p className="am-muted am-small">{detail.play.label}.</p>
            </TransportKeys>
          )}
        </div>

        <aside className="am-scene-aside" aria-label="About the motion">
          <h2>Write it</h2>
          <pre className="am-code am-motion-snippet">
            <code>{snippet(detail)}</code>
          </pre>
          {detail.family.name === "actions" ? null : (
            <p className="am-muted am-small">
              A row is registered in the performance&apos;s <code>laws</code> too.
            </p>
          )}
          <h2>Used in</h2>
          {detail.uses.length === 0 ? (
            <p className="am-muted">No scene on this site uses it yet.</p>
          ) : (
            <ul className="am-plain">
              {detail.uses.map(
                (use: { id: string; title: string }): ReactElement => (
                  <li key={use.id}>
                    <Link href={`/scenes/${use.id}/`}>{use.title}</Link>
                  </li>
                ),
              )}
            </ul>
          )}
          <div className="am-scene-links">
            {detail.playground === null ? null : (
              <Link className="am-button am-button-primary" href={detail.playground}>
                Open in the playground
              </Link>
            )}
          </div>
          <nav className="am-motion-step" aria-label="In this family">
            {detail.previous === null ? (
              <span />
            ) : (
              <Link href={`/motions/${detail.previous}/`} rel="prev">
                <span>Previous</span>
                {detail.previous}
              </Link>
            )}
            {detail.next === null ? null : (
              <Link href={`/motions/${detail.next}/`} rel="next">
                <span>Next</span>
                {detail.next}
              </Link>
            )}
          </nav>
        </aside>
      </div>

      <section className="am-panel-body" aria-labelledby="am-parameters">
        <h2 id="am-parameters" className="am-motion-h2">
          Parameters
        </h2>
        {detail.parameters === null ? (
          <p className="am-muted">This release ships no schema for it.</p>
        ) : detail.parameters.length === 0 ? (
          <p className="am-muted">It takes no parameters.</p>
        ) : (
          <div className="am-table-wrap">
            <table className="am-params">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {detail.parameters.map(
                  (p: IMotionReference.IParameter): ReactElement => (
                    <tr key={p.name}>
                      <td>
                        <code>{p.name}</code>
                        {p.required ? <span className="am-required">required</span> : null}
                      </td>
                      <td>
                        <code className="am-param-type">{p.type}</code>
                      </td>
                      <td>{p.description}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/**
 * How a chain appends the motion, with its required parameters named. A
 * lexicon row extends the chain first, and the performance registers it in
 * its `laws`, as the motions README shows.
 */
function snippet(detail: MotionIndex.IDetail): string {
  const required: string[] = (detail.parameters ?? [])
    .filter((p: IMotionReference.IParameter): boolean => p.required)
    .map((p: IMotionReference.IParameter): string => p.name);
  const args: string = required.length === 0 ? "" : `{ ${required.join(", ")} }`;
  return detail.family.name === "actions"
    ? `HumanChain.subject("a")\n  .${detail.name}(${args})`
    : `const Chain = HumanChain.extend({\n  ${detail.name},\n});\nChain.subject("a")\n  .${detail.name}(${args})`;
}
