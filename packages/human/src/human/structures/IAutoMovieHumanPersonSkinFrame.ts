import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanPersonFaceRest } from "./IAutoMovieHumanPersonFaceRest";

/**
 * What forming a one-skin person's posed skin reads from one evaluation: the face producer's skin, the head carry, the body's rest of the shared and band vertices, its bones and its posed skin. All coordinate fields use common source metres, Y up and +Z forward; face/body rest precede body rig posing while bodyPosed is already performed. Matching source populations and finite/unit bone frames remain caller premises; formation borrows these operands unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Evaluated face rest coordinates, body rest rows and posed body skin share one generation plan; body bones carry head and band changes into the posed frame.
 * @evidence contracts/common.md#clear-and-simple-design Document-dependent results are grouped per frame while invariant correspondence and weights stay in the skin plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame supplies actual producer results and body bones rather than adjusting separately fitted surfaces after construction.
 * @evidence contracts/common.md#meaningful-documentation Prose and members state metre axes, rest-versus-posed timing, unchanged borrowing, matching populations, flat translation and rest-row ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The per-frame rest positions, bone map and posed skin are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the per-frame rest positions, bone map and posed skin; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring per-frame rest positions, bone map and posed skin acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinFrame {
  /** The face producer's evaluated skin of the face view, by skin vertex. */
  faceRest: IAutoMovieHumanPersonFaceRest;

  /** The head carry's rest-frame translation, XYZ metres. */
  shift: readonly number[];

  /** The body's shaped rest of the plan's rest rows, three numbers per row. */
  bodyRest: readonly number[];

  /** The body's bones by bone. */
  bones: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBuild["bones"][number]>;

  /** The body builder's posed skin positions. */
  bodyPosed: readonly number[];
}
