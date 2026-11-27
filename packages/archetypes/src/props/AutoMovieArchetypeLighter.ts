import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { SmokingPropDraw } from "./SmokingPropDraw";

/** Constructs the digital pocket lighter from its recipe. */
export namespace AutoMovieArchetypeLighter {
  /**
   * Digital pocket lighter with a grip, wheel, button and effect locator.
   *
   * @param params The optional scene ID and BIC model.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
   */
  export function create(
    params: AutoMovieArchetypeLighter.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeLighter.Affordance, AutoMovieArchetypeLighter.Dimension> {
    const {
      builder,
      d,
    }: ReturnType<typeof SmokingPropDraw.prepare<AutoMovieArchetypeLighter.Affordance>> =
      SmokingPropDraw.prepare<AutoMovieArchetypeLighter.Affordance>("lighter", params, seed);
    const width: number = d.width!;
    const height: number = d.length!;
    const depth: number = d.diameter!;
    const wheel: number = depth * 0.3;
    builder.box(
      "body",
      Vector3.create(width, height - 2 * wheel, depth),
      Vector3.create(0, (height - 2 * wheel) / 2, 0),
      { color: "#c0392b" },
    );
    builder.rod(
      "wheel",
      wheel,
      Vector3.create(-width * 0.2, height - wheel, depth * 0.1),
      Vector3.create(width * 0.2, height - wheel, depth * 0.1),
      { color: "#8a8d91" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, (height - 2 * wheel) / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: depth,
      length: height - 2 * wheel,
    });
    builder.affordance({
      id: "wheel",
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, height - wheel, depth * 0.1),
        Vector3.create(1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      travel: 90,
      parts: ["wheel"],
    });
    builder.affordance({
      id: "valve",
      kind: "button",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, height - 2 * wheel, -depth * 0.25),
      ),
      extent: null,
      travel: 0.003,
    });
    builder.affordance({
      id: "flame",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, height + 0.015, depth * 0.3),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }
}

/** The authorable settings, contacts and dimensions of {@link AutoMovieArchetypeLighter}. */
export namespace AutoMovieArchetypeLighter {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "flame" | "grip" | "valve" | "wheel";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass" | "width";


  /** Parameters accepted by the BIC lighter producer. */
  export interface IParams {
    /** The model's id, unique in a scene; `smoking` when absent. */
    id?: string;
    /** BIC lighter model; drawn from the seed when omitted. */
    model?: SmokingPropDraw.Model;
  }
}
