import { physicalSupportSpanContacts as Contacts } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The support pieces hold for any number of planted contacts
 * (`physicalSupportSpanContacts`), with N = 2, 3, 4, 6 and 8 point contacts on
 * a 0.3 m circle about the origin, the first at +x:
 *
 * 1. The hull has the N contacts as its vertices; with two, the segment.
 * 2. Without the first limb the hull loses that vertex.
 * 3. With the capture point inside the support the capture region is the whole
 *    reachable region, nonempty.
 * 4. The weight's shares at the centroid are 1/N each; at any pivot they sum to
 *    one and their weighted mean of the contacts is the pivot.
 */
export function test_physical_support_span_contacts(): void {
  for (const n of [2, 3, 4, 6, 8]) {
    const contacts: Contacts.IContact[] = Array.from(
      { length: n },
      (_, i: number): Contacts.IContact => ({
        bone: `limb${i}`,
        points: [
          {
            x: 0.3 * Math.cos((2 * Math.PI * i) / n),
            z: 0.3 * Math.sin((2 * Math.PI * i) / n),
          },
        ],
      }),
    );
    TestValidator.equals(`${n}: hull`, Contacts.hull(contacts).length, n);
    TestValidator.equals(
      `${n}: remaining`,
      Contacts.remaining(contacts, "limb0").length,
      n - 1,
    );
    if (n >= 3)
      TestValidator.predicate(
        `${n}: capture region`,
        Contacts.captureRegion({
          polygon: Contacts.hull(contacts),
          capture: { x: 0, y: 0 },
          omega: 3.3,
          remaining: 0.3,
          range: 0.6,
        }).length >= 3,
      );
    const even: number[] = Contacts.loads(contacts, { x: 0, z: 0 }).map(
      (load: Contacts.ILoad): number => load.share,
    );
    TestValidator.predicate(
      `${n}: even shares`,
      even.every((share: number): boolean => Math.abs(share - 1 / n) < 1e-12),
    );
    const pivot: { x: number; z: number } =
      n === 2 ? { x: 0.1, z: 0 } : { x: 0.05, z: -0.04 };
    const shares: number[] = Contacts.loads(contacts, pivot).map(
      (load: Contacts.ILoad): number => load.share,
    );
    const at = (key: "x" | "z"): number =>
      shares.reduce(
        (sum: number, share: number, i: number): number =>
          sum + share * contacts[i]!.points[0]![key],
        0,
      );
    TestValidator.predicate(
      `${n}: shares at the pivot`,
      Math.abs(shares.reduce((a: number, b: number): number => a + b, 0) - 1) <
        1e-12 &&
        Math.abs(at("x") - pivot.x) < 1e-12 &&
        Math.abs(at("z") - pivot.z) < 1e-12,
    );
  }
}
