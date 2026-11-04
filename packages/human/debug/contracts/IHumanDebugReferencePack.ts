/**
 * One reference person's skin as the comparison reads it: the private pack's horizontal sections,
 * by region, read at run time from the checkout's git-ignored `.references/curves/<id>/`
 * (`HumanDebugReferenceFiles`) and never stored in the repository.
 *
 * The frame is the pack's: millimetres, forward +X, up +Y, the body's left +Z, floor at y = 0, which
 * is the viewer's body frame. Each closed curve of a section is a loop of points: the pack's cubic
 * Hermite spans read as their start points and midpoints: this display polyline carries no claimed
 * approximation bound from the original fit tolerance. Valid open arcs retain their final endpoint
 * and stay open; only curves the pack's audit marks broken are left out. A region
 * keeps one section per `step` millimetres of height, the lowest of each run.
 */
export interface IHumanDebugReferencePack {
  /** Reference id, such as `f1`. */
  id: string;

  /** The pack's stature cut: the highest skin point, mm. */
  stature: number;

  /** Least height between two kept sections of a region, mm. */
  step: number;

  /** Regions by the pack's label (`trunk`, `head`, `arm_l`, `leg_r`, `hand_l`, `foot_r`). */
  regions: IHumanDebugReferencePack.IRegion[];
}

export namespace IHumanDebugReferencePack {
  /** One region's kept sections, low to high. */
  export interface IRegion {
    /** The pack's region label. */
    name: string;

    /** Sections by rising height. */
    sections: ISection[];
  }

  /** One horizontal section. */
  export interface ISection {
    /** Height of the cutting plane, mm. */
    y: number;

    /** Closed loops, each as flat `x, z` pairs in mm rounded to 0.1 mm; the section's height is every point's y. */
    loops: number[][];

    /** Open skin arcs as flat `x, z` pairs in mm, including both endpoints; absent means none. */
    arcs?: number[][];
  }
}
