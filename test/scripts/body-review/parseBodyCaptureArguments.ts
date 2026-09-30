import {
  HUMAN_OBSERVATION_PASSES,
  type HumanObservationPass,
} from "@automovie/playground/src/human/observation/HumanObservationPass";
import {
  HUMAN_OBSERVATION_VIEWS,
  type HumanObservationView,
} from "@automovie/playground/src/human/observation/HumanObservationView";

/** What one body capture run was asked to draw. */
export interface IBodyCaptureRequest {
  /** Run name; frames land in `.shots/body-review/editor-<name>/`. */
  name: string;

  /** State names to draw, or null for every state of the document source. */
  states: string[] | null;

  /** Views, in the order drawn. */
  views: HumanObservationView[];

  /** Passes, in the order drawn. */
  passes: HumanObservationPass[];

  /** A JSON file of `{ state: { shape, pose } }` that replaces the standard states, or null. */
  documents: string | null;
}

/** The six horizon views a body review needs by default, without the poles. */
const DEFAULT_VIEWS: HumanObservationView[] = [
  "front",
  "left-three-quarter",
  "left",
  "back",
  "right-three-quarter",
  "right",
];

/**
 * Read the command line of the body capture runner:
 * `<name> [--states a,b] [--views v,w] [--passes p,q] [--documents file]`.
 *
 * Views and passes are checked against the names the page hooks accept, so a
 * misspelling fails here, before a browser is opened, and not halfway through
 * a run. Defaults are the six horizon views and the `beauty` and `clay`
 * passes; the poles are asked for by name. A repeated name is refused because
 * it would draw and record the same frame twice, an option without a value is
 * refused, and so is an unknown option, so a typo cannot silently change what
 * a run covers.
 *
 * @param argv Arguments after the script name.
 */
export function parseBodyCaptureArguments(argv: string[]): IBodyCaptureRequest {
  const rest = argv.filter((argument) => argument !== "--");
  const options = new Map<string, string>();
  const positional: string[] = [];
  for (let at = 0; at < rest.length; at++) {
    const argument = rest[at];
    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }
    const value = rest[at + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`The option ${argument} needs a value.`);
    if (!["--states", "--views", "--passes", "--documents"].includes(argument))
      throw new Error(`Unknown option ${argument}.`);
    options.set(argument, value);
    at++;
  }
  if (positional.length !== 1)
    throw new Error("Give exactly one run name.");
  const list = <Name extends string>(
    option: string,
    allowed: readonly Name[] | null,
    fallback: Name[] | null,
  ): Name[] | null => {
    const raw = options.get(option);
    if (raw === undefined) return fallback;
    const names = raw.split(",").filter((name) => name !== "");
    if (names.length === 0) throw new Error(`The option ${option} names nothing.`);
    if (new Set(names).size !== names.length)
      throw new Error(`The option ${option} repeats a name.`);
    for (const name of names)
      if (allowed !== null && !(allowed as readonly string[]).includes(name))
        throw new Error(`Unknown name "${name}" for ${option}.`);
    return names as Name[];
  };
  return {
    name: positional[0],
    states: list<string>("--states", null, null),
    views: list("--views", HUMAN_OBSERVATION_VIEWS, DEFAULT_VIEWS)!,
    passes: list("--passes", HUMAN_OBSERVATION_PASSES, ["beauty", "clay"])!,
    documents: options.get("--documents") ?? null,
  };
}
