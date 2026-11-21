"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

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

/** The order the gallery shows the settings in: the scenes that show the most motion first. */
const ORDER: readonly IScene.Setting[] = [
  "combat",
  "sport",
  "partner",
  "gym",
  "street",
  "everyday",
  "work",
  "ride",
  "troops",
];

/**
 * The scene gallery: every scene that plays, as a card with its still,
 * grouped by setting, and below them a folded list of the scenes still
 * waiting on pieces the packages do not have.
 *
 * The setting and the search live in the address's query, so a link shows
 * the same selection.
 *
 * @param props The ids of the scenes that play, and the length in seconds of each whose first take was baked.
 * @returns The page.
 */
export default function ScenesMovie(props: {
  playing: string[];
  baked: Record<string, number>;
}): ReactElement {
  const [filter, setFilter]: [IFilter, Dispatch<SetStateAction<IFilter>>] =
    useState<IFilter>({ setting: null, query: "" });

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
  const change: (next: IFilter) => void = (next: IFilter): void => {
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

  const playing: Set<string> = new Set(props.playing);
  const baked: Record<string, number> = props.baked;
  const listed: IScene[] = SCENES.filter(
    (s: IScene): boolean => s.hidden !== true,
  );
  const shown: IScene[] = listed.filter(
    (scene: IScene): boolean =>
      playing.has(scene.id) &&
      (filter.setting === null || scene.setting === filter.setting) &&
      SceneFacts.matches(scene, filter.query),
  );
  const settings: IScene.Setting[] = ORDER.filter(
    (setting: IScene.Setting): boolean =>
      listed.some(
        (s: IScene): boolean => s.setting === setting && playing.has(s.id),
      ),
  );
  const coming: IScene[] = listed.filter(
    (s: IScene): boolean => !playing.has(s.id),
  );

  return (
    <main className="am-app am-catalogue" data-pagefind-body>
      <header className="am-catalogue-head">
        <h1>Scene studies</h1>
        <p>
          Short studies of what the motion vocabulary composes: a bout, a rally,
          a class, a crowd. Point at one to play it; open it for its takes, its
          timeline and the code that writes it.
        </p>
      </header>

      <div className="am-catalogue-bar" role="search">
        <div className="am-chips" role="group" aria-label="Setting">
          {[null, ...settings].map(
            (setting: IScene.Setting | null): ReactElement => (
              <button
                key={setting ?? "all"}
                type="button"
                className="am-chip"
                aria-pressed={filter.setting === setting}
                onClick={(): void => change({ ...filter, setting })}
              >
                {setting === null ? "All" : IScene.SETTING_LABELS[setting]}
                <span className="am-chip-count">
                  {setting === null
                    ? listed.filter((s: IScene): boolean => playing.has(s.id))
                        .length
                    : listed.filter(
                        (s: IScene): boolean =>
                          s.setting === setting && playing.has(s.id),
                      ).length}
                </span>
              </button>
            ),
          )}
        </div>
        <label className="am-search">
          <span className="am-visually-hidden">Search scenes</span>
          <input
            type="search"
            placeholder="Search: kick, sword, sit, wave"
            value={filter.query}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              change({ ...filter, query: event.target.value })
            }
          />
        </label>
      </div>

      {settings.map((setting: IScene.Setting): ReactElement | null => {
        const group: IScene[] = shown.filter(
          (s: IScene): boolean => s.setting === setting,
        );
        if (group.length === 0) return null;
        return (
          <section
            key={setting}
            className="am-catalogue-group"
            aria-labelledby={`am-setting-${setting}`}
          >
            <h2 id={`am-setting-${setting}`}>
              {IScene.SETTING_LABELS[setting]}
              <span className="am-catalogue-count">{group.length}</span>
            </h2>
            <ul className="am-scene-grid">
              {group.map(
                (scene: IScene): ReactElement => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    baked={baked[scene.id] !== undefined}
                    seconds={baked[scene.id]}
                  />
                ),
              )}
            </ul>
          </section>
        );
      })}
      {shown.length === 0 ? (
        <p className="am-status">No scene matches this selection.</p>
      ) : null}

      {coming.length === 0 ? null : (
        <details className="am-roadmap">
          <summary>
            In the works{" "}
            <span className="am-catalogue-count">{coming.length}</span>
          </summary>
          <p className="am-muted">
            Scenes written for pieces the packages do not have yet. Each joins
            the scene studies on the release that brings its pieces.
          </p>
          <ul className="am-roadmap-list">
            {coming.map(
              (scene: IScene): ReactElement => (
                <li key={scene.id}>
                  <Link href={`/scenes/${scene.id}/`}>{scene.title}</Link>
                  <span>{scene.summary}</span>
                </li>
              ),
            )}
          </ul>
        </details>
      )}
    </main>
  );
}
