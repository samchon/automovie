import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import type { IAutoMovieInspectionHandle } from "@automovie/render";

import { inspectAutoMovieInspectorRequest } from "./inspectAutoMovieInspectorRequest.js";
import { messageOfAutoMovieInspectorError } from "./messageOfAutoMovieInspectorError.js";
import { readAutoMovieInspectorAddress } from "./readAutoMovieInspectorAddress.js";

/**
 * Apply the newest request's inspection to an arrived subject, or, when the
 * scene refuses it, the request that asks for nothing for the same subject.
 *
 * @param props The arrival's instance, renderer and first marks, as
 *   `inspectAutoMovieInspectorRequest` takes them, and the request wanted.
 * @returns The request applied, its inspection, and the refusal's message, or
 *   null when the wanted request was applied.
 * @throws {Error} When the request that asks for nothing is refused too.
 */
export function applyAutoMovieInspectorRequest(
  props: Omit<
    Parameters<typeof inspectAutoMovieInspectorRequest>[0],
    "request"
  > & {
    /** The newest request. */
    wanted: IAutoMovieCapturePlanRequest;
  },
): {
  /** The request whose inspection was applied. */
  applied: IAutoMovieCapturePlanRequest;

  /** Its applied inspection. */
  inspection: IAutoMovieInspectionHandle;

  /** Why the wanted request was refused, or null. */
  refusal: string | null;
} {
  const { wanted, ...scene } = props;
  try {
    return {
      applied: wanted,
      inspection: inspectAutoMovieInspectorRequest({
        ...scene,
        request: wanted,
      }),
      refusal: null,
    };
  } catch (error) {
    const applied: IAutoMovieCapturePlanRequest = {
      ...readAutoMovieInspectorAddress(""),
      subject: wanted.subject,
    };
    return {
      applied,
      inspection: inspectAutoMovieInspectorRequest({
        ...scene,
        request: applied,
      }),
      refusal: messageOfAutoMovieInspectorError(error),
    };
  }
}
