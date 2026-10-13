import type { IRouteHumanViewerConsoleProps } from "./IRouteHumanViewerConsoleProps.js";

/**
 * Route one page console line by its protocol prefix. Lines without one are
 * ordinary page logs and are ignored.
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
