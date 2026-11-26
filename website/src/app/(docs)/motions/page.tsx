import type { Metadata } from "next";
import type { ReactElement } from "react";

import { GalleryNav } from "../../../components/gallery/GalleryNav";
import { MotionCatalogue } from "../../../components/motions/MotionCatalogue";
import { MotionIndex } from "../../../motions/package/MotionIndex";

export const metadata: Metadata = {
  title: "Motions",
  description:
    "The actions of @automovie/motions by category and family, each with its still, the code that writes it, its API entry and the scenes that use it.",
};

/**
 * The motion catalogue, written while the site is exported from the installed
 * `@automovie/motions` and the baked stills.
 *
 * @returns The page.
 */
export default function MotionsPage(): ReactElement {
  const index: MotionIndex.IIndex = MotionIndex.index();
  return (
    <main className="am-app am-catalogue" data-pagefind-body>
      <header className="am-catalogue-head">
        <h1>Motions</h1>
        <p>
          Each motion is a typed call over the engine&apos;s primitives, and
          each composes with the others: chained, laid over one another or timed
          to another person. Point at a card to see it move; open it for the
          code that writes it, the scenes that use it and a 3D take.
        </p>
      </header>
      <GalleryNav current="motions" />
      <MotionCatalogue index={index} />
    </main>
  );
}
