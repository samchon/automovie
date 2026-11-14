import type { Metadata } from "next";
import { type ReactElement, Suspense } from "react";

import { ObjectsHead } from "../../../components/objects/ObjectsHead";
import ObjectsMovie from "../../../movies/ObjectsMovie";
import type { IPlaygroundComposition } from "../../../playground/structures/IPlaygroundComposition";
import { SCENES } from "../../../scenes/SCENES";

export const metadata: Metadata = {
  title: "Objects",
  description:
    "Every archetype of @automovie/archetypes: the things people hold, use, sit on, ride and fight with, with their dimensions and affordances.",
};

/**
 * The object gallery's route. The gallery reads its address, so it renders
 * in the browser, inside a boundary; the exported page carries the heading
 * and a loading note until it does. Which listed scenes place each
 * archetype is read here, while the site is exported, so the page's script
 * carries that index and not the scene records.
 *
 * @returns The page.
 */
export default function ObjectsPage(): ReactElement {
  const uses: Record<string, { id: string; title: string }[]> = {};
  for (const scene of SCENES) {
    if (scene.hidden === true) continue;
    const producers: Set<string> = new Set(
      (scene.composition?.objects ?? []).map(
        (o: IPlaygroundComposition.IObject): string => o.producer,
      ),
    );
    for (const producer of producers)
      (uses[producer] ??= []).push({ id: scene.id, title: scene.title });
  }
  return (
    <Suspense
      fallback={
        <main className="am-app">
          <ObjectsHead />
          <p className="am-status" role="status">
            Loading the archetypes.
          </p>
        </main>
      }
    >
      <ObjectsMovie uses={uses} />
    </Suspense>
  );
}
