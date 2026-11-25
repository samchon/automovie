import { physicalSupportSpanContacts as Contacts } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * The support pieces hold for any number of planted contacts
 * (`physicalSupportSpanContacts`), with N = 2, 3, 4, 6 and 8 point contacts on
 * a 0.3 m circle about the origin, the first at +x:
 *
 * 1. The hull has the N contacts as its vertices; with two, the segment.
 * 2. Without the first limb the hull loses that vertex.
 * 3. The capture region on the support left by the first limb: with the capture
 *    point inside, the reach disc about the first limb's lift-off; just past
 *    it, a region inside every disc; with the only disc out of reach, none.
 * 4. The weight's shares at the centroid are 1/N each; at any pivot they sum to
 *    one, their weighted mean of the contacts is the pivot and none is
 *    negative, with N = 6's pivot 0.01 m inside an edge.
 */
export function test_engine_physics_physical_support_span_contacts(): void {
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
    if (n >= 3) {
      const polygon = Contacts.remaining(contacts, "limb0");
      const lift = Contacts.hull([contacts[0]!])[0]!;
      const region = (
        capture: { x: number; y: number },
        reach: Contacts.IReach[],
      ) =>
        Contacts.captureRegion({
          polygon: n === 3 ? Contacts.hull(contacts) : polygon,
          capture,
          omega: 3.3,
          remaining: 0.1,
          reach,
        });
      const disc: Contacts.IReach = { center: lift, radius: 0.6 };
      TestValidator.predicate(
        `${n}: capture region inside the support`,
        region({ x: 0, y: 0 }, [disc]).length >= 3,
      );
      const beyond = region({ x: lift.x * 1.05, y: lift.y * 1.05 }, [
        disc,
        { center: { x: 0, y: 0 }, radius: 1.0 },
      ]);
      TestValidator.predicate(
        `${n}: capture region within every disc`,
        beyond.length >= 3 &&
          beyond.every(
            (p) =>
              Math.hypot(p.x - lift.x, p.y - lift.y) <=
                0.6 + PhysicalTolerance.ACCUMULATED &&
              Math.hypot(p.x, p.y) <= 1.0 + PhysicalTolerance.ACCUMULATED,
          ),
      );
      TestValidator.equals(
        `${n}: no capture region out of reach`,
        region({ x: lift.x * 1.2, y: lift.y * 1.2 }, [
          { center: { x: -lift.x * 10, y: -lift.y * 10 }, radius: 0.1 },
        ]).length,
        0,
      );
    }
    const even: number[] = Contacts.loads(contacts, { x: 0, z: 0 }).map(
      (load: Contacts.ILoad): number => load.share,
    );
    TestValidator.predicate(
      `${n}: even shares`,
      even.every(
        (share: number): boolean =>
          Math.abs(share - 1 / n) < PhysicalTolerance.ACCUMULATED,
      ),
    );
    const pivot: { x: number; z: number } =
      n === 2
        ? { x: 0.1, z: 0 }
        : n === 6
          ? { x: 0.25 * Math.cos(Math.PI / 6), z: 0.25 * Math.sin(Math.PI / 6) }
          : { x: 0.05, z: -0.04 };
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
        PhysicalTolerance.ACCUMULATED &&
        Math.abs(at("x") - pivot.x) < PhysicalTolerance.ACCUMULATED &&
        Math.abs(at("z") - pivot.z) < PhysicalTolerance.ACCUMULATED &&
        shares.every(
          (share: number): boolean => share >= -PhysicalTolerance.ROUNDING,
        ),
    );
  }

  // 5. A pivot on the boundary, where a saturated pivot sits: two 0.06 x 0.1 m
  // soles' corners, the pivot at a corner takes it all, on an edge's middle
  // its two ends half each.
  const x0: number = 0.2598076211353315 - 0.03;
  const corners: Contacts.IContact[] = [
    [x0, 0.1],
    [x0, 0.2],
    [x0 + 0.06, 0.2],
    [x0 + 0.06, 0.1],
    [x0 + 0.03, 0.7],
    [x0 + 0.03, 0.8],
    [x0 + 0.09, 0.8],
    [x0 + 0.09, 0.7],
  ].map(
    ([x, z], i: number): Contacts.IContact => ({
      bone: `corner${i}`,
      points: [{ x: x!, z: z! }],
    }),
  );
  const shares = (pivot: { x: number; z: number }): number[] =>
    Contacts.loads(corners, pivot).map((load: Contacts.ILoad) => load.share);
  TestValidator.predicate(
    "boundary: a corner",
    shares({ x: x0 + 0.03, z: 0.8 }).every(
      (share: number, i: number): boolean =>
        Math.abs(share - (i === 5 ? 1 : 0)) < PhysicalTolerance.ACCUMULATED,
    ),
  );
  TestValidator.predicate(
    "boundary: an edge",
    shares({ x: x0, z: 0.15 }).every(
      (share: number, i: number): boolean =>
        Math.abs(share - (i < 2 ? 0.5 : 0)) < PhysicalTolerance.ACCUMULATED,
    ),
  );
}
