import type { IAutoMovieHumanBodyCalibration } from "../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { HUMAN_DEBUG_REGIONS } from "../contracts/HUMAN_DEBUG_REGIONS";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "./HumanDebugChainLoft";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * `web:<region>`: the web patches of one region, the skin `AutoMovieHumanBodyWeb` builds from a
 * parent's ring to children that start apart from it, with each web's lips and own columns.
 *
 * The events are those of the person's calibration marked `web` whose parent chain the region
 * names. Their parents and children are lofted alone by `HumanDebugChainLoft`, so each web is
 * built by the production surface exactly as in the whole person. The parts kept are the intervals
 * the web's cells are grouped into: `<chain>/<layers - 2>` for a `down` event and `<chain>/0` for an
 * `up` one (`AutoMovieHumanWebMesh`). Every web path (`.../web-<vertex>`) is carried by the kept
 * part of its chain, so the lips and columns show with the patch they bound. The interdigital webs
 * are those of the hand and the foot, the two registered arguments.
 */
export const HumanDebugPieceWeb: IHumanDebugPiece = {
  name: "web",
  region: "body",
  description: "One region's web patches between a parent ring and the children that part from it, with lips and columns",
  arguments: ["hand", "foot"],
  build: (person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument => {
    const regions: Record<string, readonly string[]> = HUMAN_DEBUG_REGIONS;
    const globs: readonly string[] | undefined = argument === null ? undefined : regions[argument];
    if (globs === undefined) throw new Error("Name a region: piece=web:<" + Object.keys(regions).join("|") + ">");
    const calibration: IAutoMovieHumanBodyCalibration = person.calibration();
    const events: IAutoMovieHumanBodyCalibration.IEvent[] = calibration.events.filter(
      (event: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
        event.web === true && globs.some((glob: string): boolean => HumanDebugPattern.expression(glob).test(event.parent)),
    );
    if (events.length === 0) throw new Error("Region " + argument + " of " + person.alias + " has no web event");

    // The interval each lofted chain's web cells are grouped into.
    const layers: Map<string, number> = new Map(
      calibration.chains.map((chain: IAutoMovieLoftChain): [string, number] => [chain.name, chain.layers.length]),
    );
    const kept: Map<string, string> = new Map();
    for (const event of events)
      for (const name of [event.parent, ...event.splits.map((split: IAutoMovieHumanBodyCalibration.ISplit): string => split.child)])
        kept.set(name, "human.skin." + name + "/" + (event.direction === "down" ? layers.get(name)! - 2 : 0));

    const document: IHumanDebugDocument = HumanDebugChainLoft.build(calibration, [...kept.keys()]);
    const paths: IHumanDebugDocument.ICurve[] = document.parts.flatMap((part: IHumanDebugDocument.IPart): IHumanDebugDocument.ICurve[] =>
      part.curves.filter((curve: IHumanDebugDocument.ICurve): boolean => curve.id.includes("/web-")),
    );
    const parts: IHumanDebugDocument.IPart[] = document.parts
      .filter((part: IHumanDebugDocument.IPart): boolean => [...kept.values()].includes(part.id))
      .map((part: IHumanDebugDocument.IPart): IHumanDebugDocument.IPart => {
        const chain: string = part.id.slice("human.skin.".length, part.id.lastIndexOf("/"));
        return {
          ...part,
          curves: [
            ...part.curves.filter((curve: IHumanDebugDocument.ICurve): boolean => !curve.id.includes("/web-")),
            ...paths.filter((curve: IHumanDebugDocument.ICurve): boolean => curve.id.startsWith("human.construction." + chain + "/")),
          ],
        };
      });
    return {
      parts,
      provenance: {
        ...document.provenance,
        piece: "web:" + argument,
        person: person.alias,
        events: events.map((event: IAutoMovieHumanBodyCalibration.IEvent): string => event.parent + " " + event.direction),
        kept: [...kept.values()],
      },
    };
  },
};
