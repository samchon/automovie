import HumanWorker from "../../human-worker.ts?worker";
import { readConnectedPersonSourceUrls } from "../person/readConnectedPersonSourceUrls";

/**
 * Start the one human worker entry in a named role.
 *
 * This module is the only place that references the worker entry. The production bundler starts a separate worker build for every reference it transforms, and does not share a build that is still running, so several references to the same entry meant several concurrent builds of the whole human graph. One reference gives one build.
 *
 * `name` is the worker's standard name: a query string that states the role (`worker=<role>`) and whatever else that role reads from it. Person-generation roles inherit a complete source pair from the page when the name supplies none. Explicit worker source pairs take precedence; partial pairs refuse before worker construction. Relative selections resolve on the page before entering the worker name.
 *
 * @evidence contracts/common.md#principled-implementation One static worker import preserves the bundler's shared role graph, and person-generation roles carry the same fully resolved head/body URL pair through the standard worker name used by their entry handlers.
 * @evidence contracts/common.md#clear-and-simple-design Native worker allocation and source-pair propagation live in this page adapter while the shared parser owns URL admission and the numerical role owns generation validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing sources gain no bundled definition or guessed URL; explicit pairs retain precedence, and partial selections refuse without mixing worker and page inputs.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies standard role naming, static bundler identity, source precedence, page-relative resolution and pre-allocation partial-pair refusal.
 * @evidence contracts/performance.md#efficient-algorithms Parsing and encoding role metadata take O(n) work for n parameter characters and allocate one worker; numerical source loading remains inside that worker rather than this adapter.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call deliberately acquires a distinct numerical worker; bundler graph reuse is separate from sharing runtime source or request effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned native worker transfers termination ownership to its resident transport or page service; this factory retains no worker registry or running-task collection.
 *
 * @author Samchon
 */
export function createHumanWorker(name: string): Worker {
  const parameters: URLSearchParams = new URLSearchParams(name);
  const role: string | null = parameters.get("worker");
  if (role !== null && ["body", "body-head", "body-simple", "body-anatomy", "person"].includes(role)) {
    const source: ReturnType<typeof readConnectedPersonSourceUrls> =
      readConnectedPersonSourceUrls(name, location.href) ??
      readConnectedPersonSourceUrls(location.search, location.href);
    if (source !== undefined) {
      parameters.set("headSource", source.head);
      parameters.set("bodySource", source.body);
    }
  }
  return new HumanWorker({ name: parameters.toString() });
}
