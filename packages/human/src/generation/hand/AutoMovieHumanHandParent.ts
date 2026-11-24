import { AutoMovieLoftViewSource, AutoMovieViewAxis } from "@automovie/engine";
import type {
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanHandParent,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieLoftViewSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";

/**
 * Common hand-region scalar/frame controls and the explicit legacy part
 * adapter.
 */
export namespace AutoMovieHumanHandParent {
  /**
   * Prepare the final normalized parent once; failed originals never become
   * substitutes.
   */
  export function prepare(
    definition: IAutoMovieHumanSourceDefinition,
  ): IAutoMovieHumanHandParent.IOutput {
    const part: IAutoMovieViewPart | null = definition.part;
    if (part === null)
      throw new Error(
        "A hand attachment needs its successful actual arm original",
      );
    const admitted: IAutoMovieLoftViewSource.IResult | null =
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
        (
          station: number,
        ): IAutoMovieHumanHandParent.IOutput["stations"][number] => {
          const frame: IAutoMovieHumanHandParent.Frame = part.axis.at(station);
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
    prepared: IAutoMovieHumanArmWalk.IPrepared,
    field?: IAutoMovieHumanSiteControls.IField,
  ): IAutoMovieHumanHandParent.IOutput {
    const controls: IAutoMovieHumanArmWalk.IPrepared["controls"] =
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
      source: AutoMovieHumanSiteControls.native(
        controls.input.name,
        controls.scalars,
        field,
      ).source,
      coordinates: {
        length: "calibration-mm",
        phase: "radians",
        direction: "unitless",
        phaseDirection: "+u toward +v",
      },
      relief: "absent from original view definition",
      stations: controls.hand.stations.map(
        (
          station: number,
        ): IAutoMovieHumanHandParent.IOutput["stations"][number] => {
          const frame: IAutoMovieHumanHandParent.Frame = axis.at(station);
          return { station, frame, normal: AutoMovieViewAxis.normal(frame) };
        },
      ),
    };
  }
}
