import type { FilmPropPlacementMutation } from "./FilmPropPlacementMutation";

/** Original registry slot identities and addressed refusal reader. */
export interface IFilmPropPlacementCaseInputs {
  /** Apply the existing fresh registry mutation and read its original refusal. */
  violated(
    mutate: FilmPropPlacementMutation,
    path: string,
    message?: string,
  ): boolean;

  /** Original table slot in the shared registry. */
  TABLE: number;

  /** Original lamp slot in the shared registry. */
  LAMP: number;

  /** Original sconce slot in the shared registry. */
  SCONCE: number;

  /** Original charger slot in the shared registry. */
  CHARGER: number;

  /** Original pendant slot in the shared registry. */
  PENDANT: number;

  /** Original chime slot in the shared registry. */
  CHIME: number;

  /** Original cabinet slot in the shared registry. */
  CABINET: number;

  /** Original door slot in the shared registry. */
  DOOR: number;

  /** Original crate slot in the shared registry. */
  CRATE: number;

  /** Original sculpture slot in the shared registry. */
  SCULPTURE: number;
}
