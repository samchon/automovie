import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/** Explicit model-authoring material courses of the retained trunk. */
export namespace AutoMovieHumanTrunkCourses {
  /** Independent authored sites, distinct from clinical measurement protocols. */
  export interface IGuide {
    /** Chest tape site through the authored anterior thoracic mass. */
    chest: IAutoMovieHumanBodyCalibration.IAnchor;
    /** Lower-thorax site below that mass, independent of the waist site. */
    underbust: IAutoMovieHumanBodyCalibration.IAnchor;
    /** Abdominal site between the lower thorax and upper pelvic support. */
    waist: IAutoMovieHumanBodyCalibration.IAnchor;
    /** Upper pelvic-envelope site; it does not declare an iliac landmark. */
    highHip: IAutoMovieHumanBodyCalibration.IAnchor;
    /** Pelvic-envelope tape site, distinct from a hip joint or breadth. */
    hip: IAutoMovieHumanBodyCalibration.IAnchor;
  }

  /**
   * Bind explicitly authored source addresses without changing their objects.
   *
   * The owning chain supplies the section frame and its physical station rule.
   * The anchors declare material sites in that chart, rather than world heights
   * or phase-average centres. They remain the same sites after deformation.
   *
   * An absent, incomplete or incompatible guide returns undefined. The retained
   * calibration currently has no such anatomy guide; its acquisition-course
   * fallback remains a separate, explicitly transitional caller policy.
   *
   * @param source Normal reference carrying authored anchors named chest,
   *   underbust, waist, highHip and hip, all owned by its trunk chain.
   * @returns The same anchor objects in inferior-to-superior material order,
   *   or undefined; no numerical site is inferred from the skin or layer index.
   */
  export function bind(
    source: IAutoMovieHumanBodyCalibration,
  ): IGuide | undefined {
    const trunk: IAutoMovieHumanLoftChain | undefined = source.chains.find(
      (chain: IAutoMovieHumanLoftChain): boolean => chain.name === "trunk",
    );
    if (trunk === undefined || trunk.layers.length < 2) return undefined;

    const names: (keyof IGuide)[] = [
      "hip", "highHip", "waist", "underbust", "chest",
    ];
    const lower: number = trunk.layers[0]!.y;
    const upper: number = trunk.layers[trunk.layers.length - 1]!.y;
    let previous: number = lower;
    const guide: Partial<IGuide> = {};
    for (const name of names) {
      const anchor: IAutoMovieHumanBodyCalibration.IAnchor | undefined =
        source.anchors?.[name];
      if (
        anchor === undefined || anchor.chain !== trunk.name ||
        !Number.isFinite(anchor.station) ||
        !(anchor.station > previous && anchor.station < upper)
      ) return undefined;
      guide[name] = anchor;
      previous = anchor.station;
    }
    return guide as IGuide;
  }
}
