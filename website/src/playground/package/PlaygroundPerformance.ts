import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import { AutoMovieMotionHumanPerformance } from "@automovie/motions";

import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";
import { PlaygroundBodies } from "./PlaygroundBodies";
import { PlaygroundChain } from "./PlaygroundChain";
import { PlaygroundObjects } from "./PlaygroundObjects";

/**
 * Builds the `AutoMovieMotionHumanPerformance` of a composition, which `TakeCompute` calls
 * in the take worker for the playground and every scene alike, so a scene
 * is the performance the playground shows for the same composition.
 */
export namespace PlaygroundPerformance {
  /** One performer to draw. */
  export interface IFigure {
    /** The performer's subject id, which names the figure in the scene. */
    subject: string;

    /** The id of the performer's body among the site's bodies. */
    body: string;

    /** The performer's canonical body. */
    canonical: IAutoMovieHumanCanonicalBody.IBody;
  }

  /** A built performance and what drawing it needs. */
  export interface IBuilt {
    /** The performance. */
    performance: IAutoMovieMotionHumanPerformance;

    /** Each performer's body, in the composition's order. */
    figures: IFigure[];
  }

  /**
   * Build a composition.
   *
   * @param composition The composition.
   * @returns The performance and its figures.
   * @throws {AutoMovieMotionHumanRefusal} When the package refuses the composition.
   * @throws {Error} When the composition needs an operator, a row or a prop the installed packages lack.
   */
  export function build(composition: IPlaygroundComposition): IBuilt {
    const built: PlaygroundChain.IBuilt = PlaygroundChain.build(composition);
    const figures: IFigure[] = [];
    const input: IAutoMovieMotionHumanPerformance.IInput = {
      seed: composition.seed,
      performers: composition.performers.map(
        (
          performer: IPlaygroundComposition.IPerformer,
        ): IAutoMovieMotionHumanPerformance.IInput["performers"][number] => {
          const prepared: PlaygroundBodies.IPrepared = PlaygroundBodies.get(
            performer.body,
          );
          figures.push({
            subject: performer.subject,
            body: performer.body,
            canonical: prepared.canonical,
          });
          return {
            subject: performer.subject,
            body: prepared.body,
            at: { x: performer.x, y: 0, z: performer.z },
            yaw: performer.yaw,
            proficiency: { level: performer.proficiency },
          };
        },
      ),
      composition: built.composition,
      ...(composition.forces === undefined
        ? {}
        : { forces: composition.forces }),
    };

    // Props exist only where the composition places objects; lexicon rows are
    // registered only where the installed package takes registered laws.
    const gaits: Record<string, IPlaygroundComposition.ICue[]> = {};
    const props: IAutoMovieMotionHumanPerformance.IInput["props"] =
      PlaygroundObjects.props(
        composition.objects ?? [],
        composition.performers,
        gaits,
      );

    // The authored cue tracks and each ridden animal's own gait track reach the performance as one set of tracks.
    const cues: Record<string, readonly IPlaygroundComposition.ICue[]> = {
      ...(composition.cues ?? {}),
      ...gaits,
    };
    const full: IAutoMovieMotionHumanPerformance.IInput = {
      ...input,
      ...(props === undefined || props.length === 0 ? {} : { props }),
      ...(Object.keys(cues).length === 0 ? {} : { cues }),
    };
    return {
      performance: new AutoMovieMotionHumanPerformance(
        built.laws.length === 0
          ? full
          : ({
              ...full,
              laws: built.laws,
            } as IAutoMovieMotionHumanPerformance.IInput),
      ),
      figures,
    };
  }
}
