import type { Metadata } from "next";
import type { ReactElement } from "react";

import HumanMovie from "../../../movies/HumanMovie";
import { PLAYGROUND_BODIES } from "../../../playground/data/PLAYGROUND_BODIES";
import type { IPlaygroundVocabulary } from "../../../playground/structures/IPlaygroundVocabulary";
import { SCENES } from "../../../scenes/SCENES";
import type { IScene } from "../../../scenes/structures/IScene";

export const metadata: Metadata = {
  title: "Human",
  description:
    "The polygon man: every body the site performs with, its measures, and the inspector a production looks at a figure with.",
};

/**
 * The Human page's route. The bodies' ids and labels are read from
 * `PLAYGROUND_BODIES` while the site is exported, and the hidden scene that
 * stands them side by side from the scene records, so the page's script
 * carries that one record and no body parameters; the page computes the
 * lineup and the measures in the browser.
 *
 * @returns The page.
 */
export default function HumanPage(): ReactElement {
  return (
    <HumanMovie
      lineup={SCENES.find((s: IScene): boolean => s.id === "lineup")!}
      bodies={Object.entries(PLAYGROUND_BODIES)
        .map(
          ([id, body]: [
            string,
            PLAYGROUND_BODIES.IEntry,
          ]): IPlaygroundVocabulary.IBody => ({
            id,
            label: body.label,
          }),
        )
        .sort(
          (
            a: IPlaygroundVocabulary.IBody,
            b: IPlaygroundVocabulary.IBody,
          ): number => a.id.localeCompare(b.id),
        )}
    />
  );
}
