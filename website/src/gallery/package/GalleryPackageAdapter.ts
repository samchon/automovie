import type { IGalleryAdapter } from "../IGalleryAdapter";
import { GalleryCatalogue } from "./GalleryCatalogue";
import { GalleryStage } from "./GalleryStage";

/**
 * The gallery's adapter over the installed packages: the catalogue read from
 * `@automovie/archetypes`, and a stage that builds and draws each archetype
 * in the browser.
 */
export const GalleryPackageAdapter: IGalleryAdapter = {
  catalogue: GalleryCatalogue.catalogue(),
  mount: GalleryStage.mount,
};
