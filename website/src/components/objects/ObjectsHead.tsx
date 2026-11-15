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
      <h1>Objects</h1>
      <p className="am-lede">
        The things people hold, use, sit on, ride and fight with: every
        archetype of <code>@automovie/archetypes</code>, built in your browser.
        Each declares the contacts an action attaches to.
      </p>
    </header>
  );
}
