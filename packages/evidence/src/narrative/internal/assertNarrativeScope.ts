import type { AutoMovieEvidenceNarrativeScope } from "../AutoMovieEvidenceNarrativeScope";

/*
 * Checks the scope at the production boundary and at selector entry points.
 * Checking the exact folder name before inserting it prevents the part name
 * from changing the selector's interpretation.
 */
export function assertNarrativeScope(
  scope: unknown,
  route?: "long" | "short" | "none",
): asserts scope is AutoMovieEvidenceNarrativeScope {
  if (route === "none")
    throw new Error("A direct screenplay does not accept a narrative scope.");
  if (scope === null || typeof scope !== "object" || !("mode" in scope))
    throw new Error("Expected a complete-work or first-part-pilot scope.");
  if (scope.mode === "complete-work") return;
  if (scope.mode !== "first-part-pilot")
    throw new Error("Expected a complete-work or first-part-pilot scope.");
  if (route === "short")
    throw new Error(
      "A first-part pilot scope is available only on the long route.",
    );
  if (
    !("part" in scope) ||
    typeof scope.part !== "string" ||
    !/^001-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(scope.part)
  )
    throw new Error(
      "A first-part pilot requires one exact 001-lower-kebab-case part directory.",
    );
}
