/** What one observation run was asked to cover. */
export interface IBodyObservationRequest {
  /** Run name; output lands in `.shots/body-review/observe-<name>/`. */
  name: string;

  /** Which kind of unit to observe. */
  unit: "part" | "joint" | "whole";

  /** The unit's id (a part name or a `parent>child` pair), or null for every unit of the kind. */
  id: string | null;
}

/**
 * Read the command line of the observation runner:
 * `<name> --unit part|joint|whole [--id <unit id>]`.
 *
 * The unit kind is required, because the three kinds differ by orders of
 * magnitude in frames and a run that silently took all of them would draw
 * thousands. An id narrows a kind to one unit; without it every unit of the
 * kind is drawn. `whole` has one unit and takes no id, so an id for it is
 * refused rather than ignored, and so are an unknown kind, an unknown option,
 * an option without a value, a missing or extra run name.
 *
 * @param argv Arguments after the script name.
 */
export function parseBodyObservationArguments(
  argv: string[],
): IBodyObservationRequest {
  const rest = argv.filter((argument) => argument !== "--");
  const options = new Map<string, string>();
  const positional: string[] = [];
  for (let at = 0; at < rest.length; at++) {
    const argument = rest[at];
    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }
    if (argument !== "--unit" && argument !== "--id")
      throw new Error(`Unknown option ${argument}.`);
    const value = rest[at + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`The option ${argument} needs a value.`);
    options.set(argument, value);
    at++;
  }
  if (positional.length !== 1) throw new Error("Give exactly one run name.");
  const unit = options.get("--unit");
  if (unit !== "part" && unit !== "joint" && unit !== "whole")
    throw new Error("Give --unit part, joint or whole.");
  const id = options.get("--id") ?? null;
  if (unit === "whole" && id !== null)
    throw new Error("The whole unit takes no --id.");
  return { name: positional[0], unit, id };
}
