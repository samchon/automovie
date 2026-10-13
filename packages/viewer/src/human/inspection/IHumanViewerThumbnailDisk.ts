/**
 * Thumbnail storage borrows directory metadata, existence checking and removal for paths selected by its folder policy.
 *
 * @author Samchon
 */
export interface IHumanViewerThumbnailDisk {
  /**
   * The revision directories of the thumbnail folder with their modification times.
   */
  directories(folder: string): { name: string; mtimeMs: number }[];

  /** Whether a file exists. */
  exists(file: string): boolean;

  /** Delete a directory tree. */
  remove(path: string): void;
}
