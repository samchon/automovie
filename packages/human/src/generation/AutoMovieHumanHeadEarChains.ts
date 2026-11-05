import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadEarFree } from "./AutoMovieHumanHeadEarFree";
import { AutoMovieHumanHeadEarHelix } from "./AutoMovieHumanHeadEarHelix";
import { AutoMovieHumanHeadEarLobe } from "./AutoMovieHumanHeadEarLobe";
import { AutoMovieHumanHeadEarLoop } from "./AutoMovieHumanHeadEarLoop";
import { AutoMovieHumanHeadEarPocket } from "./AutoMovieHumanHeadEarPocket";
import { AutoMovieHumanHeadEarRim } from "./AutoMovieHumanHeadEarRim";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadEarSampler } from "./IAutoMovieHumanHeadEarSampler";
import type { IAutoMovieHumanHeadLoopLayer } from "./IAutoMovieHumanHeadLoopLayer";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * One ear's chains composed from its pieces: the lobe, the helix with the
 * attached plate, the free rim and the pocket, each drawn by its own piece from
 * the ear's sampler on the canonical (left) frame and reflected onto the side
 * by one declared rule, with the event that splits the rim and the pocket off
 * the helix's top ring and the poles that close the lobe, the rim and the
 * pocket.
 */
export namespace AutoMovieHumanHeadEarChains {
  /** One ear's chains with their own events and poles. */
  export interface IChains {
    /** The lobe, helix, rim and pocket chains. */
    chains: IAutoMovieLoftChain[];

    /** The helix's split into the rim and the pocket. */
    events: IAutoMovieHumanBodyCalibration.IEvent[];

    /** The poles closing the lobe's bottom and the rim's and the pocket's tops. */
    poles: IAutoMovieHumanBodyCalibration.IPole[];
  }

  /**
   * One ear's chains.
   *
   * @param surface The person's surface, cut once by station.
   * @param ear The ear placed on the head.
   * @param name The side's name.
   * @param sign 1 for the left side, -1 for the right.
   * @returns The ear's chains, its event and its poles.
   */
  export function earChains(
    surface: IAutoMovieHumanHeadSurface,
    ear: AutoMovieHumanEarConstruction.IEar,
    name: "left" | "right",
    sign: 1 | -1,
  ): IChains {
    const sampler: IAutoMovieHumanHeadEarSampler = AutoMovieHumanHeadEarFree.sampler(
      surface,
      ear,
      name,
      sign,
    );
    const lobeLayers: IAutoMovieHumanHeadLoopLayer[] = AutoMovieHumanHeadEarLobe.layers(sampler);
    const helixLayers: IAutoMovieHumanHeadLoopLayer[] = AutoMovieHumanHeadEarHelix.layers(sampler);
    const rimLayers: IAutoMovieHumanHeadLoopLayer[] = AutoMovieHumanHeadEarRim.layers(sampler);
    const pocketLayers: IAutoMovieHumanHeadLoopLayer[] = AutoMovieHumanHeadEarPocket.layers(sampler);

    // The split's arcs, on the helix ring's own phases: the pocket's run of
    // the pit's mouth, whose points the helix's highest loop keeps.
    const pit: number = Math.floor(AutoMovieHumanHeadEarFree.LOOP * AutoMovieHumanHeadEarFree.PIT);
    const high: [number, number][] = helixLayers[helixLayers.length - 1]!.loop;
    const from: number = pit + 1;
    const to: number = from + AutoMovieHumanHeadEarFree.POCKET;
    const closed: [number, number][] = AutoMovieHumanHeadEarLoop.reflected(high, sign);
    const cut: number[] = sign > 0 ? [from, to] : [closed.length - to, closed.length - from];
    const phases: number[] = closed.map(
      (_: [number, number], i: number): number => (2 * Math.PI * i) / closed.length,
    );
    const pocketArc: [number, number] = [
      phases[Math.min(closed.length - 1, cut[0]!)]!,
      phases[Math.min(closed.length - 1, cut[1]!)]!,
    ];
    return {
      chains: [
        AutoMovieHumanHeadEarLoop.chainOf(
          `ear.lobe.${name}`,
          64,
          "arclength",
          false,
          AutoMovieHumanHeadEarLoop.onSide(lobeLayers, sign),
        ),
        AutoMovieHumanHeadEarLoop.chainOf(
          `ear.helix.${name}`,
          ORDER_HELIX,
          "arclength",
          false,
          AutoMovieHumanHeadEarLoop.onSide(helixLayers, sign),
        ),
        AutoMovieHumanHeadEarLoop.chainOf(
          `ear.rim.${name}`,
          64,
          "arclength",
          false,
          AutoMovieHumanHeadEarLoop.onSide(rimLayers, sign),
        ),
        AutoMovieHumanHeadEarLoop.chainOf(
          `ear.pocket.${name}`,
          32,
          "polar",
          true,
          AutoMovieHumanHeadEarLoop.onSide(pocketLayers, sign),
        ),
      ],
      events: [
        {
          parent: `ear.helix.${name}`,
          direction: "up",
          splits: [
            { child: `ear.rim.${name}`, arcs: [[pocketArc[1], pocketArc[0]]] },
            { child: `ear.pocket.${name}`, arcs: [[pocketArc[0], pocketArc[1]]] },
          ],
        },
      ],
      poles: [
        {
          chain: `ear.lobe.${name}`,
          end: "bottom",
          critical: true,
          point: AutoMovieHumanHeadEarLobe.pole(sampler, lobeLayers[0]!.loop, sign),
        },
        {
          chain: `ear.rim.${name}`,
          end: "top",
          critical: true,
          point: AutoMovieHumanHeadEarRim.pole(
            sampler,
            rimLayers[rimLayers.length - 1]!.loop,
            sign,
          ),
        },
        {
          chain: `ear.pocket.${name}`,
          end: "top",
          critical: true,
          point: AutoMovieHumanHeadEarPocket.pole(
            sampler,
            pocketLayers[pocketLayers.length - 1]!.loop,
            sign,
          ),
        },
      ],
    };
  }

  /** Control points of the helix chains' sections: the density that carries the helix's roll. */
  export const ORDER_HELIX: number = 128;
}
