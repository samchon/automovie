import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieMark,
} from "@automovie/interface";

import type { IAutoMovieInspectorLive } from "./IAutoMovieInspectorLive";
import { inspectInspectorRequest } from "./inspectInspectorRequest";

/*
 * Install a request's inspection on the mount's subject with the marks of the
 * placed second; when the scene refuses it, install the applied request again,
 * so the preceding inspection stays in force, and hand the refusal to
 * `refused`.
 * Returns: Whether the request's own inspection was installed.
 */
export function installInspectorRequest(props: {
  /*
   * The mount's live state, whose inspection this replaces.
   */
  now: IAutoMovieInspectorLive;

  /*
   * The request to install.
   */
  request: IAutoMovieCapturePlanRequest;

  /*
   * The placed second, whose marks the inspection draws.
   */
  seconds: number;

  /* World trail marks at the same settled second. */
  trailMarks?: readonly IAutoMovieMark[];

  /*
   * Told the refusal's error when the request is refused.
   */
  refused: (error: unknown) => void;
}): boolean {
  const { now }: typeof props = props;
  const marks: readonly IAutoMovieMark[] | undefined = now.instance.marks?.(
    props.seconds,
  );
  const base: Omit<Parameters<typeof inspectInspectorRequest>[0], "request"> = {
    instance: now.instance,
    renderer: now.renderer,
    marks:
      props.trailMarks === undefined
        ? marks
        : [...(marks ?? []), ...props.trailMarks],
  };
  try {
    now.inspection = inspectInspectorRequest({
      ...base,
      request: props.request,
    });
    return true;
  } catch (error) {
    now.inspection = inspectInspectorRequest({
      ...base,
      request: now.applied,
    });
    props.refused(error);
    return false;
  }
}
