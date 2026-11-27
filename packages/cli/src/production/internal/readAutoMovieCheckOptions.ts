import { parseArgs } from "node:util";

/*
 * Admit the CLI's production check module, subjects, selected checks and one
 * optional gate. Status is read-only without `--run`. A gate evaluates its
 * whole stage even when `--only` limits execution to named check IDs.
 * Parameter args: The tokens after the command, excluding the executable name.
 * Returns: Production-relative module path, selection and output mode.
 * On malformed options, blank values or a repeated single-value option.
 */
export function readAutoMovieCheckOptions(args: readonly string[]): {
  module: string;
  subjects: string[];
  only: string[];
  require: string | null;
  run: boolean;
  json: boolean;
} {
  const parsed = parseArgs({
    args: [...args],
    options: {
      module: { type: "string", multiple: true },
      subject: { type: "string", multiple: true },
      only: { type: "string", multiple: true },
      require: { type: "string", multiple: true },
      run: { type: "boolean" },
      json: { type: "boolean" },
    },
  }).values;
  if ((parsed.module?.length ?? 0) > 1 || (parsed.require?.length ?? 0) > 1)
    throw new Error("check takes at most one --module and one --require.");
  const texts: string[] = [
    ...(parsed.module ?? []),
    ...(parsed.subject ?? []),
    ...(parsed.only ?? []),
    ...(parsed.require ?? []),
  ];
  if (texts.some((text: string): boolean => text.trim().length === 0))
    throw new Error("check option values must not be blank.");

  return {
    module: parsed.module?.[0] ?? "src/executable/check.ts",
    subjects: [...new Set(parsed.subject ?? [])],
    only: [...new Set(parsed.only ?? [])],
    require: parsed.require?.[0] ?? null,
    run: parsed.run ?? false,
    json: parsed.json ?? false,
  };
}
