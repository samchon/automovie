import { admitAutoMovieControlPasses } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `admitAutoMovieControlPasses` keeps the named guide passes in request order
 * and refuses `beauty`, a name that is no guide pass and a repeat.
 *
 * Scenarios:
 *
 * 1. "pose", "depth" stay in that order; an empty list admits nothing.
 * 2. "beauty" is refused as the film itself, "faces" as no guide pass and "pose",
 *    "pose" as named twice.
 */
export function test_unit_render_delivery_admit_control_passes(): void {
  TestValidator.equals(
    "request order",
    admitAutoMovieControlPasses(["pose", "depth"]),
    ["pose", "depth"],
  );
  TestValidator.equals("nothing", admitAutoMovieControlPasses([]), []);
  for (const [passes, message] of [
    [["beauty"], "film itself"],
    [["faces"], "not a guide pass"],
    [["pose", "pose"], "named twice"],
  ] as const)
    TestValidator.equals(
      message,
      ((): string => {
        try {
          admitAutoMovieControlPasses(passes);
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
