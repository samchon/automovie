"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

import { SceneTimeline } from "../components/scenes/SceneTimeline";
import { SceneView } from "../components/scenes/SceneView";
import { useSceneClock } from "../components/scenes/useSceneClock";
import { Transport } from "../components/stage/Transport";
import { TransportKeys } from "../components/stage/TransportKeys";
import { PlaygroundAddress } from "../playground/PlaygroundAddress";
import type { SceneClock } from "../scenes/SceneClock";
import { SceneFacts } from "../scenes/SceneFacts";
import { formatSceneChain } from "../scenes/formatSceneChain";
import type { IScene } from "../scenes/structures/IScene";
import type { ISceneManifest } from "../scenes/structures/ISceneManifest";
import type { IScenePlayer } from "../scenes/structures/IScenePlayer";

/** The panels under the player. */
type Panel = "variations" | "made";

/** The named views the toolbar offers, in its order. */
const VIEWS: readonly IScene.ICamera["view"][] = [
  "three-quarter",
  "front",
  "side",
  "top",
];

/**
 * One scene: the player with its transport and named views, then the takes
 * side by side on the same clock, or how the scene is made. Customise opens
 * the scene's composition in the playground, with every parameter.
 *
 * A scene the build did not bake, because it waits on a release or is
 * planned, shows what it will compose and the issues it waits on.
 *
 * @param props The scene's record, its baked takes if any, and the reference page of each action by name.
 * @returns The page.
 */
