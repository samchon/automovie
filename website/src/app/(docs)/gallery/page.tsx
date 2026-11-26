import type { Metadata } from "next";
import type { ReactElement } from "react";

import { BakedManifest } from "../../../baked/BakedManifest";
import type { IBakedManifest } from "../../../baked/IBakedManifest";
import { GalleryNav } from "../../../components/gallery/GalleryNav";
import { GallerySavedTake } from "../../../components/gallery/GallerySavedTake";
import { SceneCard } from "../../../components/scenes/SceneCard";
import { SCENES } from "../../../scenes/SCENES";
import { GALLERY_MOTION_EXAMPLES } from "../../../scenes/data/GALLERY_MOTION_EXAMPLES";
import type { IScene } from "../../../scenes/structures/IScene";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Explore 3D motion examples, the motions that compose them, and the objects they use.",
};

/**
 * The shared entry to the motion and archetype catalogues, with applied takes.
 *
 * @returns The page.
 */
export default function GalleryPage(): ReactElement {
  const manifest: IBakedManifest = BakedManifest.read();
  const examples: readonly IScene[] = [
    ...GALLERY_MOTION_EXAMPLES,
    ...SCENES.filter((scene: IScene): boolean => scene.id === "high-jump"),
  ];
  return (
    <main className="am-app am-catalogue am-gallery-hub" data-pagefind-body>
      <header className="am-catalogue-head">
        <h1>Gallery</h1>
        <p>See how motions, people and objects come together in 3D takes.</p>
      </header>
      <GalleryNav current="gallery" />
      <GallerySavedTake />
      <section aria-labelledby="am-gallery-examples">
        <h2 id="am-gallery-examples">Motion examples</h2>
        <ul className="am-scene-grid">
          {examples.map((scene: IScene): ReactElement => {
            const take: IBakedManifest.IEntry | undefined =
              manifest.scenes[scene.id];
            return (
              <SceneCard
                key={scene.id}
                scene={scene}
                baked={take !== undefined}
                seconds={take?.duration}
              />
            );
          })}
        </ul>
      </section>
    </main>
  );
}
