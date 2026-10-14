import type { IRouteHumanViewerConsoleProps } from "./IRouteHumanViewerConsoleProps.js";

/**
 * Route one page console line by its protocol prefix. Lines without one are ordinary page logs and are ignored.
 *
 * @evidence contracts/common.md#principled-implementation Dispatches actual page console text by the closed protocol prefix set, passing the remaining bytes to the matching progress/error/display owner.
 * @evidence contracts/common.md#clear-and-simple-design One mutually exclusive prefix chain keeps decoding and status interpretation in the supplied callbacks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrecognized page logs are ignored rather than interpreted as progress or renderer readiness; optional cache reporting stays explicitly optional.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies protocol-prefix dispatch and ordinary-log omission without claiming payload validation in this router.
 * @evidence contracts/performance.md#efficient-algorithms A fixed prefix set and at most one substring allocation make work linear only in the selected line's payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Console events are individual notifications and are routed once; this function caches no prior event or readiness state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Callbacks and text are borrowed for this invocation; no console listener is registered or retained by the router.
 */
export function routeHumanViewerConsole(
  text: string,
  props: IRouteHumanViewerConsoleProps,
): void {
  if (text.startsWith("HUMAN_WORK "))
    props.work(text.slice("HUMAN_WORK ".length));
  else if (text.startsWith("HUMAN_ERROR "))
    props.error(text.slice("HUMAN_ERROR ".length));
  else if (text.startsWith("HUMAN_DISPLAY_ERROR "))
    props.displayError(text.slice("HUMAN_DISPLAY_ERROR ".length));
  else if (text === "HUMAN_DISPLAY_RECOVERED") props.displayRecovered();
  else if (text.startsWith("HUMAN_READY "))
    props.ready(text.slice("HUMAN_READY ".length));
  else if (text === "HUMAN_ADMISSION") props.admission();
  else if (text.startsWith("HUMAN_RESTART "))
    props.restart(text.slice("HUMAN_RESTART ".length));
  else if (text.startsWith("HUMAN_FIRST_ADDRESS "))
    props.firstAddress(text.slice("HUMAN_FIRST_ADDRESS ".length));
  else if (text.startsWith("HUMAN_CACHE "))
    props.cache?.(text.slice("HUMAN_CACHE ".length));
}
