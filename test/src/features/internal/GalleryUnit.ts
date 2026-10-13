import path from "node:path";

import type { createGalleryHostFacts } from "./createGalleryHostFacts";
import { loadSourceModule } from "./loadSourceModule";

type Click = { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean };
type Key = Omit<Click, "button"> & { key: string };
type Backdrop = { dialogTarget: boolean; x: number; y: number; bounds: { left: number; right: number; top: number; bottom: number } };
interface Controller {
  open(index: number, opener: string, click: Click, intercept: () => void): boolean;
  moveBuilding(direction: -1 | 1): void;
  selectView(index: number): void;
  key(input: Key, intercept: () => void): boolean;
  backdrop(input: Backdrop): void;
  close(): void;
  closed(): void;
  dispose(): void;
}
interface Content {
  title: string | null;
  era: string | null;
  description: string | null;
  source: string;
  tour: string | null;
  images: readonly { src: string; alt: string; label: string | undefined }[];
}
interface Selection extends Omit<Content, "images"> {
  count: string;
  image: Content["images"][number];
  caption: string | undefined;
  pressed: boolean[];
}
const directory = path.resolve(__dirname, "../../../../website/src/gallery");

/** Typed access to the actual gallery owners through the existing checked source hook. */
export const GalleryUnit = {
  readBuildings: loadSourceModule<{
    readGalleryBuildings(document: Document): {
      opener: HTMLAnchorElement; title: string | null; era: string | null;
      description: string | null; source: string; tour: HTMLAnchorElement | null;
      images: HTMLImageElement[];
    }[];
  }>(path.join(directory, "readGalleryBuildings.ts")).readGalleryBuildings,
  ImageLifecycle: loadSourceModule<{
    GalleryImageLifecycle: new () => {
      replace(attach: (whenCurrent: (effect: () => void) => void) => (() => void)): void;
      dispose(): void;
    };
  }>(path.join(directory, "GalleryImageLifecycle.ts")).GalleryImageLifecycle,
  selection: loadSourceModule<{
    deriveGallerySelection(content: readonly Content[], building: number, view: number): Selection;
  }>(path.join(directory, "deriveGallerySelection.ts")).deriveGallerySelection,
  shouldDisposePage: loadSourceModule<{
    shouldDisposeGalleryPage(persisted: boolean): boolean;
  }>(path.join(directory, "shouldDisposeGalleryPage.ts")).shouldDisposeGalleryPage,
  Controller: loadSourceModule<{
    GalleryController: new (host: ReturnType<typeof createGalleryHostFacts>["host"], views: readonly number[]) => Controller;
  }>(path.join(directory, "GalleryController.ts")).GalleryController,
  require: loadSourceModule<{
    requireGalleryValue<T>(value: T | null, selector: string): T;
  }>(path.join(directory, "requireGalleryValue.ts")).requireGalleryValue,
};
