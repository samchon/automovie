import { HumanPublishedDomains } from "../../../internal/HumanPublishedDomains";

/**
 * Actual body publication and Human restoration keep original domain sides distinct from cutting holes.
 *
 * Scenarios:
 * 1. Publish regular sampling bounds inside the unchanged two-pole source domain.
 * 2. Restore the explicit authorities at the original phase density: regular bounds, source ownership, each shared original point consumed once, both true poles once, no regular triangle in the hole.
 *
 * @evidence contracts/testing.md#behavioral-verification Publishes a real native ellipsoid body with authoritative grid ends and an independent interior hole (`HumanPublishedDomains`), then consumes it through actual Human BodySurfaceSolids.draw.
 * @evidence contracts/testing.md#independent-expectations The authored ellipsoid has exactly two actual poles. Both survive an interior hole, and no emitted regular triangle centroid may lie in that hole; original domain rows are not cuts. Published cycles/domain fields must retain their declared distinct roles.
 * @evidence contracts/testing.md#distinguishing-cases The explicit authorities here; the legacy publication omitting the optional fields in `test_human_published_domains_legacy`. Regular sampling bounds remain distinct from unchanged source bounds, and shared original point IDs remain consumed once.
 * @evidence contracts/testing.md#execution-ownership One synchronous CPU question uses authored small sources and the real Human consumer, without a person, image, new process or viewer. It makes no f1 profile/binding claim.
 */
export function test_human_published_domains(): void {
  const failures: string[] = HumanPublishedDomains.audit({ explicit: true, density: 1 });
  if (failures.length !== 0) throw new Error("Published domain roundtrip findings:\n" + failures.join("\n"));
}
