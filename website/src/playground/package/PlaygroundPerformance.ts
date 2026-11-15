import type { AutoMovieHumanCanonicalBody } from "@automovie/human";
import { HumanPerformance } from "@automovie/motions";

import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";
import { PlaygroundBodies } from "./PlaygroundBodies";
import { PlaygroundChain } from "./PlaygroundChain";
import { PlaygroundObjects } from "./PlaygroundObjects";

/**
 * Builds the `HumanPerformance` of a composition, the one path the
 * playground in the browser and the site's bake in Node both take, so a
 * baked scene is the performance the playground shows for the same
 * composition.
 */
export namespace PlaygroundPerformance {
  /** One performer to draw. */
  export interface IFigure {
    /** The performer's subject id, which names the figure in the scene. */
    subject: string;

    /** The id of the performer's body among the site's bodies. */
    body: string;

    /** The performer's canonical body. */
    canonical: AutoMovieHumanCanonicalBody.IBody;
  }

  /** A built performance and what drawing it needs. */
  export interface IBuilt {
    /** The performance. */
    performance: HumanPerformance;

    /** Each performer's body, in the composition's order. */
    figures: IFigure[];
  }

  /**
   * Build a composition.
   *
   * @param composition The composition.
   * @returns The performance and its figures.
   * @throws {HumanRefusal} When the package refuses the composition.
   * @throws {Error} When the composition needs an operator, a row or a prop the installed packages lack.
   */
  export function build(composition: IPlaygroundComposition): IBuilt {
    const built: PlaygroundChain.IBuilt = PlaygroundChain.build(composition);
    const figures: IFigure[] = [];
    const input: HumanPerformance.IInput = {
      seed: composition.seed,
      performers: composition.performers.map(
        (
          performer: IPlaygroundComposition.IPerformer,
        ): HumanPerformance.IInput["performers"][number] => {
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
    };

    // Props exist only where the composition places objects; lexicon rows are
    // registered only where the installed package takes registered laws.
    const props: HumanPerformance.IInput["props"] = PlaygroundObjects.props(
      composition.objects ?? [],
    );
    const full: HumanPerformance.IInput = {
      ...input,
      ...(props === undefined || props.length === 0 ? {} : { props }),
    };
    return {
      performance: new HumanPerformance(
        built.laws.length === 0
          ? full
          : ({ ...full, laws: built.laws } as HumanPerformance.IInput),
      ),
      figures,
    };
  }
}
