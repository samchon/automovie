import { createBow } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArchery,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose } from "../../../features/internal/qclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A staged arrow or bolt remains with its named fixture until the public
 * release cue, then keeps its world frame while taking on the travel of a
 * separate authored carrier.
 *
 * Scenarios:
 * 1. At `open` with a recurve and `strokeStart` with a crossbow, check the
 *    held nock, exact cue, authored continuation, and later reads out of order.
 * 2. The fixture's string settles at rest while the same inert prop moves
 *    along the carrier. A spare prop stays parked and cannot take the cue.
 * 3. The crossbow has distinct grip and support contact points, a forward
 *    rail mark, a separate upward rest, and visible trigger recovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both public cue names, continuity, the held and continued subjects, and the distinct crossbow geometry checks.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the real archery rows, measures world prop frames through HumanPerformance across each cue, and inspects the crossbow geometry at cue time and after recovery.
 * @evidence contracts/development/testing.md#independent-expectations The placed fixture and local held nock give the starting world frame. The authored carrier translates by its declared velocity times elapsed film seconds after the public cue. A 1 mm bound is the moving-socket placement continuity bound and is far smaller than the late path increment. No trajectory publication is an expected value.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers two different fixture coordinates and cue names, reverse-order reads, a named prop off the nock, and a fixture recovery while its former prop still moves. Other tests own quiver pickup and performer reach.
 * @evidence contracts/development/testing.md#execution-ownership Uses seedless prop producers and in-memory HumanPerformance on one polygon body. This exported entry starts no host.
 */
