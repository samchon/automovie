import type { IRouteHumanViewerConsoleProps } from "./IRouteHumanViewerConsoleProps";

/**
 * Route one page console line by its protocol prefix. Lines without one are
 * ordinary page logs and are ignored.
 *
 * @evidence contracts/common.md#clear-and-simple-design One function owns the console protocol prefixes.
 * @evidence contracts/common.md#meaningful-documentation States the ignored case.
 */
export function routeHumanViewerConsole(text: string, props: IRouteHumanViewerConsoleProps): void {
  if (text.startsWith("HUMAN_WORK ")) props.work(text.slice("HUMAN_WORK ".length));
  else if (text.startsWith("HUMAN_ERROR ")) props.error(text.slice("HUMAN_ERROR ".length));
  else if (text.startsWith("HUMAN_READY ")) props.ready(text.slice("HUMAN_READY ".length));
  else if (text === "HUMAN_ADMISSION") props.admission();
  else if (text.startsWith("HUMAN_RESTART ")) props.restart(text.slice("HUMAN_RESTART ".length));
  else if (text.startsWith("HUMAN_FIRST_ADDRESS ")) props.firstAddress(text.slice("HUMAN_FIRST_ADDRESS ".length));
  else if (text.startsWith("HUMAN_CACHE ")) props.cache?.(text.slice("HUMAN_CACHE ".length));
}
