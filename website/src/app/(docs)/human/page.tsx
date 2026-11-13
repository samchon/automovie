import type { Metadata } from "next";
import type { ReactElement } from "react";

import type { IHumanEntry } from "../../../human/structures/IHumanEntry";
import HumanMovie from "../../../movies/HumanMovie";
import { readBakedManifest } from "../../../scenes/readBakedManifest";
import type { ISceneManifest } from "../../../scenes/structures/ISceneManifest";

export const metadata: Metadata = {
  title: "Human",
  description:
    "The polygon man: every body the site performs with, its measures, and the inspector a production looks at a figure with.",
};

/**
 * The Human page's route. The bodies and their measures are read from the
 * bake while the site is exported.
 *
 * @returns The page.
 */
export default function HumanPage(): ReactElement {
  const manifest: ISceneManifest | null = readBakedManifest();
  return (
    <HumanMovie
      bodies={Object.entries(manifest?.bodies ?? {})
        .map(
          ([id, body]: [string, ISceneManifest.IBody]): IHumanEntry => ({
            id,
            label: body.label,
            measures: body.measures,
          }),
        )
        .sort((a: IHumanEntry, b: IHumanEntry): number =>
          a.id.localeCompare(b.id),
        )}
    />
  );
}
