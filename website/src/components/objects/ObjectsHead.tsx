import type { ReactElement } from "react";

/**
 * The object gallery's heading, shown by the exported page before the
 * gallery reads its address and by the gallery itself.
 *
 * @returns The heading.
 */
export function ObjectsHead(): ReactElement {
  return (
    <header className="am-app-head">
      <h1>Archetypes</h1>
      <p className="am-lede">
        Explore the objects that make up a scene. Choose a model to inspect its
        variants, dimensions and contact points.
      </p>
    </header>
  );
}
