import type { AutoMovieLoftContract, IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";
import { AutoMovieHumanLegReliefWindows } from "./AutoMovieHumanLegReliefWindows";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The leg's thirteen relief windows (`AutoMovieHumanLegReliefWindows`) composed on one leg: each named bump or
 * hollow placed at its own centre with the local radius there, the girth the
 * law asks for at that station over 2 pi, so its size follows the person.
 *
 * A window whose centre stands outside the leg's own span (above the crotch
 * ring or under the ankle ring) has no skin of the leg to move there and is
 * left out; the rest of its window past a ring is cut by the ring, where the
 * neighbour owns the skin.
 */
export namespace AutoMovieHumanLegReliefs {
  /**
   * The reliefs of one leg.
   *
   * @param bones The joints' heights, mm.
   * @param girth The girth the law asks for at a station, mm.
   * @param span The leg's own stations, from the ankle ring to the crotch ring, mm.
   * @param crotchReach The span under the crotch ring over which the trunk's ring hands the skin over to the leg's law, mm; a window anchored at the crotch stands at its end. Absent (a leg read without its crotch ring), every window stands at its share.
   * @param diagnostics The list a relief that cannot be placed is recorded in; the leg keeps its base there (level 3 for a bump, 4 for a recess).
   * @param furrow The person's gluteal furrow height, mm: a window anchored at the crotch stands there when it lies inside the leg, the fold being where the furrow is.
   */
  export function of(
    bones: AutoMovieHumanLegStations.IBones,
    girth: (s: number) => number,
    span: readonly [number, number],
    crotchReach?: number,
    diagnostics: AutoMovieLoftContract.IDiagnostic[] = [],
    furrow?: number,
  ): IAutoMovieLoftRelief[] {
    const centre: (w: AutoMovieHumanLegReliefWindow.IWindow) => number = (w: AutoMovieHumanLegReliefWindow.IWindow): number =>
      w.anchor === "crotch" && furrow !== undefined && furrow > span[0] && furrow < span[1]
        ? furrow
        : w.anchor === "crotch" && crotchReach !== undefined
        ? span[1] - crotchReach
        : AutoMovieHumanLegStations.heightAt(bones, w.segment, w.share);
    return AutoMovieHumanLegReliefWindows.ALL.filter((w: AutoMovieHumanLegReliefWindow.IWindow): boolean => {
      const at: number = centre(w);
      return at > span[0] && at < span[1];
    }).flatMap((w: AutoMovieHumanLegReliefWindow.IWindow): IAutoMovieLoftRelief[] => {
      const at: number = centre(w);
      try {
        return [AutoMovieHumanLegReliefWindow.create(w, { bones, radius: girth(at) / (2 * Math.PI), at })];
      } catch (error) {
        const inward: boolean = w.axis[0] * Math.cos(w.angle) + w.axis[2] * Math.sin(w.angle) < 0;
        diagnostics.push({
          producer: w.name,
          level: inward ? 4 : 3,
          contract: "a relief window has a positive local radius at its centre",
          detail: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    });
  }
}
