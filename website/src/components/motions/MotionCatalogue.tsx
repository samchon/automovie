"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import { SITE_BASE } from "../../SITE_BASE";
import { BakedClient } from "../../baked/BakedClient";
import type { MotionIndex } from "../../motions/package/MotionIndex";
import { FigureCanvas } from "../figure/FigureCanvas";

/**
 * The motion catalogue: an index of categories and families beside a
 * section per family, each a grid of cards with the motion's still. Pointing
 * at a card plays the motion in place, flat; opening it shows the motion's
 * page with the 3D player, the parameters and the scenes that use it. The
 * search keeps the cards whose name holds every word typed, and lives in
 * the address's query.
 *
 * An address naming a motion in its fragment, as a scene's action tag
 * writes it, goes on to that motion's page.
 *
 * @param props The catalogue.
 * @returns The page's body.
 */
export function MotionCatalogue(props: {
  index: MotionIndex.IIndex;
}): ReactElement {
  const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
    useState<string>("");

  useEffect((): void => {
    const hash: string = decodeURIComponent(window.location.hash.slice(1));
    const known: boolean = props.index.categories.some(
      (c: MotionIndex.ICategory): boolean =>
        c.families.some((f: MotionIndex.IFamily): boolean =>
          f.motions.some((m: MotionIndex.IEntry): boolean => m.name === hash),
        ),
    );
    if (known) {
      window.location.replace(`${SITE_BASE}/motions/${hash}/`);
      return;
    }
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [props.index]);

  const change: (value: string) => void = (value: string): void => {
    setQuery(value);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${value === "" ? "" : `?q=${encodeURIComponent(value)}`}${window.location.hash}`,
    );
  };
  const words: string[] = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches: (
    entry: MotionIndex.IEntry,
    family: MotionIndex.IFamily,
  ) => boolean = (
    entry: MotionIndex.IEntry,
    family: MotionIndex.IFamily,
  ): boolean =>
    words.every(
      (w: string): boolean =>
        entry.name.toLowerCase().includes(w) ||
        family.label.toLowerCase().includes(w),
    );

  // A family's motions the search keeps.
  const kept: (family: MotionIndex.IFamily) => MotionIndex.IEntry[] = (
    family: MotionIndex.IFamily,
  ): MotionIndex.IEntry[] =>
    family.motions.filter((m: MotionIndex.IEntry): boolean =>
      matches(m, family),
    );
  const shown: number = props.index.categories.reduce(
    (sum: number, c: MotionIndex.ICategory): number =>
      sum +
      c.families.reduce(
        (s: number, f: MotionIndex.IFamily): number => s + kept(f).length,
        0,
      ),
    0,
  );

  return (
    <div className="am-indexed">
      <nav className="am-index-nav" aria-label="Families">
        <label className="am-search">
          <span className="am-visually-hidden">Search motions</span>
          <input
            type="search"
            placeholder="Search: kick, bow, sit"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              change(event.target.value)
            }
          />
        </label>
        <p className="am-index-shown" role="status">
          {words.length === 0 ? "" : `${shown} found`}
        </p>
        <ol>
          {props.index.categories.map(
            (category: MotionIndex.ICategory): ReactElement => (
              <li key={category.id}>
                <a href={`#${category.id}`} className="am-index-category-link">
                  {category.title}
                </a>
                <ol>
                  {category.families.map(
                    (family: MotionIndex.IFamily): ReactElement => (
                      <li key={family.name}>
                        <a href={`#family-${family.name}`}>
                          {family.label}
                          <span>{kept(family).length}</span>
                        </a>
                      </li>
                    ),
                  )}
                </ol>
              </li>
            ),
          )}
        </ol>
      </nav>

      <div className="am-indexed-body">
        {props.index.categories.map(
          (category: MotionIndex.ICategory): ReactElement | null => {
            const families: MotionIndex.IFamily[] = category.families.filter(
              (f: MotionIndex.IFamily): boolean => kept(f).length !== 0,
            );
            if (families.length === 0) return null;
            return (
              <section
                key={category.id}
                id={category.id}
                className="am-index-category"
              >
                <header>
                  <h2>{category.title}</h2>
                  <p>{category.summary}</p>
                </header>
                {families.map(
                  (family: MotionIndex.IFamily): ReactElement => (
                    <section
                      key={family.name}
                      id={`family-${family.name}`}
                      className="am-index-family"
                      aria-labelledby={`am-family-${family.name}`}
                    >
                      <h3
                        id={`am-family-${family.name}`}
                        className={
                          category.families.length === 1
                            ? "am-visually-hidden"
                            : undefined
                        }
                      >
                        {family.label}
                        <span className="am-catalogue-count">
                          {kept(family).length}
                        </span>
                      </h3>
                      <ul className="am-motion-grid">
                        {kept(family).map(
                          (entry: MotionIndex.IEntry): ReactElement => (
                            <MotionCard
                              key={entry.name}
                              entry={entry}
                              opening={props.index.opening}
                            />
                          ),
                        )}
                      </ul>
                    </section>
                  ),
                )}
              </section>
            );
          },
        )}
        {shown === 0 ? (
          <p className="am-status">No motion matches this search.</p>
        ) : null}
      </div>
    </div>
  );
}

/** One motion's card: its still, and the motion playing flat while pointed at or focused. */
function MotionCard(props: {
  entry: MotionIndex.IEntry;
  opening: number;
}): ReactElement {
  const { entry }: { entry: MotionIndex.IEntry } = props;
  const [live, setLive]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  const playable: boolean = entry.poster?.kind === "motion";
  return (
    <li
      className="am-motion-card"
      onPointerEnter={(): void => setLive(playable)}
      onPointerLeave={(): void => setLive(false)}
      onFocus={(): void => setLive(playable)}
      onBlur={(): void => setLive(false)}
    >
      <a href={`${SITE_BASE}/motions/${entry.name}/`} id={entry.name}>
        <span
          className="am-motion-card-view"
          data-scene={entry.poster?.kind === "scene"}
        >
          {entry.poster === null ? (
            <span className="am-motion-card-none" aria-hidden="true">
              no scene yet
            </span>
          ) : (
            <img
              src={BakedClient.address(
                entry.poster.kind,
                entry.poster.id,
                "svg",
              )}
              alt=""
              width={240}
              height={180}
              loading="lazy"
              decoding="async"
            />
          )}
          {live ? (
            <FigureCanvas
              kind="motion"
              id={entry.name}
              view="three-quarter"
              label=""
              from={props.opening}
            />
          ) : null}
        </span>
        <span className="am-motion-card-name">{entry.name}</span>
        <span className="am-motion-card-facts">
          {entry.poster?.kind === "scene" ? "in a scene" : ""}
        </span>
      </a>
    </li>
  );
}
