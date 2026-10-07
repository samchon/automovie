import HumanWorker from "../../human-worker.ts?worker";

/**
 * Start the one human worker entry in a named role.
 *
 * This module is the only place that references the worker entry. The
 * production bundler starts a separate worker build for every reference it
 * transforms, and does not share a build that is still running, so several
 * references to the same entry meant several concurrent builds of the whole
 * human graph. One reference gives one build.
 *
 * `name` is the worker's standard name: a query string that states the role
 * (`worker=<role>`) and whatever else that role reads from it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Starts the resident worker whose replies the face editor's request owner correlates.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps native worker allocation in one browser adapter outside the numerical request owners.
 * @author Samchon
 */
export function createHumanWorker(name: string): Worker {
  return new HumanWorker({ name });
}
