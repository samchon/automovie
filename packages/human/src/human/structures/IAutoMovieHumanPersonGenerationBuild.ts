import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanPersonBoundaryReading } from "./IAutoMovieHumanPersonBoundaryReading";

/**
 * One evaluation of a person document by the one-skin evaluator.
 *
 * `model` is the whole person as one static resident model: face parts and
 * materials under `face:` names, body parts under `body:` names, posed, in
 * the shared metre, Y-up, +Z-forward frame. The two skin halves are the head
 * and body cells of one skin; each shared boundary sample has one position
 * and one normal in every part that has it. Without registered skin layers,
 * `body` retains its independent evaluation of the derived body document.
 * With layers, its skin, garment and layers use the final formed body exterior.
 * `boundary` reads what the two
 * partitions' fields asked of the boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuild {
  /** The posed person, validated as a resident model. */
  model: IAutoMovieModel;

  /**
   * The same final joined evaluation before its garment material partition.
   * Positions, unit normals, physical sample identities and ground placement
   * retain the model's final frame and neck stitching. Omission means model
   * still contains that complete source-region population. This derived
   * observation model is not rendered, exported or authored separately.
   */
  sourceSkinModel?: IAutoMovieModel;

  /** Independent body evaluation without layers; final formed skin, garment and layers when registered. */
  body: IAutoMovieHumanBodyBuild;

  /** Rest and posed frames of the body's joints, then the face's jaw and eyes under the head. */
  bones: IAutoMovieHumanBodyBuild["bones"];

  /** What the two partitions asked of the shared boundary. */
  boundary: IAutoMovieHumanPersonBoundaryReading;
}
