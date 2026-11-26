import type {
  IAutoMovieHumanFootSource,
  IAutoMovieHumanSiteControls,
} from "@automovie/interface";

import { AutoMovieHumanFootSource } from "../foot/AutoMovieHumanFootSource";

/** Build a bounded Human leg-region reader from controls. */
export namespace AutoMovieHumanLegRegion {
  /** Bounded ankle-region contact capability directly from shared local controls, without a complete leg. */
  export function fromControls(
    prepared: IAutoMovieHumanSiteControls.IOutput,
  ): IAutoMovieHumanFootSource.IRegion {
    const controls: IAutoMovieHumanSiteControls.IControls | null =
      prepared.controls;
    if (controls === null)
      throw new Error(
        "The actual distal leg controls are unavailable: " +
          JSON.stringify(prepared.diagnostics),
      );
    const original: IAutoMovieHumanFootSource.ISource =
      AutoMovieHumanFootSource.fromControls(prepared);
    const domain: readonly [number, number] = [
      controls.scalars.stations[0]!,
      controls.scalars.stations.at(-1)!,
    ];
    return {
      name: controls.input.name,
      axis: controls.axis,
      domain,
      at(station: number): IAutoMovieHumanFootSource.IStation {
        if (
          !(
            Number.isFinite(station) &&
            station >= domain[0] &&
            station <= domain[1]
          )
        )
          throw new Error(
            `${controls.input.name}: query outside retained distal authority [${domain.join(", ")}] mm`,
          );
        return AutoMovieHumanFootSource.at(original, station);
      },
    };
  }
}
