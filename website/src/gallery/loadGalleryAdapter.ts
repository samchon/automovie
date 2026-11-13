import type { IGalleryAdapter } from "./IGalleryAdapter";

/**
 * Load the gallery's adapter in the browser, as a chunk of its own, so the
 * static page is rendered without evaluating three.js or the packages on the
 * build machine.
 *
 * @returns The adapter over the installed packages.
 */
export async function loadGalleryAdapter(): Promise<IGalleryAdapter> {
  return (await import("./package/GalleryPackageAdapter"))
    .GalleryPackageAdapter;
}
