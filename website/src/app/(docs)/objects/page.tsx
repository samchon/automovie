import type { Metadata } from "next";
import type { ReactElement } from "react";

import ObjectsMovie from "../../../movies/ObjectsMovie";

export const metadata: Metadata = {
  title: "Objects",
  description:
    "Every archetype of @automovie/archetypes: the things people hold, use, sit on, ride and fight with, with their dimensions and affordances.",
};

/**
 * The object gallery's route.
 *
 * @returns The page.
 */
export default function ObjectsPage(): ReactElement {
  return <ObjectsMovie />;
}
