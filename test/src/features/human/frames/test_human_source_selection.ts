import { FamilyConicSourceSelection as Selection } from "../../../reference-conics/FamilyConicSourceSelection";

/**
 * Source PNG selection narrows actual original ids and supported directions without changing the absent-option plan.
 *
 * Scenarios:
 * 1. Explicit source/view lists select only the requested actual axes in their requested order.
 * 2. Absent options retain the whole offered plan, with absence recorded separately.
 * 3. Unknown, duplicate, empty and repeated CLI values are refused on both axes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual pure selection used by source-only PNG consumers with made offered ids and directions, without metadata filtering or rendering.
 * @evidence contracts/development/testing.md#independent-expectations Literal arm/figure and front/top require two sources and two views; absent options must preserve the offered three-by-three plan.
 * @evidence contracts/development/common.md#meaningful-documentation PNG source selection preserves explicit order and defaults to the offered plan. Unknown, duplicate, empty, and repeated values refuse on either axis.
 */
export function test_human_source_selection(): void {
  const sources: string[] = ["figure", "trunk", "arm"];
  const views: string[] = ["front", "left", "top"];
  const failures: string[] = [];
  const reduced: Selection.IPlan = Selection.select(
    ["--sources=arm,figure", "--views=front,top"],
    sources,
    views,
  );
  if (
    reduced.sources.join(",") !== "arm,figure" ||
    reduced.views.join(",") !== "front,top" ||
    reduced.requested.sources?.join(",") !== "arm,figure" ||
    reduced.requested.views?.join(",") !== "front,top"
  )
    failures.push("explicit sources/views were not narrowed and recorded");
  const full: Selection.IPlan = Selection.select([], sources, views);
  if (
    full.sources.join(",") !== sources.join(",") ||
    full.views.join(",") !== views.join(",") ||
    full.requested.sources !== null ||
    full.requested.views !== null
  )
    failures.push("absent source/view options changed the complete plan");
  const exact: Selection.IPlan = Selection.select(
    ["--sources=arm"],
    ["figure", "arm", "arm.mirror", "factory.failed"],
    views,
  );
  const failed: Selection.IPlan = Selection.select(
    ["--sources=factory.failed"],
    ["figure", "arm", "arm.mirror", "factory.failed"],
    views,
  );
  if (
    exact.sources.join(",") !== "arm" ||
    failed.sources.join(",") !== "factory.failed"
  )
    failures.push(
      "exact source identity or declared failed factory was hidden",
    );
  const invalid: string[][] = [
    ["--sources=missing"],
    ["--sources=arm,arm"],
    ["--sources="],
    ["--sources=arm,,trunk"],
    ["--sources"],
    ["--sources=arm", "--sources=trunk"],
    ["--views=underside"],
    ["--views=top,top"],
    ["--views="],
    ["--views=front,"],
    ["--views"],
    ["--views=front", "--views=top"],
  ];
  for (const args of invalid) {
    let refused: boolean = false;
    try {
      Selection.select(args, sources, views);
    } catch {
      refused = true;
    }
    if (!refused)
      failures.push(
        "accepted ambiguous or unavailable PNG selection: " + args.join(" "),
      );
  }
  if (
    sources.join(",") !== "figure,trunk,arm" ||
    views.join(",") !== "front,left,top"
  )
    failures.push("selection mutated the offered definitions");
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
