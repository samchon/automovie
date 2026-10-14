import { GalleryController } from "../../../../website/src/gallery/GalleryController";
import { GalleryImageLifecycle } from "../../../../website/src/gallery/GalleryImageLifecycle";
import { deriveGallerySelection } from "../../../../website/src/gallery/deriveGallerySelection";
import { readGalleryBuildings } from "../../../../website/src/gallery/readGalleryBuildings";
import { requireGalleryValue } from "../../../../website/src/gallery/requireGalleryValue";
import { shouldDisposeGalleryPage } from "../../../../website/src/gallery/shouldDisposeGalleryPage";

/**
 * Keep the existing unit aliases over direct product imports. These are the actual policy and content-reader owners; their types come from the products, without a handwritten constructor protocol or a separate source loader. Portable policy facts do not certify native modal, layout or image effects.
 */
export const GalleryUnit: {
  readBuildings: typeof readGalleryBuildings;
  ImageLifecycle: typeof GalleryImageLifecycle;
  selection: typeof deriveGallerySelection;
  shouldDisposePage: typeof shouldDisposeGalleryPage;
  Controller: typeof GalleryController;
  require: typeof requireGalleryValue;
} = {
  readBuildings: readGalleryBuildings,
  ImageLifecycle: GalleryImageLifecycle,
  selection: deriveGallerySelection,
  shouldDisposePage: shouldDisposeGalleryPage,
  Controller: GalleryController,
  require: requireGalleryValue,
};
