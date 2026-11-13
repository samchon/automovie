"use client";

import { type ReactElement, useState } from "react";

import type { IGalleryCatalogue } from "../../gallery/structures/IGalleryCatalogue";

/**
 * The catalogue: every subject under its group, with a filter.
 *
 * On a wide screen it is a list beside the view. On a narrow one the same
 * subjects are one grouped select above it, so the view stays on screen
 * while a subject is chosen.
 *
 * @param props The catalogue, the chosen subject and the listener.
 * @returns The navigation.
 */
export function GalleryCatalogueNav(props: {
  /** The catalogue. */
  catalogue: IGalleryCatalogue;

  /** The id of the subject shown. */
  selected: string;

  /** Hear the id of the subject chosen. */
  onSelect: (subject: string) => void;
}): ReactElement {
  const [filter, setFilter] = useState<string>("");
  const wanted: string = filter.trim().toLowerCase();
  const groups: IGalleryCatalogue.IGroup[] = props.catalogue.groups
    .map(
      (group: IGalleryCatalogue.IGroup): IGalleryCatalogue.IGroup => ({
        ...group,
        subjects: group.subjects.filter(
          (subject: IGalleryCatalogue.ISubject): boolean =>
            wanted === "" ||
            subject.label.toLowerCase().includes(wanted) ||
            group.name.toLowerCase().includes(wanted) ||
            subject.variants.some((v): boolean =>
              v.label.toLowerCase().includes(wanted),
            ),
        ),
      }),
    )
    .filter((group: IGalleryCatalogue.IGroup): boolean => group.subjects.length !== 0);

  return (
    <nav className="am-catalogue" aria-label="Catalogue">
      <label className="am-field am-catalogue-select">
        <span className="am-label">Subject</span>
        <select
          value={props.selected}
          onChange={(event): void => props.onSelect(event.target.value)}
        >
          {props.catalogue.groups.map(
            (group: IGalleryCatalogue.IGroup): ReactElement => (
              <optgroup key={group.name} label={group.name}>
                {group.subjects.map(
                  (subject: IGalleryCatalogue.ISubject): ReactElement => (
                    <option key={subject.id} value={subject.id}>
                      {subject.label}
                    </option>
                  ),
                )}
              </optgroup>
            ),
          )}
        </select>
      </label>

      <div className="am-catalogue-list">
        <label className="am-field">
          <span className="am-label">Filter</span>
          <input
            type="search"
            value={filter}
            placeholder="chair, hinge, sword"
            onChange={(event): void => setFilter(event.target.value)}
          />
        </label>
        {groups.length === 0 ? (
          <p className="am-muted">Nothing matches the filter.</p>
        ) : null}
        {groups.map(
          (group: IGalleryCatalogue.IGroup): ReactElement => (
            <section key={group.name}>
              <h3 className="am-overline">{group.name}</h3>
              <ul>
                {group.subjects.map(
                  (subject: IGalleryCatalogue.ISubject): ReactElement => (
                    <li key={subject.id}>
                      <button
                        type="button"
                        className="am-catalogue-item"
                        aria-current={
                          subject.id === props.selected ? "true" : undefined
                        }
                        onClick={(): void => props.onSelect(subject.id)}
                      >
                        <span>{subject.label}</span>
                        {subject.variants.length > 1 ? (
                          <span className="am-count">
                            {subject.variants.length}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </section>
          ),
        )}
      </div>
    </nav>
  );
}
