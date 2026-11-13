"use client";

import { type ReactElement, useEffect, useState } from "react";

import { ObjectCard } from "../components/objects/ObjectCard";
import type { IGalleryAdapter } from "../gallery/IGalleryAdapter";
import { loadGalleryAdapter } from "../gallery/loadGalleryAdapter";
import type { IGalleryCatalogue } from "../gallery/structures/IGalleryCatalogue";
import GalleryMovie from "./GalleryMovie";

/** What the page shows: the grid, or one subject the address names. */
type Mode =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "grid"; catalogue: IGalleryCatalogue }
  | { kind: "subject" };

/**
 * The object gallery: every archetype the packages export as a card,
 * grouped by family, with family chips and a filter kept in the address.
 * An address naming a subject opens that archetype's page instead.
 *
 * @returns The page.
 */
export default function ObjectsMovie(): ReactElement {
  const [mode, setMode] = useState<Mode>({ kind: "loading" });
  const [family, setFamily] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  useEffect((): (() => void) => {
    let alive: boolean = true;
    const params: URLSearchParams = new URLSearchParams(window.location.search);
    if (params.has("subject")) {
      setMode({ kind: "subject" });
      return (): void => undefined;
    }
    setFamily(params.get("family"));
    setQuery(params.get("q") ?? "");
    loadGalleryAdapter()
      .then((adapter: IGalleryAdapter): void => {
        if (alive) setMode({ kind: "grid", catalogue: adapter.catalogue });
      })
      .catch((error: unknown): void => {
        if (alive)
          setMode({
            kind: "failed",
            message: error instanceof Error ? error.message : String(error),
          });
      });
    return (): void => {
      alive = false;
    };
  }, []);

  if (mode.kind === "subject") return <GalleryMovie />;

  const change = (nextFamily: string | null, nextQuery: string): void => {
    setFamily(nextFamily);
    setQuery(nextQuery);
    const params: URLSearchParams = new URLSearchParams();
    if (nextFamily !== null) params.set("family", nextFamily);
    if (nextQuery !== "") params.set("q", nextQuery);
    const text: string = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${text === "" ? "" : `?${text}`}`,
    );
  };
  const words: string[] = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w: string): boolean => w !== "");
  const matches = (subject: IGalleryCatalogue.ISubject): boolean => {
    const text: string = [
      subject.label,
      subject.group,
      ...subject.variants.map((v: { label: string }): string => v.label),
    ]
      .join(" ")
      .toLowerCase();
    return words.every((w: string): boolean => text.includes(w));
  };

  return (
    <div className="am-app">
      <header className="am-app-head">
        <h1>Objects</h1>
        <p className="am-lede">
          The things people hold, use, sit on, ride and fight with: every
          archetype of <code>@automovie/archetypes</code>, built in your
          browser. Each declares the contacts an action attaches to.
        </p>
      </header>
      {mode.kind === "loading" ? (
        <p className="am-status" role="status">
          Loading the archetypes.
        </p>
      ) : mode.kind === "failed" ? (
        <div className="am-alert" role="alert">
          <h2>The archetypes did not load</h2>
          <pre className="am-message">{mode.message}</pre>
        </div>
      ) : (
        <>
          <div className="am-filters" role="search">
            <div className="am-chips" role="group" aria-label="Family">
              {[null, ...mode.catalogue.groups.map((g: IGalleryCatalogue.IGroup): string => g.name)].map(
                (name: string | null): ReactElement => (
                  <button
                    key={name ?? "all"}
                    type="button"
                    className="am-chip"
                    aria-pressed={family === name}
                    onClick={(): void => change(name, query)}
                  >
                    {name === null ? "All" : name[0]!.toUpperCase() + name.slice(1)}
                  </button>
                ),
              )}
            </div>
            <label className="am-search">
              <span className="am-visually-hidden">Search objects</span>
              <input
                type="search"
                placeholder="Search: chair, hinge, sword"
                value={query}
                onChange={(event): void => change(family, event.target.value)}
              />
            </label>
          </div>
          {mode.catalogue.groups
            .filter((g: IGalleryCatalogue.IGroup): boolean => family === null || g.name === family)
            .map((group: IGalleryCatalogue.IGroup): ReactElement | null => {
              const shown: IGalleryCatalogue.ISubject[] = group.subjects.filter(matches);
              if (shown.length === 0) return null;
              return (
                <section key={group.name} aria-labelledby={`am-family-${group.name}`}>
                  <h2 id={`am-family-${group.name}`}>
                    {group.name[0]!.toUpperCase() + group.name.slice(1)}
                  </h2>
                  <ul className="am-object-grid">
                    {shown.map(
                      (subject: IGalleryCatalogue.ISubject): ReactElement => (
                        <ObjectCard key={subject.id} subject={subject} />
                      ),
                    )}
                  </ul>
                </section>
              );
            })}
        </>
      )}
    </div>
  );
}
