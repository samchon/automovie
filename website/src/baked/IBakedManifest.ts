/**
 * What the build baked, written beside the files as `baked/manifest.json`. A
 * page reads it while the site is exported to know which stills and takes
 * exist, and draws a placeholder for the rest, so a site served before any bake
 * still works.
 */
export interface IBakedManifest {
  /** The manifest's format marker. Takes carry their own sample-width magic. */
  format: string;

  /** The baked scenes by id. */
  scenes: Record<string, IBakedManifest.IEntry>;

  /** The baked motions by name. */
  motions: Record<string, IBakedManifest.IEntry>;
}
export namespace IBakedManifest {
  /** One baked take. */
  export interface IEntry {
    /** The take's length, seconds. */
    duration: number;

    /** Bytes of its compressed take, so a page can say what a click loads. */
    bytes: number;

    /**
     * `BakedManifest.hash` of the composition it was computed from, so a take
     * baked before the composition changed is not played as current.
     */
    composition: string;
  }
}
