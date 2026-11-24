import { createInstrument, createViolinBow } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Read the displayed props at ready, contact, midstroke, lift and end. On
 * the string the sounding point must lie on the finite hair ribbon as the
 * hair moves toward the tip. Before and after it must clear the ribbon.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, expected motion of the contact and release.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the law, picks up the archetype bow and measures the displayed prop frames at named boundaries.
 * @evidence contracts/development/testing.md#independent-expectations Projects a sounding point defined by the violin bar on the finite segment of displayed bow hair, with a 5 mm contact tolerance and 25 mm release bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests exact contact and lift boundaries, a moving midpoint, clear ready and end poses and retention of the bow after the stroke.
 * @evidence contracts/development/testing.md#execution-ownership Builds and samples two in-memory public performances without a renderer or external input.
 */
export function test_motion_instrument_bow_violin(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bow: ReturnType<typeof createViolinBow> = createViolinBow();
  const bowProp: IAutoMovieMotionHumanProp = HumanObject.prop("bow", bow, {
    at: { x: -0.22, y: 0.58 * body.measure.stature, z: 0.29 },
    yaw: 0,
  });
  const performer: IAutoMovieMotionHumanPerformer = {
    subject: "player",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const Chain: ReturnType<
    typeof HumanChain.extend<{
      bowViolin: typeof AutoMovieMotionHumanInstrument.bowViolin;
    }>
  > = HumanChain.extend({
    bowViolin: AutoMovieMotionHumanInstrument.bowViolin,
  });
  // Take the bow by its declared grip. The following stroke fits its own
  // target on the string using the held bow's actual attachment.
  const pick = (): ReturnType<typeof Chain.subject> =>
    Chain.subject("player").pickUp({
      prop: "bow",
      hand: "right",
      handle: "grip",
    });
  const pickup: HumanPerformance = new HumanPerformance({
    seed: "bow",
    performers: [performer],
    props: [bowProp],
    composition: pick().node,
  });

  // Stage the violin below the ready pose reached by this body's actual grip.
  const readyBow: IAutoMovieRigidTransform = pickup.prop(
    "bow",
    pickup.duration,
  );
  const violin: ReturnType<typeof createInstrument> = createInstrument({
    kind: "violin",
  });
  const bar: ReturnType<typeof violin.affordance> =
    violin.affordance("string1");
  const frog: IAutoMovieVector3 = bow.affordance("hairFrog").frame.translation;
  const tip: IAutoMovieVector3 = bow.affordance("hairTip").frame.translation;
  const theta: number = Math.PI / 15;
  const out: IAutoMovieVector3 = Quaternion.rotateVector(readyBow.rotation, {
    x: Math.sin(theta),
    y: Math.cos(theta),
    z: 0,
  });
  const across: IAutoMovieVector3 = Quaternion.rotateVector(readyBow.rotation, {
    x: Math.cos(theta),
    y: -Math.sin(theta),
    z: 0,
  });
  const long: IAutoMovieVector3 = Vector3.cross(out, across);
  const turning: IAutoMovieQuaternion = Quaternion.multiply(
    quaternionFromAutoMovieBasis(long, out, across),
    Quaternion.inverse(bar.frame.rotation),
  );
  const at: IAutoMovieVector3 = world(
    readyBow,
    Vector3.add(frog, Vector3.scale(Vector3.subtract(tip, frog), 0.18)),
  );
  const local: IAutoMovieVector3 = Vector3.add(
    bar.frame.translation,
    Quaternion.rotateVector(bar.frame.rotation, {
      x: -0.4 * bar.length!,
      y: 0,
      z: 0,
    }),
  );
  const violinProp: IAutoMovieMotionHumanProp = HumanObject.prop(
    "violin",
    violin,
    {
      position: Vector3.subtract(
        Vector3.subtract(at, Vector3.scale(out, 0.035)),
        Quaternion.rotateVector(turning, local),
      ),
      rotation: turning,
      fixed: true,
    },
  );

  const film: HumanPerformance = new HumanPerformance({
    seed: "bow",
    laws: [AutoMovieMotionHumanInstrument.bowViolin],
    performers: [performer],
    props: [bowProp, violinProp],
    composition: pick().bowViolin({
      violin: "violin",
      bow: "bow",
      string: "string1",
      duration: 1,
    }).node,
  });
  const segment: IAutoMovieMotionHumanSegment = film.segments("player")[1]!;
  const event = (name: string): number =>
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (instant: IAutoMovieMotionEvent): boolean => instant.name === name,
      )!.share;
  const measure = (seconds: number): { share: number; gap: number } => {
    const bowFrame: IAutoMovieRigidTransform = film.prop("bow", seconds);
    const stringPoint: IAutoMovieVector3 = world(
      film.prop("violin", seconds),
      local,
    );
    const a: IAutoMovieVector3 = world(bowFrame, frog);
    const v: IAutoMovieVector3 = Vector3.subtract(world(bowFrame, tip), a);
    const w: IAutoMovieVector3 = Vector3.subtract(stringPoint, a);
    const share: number = Vector3.dot(w, v) / Vector3.dot(v, v);
    const gap: number = Vector3.length(
      Vector3.subtract(w, Vector3.scale(v, Math.max(0, Math.min(1, share)))),
    );
    return { share, gap };
  };

  const contact: number = event("contact");
  const lift: number = event("lift");
  const a: ReturnType<typeof measure> = measure(contact);
  const b: ReturnType<typeof measure> = measure((contact + lift) / 2);
  const c: ReturnType<typeof measure> = measure(lift);
  const complaints: string[] = [];
  if (Math.abs(lift - contact - 1) > 1e-9)
    complaints.push(
      `one second was authored but the stroke lasted ${lift - contact}s`,
    );
  for (const [label, read] of [
    ["contact", a],
    ["midstroke", b],
    ["lift", c],
  ] as const)
    if (!(read.share > 0 && read.share < 1 && read.gap <= 0.005))
      complaints.push(`${label}: share ${read.share}, gap ${read.gap}m`);
  if (!(a.share < b.share && b.share < c.share && c.share - a.share > 0.2))
    complaints.push(
      `the hair did not pass frog-to-tip: ${[a.share, b.share, c.share]}`,
    );
  for (const [label, seconds] of [
    ["ready", event("ready")],
    ["end", segment.end],
  ] as const) {
    const gap: number = measure(seconds).gap;
    if (gap < 0.025) complaints.push(`${label}: only ${gap}m of clearance`);
  }
  if (
    !segment.plan.holds?.some(
      (hold: IAutoMovieMotionPropHold): boolean =>
        hold.prop === "bow" && hold.side === "right",
    )
  )
    complaints.push("the right hand did not retain the bow");
  TestValidator.equals("staged violin bow contact and release", complaints, []);
}

/** Place a local affordance on its displayed rigid prop. */
function world(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, point),
  );
}
