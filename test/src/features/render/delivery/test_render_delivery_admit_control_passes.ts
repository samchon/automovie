import { AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderDraw.admitControlPasses` keeps the named guide passes in request order
 * and refuses `beauty`, a name that is no guide pass and a repeat.
 *
 * Scenarios:
 *
 * 1. "pose", "depth" stay in that order; an empty list admits nothing.
 * 2. "beauty" is refused as the film itself, "faces" as no guide pass and "pose",
 *    "pose" as named twice.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admits named control passes in request order and refuses beauty, unknown names and repeated names.
 * @evidence contracts/development/testing.md#behavioral-verification Calls control-pass admission with two ordered passes, no passes and three separate invalid requests.
 * @evidence contracts/development/testing.md#independent-expectations The expected ordered pair and the three refusal messages identify each admission decision rather than relying on list order alone.
 */
export function test_render_delivery_admit_control_passes(): void {
  TestValidator.equals(
    "request order",
    AutoMovieRenderDraw.admitControlPasses(["pose", "depth"]),
    ["pose", "depth"],
  );
  TestValidator.equals("nothing", AutoMovieRenderDraw.admitControlPasses([]), []);
  for (const [passes, message] of [
    [["beauty"], "film itself"],
    [["faces"], "not a guide pass"],
    [["pose", "pose"], "named twice"],
  ] as const)
    TestValidator.equals(
      message,
      ((): string => {
        try {
          AutoMovieRenderDraw.admitControlPasses(passes);
          return "";
        } catch (error) {
          return error instanceof Error && error.message.includes(message)
            ? message
            : "";
        }
      })(),
      message,
    );
}
