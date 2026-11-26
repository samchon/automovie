import type { ReactElement } from "react";

import { GalleryNav } from "../gallery/GalleryNav";

/**
 * The archetypes' heading, shown by the exported page before the gallery reads
 * its address and by the gallery itself.
 *
 * @returns The heading.
 */
export function ObjectsHead(): ReactElement {
  return (
    <>
      <header className="am-catalogue-head">
        <h1>Archetypes</h1>
        <p>
          Coarse seeded models of what people act with. Each states where a body
          meets it, a seat, a grip, a rest, so an action finds the contact
          without a coordinate written by hand. Open one for its kinds,
          dimensions and contact points.
        </p>
      </header>
      <GalleryNav current="archetypes" />
    </>
  );
}
