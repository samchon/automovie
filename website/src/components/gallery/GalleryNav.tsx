import Link from "next/link";
import type { ReactElement } from "react";

/** The catalogues that share the gallery's navigation. */
const SECTIONS = [
  { id: "gallery", label: "Overview", href: "/gallery/" },
  { id: "motions", label: "Motions", href: "/motions/" },
  { id: "archetypes", label: "Archetypes", href: "/archetypes/" },
] as const;

/** Links between the gallery and its two catalogues. */
export function GalleryNav(props: {
  current: (typeof SECTIONS)[number]["id"];
}): ReactElement {
  return (
    <nav className="am-gallery-nav" aria-label="Gallery sections">
      {SECTIONS.map(
        ({ id, label, href }): ReactElement => (
          <Link
            key={id}
            href={href}
            aria-current={id === props.current ? "page" : undefined}
          >
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
