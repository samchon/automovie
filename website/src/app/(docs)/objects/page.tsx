import type { Metadata } from "next";
import { type ReactElement, Suspense } from "react";

import { ObjectsHead } from "../../../components/objects/ObjectsHead";
import ObjectsMovie from "../../../movies/ObjectsMovie";

export const metadata: Metadata = {
  title: "Objects",
  description:
    "Every archetype of @automovie/archetypes: the things people hold, use, sit on, ride and fight with, with their dimensions and affordances.",
};

/**
 * The object gallery's route. The gallery reads its address, so it renders
 * in the browser, inside a boundary; the exported page carries the heading
 * and a loading note until it does.
 *
 * @returns The page.
 */
export default function ObjectsPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="am-app">
          <ObjectsHead />
          <p className="am-status" role="status">
            Loading the archetypes.
          </p>
        </div>
      }
    >
      <ObjectsMovie />
    </Suspense>
  );
}
