import Link from "next/link";
import type { ReactElement } from "react";

/**
 * The motion reference's list of pages: the overview, the actions, then each
 * family of the lexicon with its number of rows.
 *
 * @param props The families with their row counts, and the page shown.
 * @returns The list.
 */
export function MotionNav(props: {
  families: { name: string; rows: number }[];
  actions: number;
  current: string | null;
}): ReactElement {
  const item: (
    href: string,
    label: string,
    count: number | null,
    key: string | null,
  ) => ReactElement = (
    href: string,
    label: string,
    count: number | null,
    key: string | null,
  ): ReactElement => (
    <li key={href}>
      <Link
        href={href}
        className="am-motion-nav-link"
        aria-current={props.current === key ? "page" : undefined}
      >
        {label}
        {count === null ? null : <span className="am-count">{count}</span>}
      </Link>
    </li>
  );
  return (
    <nav className="am-motion-nav" aria-label="Motion reference">
      <ul className="am-plain">
        {item("/motions/", "Overview", null, null)}
        {item("/motions/actions/", "Actions", props.actions, "actions")}
        {props.families.map(
          (family: { name: string; rows: number }): ReactElement =>
            item(
              `/motions/${family.name}/`,
              family.name,
              family.rows,
              family.name,
            ),
        )}
      </ul>
    </nav>
  );
}
