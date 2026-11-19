import type { Metadata } from "next";
import type { ReactElement } from "react";

import { MotionCatalogue } from "../../../components/motions/MotionCatalogue";
import { MotionIndex } from "../../../motions/package/MotionIndex";

export const metadata: Metadata = {
  title: "Motions",
  description:
    "Every action and named row of @automovie/motions, by category and family, each with its still, its parameters and the scenes that use it.",
};

/**
 * The motion catalogue, written while the site is exported from the
 * installed `@automovie/motions` and the baked stills.
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
          The vocabulary a performance is composed from: {index.total} actions
          and named rows. Point at a card to see the motion; open it for its
          parameters, the scenes that use it and a 3D take.
        </p>
      </header>
      <MotionCatalogue index={index} />
    </main>
  );
}
