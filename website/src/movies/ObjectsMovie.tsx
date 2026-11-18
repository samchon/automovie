"use client";

import { useSearchParams } from "next/navigation";
import type { ChangeEvent, ReactElement } from "react";

import { ObjectCard } from "../components/objects/ObjectCard";
import { ObjectsHead } from "../components/objects/ObjectsHead";
import type { IGalleryCatalogue } from "../gallery/structures/IGalleryCatalogue";
import GalleryMovie from "./GalleryMovie";

interface IObjectsProps {
  catalogue: IGalleryCatalogue;
  uses: Record<string, ISceneLink[]>;
}

interface ISceneLink {
  id: string;
  title: string;
}

/**
 * The object gallery: every archetype the packages export as a card,
 * grouped by family, with family chips and a filter kept in the address.
 * An address naming a subject opens that archetype's page instead; the
 * address is read on every navigation, so a link back to the grid shows it.
 * A search that keeps no object says so.
 *
 * @param props The listed scenes that place each producer, by producer's export name, which an archetype's page lists.
 * @returns The page.
 */
export default function ObjectsMovie(props: IObjectsProps): ReactElement {
  const params = useSearchParams();
  const family: string | null = params.get("family");
  const query: string = params.get("q") ?? "";
  if (params.has("subject")) return <GalleryMovie uses={props.uses} />;

  const change = (nextFamily: string | null, nextQuery: string): void => {
    const address: URL = new URL(window.location.href);
    if (nextFamily === null) address.searchParams.delete("family");
    else address.searchParams.set("family", nextFamily);
    if (nextQuery === "") address.searchParams.delete("q");
    else address.searchParams.set("q", nextQuery);
    window.history.replaceState(null, "", address);
  };
  const words: string[] = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w: string): boolean => w !== "");
  const matches: (subject: IGalleryCatalogue.ISubject) => boolean = (
    subject: IGalleryCatalogue.ISubject,
  ): boolean => {
    const text: string = [
      subject.label,
      subject.group,
      ...subject.variants.map((v: { label: string }): string => v.label),
    ]
      .join(" ")
      .toLowerCase();
    return words.every((w: string): boolean => text.includes(w));
  };

  // The groups the chips select, each with the subjects the search keeps.
  const groups: {
    group: IGalleryCatalogue.IGroup;
    shown: IGalleryCatalogue.ISubject[];
  }[] = props.catalogue.groups
    .filter(
      (g: IGalleryCatalogue.IGroup): boolean =>
        family === null || g.name === family,
    )
    .map(
      (
        group: IGalleryCatalogue.IGroup,
      ): {
        group: IGalleryCatalogue.IGroup;
        shown: IGalleryCatalogue.ISubject[];
      } => ({ group, shown: group.subjects.filter(matches) }),
    );

  return (
    <main className="am-app am-catalogue am-library">
      <ObjectsHead />
      <div className="am-filters" role="search">
        <div className="am-chips" role="group" aria-label="Family">
          {[
            null,
            ...props.catalogue.groups.map(
              (g: IGalleryCatalogue.IGroup): string => g.name,
            ),
          ].map(
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
            placeholder="Search models and variants"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              change(family, event.target.value)
            }
          />
        </label>
      </div>
      {groups.map(
        ({
          group,
          shown,
        }: {
          group: IGalleryCatalogue.IGroup;
          shown: IGalleryCatalogue.ISubject[];
        }): ReactElement | null => {
          if (shown.length === 0) return null;
          return (
            <section
              key={group.name}
              aria-labelledby={`am-family-${group.name}`}
            >
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
        },
      )}
      {groups.every(
        (g: { shown: IGalleryCatalogue.ISubject[] }): boolean =>
          g.shown.length === 0,
      ) ? (
        <p className="am-status">No object matches this selection.</p>
      ) : null}
    </main>
  );
}
