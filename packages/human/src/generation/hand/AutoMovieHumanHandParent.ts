import {
  AutoMovieLoftViewSource,
  AutoMovieViewAxis,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanArmWalk } from "../arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";

/** Original normal-plane frame, before any skin or mesh. */
type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;

/** Calibration-mm position or dimensionless normal direction. */
type Vec3 = [number, number, number];

/** Common hand-region scalar/frame controls and the explicit legacy part adapter. */
export namespace AutoMovieHumanHandParent {
  /** One prepared original hand-region field shared by all five digits before whole-arm demand. */
  export interface IOutput {
    /** Only the legacy explicit-part adapter retains a completed original; production controls leave this absent. */
    definition?: AutoMovieHumanSiteViewPart.IDefinition;

    /** Shared identity/frame/pole metadata; no neighbouring scalar curves or completed part is acquired. */
    part: Pick<IAutoMovieViewPart, "name" | "axis" | "pole">;

    /** Complete original signed scalar/fullness owner, not emitted layers. */
    source: AutoMovieLoftViewSource.ISource;

    /** Units and phase orientation shared by both original consumers. */
    coordinates: {
      /** Physical chart length unit. */
      length: "calibration-mm";

      /** Original material phase unit. */
      phase: "radians";

      /** Frame and normal vectors use unitless coordinates. */
      direction: "unitless";

      /** Positive material orientation in the local chart. */
      phaseDirection: "+u toward +v";
    };

    /** This original ViewPart producer has no relief or layer-lift input. */
    relief: "absent from original view definition";

    /** Actual requested chart interval, calibration mm; the native scalar coefficients keep their original global parameter. */
    domain: readonly [number, number];

    /** Actual original frames only in this chart, reused to bracket its normal-plane roots. */
    stations: {
      /** Original physical station, calibration mm. */
      station: number;

      /** Actual shared frame mapping at this station. */
      frame: Frame;

      /** Normal used only to bracket the original coordinate equation. */
      normal: Vec3;
    }[];
  }

  /** Prepare the final normalized parent once; failed originals never become substitutes. */
  export function prepare(
    definition: AutoMovieHumanSiteViewPart.IDefinition,
  ): IOutput {
    const part: IAutoMovieViewPart | null = definition.part;
    if (part === null)
      throw new Error(
        "A hand attachment needs its successful actual arm original",
      );
    const admitted: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    if (
      admitted === null ||
      admitted.source === null ||
      admitted.diagnostics.length !== 0
    )
      throw new Error(
        `The actual ${part.name} has no direct original hand field: ${JSON.stringify(admitted)}`,
      );
    return {
      definition,
      part,
      domain: admitted.source.domain,
      source: admitted.source,
      coordinates: {
        length: "calibration-mm",
        phase: "radians",
        direction: "unitless",
        phaseDirection: "+u toward +v",
      },
      relief: "absent from original view definition",
      stations: part.stations.map(
        (station: number): IOutput["stations"][number] => {
          const frame: Frame = part.axis.at(station);
          return { station, frame, normal: AutoMovieViewAxis.normal(frame) };
        },
      ),
    };
  }

  /**
   * Read the common original scalar/frame definition directly, before an arm
   * part, tree view or raw result exists. The minimal identity/frame record
   * contains no completed neighbouring part or independently fitted section.
   */
  export function fromControls(
    prepared: AutoMovieHumanArmWalk.IPrepared,
  ): IOutput {
    const controls: AutoMovieHumanArmWalk.IPrepared["controls"] =
      prepared.controls;
    if (controls === null)
      throw new Error(
        "A hand attachment needs admitted original controls: " +
          JSON.stringify(prepared.diagnostics),
      );
    if (controls.hand === null)
      throw new Error(
        "A production hand contact has no declared wrist/hand chart",
      );
    const axis: IAutoMovieViewPart["axis"] = controls.axis;
    return {
      part: { name: controls.input.name, axis, pole: controls.scalars.pole },
      domain: controls.hand.domain,
      source: controls.field(),
      coordinates: {
        length: "calibration-mm",
        phase: "radians",
        direction: "unitless",
        phaseDirection: "+u toward +v",
      },
      relief: "absent from original view definition",
      stations: controls.hand.stations.map(
        (station: number): IOutput["stations"][number] => {
          const frame: Frame = axis.at(station);
          return { station, frame, normal: AutoMovieViewAxis.normal(frame) };
        },
      ),
    };
  }
}
