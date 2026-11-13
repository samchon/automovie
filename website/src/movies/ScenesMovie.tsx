"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

import { SceneCard } from "../components/scenes/SceneCard";
import { SCENES } from "../scenes/SCENES";
import { SceneFacts } from "../scenes/SceneFacts";
import { IScene } from "../scenes/structures/IScene";

/** The address's query: the setting shown and the words searched. */
interface IFilter {
  /** The setting, or every setting when absent. */
  setting: IScene.Setting | null;

  /** The words a scene must match. */
  query: string;
}

/**
 * The scene gallery: every scene that plays as a card playing its first
 * take, grouped by setting, and below them the roadmap of scenes that wait
 * on a release or are planned, with the issues they wait on.
 *
 * The setting and the search live in the address's query, so a link shows
 * the same selection.
 *
 * @param props The ids of the scenes the build baked.
 * @returns The page.
 */
export default function ScenesMovie(props: { baked: string[] }): ReactElement {
  const [filter, setFilter] = useState<IFilter>({ setting: null, query: "" });

  // The query is read once the page runs, then kept equal to the filter.
  useEffect((): void => {
    const params: URLSearchParams = new URLSearchParams(window.location.search);
    const setting: string | null = params.get("setting");
    setFilter({
      setting: (IScene.SETTINGS as readonly string[]).includes(setting ?? "")
        ? (setting as IScene.Setting)
        : null,
      query: params.get("q") ?? "",
    });
  }, []);
  const change = (next: IFilter): void => {
    setFilter(next);
    const params: URLSearchParams = new URLSearchParams();
    if (next.setting !== null) params.set("setting", next.setting);
    if (next.query !== "") params.set("q", next.query);
    const query: string = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query === "" ? "" : `?${query}`}`,
    );
  };

  const baked: Set<string> = new Set(props.baked);
  const shown: IScene[] = SCENES.filter(
    (scene: IScene): boolean =>
      scene.hidden !== true &&
      (filter.setting === null || scene.setting === filter.setting) &&
      SceneFacts.matches(scene, filter.query),
  );
  const playing: IScene[] = shown.filter((s: IScene): boolean =>
    baked.has(s.id),
  );
  const coming: IScene[] = shown.filter(
    (s: IScene): boolean => !baked.has(s.id),
  );

  return (
    <div className="am-app" data-pagefind-body>
      <header className="am-app-head">
        <h1>Scenes</h1>
        <p className="am-lede">
          Whole scenes composed from the motion vocabulary. Open one to see it
          replayed with other seeds, bodies and skill, and how it is made.
        </p>
      </header>

      <div className="am-filters" role="search">
        <div className="am-chips" role="group" aria-label="Setting">
          {[null, ...IScene.SETTINGS].map(
            (setting: IScene.Setting | null): ReactElement => (
              <button
                key={setting ?? "all"}
                type="button"
                className="am-chip"
                aria-pressed={filter.setting === setting}
                onClick={(): void => change({ ...filter, setting })}
              >
                {setting === null ? "All" : IScene.SETTING_LABELS[setting]}
              </button>
            ),
          )}
        </div>
        <label className="am-search">
          <span className="am-visually-hidden">Search scenes</span>
          <input
            type="search"
            placeholder="Search: sword, sit, wave"
            value={filter.query}
            onChange={(event): void =>
              change({ ...filter, query: event.target.value })
            }
          />
        </label>
      </div>

      {IScene.SETTINGS.map((setting: IScene.Setting): ReactElement | null => {
        const group: IScene[] = playing.filter(
          (s: IScene): boolean => s.setting === setting,
        );
        if (group.length === 0) return null;
        return (
          <section key={setting} aria-labelledby={`am-setting-${setting}`}>
            <h2 id={`am-setting-${setting}`}>
              {IScene.SETTING_LABELS[setting]}
            </h2>
            <ul className="am-scene-grid">
              {group.map(
                (scene: IScene): ReactElement => (
                  <SceneCard key={scene.id} scene={scene} />
                ),
              )}
            </ul>
          </section>
        );
      })}
      {playing.length === 0 ? (
        <p className="am-status">No scene that plays matches this selection.</p>
      ) : null}

      <section aria-labelledby="am-roadmap" className="am-roadmap">
        <h2 id="am-roadmap">Coming next</h2>
        <p className="am-muted">
          Scenes written for pieces the packages do not have yet. Each turns
          into a playing card on the release that brings its pieces.
        </p>
        <ul className="am-roadmap-list">
          {coming.map(
            (scene: IScene): ReactElement => (
              <li key={scene.id} className="am-roadmap-item">
                <Link href={`/scenes/${scene.id}/`}>
                  <strong>{scene.title}</strong>
                </Link>
                <span className="am-badge">
                  {scene.composition === null
                    ? "Planned"
                    : "Waits on a release"}
                </span>
                <p>{scene.summary}</p>
                <p className="am-muted">
                  {scene.planned?.pieces ??
                    SceneFacts.actions(scene).join(", ")}
                </p>
                <p className="am-issues">
                  Waits on{" "}
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
                </p>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}
