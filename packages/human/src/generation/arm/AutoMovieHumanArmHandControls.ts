import type {
  IAutoMovieHumanArmFrame,
  IAutoMovieHumanArmHandControls,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanSectionSite,
  IAutoMovieHumanSectionSource,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSiteRegionControls,
} from "@automovie/interface";

import { AutoMovieHumanSiteRegionControls } from "../limb/AutoMovieHumanSiteRegionControls";

/** Anatomical hand-domain selection over a common original C2 scalar owner. */
export namespace AutoMovieHumanArmHandControls {
  /** Close only forearm/wrist/palm constraints before either original is published. */
  export function create(
    frame: IAutoMovieHumanArmFrame.IOutput,
  ): IAutoMovieHumanArmHandControls.IOutput {
    const wrist: IAutoMovieHumanSectionSite | undefined =
      frame.source.input.sites.find(
        (site: IAutoMovieHumanSectionSite): boolean => site.site === "wrist",
      );
    if (wrist === undefined)
      throw new Error("The hand chart needs its named wrist");
    const shared: IAutoMovieHumanSiteRegionControls.IOutput =
      AutoMovieHumanSiteRegionControls.create(frame.source.input, "forearm");
    return {
      hand: region(shared.local, wrist.station),
      connect: shared.connect,
      prepare(
        input: IAutoMovieHumanSectionSource,
      ): IAutoMovieHumanArmWalk.IPrepared {
        return region(shared.prepare(input), wrist.station);
      },
    };
  }
}

/** Contact coordinates visit only the known hand domain; scalar support remains shared. */
function region(
  prepared: IAutoMovieHumanSiteControls.IOutput,
  wrist: number,
): IAutoMovieHumanArmWalk.IPrepared {
  if (prepared.controls === null)
    return { controls: null, diagnostics: prepared.diagnostics };
  const original: IAutoMovieHumanSiteControls.IControls = prepared.controls;
  const stations: number[] = original.scalars.stations.filter(
    (station: number): boolean => station >= wrist,
  );
  return {
    diagnostics: prepared.diagnostics,
    controls: {
      ...original,
      hand: { domain: [wrist, original.scalars.stations.at(-1)!], stations },
    },
  };
}
