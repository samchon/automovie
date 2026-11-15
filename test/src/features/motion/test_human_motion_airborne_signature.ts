import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  HumanAirborneShape,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanLayer,
  type IHumanPosture,
  type jump,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Airborne rotation as compositions (#3428): `jump`'s `rotation` with the
 * flight shapes of `HumanAirborneShape` laid over its flight.
 *
 * Scenarios:
 * 1. Every cell of somersault {1, 2} by shape {tuck, pike, layout} by way
 *    {forward, backward, left} on the average man and the small woman, a
 *    1 m forward jump with a 0.6 m apex: either it lands, its root's turn at
 *    touchdown within 0.02 revolution of upright about each of Yeadon's
 *    axes, or it is refused with a `HumanRefusal` on the axis `turns`.
 * 2. Metamorphic on the composed inertia: arms wrapped in (`armsIn`) give a
 *    smaller moment about the long axis than the rig's arms-out rest, so a
 *    twist turns faster with arms in; a tuck gives a smaller moment about
 *    the somersault axis than a layout.
 * 3. A shape claims only the limbs its table names: a tuck sets the legs'
 *    joints and drops the leg goals and leaves the arms; `armsIn` the
 *    reverse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs jumps with turns and shapes through the public performance and reads the displayed root's attitude; a landing off upright, a refusal of another kind or a shape that claims a limb it does not name fails.
 * @evidence contracts/development/testing.md#independent-expectations Yeadon's attitude angles read independently of the solver's residual, the composed tensor of #3422 for the shapes' moments, and the shapes' own tables for what they claim.
 * @evidence contracts/development/testing.md#distinguishing-cases Two counts, three shapes, three ways, two bodies, arms in and out, legs and arms claimed; the flight pass's own conservation belongs to `test_human_motion_core_flight`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and performs short films in memory, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and their bounds.
 */
export function test_human_motion_airborne_signature(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  const perform = (
    body: IHumanBody,
    rotation: jump.IParams["rotation"],
    shape: HumanAirborneShape.Shape,
  ): HumanPerformance => {
    const layer: IHumanLayer.IScheduled = {
      layer: HumanAirborneShape.layer(shape),
      from: { of: "leap", event: "takeoff" },
      to: { of: "leap", event: "touchdown" },
      fade: 0.05,
    };
    return new HumanPerformance({
      seed: "airborne",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .jump({ to: { x: 0, y: 0, z: 1 }, apex: 0.6, rotation }, "leap").node,
      layers: { a: [layer] },
    });
  };

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);

    // 1. Each cell lands upright or is refused on its turns.
    for (const somersault of [1, 2])
      for (const shape of ["tuck", "pike", "layout"] as const)
        for (const way of ["forward", "backward", "left"] as const) {
          const label: string = `${name} ${somersault} ${shape} ${way}`;
          let p: HumanPerformance;
          try {
            p = perform(body, { somersault, way }, shape);
          } catch (error) {
            if (
              !(error instanceof HumanRefusal) ||
              !error.message.includes("turns")
            )
              findings.push(`${label}: refused otherwise: ${String(error)}`);
            continue;
          }
          const s: HumanSegment.ISegment = p.segments("a")[1]!;
          const touchdown: number =
            s.start +
            s.plan.events.find(
              (e: IAutoMovieMotionEvent): boolean => e.name === "touchdown",
            )!.share *
              s.plan.duration;
          const takeoff: number =
            s.start +
            s.plan.events.find(
              (e: IAutoMovieMotionEvent): boolean => e.name === "takeoff",
            )!.share *
              s.plan.duration;
          const q0: IAutoMovieQuaternion = p.pose("a", takeoff).root!.rotation;
          const q1: IAutoMovieQuaternion = p.pose("a", touchdown - 1e-6).root!
            .rotation;
          const off: solveAirborneTakeoff.IAngles = solveAirborneTakeoff.angles(
            q0,
            q1,
          );
          const turns: number =
            Math.max(
              Math.abs(off.somersault),
              Math.abs(off.tilt),
              Math.abs(off.twist),
            ) /
            (2 * Math.PI);
          if (turns > 0.02)
            findings.push(
              `${label}: lands ${turns.toFixed(3)} revolution off upright`,
            );
        }

    // 2. The shapes' moments.
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const shaped = (s: HumanAirborneShape.Shape | null): Bones =>
      poseBones(body, {
        skeleton: body.skeleton.id,
        root: null,
        joints: Object.entries(
          s === null ? {} : HumanAirborneShape.ANGLES[s],
        ).map(
          ([bone, a]: [
            string,
            readonly [number, number, number],
          ]): IAutoMovieJointPose => ({
            bone: bone as AutoMovieHumanoidBone,
            flexion: a[0],
            abduction: a[1],
            twist: a[2],
          }),
        ),
      });
    const moment = (bones: Bones, axis: 0 | 1): number =>
      resolveAutoMovieMomentum.inertia(model, bones)[axis]![axis]!;
    if (!(moment(shaped("armsIn"), 1) < moment(shaped(null), 1)))
      findings.push(
        `${name}: arms in do not lower the moment about the long axis`,
      );
    if (!(moment(shaped("tuck"), 0) < moment(shaped("layout"), 0)))
      findings.push(
        `${name}: a tuck does not lower the moment about the somersault axis`,
      );
  }

  // 3. What each shape claims.
  const standing: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      leftLeg: {
        point: { x: 0.1, y: 0.1, z: 0 },
        bend: { x: 0.1, y: 0.5, z: 0.5 },
      },
      leftArm: {
        point: { x: 0.3, y: 1.2, z: 0.3 },
        bend: { x: 0.5, y: 1, z: 0 },
      },
    },
  };
  const context: never = {} as never;
  const tucked: IHumanPosture = HumanAirborneShape.layer("tuck").apply(
    standing,
    0,
    context,
  );
  if (
    tucked.limbs.leftLeg !== undefined ||
    tucked.limbs.leftArm === undefined ||
    tucked.joints.leftUpperLeg === undefined
  )
    findings.push("a tuck does not claim exactly the legs");
  const wrapped: IHumanPosture = HumanAirborneShape.layer("armsIn").apply(
    standing,
    0,
    context,
  );
  if (
    wrapped.limbs.leftArm !== undefined ||
    wrapped.limbs.leftLeg === undefined ||
    wrapped.joints.leftUpperArm === undefined
  )
    findings.push("arms in do not claim exactly the arms");

  TestValidator.predicate(
    `airborne signature: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
