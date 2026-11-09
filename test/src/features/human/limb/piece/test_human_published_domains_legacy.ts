import { HumanPublishedDomains } from "../../../internal/HumanPublishedDomains";

/**
 * Human restoration of a legacy publication, one without the optional domain
 * authorities, keeps the true poles and the independent cutting hole.
 *
 * @evidence contracts/testing.md#behavioral-verification Publishes the shared native ellipsoid fixture (`HumanPublishedDomains`), strips the optional domain fields and consumes it through actual `AutoMovieHumanBodySurfaceSolids.draw`.
 * @evidence contracts/testing.md#independent-expectations The authored ellipsoid has exactly two poles; no emitted regular triangle centroid may lie in the authored hole.
 * @evidence contracts/testing.md#distinguishing-cases The legacy publication here; the explicit authorities in `test_human_published_domains`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_published_domains_legacy`, on authored small sources and the real Human consumer, with no person, image, process or viewer.
 */
export function test_human_published_domains_legacy(): void {
  const failures: string[] = HumanPublishedDomains.audit({ explicit: false, density: 1 });
  if (failures.length !== 0) throw new Error("Published domain roundtrip findings:\n" + failures.join("\n"));
}