export default function SceneMovie(props: {
  scene: IScene;
  baked: ISceneManifest.IScene | null;
  pages: Record<string, string>;
}): ReactElement {
  const { scene, baked } = props;
  const clock: SceneClock = useSceneClock();
  const [panel, setPanel] = useState<Panel>("variations");
  const [player, setPlayer] = useState<IScenePlayer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // The clock runs as long as the longest take.
  useEffect((): void => {
    if (baked === null) return;
    clock.duration = Math.max(
      ...baked.takes.map((t: ISceneManifest.ITake): number => t.duration),
    );
    clock.fps = baked.takes[0]?.fps ?? 12;

    // A seek tells the transport, which reads the film's length from the clock.
    clock.seek(clock.time);
  }, [baked, clock]);

  const head: ReactElement = (
    <header className="am-app-head">
      <h1>{scene.title}</h1>
      <p className="am-lede">{scene.summary}</p>
    </header>
  );

  if (baked === null || scene.composition === null)
    return (
      <div className="am-app" data-pagefind-body>
        {head}
        <section className="am-panel am-stack" aria-label="Status">
          <p>
            <span className="am-badge">
              {scene.composition === null ? "Planned" : "Waits on a release"}
            </span>
          </p>
          <p>
            {scene.composition === null
              ? "The packages cannot compose this scene yet."
              : "This scene is written, but the installed packages lack a piece it composes."}{" "}
            It plays here on the release that closes{" "}
            {scene.needs.map(
              (issue: number, i: number): ReactElement => (
                <span key={issue}>
                  {i === 0 ? "" : ", "}
                  <a
                    href={`https://github.com/samchon/automovie/issues/${issue}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{issue}
                  </a>
                </span>
              ),
            )}
            .
          </p>
          {scene.planned === undefined ? null : (
            <dl className="am-facts">
              <dt>Cast and objects</dt>
              <dd>{scene.planned.cast}</dd>
              <dt>What it composes</dt>
              <dd>{scene.planned.pieces}</dd>
            </dl>
          )}
          {scene.composition === null ? null : (
            <>
              <h2>What it composes</h2>
              <pre className="am-code">
                <code>{formatSceneChain(scene.composition)}</code>
              </pre>
            </>
          )}
          <p>
            <Link href="/scenes/">Back to the scenes</Link>
          </p>
        </section>
      </div>
    );

  const composition = scene.composition;
  const roles: Record<string, string> = Object.fromEntries(
    scene.cast.map((c: IScene.ICast): [string, string] => [c.subject, c.role]),
  );
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("The page's address was copied.");
    } catch {
      setNotice("Copy the address from the address bar.");
    }
  };

  return (
    <div className="am-app" data-pagefind-body>
      {head}
      <div className="am-scene-layout">
        <TransportKeys clock={clock} label="Scene player">
          <div className="am-toolbar" role="toolbar" aria-label="View">
            {VIEWS.map(
              (view: IScene.ICamera["view"]): ReactElement => (
                <button
                  key={view}
                  type="button"
                  disabled={player === null}
                  onClick={(): void => player?.frame(view)}
                >
                  {view === "three-quarter"
                    ? "Three-quarter"
                    : view[0]!.toUpperCase() + view.slice(1)}
                </button>
              ),
            )}
          </div>
          <SceneView
            scene={scene}
            take={0}
            clock={clock}
            orbit
            onLoad={setPlayer}
          />
          <Transport clock={clock} />
        </TransportKeys>

        <aside className="am-scene-aside" aria-label="About the scene">
          <h2>Cast</h2>
          <ul className="am-plain">
            {composition.performers.map(
              (p): ReactElement => (
                <li key={p.subject}>
                  <span className="am-mono">{p.subject}</span>,{" "}
                  {roles[p.subject]}
                  <span className="am-muted">
                    {" "}
                    ({p.body}, {p.proficiency})
                  </span>
                </li>
              ),
            )}
          </ul>
          {(composition.objects ?? []).length === 0 ? null : (
            <>
              <h2>Objects</h2>
              <ul className="am-plain">
                {(composition.objects ?? []).map(
                  (o): ReactElement => (
                    <li key={o.subject}>
                      <span className="am-mono">{o.subject}</span>,{" "}
                      <Link href={`/objects/?subject=${o.producer}`}>
                        {o.producer.replace(/^create/, "")}
                      </Link>
                      {o.kind === undefined ? "" : ` (${o.kind})`}
                    </li>
                  ),
                )}
              </ul>
            </>
          )}
          <h2>Actions</h2>
          <p className="am-mono am-small">
            {SceneFacts.actions(scene).map(
              (name: string, i: number): ReactElement => (
                <span key={name}>
                  {i === 0 ? "" : ", "}
                  {props.pages[name] === undefined ? (
                    name
                  ) : (
                    <Link href={`/motions/${props.pages[name]}/#${name}`}>
                      {name}
                    </Link>
                  )}
                </span>
              ),
            )}
          </p>
        </aside>
      </div>

      <div className="am-actions" role="group" aria-label="This scene">
        <div className="am-tabs-inline" role="group" aria-label="Panel">
          <button
            type="button"
            aria-pressed={panel === "variations"}
            onClick={(): void => setPanel("variations")}
          >
            Variations
          </button>
          <button
            type="button"
            aria-pressed={panel === "made"}
            onClick={(): void => setPanel("made")}
          >
            How is this made?
          </button>
        </div>
        <Link
          className="am-button"
          href={`/playground/${PlaygroundAddress.encode({
            ...composition,
            version: PlaygroundAddress.VERSION,
          })}`}
        >
          Customise
        </Link>
        <button type="button" onClick={(): void => void copy()}>
          Copy link
        </button>
        {notice === null ? null : (
          <span className="am-muted" role="status">
            {notice}
          </span>
        )}
      </div>

      {panel === "variations" ? (
        <section aria-label="Variations" className="am-stack">
          <p className="am-muted">
            The same composition in {baked.takes.length} takes, played on the
            player&apos;s clock: each changes one choice and keeps the rest.
          </p>
          <ul className="am-take-grid">
            {baked.takes.map(
              (take: ISceneManifest.ITake, index: number): ReactElement => (
                <li key={index} className="am-take">
                  <SceneView scene={scene} take={index} clock={clock} />
                  <span className="am-take-label">{take.label}</span>
                </li>
              ),
            )}
          </ul>
        </section>
      ) : (
        <section aria-label="How is this made?" className="am-stack">
          <p>
            Each person is a chain of actions from{" "}
            <code>@automovie/motions</code>. This is the code an agent writes
            for this scene; the{" "}
            <Link href="/docs/composing-motion/">guide</Link> explains the
            parts.
          </p>
          <pre className="am-code">
            <code>{formatSceneChain(composition)}</code>
          </pre>
          <h2>Timeline</h2>
          <SceneTimeline take={baked.takes[0]!} roles={roles} />
        </section>
      )}
    </div>
  );
}
