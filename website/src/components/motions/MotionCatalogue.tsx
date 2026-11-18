"use client";

import Link from "next/link";
import { type ChangeEvent, type ReactElement, useState } from "react";

interface IMotionGroup {
  name: string;
  motions: string[];
}

interface IMotionCatalogueProps {
  groups: IMotionGroup[];
}

/** Search the installed vocabulary by motion or family and open its reference entry. */
export function MotionCatalogue(props: IMotionCatalogueProps): ReactElement {
  const [query, setQuery] = useState<string>("");
  const words: string[] = query.trim().toLowerCase().split(/\s+/);
  const groups: IMotionGroup[] = props.groups
    .map(
      (group: IMotionGroup): IMotionGroup => ({
        name: group.name,
        motions: group.motions.filter((motion: string): boolean =>
          words.every((word: string): boolean =>
            (group.name + " " + motion).toLowerCase().includes(word),
          ),
        ),
      }),
    )
    .filter((group: IMotionGroup): boolean => group.motions.length > 0);
  return (
    <section className="am-stack" aria-label="Motion catalogue">
      <label className="am-search">
        <span className="am-visually-hidden">Search motions and families</span>
        <input
          type="search"
          placeholder="Search motions and families"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            setQuery(event.target.value)
          }
        />
      </label>
      {groups.length === 0 ? (
        <p role="status">No motions match your search.</p>
      ) : (
        <div className="am-family-grid">
          {groups.map(
            (group: IMotionGroup): ReactElement => (
              <details
                className="am-panel am-motion-group"
                key={group.name}
                open={query.trim() === "" ? undefined : true}
              >
                <summary>
                  {group.name}
                  <span className="am-count">{group.motions.length}</span>
                </summary>
                <ul className="am-motion-index">
                  {group.motions.map(
                    (motion: string): ReactElement => (
                      <li key={motion}>
                        <Link
                          prefetch={false}
                          href={`/motions/${group.name}/#${motion}`}
                        >
                          {motion}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </details>
            ),
          )}
        </div>
      )}
    </section>
  );
}
