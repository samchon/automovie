import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";

import type { IAutoMovieInspectorLive } from "./IAutoMovieInspectorLive.js";
import { inspectAutoMovieInspectorRequest } from "./inspectAutoMovieInspectorRequest.js";

/**
 * Install a request's inspection on the mount's subject with the marks of the
 * placed second; when the scene refuses it, install the applied request again,
 * so the preceding inspection stays in force, and hand the refusal to
 * `refused`.
 *
 * @returns Whether the request's own inspection was installed.
 */
export function installAutoMovieInspectorRequest(props: {
  /** The mount's live state, whose inspection this replaces. */
  now: IAutoMovieInspectorLive;

  /** The request to install. */
  request: IAutoMovieCapturePlanRequest;

  /** The placed second, whose marks the inspection draws. */
  seconds: number;

  /** Told the refusal's error when the request is refused. */
  refused: (error: unknown) => void;
}): boolean {
  const { now }: typeof props = props;
  const base: Omit<
    Parameters<typeof inspectAutoMovieInspectorRequest>[0],
    "request"
  > = {
    instance: now.instance,
    renderer: now.renderer,
    marks: now.instance.marks?.(props.seconds),
  };
  try {
    now.inspection = inspectAutoMovieInspectorRequest({
      ...base,
      request: props.request,
    });
    return true;
  } catch (error) {
    now.inspection = inspectAutoMovieInspectorRequest({
      ...base,
      request: now.applied,
    });
    props.refused(error);
    return false;
  }
}
