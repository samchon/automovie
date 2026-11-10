import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanPrehension,
  type IHumanBody,
  type IHumanProp,
  createHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * Polygon men of different statures pick up a bottle standing in front of
 * them, carry it while walking, and set it down.
 *
 * The bottle is a primitive: one upright capsule 70 mm across and 190 mm
 * tall standing on a surface at hip height 0.3 m in front of the right
 * shoulder, with a `handle` affordance on its axis at mid-height whose frame
 * follows the affordance convention (+Y toward the performer, the wrapped
 * axis +X up the bottle). Bodies: the small woman, the average and tall men
 * and the long-armed man.
 *
 * Scenarios, for each body:
 * 1. At `gripClosed` the hand stands on its grasp goal within 1 mm and 1
 *    degree, and every closing digit's phalanges lie within 2 mm of the
 *    bottle's capsule and none enters it by more than 1 mm (#3201 step 5),
 *    or the digit is stopped by its range (reported).
 * 2. The thumb-index aperture, sampled at 240 Hz through the reach, peaks
 *    between 60 and 70 % of the transport (Jeannerod 1984).
 * 3. The bottle stays within 1 mm of its grip offset in the hand from
 *    `gripClosed` through a following walk of 1 m and the stand after it.
 * 4. A put down after the pick up puts the hand on its placing goal within
 *    1 mm and 1 degree at `placed` and leaves the bottle's origin within 1 mm of
 *    its requested place and upright within 1 degree.
 * 5. A bottle 1.5 m away is refused at build.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs whole performances on prepared polygon men and reads displayed bones and the performance's prop frames; fingers that stop off the bottle or inside it, an aperture peaking outside Jeannerod's band, a prop that slips in the hand during a walk, a misplaced put down or an accepted unreachable grasp fails.
 * @evidence contracts/development/testing.md#independent-expectations Bounds are #3201 step 5's 2 mm and 1 mm and Jeannerod's 60 to 70 %; finger clearances come from the body's own phalanx capsules posed by forward kinematics against the bottle's capsule by the engine's segment distance, not from the curl's report; the hand offset is read from displayed frames.
 * @evidence contracts/development/testing.md#distinguishing-cases Four statures and proportions, reach, carry through a walk, put down and refusal; the curl's arithmetic is owned by the CI test test_motion_handling_curl.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_human_motion_handling_grasp(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  for (const name of ["f-small", "m-average", "m-tall", "m-long-armed"]) {
    const man = MotionBodies.population(name);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
    const place: IAutoMovieVector3 = {
      x: shoulder.x,
      y: body.measure.hipHeight,
      z: 0.3,
    };
    const bottle: IHumanProp = prop(place);

    // 1-3. Pick up, walk, stand.
    const carry: HumanPerformance = new HumanPerformance({
      seed: `grasp-${name}`,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [bottle],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.4 })
        .pickUp({ prop: "bottle", handle: "handle", hand: "right" })
        .walk({ to: { x: 0, y: 0, z: 1 } })
        .stand({ seconds: 0.6 }).node,
    });
    const grasp = carry.segments("a").find((s) => s.name === "pickUp")!;
    const closed: number =
      grasp.start +
      grasp.plan.events.find((e) => e.name === "gripClosed")!.share *
        grasp.plan.duration;
    const bones = carry.bones("a", closed);
    const goal = carry.posture("a", closed).limbs.rightArm!;
    const shownHand: IAutoMovieResolvedBone = bones.get("rightHand")!;
    const handMiss: number = Vector3.length(
      Vector3.subtract(shownHand.worldPosition, goal.point),
    );
    const handTurn: number =
      goal.rotation === undefined
        ? 0
        : (2 *
            Math.acos(
              Math.min(
                1,
                Math.abs(
                  Quaternion.multiply(
                    Quaternion.inverse(goal.rotation),
                    shownHand.worldRotation,
                  ).w,
                ),
              ),
            ) *
            180) /
          Math.PI;
    check(
      `${name} hand on its grasp goal (${(handMiss * 1000).toFixed(2)} mm, ${handTurn.toFixed(2)} deg)`,
      handMiss <= 0.001 && handTurn <= 1,
    );
    for (const digit of ["Index", "Middle", "Ring", "Little", "Thumb"]) {
      const gap: number = clearance(
        body,
        bones,
        digit,
        carry.prop("bottle", closed),
      );
      check(
        `${name} ${digit} at the bottle (${(gap * 1000).toFixed(2)} mm)`,
        gap >= -0.001 && gap <= 0.002,
      );
    }

    let best: number = -Infinity;
    let at: number = 0;
    for (let t: number = grasp.entryTime; t <= closed; t += 1 / 240) {
      const aperture: number = Vector3.length(
        Vector3.subtract(
          tip(body, carry.bones("a", t), "Thumb"),
          tip(body, carry.bones("a", t), "Index"),
        ),
      );
      if (aperture > best) {
        best = aperture;
        at = t;
      }
    }
    const share: number = (at - grasp.entryTime) / (closed - grasp.entryTime);
    check(
      `${name} aperture peaks at ${(share * 100).toFixed(1)} % (${(best * 1000).toFixed(1)} mm, wanted ${(HumanPrehension.aperture(0.07) * 1000).toFixed(1)})`,
      share >= 0.6 && share <= 0.7,
    );

    const offset = (t: number): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = carry
        .bones("a", t)
        .get("rightHand")!;
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(carry.prop("bottle", t).position, hand.worldPosition),
      );
    };
    const held: IAutoMovieVector3 = offset(closed);
    let slip: number = 0;
    for (let t: number = closed; t <= carry.duration; t += 1 / 24)
      slip = Math.max(slip, Vector3.length(Vector3.subtract(offset(t), held)));
    check(
      `${name} bottle held within 1 mm through the walk (${(slip * 1000).toFixed(2)} mm)`,
      slip <= 0.001,
    );

    // 4. Put down.
    const target: IAutoMovieVector3 = {
      x: shoulder.x - 0.05,
      y: body.measure.hipHeight,
      z: 0.25,
    };
    const down: HumanPerformance = new HumanPerformance({
      seed: `put-${name}`,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [bottle],
      composition: HumanChain.subject("a")
        .pickUp({ prop: "bottle", handle: "handle", hand: "right" })
        .putDown({ prop: "bottle", at: target, hand: "right" })
        .stand({ seconds: 0.4 }).node,
    });
    const placing = down.segments("a").find((s) => s.name === "putDown")!;
    const placed: number =
      placing.start +
      placing.plan.events.find((e) => e.name === "placed")!.share *
        placing.plan.duration;
    const placeGoal = down.posture("a", placed).limbs.rightArm!;
    const placeHand: IAutoMovieResolvedBone = down
      .bones("a", placed)
      .get("rightHand")!;
    const placeMiss: number = Vector3.length(
      Vector3.subtract(placeHand.worldPosition, placeGoal.point),
    );
    const placeTurn: number =
      placeGoal.rotation === undefined
        ? 0
        : (2 *
            Math.acos(
              Math.min(
                1,
                Math.abs(
                  Quaternion.multiply(
                    Quaternion.inverse(placeGoal.rotation),
                    placeHand.worldRotation,
                  ).w,
                ),
              ),
            ) *
            180) /
          Math.PI;
    check(
      `${name} hand on its placing goal (${(placeMiss * 1000).toFixed(2)} mm, ${placeTurn.toFixed(2)} deg)`,
      placeMiss <= 0.001 && placeTurn <= 1,
    );
    const rest: IHumanProp.IFrame = down.prop("bottle", down.duration);
    check(
      `${name} put down within 1 mm (${(Vector3.length(Vector3.subtract(rest.position, target)) * 1000).toFixed(2)} mm)`,
      Vector3.length(Vector3.subtract(rest.position, target)) <= 0.001,
    );
    const up: IAutoMovieVector3 = Quaternion.rotateVector(rest.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    check(
      `${name} put down upright`,
      (Math.acos(Math.min(1, up.y)) * 180) / Math.PI <= 1,
    );

    // 5. Out of reach.
    TestValidator.error(
      `${name} refuses an unreachable bottle`,
      (): unknown =>
        new HumanPerformance({
          seed: "far",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: [prop({ ...place, z: 1.5 })],
          composition: HumanChain.subject("a").pickUp({
            prop: "bottle",
            handle: "handle",
          }).node,
        }),
    );
  }
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** An upright capsule bottle standing at a point, its grip on its axis facing -Z. */
function prop(at: IAutoMovieVector3): IHumanProp {
  const capsule: P.IShape = {
    id: "glass",
    material: "glass",
    transform: {
      position: { x: 0, y: 0.095, z: 0 },
      rotation: Quaternion.identity(),
    },
    kind: "capsule",
    radius: 0.035,
    halfLength: 0.06,
  };
  return {
    subject: "bottle",
    frame: { position: at, rotation: Quaternion.identity() },
    points: {},
    shapes: [capsule],
    affordances: [
      {
        id: "handle",
        kind: "handle",
        frame: {
          translation: { x: 0, y: 0.095, z: 0 },
          rotation: frame({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }),
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
        grip: "power",
        aperture: 0.07,
      },
    ],
  };
}

/** The rotation taking local +X and +Y onto two perpendicular unit directions. */
function frame(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const swing: IAutoMovieQuaternion = rotationBetween({ x: 0, y: 1, z: 0 }, y);
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(swing, {
    x: 1,
    y: 0,
    z: 0,
  });
  const angle: number =
    (Math.atan2(
      Vector3.dot(y, Vector3.cross(turned, x)),
      Vector3.dot(turned, x),
    ) *
      180) /
    Math.PI;
  return Quaternion.normalize(
    Quaternion.multiply(Quaternion.fromAxisAngle(y, angle), swing),
  );
}

/** A digit's phalanx capsules posed, as segments with radii, from the body's profile. */
function phalanges(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  digit: string,
): { a: IAutoMovieVector3; b: IAutoMovieVector3; r: number }[] {
  const names: string[] =
    digit === "Thumb"
      ? ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"]
      : [`${digit}Proximal`, `${digit}Intermediate`, `${digit}Distal`];
  return names.map((n: string) => {
    const bone = `right${n}` as AutoMovieHumanoidBone;
    const shape = body.profile.segments
      .find((s: P.ISegment): boolean => s.bone === bone)!
      .shapes.find((s: P.IShape): boolean => s.kind === "capsule") as Extract<
      P.IShape,
      { kind: "capsule" }
    >;
    const r: IAutoMovieResolvedBone = bones.get(bone)!;
    const centre: IAutoMovieVector3 = Vector3.add(
      r.worldPosition,
      Quaternion.rotateVector(r.worldRotation, shape.transform.position),
    );
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(r.worldRotation, shape.transform.rotation),
      { x: 0, y: shape.halfLength, z: 0 },
    );
    return {
      a: Vector3.subtract(centre, axis),
      b: Vector3.add(centre, axis),
      r: shape.radius,
    };
  });
}

/** The least surface clearance between a digit and the bottle, metres. */
function clearance(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  digit: string,
  bottle: IHumanProp.IFrame,
): number {
  const centre: IAutoMovieVector3 = Vector3.add(
    bottle.position,
    Quaternion.rotateVector(bottle.rotation, { x: 0, y: 0.095, z: 0 }),
  );
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(bottle.rotation, {
    x: 0,
    y: 0.06,
    z: 0,
  });
  return Math.min(
    ...phalanges(body, bones, digit).map(
      (p): number =>
        closestPointsBetweenSegments(
          p.a,
          p.b,
          Vector3.subtract(centre, axis),
          Vector3.add(centre, axis),
        ).distance -
        p.r -
        0.035,
    ),
  );
}

/** A digit's tip: the far end of its distal capsule. */
function tip(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  digit: string,
): IAutoMovieVector3 {
  const last = phalanges(body, bones, digit)[2]!;
  return Vector3.add(
    last.b,
    Vector3.scale(Vector3.normalize(Vector3.subtract(last.b, last.a)), last.r),
  );
}
