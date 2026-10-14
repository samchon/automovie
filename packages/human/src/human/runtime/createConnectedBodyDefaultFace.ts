import type {
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonHeadView,
} from "../../index";

/**
 * Create the body editor's neutral face document against the supplied head view: fixed document identity and empty shape/expression. Both head-person document composition and whole-person readers use this same factory; other appearance follows the loaded basis owner's default/omission semantics. No mesh, clinical phenotype or current rendered appearance is constructed or observed here.
 *
 * @evidence contracts/common.md#principled-implementation The supplied actual face basis identity and owner-neutral empty coefficients provide one default document for coupled body/head consumers.
 * @evidence contracts/common.md#clear-and-simple-design This factory creates document identity and neutral numerical fields only, leaving anatomy/material defaults and generation evaluation with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A default document is not a hidden personal asset or measured demographic/appearance result; loaded source admission remains downstream.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies actual shared consumers, neutral coefficient semantics and unobserved runtime/appearance scope.
 * @evidence contracts/performance.md#efficient-algorithms Fixed document/empty-record allocation and one basis-ID read use constant work independent of geometry size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller receives its own neutral document; the factory coordinates no source fetch, evaluated-face cache or request sharing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned document/empty records escape, retaining the basis identity string rather than the head geometry or a task.
 *
 * @author Samchon
 */
export function createConnectedBodyDefaultFace(
  head: IAutoMovieHumanPersonHeadView,
): IAutoMovieHumanFaceBasisDocument {
  return {
    id: "body-editor-face",
    name: "default face",
    basis: head.face.id,
    shape: {},
    expression: {},
  };
}