export function test_motion_archery_archery_continuation(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const zero: IAutoMovieVector3 = Vector3.create(0, 0, 0);
  const up: IAutoMovieVector3 = Vector3.create(0, 1, 0);
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const fixtureFrame: IAutoMovieRigidTransform = {
    position: Vector3.create(3, 2, -1),
    rotation: Quaternion.fromAxisAngle(up, 25),
  };
  const speed: IAutoMovieVector3 = Vector3.create(0.7, -0.2, 0.3);
  const trackOrigin: IAutoMovieVector3 = Vector3.create(-4, 3, 8);
  const trackRotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(up, -20);
  const track: IAutoMovieMotionHumanProp = {
    subject: "track",
    frame: { position: trackOrigin, rotation: trackRotation },
    points: {},
    affordances: [
      {
        id: "mark",
        kind: "socket",
        frame: Transform.of(Vector3.create(0.17, 0.11, 0.05), identity),
        extent: null,
      },
    ],
    motion: (seconds: number): IAutoMovieRigidTransform => ({
      position: Vector3.addScaled(trackOrigin, speed, seconds),
      rotation: trackRotation,
    }),
  };
  const spare: IAutoMovieMotionHumanProp = {
    subject: "spare",
    frame: { position: Vector3.create(7, 4, 2), rotation: identity },
    points: { nock: { point: zero, normal: up } },
  };
  const transferred: IAutoMovieMotionHumanProp = {
    ...spare,
    subject: "foam-prop",
    mounted: {
      prop: "fixture",
      point: "nock",
      offset: { position: zero, rotation: identity },
    },
  };

  for (const kind of ["recurve", "crossbow"] as const) {
    const model: ReturnType<typeof createBow> = createBow({ kind });
    const crossbow: boolean = kind === "crossbow";
    const law:
      | typeof AutoMovieMotionHumanArchery.HumanArchery.loose
      | typeof AutoMovieMotionHumanArchery.HumanArchery.shootCrossbow = crossbow
      ? AutoMovieMotionHumanArchery.HumanArchery.shootCrossbow
      : AutoMovieMotionHumanArchery.HumanArchery.loose;
    const event: string = crossbow ? "strokeStart" : "open";
    const coordinate: "string" | "crank" = crossbow ? "crank" : "string";
    const heldTravel: number = model.affordance(coordinate).travel! / 3;
    const rest: IAutoMovieVector3 = model.affordance("nock").frame.translation;
    const staged: IAutoMovieVector3 = Vector3.add(rest, {
      x: 0,
      y: 0,
      z: ((crossbow ? -1 : 1) * model.affordance("string").travel!) / 3,
    });
    const expectedStart: IAutoMovieVector3 = Vector3.add(
      fixtureFrame.position,
      Quaternion.rotateVector(fixtureFrame.rotation, staged),
    );
    const expectedRotation: IAutoMovieQuaternion = Quaternion.multiply(
      fixtureFrame.rotation,
      model.affordance("nock").frame.rotation,
    );
    const fixture: IAutoMovieMotionHumanProp = HumanObject.prop(
      "fixture",
      model,
      { ...fixtureFrame, fixed: true },
      undefined,
      undefined,
      [
        {
          articulation: coordinate,
          start: 0.1,
          duration: 0.2,
          travel: (): number => heldTravel,
        },
      ],
    );
    const take = (prop: string): HumanPerformance =>
      new HumanPerformance({
        seed: `exercise-${kind}-continuation`,
        performers: [
          {
            subject: "actor",
            body,
            at: zero,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [fixture, transferred, spare, track],
        laws: [law],
        composition: HumanChain.subject("actor")
          .stand({ hold: 0.8 })
          .registered(
            law.name,
            {
              continuation: {
                source: "fixture",
                prop,
                onto: "track",
                point: "mark",
              },
            },
            "cue",
          )
          .stand({ hold: 1 }).node,
      });
    const film: HumanPerformance = take(transferred.subject);
    const at: number = film.instant({ of: "cue", event });
    const end: number = film.instant({ of: "cue", event: "end" });
    TestValidator.predicate(
      `${kind} cue has its own nonzero film time`,
      at > 0.8 && end > at,
    );
    for (const t of [end + 0.2, at - 0.002, at, at + 0.002, end + 0.2]) {
      const frame: IAutoMovieRigidTransform = film.prop(transferred.subject, t);
      const expected: IAutoMovieVector3 = Vector3.addScaled(
        expectedStart,
        speed,
        Math.max(0, t - at),
      );
      TestValidator.predicate(
        `${kind} continues the same mounted prop at ${t} s`,
        vclose(frame.position, expected, 0.001) &&
          qclose(frame.rotation, expectedRotation, 1e-6),
      );
      TestValidator.predicate(
        `${kind} leaves the spare at its authored mark at ${t} s`,
        vclose(
          film.prop(spare.subject, t).position,
          spare.frame.position,
          1e-9,
        ),
      );
    }
    const recovered: ReturnType<typeof createBow> = model.articulate(
      film.state(fixture.subject, end),
    );
    TestValidator.predicate(
      `${kind} source nock returns to its rest mark`,
      vclose(recovered.affordance("nock").frame.translation, rest, 1e-9),
    );
    TestValidator.predicate(
      `${kind} refuses a prop staged away from the source nock`,
      unseated((): HumanPerformance => take(spare.subject)),
    );

    if (crossbow) {
      const pressed: ReturnType<typeof createBow> = model.articulate(
        film.state(fixture.subject, at),
      );
      const triggerPart = (
        object: ReturnType<typeof createBow>,
      ): IAutoMovieVector3 =>
        object.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === "trigger",
        )!.transform!.translation;
      const separation: number = Vector3.distance(
        triggerPart(pressed),
        triggerPart(model),
      );
      TestValidator.predicate(
        "crossbow cue advances and returns the visible trigger part",
        nclose(separation, model.affordance("trigger").travel!, 1e-6) &&
          vclose(triggerPart(recovered), triggerPart(model), 1e-9),
      );
      TestValidator.predicate(
        "crossbow stock has separate grip, support, rail, and rest marks",
        model.affordance("foreEnd").frame.translation.z >
          model.affordance("grip").frame.translation.z &&
          model.affordance("rail").frame.translation.z >
            model.affordance("rest").frame.translation.z &&
          vclose(
            Quaternion.rotateVector(
              model.affordance("rail").frame.rotation,
              up,
            ),
            Vector3.create(0, 0, 1),
          ) &&
          vclose(
            Quaternion.rotateVector(
              model.affordance("rest").frame.rotation,
              up,
            ),
            up,
          ),
      );
    }
  }
}

/** Read the planned film so an invalid nock selection must refuse through the public scheduler. */
function unseated(take: () => HumanPerformance): boolean {
  try {
    take().instant({ of: "cue", event: "start" });
    return false;
  } catch (error) {
    return error instanceof HumanRefusal && error.axis === "continuation";
  }
}
