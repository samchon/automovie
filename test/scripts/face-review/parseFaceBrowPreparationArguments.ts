/**
 * Parse the internal preparation command's study, explicit probe record and new
 * output artifact. Existence is injected so argument policy is tested without
 * filesystem work. Paths are retained literally for the caller's platform.
 */
export function parseFaceBrowPreparationArguments(
  args: readonly string[],
  exists: (path: string) => boolean,
): { study: string; request: string; output: string } {
  if (args.length !== 3 || args.some((arg) => arg.trim() === ""))
    throw new Error("Brow preparation needs STUDY REQUEST.json OUTPUT.json.");
  const [study, request, output] = args;
  if (!exists(study) || !exists(request))
    throw new Error(
      "Brow preparation needs an existing study and explicit request.",
    );
  if (exists(output))
    throw new Error("Brow preparation output must be a new artifact.");
  return { study, request, output };
}
