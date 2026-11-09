import type { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import { AutoMovieHumanSiteRegionControls } from "../limb/AutoMovieHumanSiteRegionControls";
import type { AutoMovieHumanSiteViewPart as Site } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanArmFrame } from "./AutoMovieHumanArmFrame";
import type { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";

/** Anatomical hand-domain selection over a common original C2 scalar owner. */
export namespace AutoMovieHumanArmHandControls {
  /** Arm publication and digit contacts consume the same complete distal field. */
  export interface IOutput {
    /** Wrist-to-cap contact domain, with forearm support for the shared scalar jets. */
    hand: AutoMovieHumanArmWalk.IPrepared;

    /** Attach the original shared parameter, control values and jets to the arm input. */
    connect(input: Site.IInput): Site.IInput;

    /** Explicit arm scalar demand reuses identical local tape constraints. */
    prepare(input: Site.IInput): AutoMovieHumanArmWalk.IPrepared;
  }

  /** Close only forearm/wrist/palm constraints before either original is published. */
  export function create(frame: AutoMovieHumanArmFrame.IOutput): IOutput {
    const wrist: Site.ISite | undefined = frame.source.input.sites.find(
      (site: Site.ISite): boolean => site.site === "wrist",
    );
    if (wrist === undefined)
      throw new Error("The hand chart needs its named wrist");
    const shared: AutoMovieHumanSiteRegionControls.IOutput =
      AutoMovieHumanSiteRegionControls.create(frame.source.input, "forearm");
    return {
      hand: region(shared.local, wrist.station),
      connect: shared.connect,
      prepare(input: Site.IInput): AutoMovieHumanArmWalk.IPrepared {
        return region(shared.prepare(input), wrist.station);
      },
    };
  }
}

/** Contact coordinates visit only the known hand domain; scalar support remains shared. */
function region(
  prepared: AutoMovieHumanSiteControls.IOutput,
  wrist: number,
): AutoMovieHumanArmWalk.IPrepared {
  if (prepared.controls === null)
    return { controls: null, diagnostics: prepared.diagnostics };
  const original: AutoMovieHumanSiteControls.IControls = prepared.controls;
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
