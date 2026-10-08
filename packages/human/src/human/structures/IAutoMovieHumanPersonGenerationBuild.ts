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
 * @evidence contracts/common.md#principled-implementation Returns the evaluated model with the body evaluation and joints a consumer already reads from a person build.
 * @evidence contracts/common.md#clear-and-simple-design Four named fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The boundary reading reports the partitions' disagreement instead of hiding it.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the naming and the shared-sample property.
 * @evidence contracts/modeling.md#part-identity-and-grouping Parts keep their owners' identities under a prefix; no third skin identity is introduced.
 * @evidence contracts/modeling.md#shared-boundaries Shared samples carry one position and one normal on both halves.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, +Z forward, posed.
 * @evidenceExclude contracts/modeling.md#parameter-channels The build defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator owns the emitted geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Rendering is observed separately.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The build carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The build admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The build is an output.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuild {
  /** The posed person, validated as a resident model. */
  model: IAutoMovieModel;

  /** Independent body evaluation without layers; final formed skin, garment and layers when registered. */
  body: IAutoMovieHumanBodyBuild;

  /** Rest and posed frames of the body's joints, then the face's jaw and eyes under the head. */
  bones: IAutoMovieHumanBodyBuild["bones"];

  /** What the two partitions asked of the shared boundary. */
  boundary: IAutoMovieHumanPersonBoundaryReading;
}
