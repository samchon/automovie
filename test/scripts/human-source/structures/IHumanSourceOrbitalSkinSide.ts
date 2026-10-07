/**
 * Source skin inside one posterior lid loop, re-authored clear of the globe.
 *
 * @author Samchon
 */
export interface IHumanSourceOrbitalSkinSide {
  /** Anatomical side of the posterior loop. */
  side: "left" | "right";

  /** Canonical source vertices moved, ascending. Cage stations are excluded. */
  movedSourceVertices: number[];

  /** Smallest signed globe distance among selected vertices before authoring, metres. */
  minimumBeforeMetres: number | null;

  /** Smallest signed globe distance measured again after authoring, metres. */
  minimumAfterMetres: number | null;

  /** Largest displacement among selected vertices, metres. */
  maximumDisplacementMetres: number;
}
