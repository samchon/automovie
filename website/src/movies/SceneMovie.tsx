"use client";

import Link from "next/link";
import {
  type Dispatch,
  type KeyboardEvent,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import { SITE_BASE } from "../SITE_BASE";
import { BakedClient } from "../baked/BakedClient";
import { SceneTimeline } from "../components/scenes/SceneTimeline";
import { SceneView } from "../components/scenes/SceneView";
import { useSceneClock } from "../components/scenes/useSceneClock";
import { Transport } from "../components/stage/Transport";
import { TransportKeys } from "../components/stage/TransportKeys";
import { formatArchetypeLabel } from "../gallery/formatArchetypeLabel";
import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { SceneClock } from "../scenes/SceneClock";
import { SceneFacts } from "../scenes/SceneFacts";
import { formatSceneChain } from "../scenes/formatSceneChain";
import { IScene } from "../scenes/structures/IScene";
import type { ISceneChainNames } from "../scenes/structures/ISceneChainNames";
import type { IScenePlayer } from "../scenes/structures/IScenePlayer";

/** The panels under the player. */
type Panel = "code" | "timeline" | "takes";

/** The panels in their tabs' order. */
const PANELS: readonly Panel[] = ["code", "timeline", "takes"];

/**
 * The player's loaded take, and what redraws its view after the toolbar moves
 * the camera.
 */
interface ILoaded {
  /** The take. */
  take: IScenePlayer;

  /** Draw the view again, as a paused clock does not. */
  redraw: () => void;
}

/** The named views the toolbar offers, in its order. */
const VIEWS: readonly IScene.ICamera["view"][] = [
  "three-quarter",
  "front",
  "side",
  "top",
];

/**
 * One scene: the player with its named views and transport beside the cast, the
 * objects and the actions, then three panels: the code an agent writes for it,
 * the timeline of the take, and the takes that vary one choice.
 *
 * The first take plays from its baked bytes at once; the takes panel computes
 * the other takes in the page only when it is opened. A scene the installed
 * packages cannot compute shows what it will compose and the issues it waits
 * on.
 *
 * @param props The scene's record, whether the installed packages compute its
 *   takes, whether its first take was baked, the exported names its code refers
 *   to, and which of its actions have a motion page.
 * @returns The page.
 */
export default function SceneMovie(props: {
  scene: IScene;
  computes: boolean;
  baked: boolean;
  names: ISceneChainNames | null;
  motions: string[];
}): ReactElement {
  const { scene, computes }: typeof props = props;
  const clock: SceneClock = useSceneClock();
  const [panel, setPanel]: [Panel, Dispatch<SetStateAction<Panel>>] =
    useState<Panel>("code");
  const [player, setPlayer]: [
    ILoaded | null,
    Dispatch<SetStateAction<ILoaded | null>>,
  ] = useState<ILoaded | null>(null);
  const [notice, setNotice]: [string, Dispatch<SetStateAction<string>>] =
    useState<string>("");

  // The takes are computed from the first time their tab opens, and kept,
  // so choosing a panel records that in the same render.
  const [opened, setOpened]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  const choose: (next: Panel) => void = (next: Panel): void => {
    setPanel(next);
    if (next === "takes") setOpened(true);
  };

  // An address ending in #timeline or #takes opens on that panel.
  useEffect((): void => {
    const hash: string = window.location.hash.slice(1);
    if (hash === "timeline" || hash === "takes") choose(hash);
  }, []);

  const head: ReactElement = (
    <header className="am-scene-head">
      <nav aria-label="Breadcrumb" className="am-crumbs">
        <Link href="/scenes/">Scene studies</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/scenes/?setting=${scene.setting}`}>
          {IScene.SETTING_LABELS[scene.setting]}
        </Link>
      </nav>
      <h1>{scene.title}</h1>
      <p>{scene.summary}</p>
      {scene.refusedUntil === undefined ? null : (
        <p className="am-scene-refused" role="note">
          The packages refuse this scene today, in their own words on the view
          below.{" "}
          <a
            href={`https://github.com/samchon/automovie/issues/${scene.refusedUntil}`}
          >
            #{scene.refusedUntil}
          </a>{" "}
          fixes it.
        </p>
      )}
    </header>
  );

  if (!computes || scene.composition === null)
    return (
      <main className="am-app am-scene-page" data-pagefind-body>
        {head}
        <section className="am-scene-waiting" aria-label="Status">
          <p>
            {scene.composition === null
              ? "The packages cannot compose this scene yet."
              : "This scene is written, but the installed packages lack a piece it composes."}{" "}
            {scene.needs.length === 0 ? (
              "It plays here on the release that brings those pieces."
            ) : (
              <>
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
              </>
            )}
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
            <pre className="am-code">
              <code>{formatSceneChain(scene.composition, props.names!)}</code>
            </pre>
          )}
        </section>
      </main>
    );

  const composition: IPlaygroundComposition = scene.composition;
  const roles: Record<string, string> = Object.fromEntries(
    scene.cast.map((c: IScene.ICast): [string, string] => [c.subject, c.role]),
  );
  const copy: () => Promise<void> = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("The page's address was copied.");
    } catch {
      setNotice("Copy the address from the address bar.");
    }
  };

  return (
    <main className="am-app am-scene-page" data-pagefind-body>
      {head}
      <div className="am-scene-layout">
        <TransportKeys clock={clock} label="Scene player">
          <SceneView
            scene={scene}
            take={0}
            clock={clock}
            orbit
            baked={props.baked ? "scene" : undefined}
            poster={
              props.baked
                ? BakedClient.address("scene", scene.id, "svg")
                : undefined
            }
            onLoad={(take: IScenePlayer, redraw: () => void): void => {
              clock.duration = take.duration;
              clock.fps = take.fps;
              clock.seek(clock.time);
              setPlayer({ take, redraw });
            }}
          />
          <div className="am-scene-controls">
            {player === null ? null : <Transport clock={clock} />}
            <div className="am-toolbar" role="group" aria-label="View">
              {VIEWS.map(
                (view: IScene.ICamera["view"]): ReactElement => (
                  <button
                    key={view}
                    type="button"
                    disabled={player === null}
                    onClick={(): void => {
                      if (player === null) return;
                      player.take.frame(view);
                      player.redraw();
                    }}
                  >
                    {view === "three-quarter"
                      ? "Three-quarter"
                      : view[0]!.toUpperCase() + view.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>
        </TransportKeys>

        <aside className="am-scene-aside" aria-label="About the scene">
          <h2>Cast</h2>
          <ul className="am-plain">
            {composition.performers.map(
              (p: IPlaygroundComposition.IPerformer): ReactElement => (
                <li key={p.subject}>
                  <span className="am-mono">{p.subject}</span>{" "}
                  {roles[p.subject]}
                  <span className="am-muted">
                    {" "}
                    {p.body}, {p.proficiency}
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
                  (o: IPlaygroundComposition.IObject): ReactElement => (
                    <li key={o.subject}>
                      <span className="am-mono">{o.subject}</span>{" "}
                      {/* A full navigation: an archetype's page reads its
                          request from the address once, when it mounts. */}
                      <a
                        href={`${SITE_BASE}/archetypes/?subject=${o.producer}${o.kind === undefined ? "" : `&variant=${o.kind}`}`}
                      >
                        {formatArchetypeLabel(o.producer)}
                      </a>
                      {o.kind === undefined ? (
                        ""
                      ) : (
                        <span className="am-muted"> {o.kind}</span>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </>
          )}
          {SceneFacts.features(scene).length === 0 ? null : (
            <>
              <h2>Composed with</h2>
              <ul className="am-plain">
                {SceneFacts.features(scene).map(
                  (feature: string): ReactElement => (
                    <li key={feature}>{feature}</li>
                  ),
                )}
              </ul>
            </>
          )}
          <h2>Actions</h2>
          <ul className="am-tags">
            {SceneFacts.actions(scene).map(
              (name: string): ReactElement => (
                <li key={name}>
                  {props.motions.includes(name) ? (
                    <Link href={`/motions/${name}/`}>{name}</Link>
                  ) : (
                    <span>{name}</span>
                  )}
                </li>
              ),
            )}
          </ul>
          <div className="am-scene-links">
            <button
              type="button"
              className="am-button"
              onClick={(): void => void copy()}
            >
              Copy link
            </button>
            <span className="am-muted am-small" role="status">
              {notice}
            </span>
          </div>
        </aside>
      </div>

      {/* The tabs take one stop in the tab order; the arrow keys, Home and
          End move between them, as the WAI-ARIA tabs pattern sets. */}
      <div
        className="am-tabs"
        role="tablist"
        aria-label="This scene"
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>): void => {
          const at: number = PANELS.indexOf(panel);
          const next: number | null =
            event.key === "ArrowRight"
              ? (at + 1) % PANELS.length
              : event.key === "ArrowLeft"
                ? (at + PANELS.length - 1) % PANELS.length
                : event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? PANELS.length - 1
                    : null;
          if (next === null) return;
          event.preventDefault();
          choose(PANELS[next]!);
          document.getElementById(`am-tab-${PANELS[next]!}`)?.focus();
        }}
      >
        {PANELS.map(
          (id: Panel): ReactElement => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`am-tab-${id}`}
              aria-selected={panel === id}
              aria-controls={`am-panel-${id}`}
              tabIndex={panel === id ? 0 : -1}
              onClick={(): void => choose(id)}
            >
              {id === "code"
                ? "Code"
                : id === "timeline"
                  ? "Timeline"
                  : `Takes (${scene.takes.length})`}
            </button>
          ),
        )}
      </div>

      <section
        role="tabpanel"
        id="am-panel-code"
        aria-labelledby="am-tab-code"
        className="am-panel-body"
        hidden={panel !== "code"}
      >
        <p className="am-muted">
          Each person is a chain of typed actions from{" "}
          <code>@automovie/motions</code>. This is what an agent writes for the
          scene;{" "}
          <Link href="/reference/motion/composing/">Composing motion</Link>{" "}
          explains the parts.
        </p>
        <pre className="am-code">
          <code>{formatSceneChain(composition, props.names!)}</code>
        </pre>
      </section>
      <section
        role="tabpanel"
        id="am-panel-timeline"
        aria-labelledby="am-tab-timeline"
        className="am-panel-body"
        hidden={panel !== "timeline"}
      >
        <p className="am-muted">
          Each person&apos;s actions on the film clock, with their named
          instants, as the engine placed them.
        </p>
        {player === null ? (
          <p className="am-status" role="status">
            The timeline appears when the take is drawn.
          </p>
        ) : (
          <SceneTimeline timeline={player.take.timeline} roles={roles} />
        )}
      </section>
      <section
        role="tabpanel"
        id="am-panel-takes"
        aria-labelledby="am-tab-takes"
        className="am-panel-body"
        hidden={panel !== "takes"}
      >
        <p className="am-muted">
          The same composition in {scene.takes.length} takes on the
          player&apos;s clock. Each changes one choice and keeps the rest; the
          other takes are computed in this page, which takes a few seconds.
        </p>
        {/* The takes are computed only once their tab has been opened. */}
        {opened ? (
          <ul className="am-take-grid">
            {scene.takes.map(
              (take: IScene.ITake, index: number): ReactElement => (
                <li key={index} className="am-take">
                  <SceneView
                    scene={scene}
                    take={index}
                    clock={clock}
                    label={take.label}
                    baked={props.baked && index === 0 ? "scene" : undefined}
                    poster={
                      props.baked && index === 0
                        ? BakedClient.address("scene", scene.id, "svg")
                        : undefined
                    }
                    onLoad={(loaded: IScenePlayer): void => {
                      clock.duration = Math.max(
                        clock.duration,
                        loaded.duration,
                      );
                      clock.seek(clock.time);
                    }}
                  />
                  <span className="am-take-label">{take.label}</span>
                </li>
              ),
            )}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
