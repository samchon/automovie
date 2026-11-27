import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineTransform,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import {
  HumanGrip
} from "../../../../../packages/motions/src/handling/internal/HumanGrip";
import { TestValidator } from "@nestia/e2e";

import {
  FamilyCaseKit
} from "../../../../../packages/motions/src/executable/cases/FamilyCaseKit";

const DIGITS = ["Thumb", "Index", "Middle", "Ring", "Little"] as const;
const SUBJECT = "a";
const RADIUS = 0.035;
const SWEEP = 480;
const ERROR = 0.001;
const CONTACT = 0.002;

/** Check an embedded power grip across the actual approach, loaded lift and later seeks. */
export function test_motions_handling_pickup_digit_course(): void {
  for (const population of ["f-small", "m-average", "m-tall"]) {
    const { body } = FamilyCaseKit.body(population);
    const actor = AutoMovieMotionHumanChain.subject(SUBJECT);
    const performer = {
      subject: SUBJECT,
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    };
    const rehearsal = new AutoMovieMotionHumanPerformance({
      seed: "qa-static-body",
      performers: [performer],
      composition: actor.stand({ hold: 0.4 }).node,
      props: [],
    });
    const shoulder = rehearsal.bones(SUBJECT, 0).get("rightUpperArm")!.worldPosition;
    const { bottle, collider } = setup(body, shoulder);
    for (const seed of ["grasp-qa-a", "grasp-qa-b"]) {
      const input = {
        seed,
        performers: [performer],
        props: [bottle],
        composition: actor.pickUp({ prop: "bottle", handle: "handle", hand: "right" }).node,
      };
      const take = new AutoMovieMotionHumanPerformance(input);
      const name = `${population} ${seed}`;
      const close = FamilyCaseKit.event(take, "gripClosed", SUBJECT);
      const lift = FamilyCaseKit.event(take, "liftOff", SUBJECT);
      const end = FamilyCaseKit.event(take, "lifted", SUBJECT);
      const aperture = HumanGrip.prepareAperture(body, "right");
      const samples = Array.from({ length: SWEEP + 1 }, (_, i) => {
        const time = (i * close) / SWEEP;
        return {
          share: i / SWEEP,
          width: aperture(HumanGrip.fingers(take.pose(SUBJECT, time), "right")),
          gaps: fingerGaps(body, take, collider, time),
        };
      });
      const peak = samples.reduce((a, b) => (a.width >= b.width ? a : b));
      TestValidator.predicate(`${name} aperture maximum`, peak.share >= 0.6 && peak.share <= 0.7);
      TestValidator.predicate(`${name} calibrated opening`, Math.abs(peak.width - 0.081) <= ERROR);
      let previous = peak.width;
      for (const sample of samples.slice(samples.indexOf(peak))) {
        TestValidator.predicate(`${name} closes without reopening`, sample.width <= previous + 0.00005);
        previous = Math.min(previous, sample.width);
      }
      TestValidator.predicate(
        `${name} clearance throughout the approach`,
        samples.every((sample) => sample.gaps.every((gap) => gap >= -ERROR)),
      );
      TestValidator.predicate(
        `${name} all five fingers contact`,
        samples.at(-1)!.gaps.every((gap) => gap >= -ERROR && gap <= CONTACT),
      );
      const offset = (time: number): IAutoMovieVector3 => {
        const hand = take.bones(SUBJECT, time).get("rightHand")!;
        const prop = take.prop("bottle", time);
        return AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(hand.worldRotation),
          AutoMovieEngineVector3.subtract(prop.position, hand.worldPosition),
        );
      };
      const held = offset(lift);
      for (let k = 0; k <= 24; ++k) {
        const time = lift + ((end - lift) * k) / 24;
        TestValidator.predicate(`${name} held bottle`, AutoMovieEngineVector3.distance(held, offset(time)) <= ERROR);
      }
      const fresh = new AutoMovieMotionHumanPerformance(input);
      for (const time of [end, close * 0.94, lift, close * 0.64, close * 0.86, 0])
        TestValidator.equals(`${name} repeat at ${time}`, take.pose(SUBJECT, time), fresh.pose(SUBJECT, time));
    }
  }
}

type Capsule = Extract<IAutoMoviePhysicalShape, { kind: "capsule" }>;

function setup(body: IAutoMovieMotionHumanBody, shoulder: IAutoMovieVector3): {
  bottle: IAutoMovieMotionHumanProp;
  collider: Capsule;
} {
  const reach = 0.85 * (body.measure.upperArm + body.measure.forearm);
  const height = body.measure.shoulderHeight - body.measure.upperArm - 0.15;
  const drop = shoulder.y - height - 0.095;
  const frame = {
    position: {
      x: shoulder.x,
      y: height,
      z: shoulder.z + Math.sqrt(reach * reach - drop * drop) + RADIUS,
    },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const center = { x: 0, y: 0.095, z: 0 };
  const turn = AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  ));
  const collider: Capsule = {
    id: "glass",
    material: "glass",
    kind: "capsule",
    transform: { position: center, rotation: AutoMovieEngineQuaternion.identity() },
    radius: RADIUS,
    halfLength: 0.06,
  };
  return {
    collider,
    bottle: {
      subject: "bottle",
      frame,
      points: {},
      shapes: [collider],
      affordances: [{
        id: "handle",
        kind: "handle",
        frame: AutoMovieEngineTransform.of(center, turn),
        extent: null,
        grip: "power",
        aperture: 2 * RADIUS,
      }],
    },
  };
}

function fingerGaps(
  body: IAutoMovieMotionHumanBody,
  take: AutoMovieMotionHumanPerformance,
  collider: Capsule,
  time: number,
): number[] {
  const distance = AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(take.prop("bottle", time), collider);
  const bones = take.bones(SUBJECT, time);
  const gap = (name: AutoMovieHumanoidBone): number => {
    const site = bones.get(name)!;
    const shape = body.profile.segments.find((s) => s.bone === name)!.shapes.find(
      (s): s is Capsule => s.kind === "capsule",
    )!;
    const center = AutoMovieEngineVector3.add(
      site.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(site.worldRotation, shape.transform.position),
    );
    const along = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.multiply(site.worldRotation, shape.transform.rotation),
      { x: 0, y: shape.halfLength, z: 0 },
    );
    return distance(AutoMovieEngineVector3.subtract(center, along), AutoMovieEngineVector3.add(center, along)) - shape.radius;
  };
  return DIGITS.map((digit) => Math.min(...HumanGrip.bones("right", digit).map(gap)));
}
