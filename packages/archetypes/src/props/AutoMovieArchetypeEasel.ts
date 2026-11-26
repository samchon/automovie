import { type AutoMovieArchetype } from "../core/index";
import { createEasel as createEaselImplementation } from "./internal/createEasel";

/** Public operations for Auto Movie Archetype Easel. */
export namespace AutoMovieArchetypeEasel {
  /**
   * An easel standing on the floor with a canvas upright on it.
   *
   * The easel stands at the origin, the canvas' painted face toward `-Z`, where
   * the painter stands. `canvas` is that face, its outward normal (`+Y` of the
   * frame) toward `-Z` and its `X` along world `+X`, `width` across and `depth`
   * up, centred at `centre` above the floor.
   *
   * @param params The optional scene id.
   * @returns The easel and its canvas surface, metres.
   */
  export function create(params?: AutoMovieArchetypeEasel.IParams): AutoMovieArchetype<AutoMovieArchetypeEasel.Affordance, AutoMovieArchetypeEasel.Dimension> {
    return createEaselImplementation(params);
  }

  /** The canvas' painted face. */
  export type Affordance = "canvas";

  /** The canvas' width, height and centre height, and the mass. */
  export type Dimension = "width" | "height" | "centre" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `easel` when absent. */
    id?: string;
  }

  /** The easel's size, metres and kilograms. */
  export interface ISize {
    /** The canvas across. */
    width: number;

    /** The canvas up. */
    height: number;

    /** The canvas' centre above the floor. */
    centre: number;

    /** The mass. */
    mass: number;
  }}
