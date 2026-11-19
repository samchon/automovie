"use client";

import { useSearchParams } from "next/navigation";
import type { ChangeEvent, ReactElement } from "react";

import { ObjectCard } from "../components/objects/ObjectCard";
import { ObjectsHead } from "../components/objects/ObjectsHead";
import { ARCHETYPE_FAMILY_NOTES } from "../gallery/ARCHETYPE_FAMILY_NOTES";
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
 * The archetypes: an index of the families beside a section per family,
 * each a grid of cards drawing the producer's first kind. The search keeps
 * the producers whose name, family or kinds hold every word typed, and lives
 * in the address. An address naming a subject opens that archetype's page
 * instead; the address is read on every navigation, so a link back to the
 * grid shows it.
 *
 * @param props The catalogue, and the listed scenes that place each producer by its export name, which an archetype's page lists.
 * @returns The page.
 */
export default function ObjectsMovie(props: IObjectsProps): ReactElement {
  const params = useSearchParams();
  const query: string = params.get("q") ?? "";
  if (params.has("subject")) return <GalleryMovie uses={props.uses} />;

  const change = (next: string): void => {
    const address: URL = new URL(window.location.href);
    if (next === "") address.searchParams.delete("q");
    else address.searchParams.set("q", next);
    window.history.replaceState(null, "", address);
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
  const groups = props.catalogue.groups.map(
    (group: IGalleryCatalogue.IGroup) => ({ group, shown: group.subjects.filter(matches) }),
  );
  const total: number = props.catalogue.groups.reduce(
    (sum: number, g: IGalleryCatalogue.IGroup): number => sum + g.subjects.length,
    0,
  );
  const shown: number = groups.reduce((sum, g) => sum + g.shown.length, 0);
  const title = (name: string): string => name[0]!.toUpperCase() + name.slice(1);

  return (
    <main className="am-app am-catalogue">
      <ObjectsHead />
      <div className="am-indexed">
        <nav className="am-index-nav" aria-label="Families">
          <label className="am-search">
            <span className="am-visually-hidden">Search archetypes</span>
            <input
              type="search"
              placeholder="Search: chair, sword, cup"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                change(event.target.value)
              }
            />
          </label>
          <p className="am-index-shown" role="status">
            {words.length === 0 ? `${total} archetypes` : `${shown} of ${total} archetypes`}
          </p>
          <ol>
            {groups.map(({ group, shown: kept }) => (
              <li key={group.name}>
                <a href={`#family-${group.name}`}>
                  {title(group.name)}
                  <span>{kept.length}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="am-indexed-body">
          {groups.map(({ group, shown: kept }): ReactElement | null =>
            kept.length === 0 ? null : (
              <section
                key={group.name}
                id={`family-${group.name}`}
                className="am-index-category"
                aria-labelledby={`am-family-${group.name}`}
              >
                <header>
                  <h2 id={`am-family-${group.name}`}>
                    {title(group.name)}
                    <span className="am-catalogue-count">{kept.length}</span>
                  </h2>
                  {ARCHETYPE_FAMILY_NOTES[group.name] === undefined ? null : (
                    <p>{ARCHETYPE_FAMILY_NOTES[group.name]}</p>
                  )}
                </header>
                <ul className="am-object-grid">
                  {kept.map(
                    (subject: IGalleryCatalogue.ISubject): ReactElement => (
                      <ObjectCard key={subject.id} subject={subject} />
                    ),
                  )}
                </ul>
              </section>
            ),
          )}
          {shown === 0 ? (
            <p className="am-status">No archetype matches this search.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
