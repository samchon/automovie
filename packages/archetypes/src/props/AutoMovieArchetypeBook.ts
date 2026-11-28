import { type AutoMovieArchetype } from "../core/index";
import { type StationeryDraw } from "./internal/StationeryDraw";
import { createBook as createBookImplementation } from "./internal/createBook";

/** Constructs a closed book with independently moving cover and leaf. */
export namespace AutoMovieArchetypeBook {
  /**
   * Build a closed book resting on its back at model Y zero.
   *
   * The spine grip stays at `-X`. The `hinge` carries the front cover's
   * face and edge, and `page` carries a separate leaf and its edge grip.
   * Both controls have 180 degrees of authored travel.
   *
   * @param params Optional ID and finite dimensions in the book bands.
   *   The ID defaults to `stationery`.
   * @param seed Numeric seed for omitted dimensions. Without it the
   *   book is 0.133 by 0.206 metres and 0.024 metres thick.
   * @returns The book and its local fixed and moving contact frames.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    StationeryDraw.IParams,
    "id" | "width" | "length" | "thickness" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBook.Affordance, AutoMovieArchetypeBook.Dimension> {
    return createBookImplementation(params, seed);
  }

  /**
   * Fixed spine `grip`, front-cover `hinge` with `face` and `edge`, and separate leaf `page` with `page-edge`.
   */
  export type Affordance =
    | "edge"
    | "face"
    | "grip"
    | "hinge"
    | "page"
    | "page-edge";

  /**
   * Closed width across X, length along Z and thickness along Y in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";}
