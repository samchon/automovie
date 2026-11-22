import { type AutoMovieArchetype, createWearable } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  dressPartner,
  presentHand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The rigid custody bound: a worn item's drift on its bone, metres. */
const RIGID: number = 0.001;

/** One dressing case: the item kind, the partner's region and its bone. */
interface ICase {
  /** The wearable kind. */
  kind: createWearable.Kind;

  /** The partner's region. */
  region: AutoMovieHumanoidRegion;

  /** Whether the partner kneels to receive it, as a crown is received; otherwise the partner presents the left hand, as a wrist is dressed. */
  kneels: boolean;
}

/** How long the partner keeps the receiving pose, seconds: past the dresser's pick-up and carry. */
const RECEIVE: number = 4;

/** The partner's receiving action's anchor, which the dresser waits for. */
const RECEIVING: string = "receiving";

/**
 * A held wearable passes from the dresser's hand to the partner's body.
 *
 * Scenarios, for a hat on the partner's kneeling crown and a watch on the
 * partner's presented left wrist, with the average man dressing the small
 * woman and the reverse; the dresser waits until the partner has knelt or
 * presented the hand, since the dresser reads the region where it is as the
 * dressing starts:
 * 1. The dresser's grip on the item ends at the arm phrase's stroke and the
 *    item is worn on the partner's bone under the region from then.
 * 2. The worn item keeps its offset on the partner's bone through the rest
 *    of the take, while the partner turns.
 * 3. Naming the dresser as the partner is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the custody change, the cases and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's grip window and the displayed item against the partner's displayed bone; a grip that outlasts the wear, an item left in the air or sliding on the partner, or an admitted self-dressing fails.
 * @evidence contracts/development/testing.md#independent-expectations Custody passes without a gap or an overlap; a worn item is rigid on its bone, bounded at 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two items on two regions, both body pairs, the refusal; reach is the arm phrase's own specification.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory two-performer performance through the public chain.
 */
export function test_human_motion_dress_partner(): void {
  const cases: readonly ICase[] = [
    { kind: "hat", region: "crown", kneels: true },
    { kind: "watch", region: "wristLeft", kneels: false },
  ];
  for (const [dresser, dressed] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const)
    for (const item of cases) {
      const a: IAutoMovieMotionHumanBody = motionHumanBody(dresser);
      const b: IAutoMovieMotionHumanBody = motionHumanBody(dressed);
      const model: AutoMovieArchetype<
        createWearable.Affordance,
        createWearable.Dimension
      > = createWearable({ kind: item.kind });
      const film: HumanPerformance = stage(a, b, model, item, "b");
      assertTakeClean(`${dresser} dresses ${dressed}: ${item.kind}`, film);
      const dress: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.name === "dressPartner",
        )!;
      const worn: number = event(dress, "stroke");
      const grip: IAutoMovieMotionHumanContactWindow | undefined =
        dress.plan.contacts.find(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.kind === "grip" &&
            window.support.kind === "prop" &&
            window.support.subject === "item",
        );
      const label: string = `${dresser} dresses ${dressed} with a ${item.kind}`;
      TestValidator.predicate(
        `${label}: the grip ends as the item is worn`,
        grip !== undefined &&
          Math.abs(dress.start + grip.to * dress.plan.duration - worn) <= 1e-9,
      );
      const bone: AutoMovieHumanoidBone = b.surfaces.regions[item.region].bone;
      const first: IAutoMovieVector3 = local(
        film.prop("item", worn + 0.01),
        film.bones("b", worn + 0.01).get(bone)!,
      );
      const drifts: readonly number[] = [0.5, 1].map(
        (share: number): number => {
          const t: number = worn + share * (film.duration - worn);
          return Vector3.distance(
            local(film.prop("item", t), film.bones("b", t).get(bone)!),
            first,
          );
        },
      );
      TestValidator.predicate(
        `${label}: the item rides the partner's bone (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
        drifts.every((d: number): boolean => d <= RIGID),
      );
    }
  const self: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  TestValidator.predicate(
    "dressing oneself is refused",
    (() => {
      try {
        stage(
          self,
          self,
          createWearable({ kind: "hat" }),
          cases[0]!,
          "a",
        ).bones("a", 1);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === "partner";
      }
    })(),
  );
}

/** The dresser `a` takes the item and dresses `partner`, then `b` turns. */
function stage(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  model: AutoMovieArchetype<
    createWearable.Affordance,
    createWearable.Dimension
  >,
  item: ICase,
  partner: string,
): HumanPerformance {
  // The dresser stands until the partner has knelt or presented the hand
  // (the stand is cut there, its own length only an upper bound), then
  // takes the item.
  const Chain: IAutoMovieMotionHumanChain.IExtension<{
    dressPartner: typeof dressPartner;
  }> = HumanChain.extend({ dressPartner });
  const dresser: ReturnType<typeof Chain.subject> = Chain.subject("a")
    .stand({ seconds: 2 * RECEIVE })
    .until({ of: RECEIVING, event: item.kneels ? "settled" : "ready" })
    .pickUp({ prop: "item", handle: "hold", hand: "right", lift: 0.05 });
  return new HumanPerformance({
    seed: "dress-partner",
    laws: [dressPartner, presentHand],
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: 0.55 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("item", model, {
        position: { x: -0.25, y: 1.0, z: 0.2 },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 0),
      }),
    ],
    // The partner is placed first, so the dresser reads where the partner is.
    composition: (item.kneels
      ? // The partner kneels where they stand, the right knee coming down
        // under the right hip, not stepping back out of the dresser's reach.
        HumanChain.subject("b").act(
          "kneel",
          {
            kind: "both",
            hold: RECEIVE,
            rise: true,
            at: {
              kind: "point",
              frame: "world",
              at: { x: -b.rest.get("rightFoot")!.x, y: 0, z: 0.55 },
            },
          },
          RECEIVING,
        )
      : // A hanging wrist lies about 0.7 m below the dresser's shoulder,
        // beyond an arm; the partner holds it out, forearm level.
        HumanChain.subject("b")
          .registered(
            presentHand.name,
            { side: "left", seconds: RECEIVE },
            RECEIVING,
          )
          .walk({ to: { x: 0, y: 0, z: 0.55 }, face: 120 })
    ).with(
      dresser.dressPartner({
        prop: "item",
        partner,
        region: item.region,
        point: "wear",
      }),
    ).node,
  });
}

/** The film second of a segment's named event. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (item: IAutoMovieMotionEvent): boolean => item.name === name,
      )!.share
  );
}

/** A prop's position in a displayed bone's frame, metres. */
function local(
  prop: IAutoMovieRigidTransform,
  bone: IAutoMovieResolvedBone,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(bone.worldRotation),
    Vector3.subtract(prop.position, bone.worldPosition),
  );
}
