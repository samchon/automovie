import type {
  IAutoMovieHumanBodySimpleWhole,
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "../../index";
import { compileHumanPersonGeneration } from "../build/compileHumanPersonGeneration";
import { joinHumanPersonGeneration } from "../build/joinHumanPersonGeneration";
import { createHumanPersonSimpleWhole } from "../measure/createHumanPersonSimpleWhole";
import { createConnectedBodyDefaultFace } from "./createConnectedBodyDefaultFace";

/**
 * Join and compile the supplied loaded head/body pair into whole-person stature/volume readers with the same neutral face factory and linked-person intent used by the body editor. Each trial changes body shape only; registered alias/driver behavior follows its separate actual evaluator branch. No second asset fetch or full displayed person build occurs here. Source-rest measurements retain their own omitted-stage, source-frame and clinical limitations.
 *
 * @evidence contracts/common.md#principled-implementation Matching generation views and one default face document supply the paired source-rest reader used by simple body solving and humeral-head observation.
 * @evidence contracts/common.md#clear-and-simple-design This factory owns loaded-pair/document composition; generation admission, rest evaluation, lazy coupled reach and measurement caching have existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mixed generations refuse through joining, and source-rest readouts are not claimed a current displayed/GPU model or clinical stature/mass certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose states actual consumers, trial body-shape ownership, linked-versus-driver boundary and no second source acquisition.
 * @evidence contracts/performance.md#efficient-algorithms Joining/compilation pays actual source/chart/normal setup before fixed document wrappers; later shape reads and lazy reach pay their own source-rest/interval work.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled loaded pair and fixed default face serve all trial shapes, avoiding independent source reads or face geometry construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned measurement closures retain compiled source/default document and their bounded last-read state until dropped; this factory creates no worker, timer or source fetch handle.
 *
 * @author Samchon
 */
export function createConnectedBodySimpleWhole(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
): IAutoMovieHumanBodySimpleWhole {
  return createHumanPersonSimpleWhole(
    compileHumanPersonGeneration(joinHumanPersonGeneration(head, body)),
    {
      id: "body-editor-person",
      name: "body editor person",
      population: "linked",
      face: createConnectedBodyDefaultFace(head),
      body: {
        id: "body-editor-body",
        name: "body editor body",
        basis: body.body.id,
        shape: {},
      },
    },
  );
}
