import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";

/** Profile trait proving that deterministic impacts can damage this body. */
export interface IAutoMovieDestructibleTrait {
  /** Trait discriminator. */
  kind: "destructible";

  /** Positive structural durability. */
  durability: number;

  /** Collision and material response owned by the declared proxy. */
  impactBody: IAutoMovieImpactBody;
}
