import {
  createBow,
  createProjectile,
  createTable,
} from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The counter top above the floor, metres: the website's counter band middle. */
const TOP: number = 0.914;
/** The archer's target, world metres: a butt down range. */
const TARGET: IAutoMovieVector3 = { x: 0, y: 1.4, z: 12 };
/** The arrow's authored flight speed after the cue, metres per second: a recurve's typical arrow speed. */
const SPEED: number = 60;
/** A carried prop rides its carrier rigidly within this, metres: the worn-prop bound. */
const RIGID: number = 0.002;
/** A declared hit crosses the target's plane within this of its centre, metres: the 122 cm face's radius (World Archery). */
const FACE: number = 0.61;
/** A string at rest sits within this of its rest mark, metres. */
const REST: number = 1e-6;

/** The two bow silhouettes whose hands differ: a longbow and a recurve. */
const BOWS: readonly createBow.Kind[] = ["longbow", "recurve"];

/**
 * One inert arrow through a whole archery take (#3867): the archer picks the
 * bow up in the left hand, takes the arrow from the counter by its nock and
 * nocks it, presents the bow on the line to the target, draws and looses, and the same arrow
 * flies on an authored carrier to a declared hit.
 *
 * Scenarios, for a longbow and a recurve on two bodies:
 * 1. The bow rides the left hand rigidly from its pick-up to the end.
 * 2. The arrow rides the right hand from its take to its nocking, then the
 *    bow's nock until the cue, then the carrier: one identity, one owner at
 *    every sampled instant, no jump at either change.
 * 3. There is exactly one release cue, and the arrow ends on the target.
 * 4. The bow's string is back at rest at the end.
 * 5. The take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take's custody chain and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered archery rows through HumanPerformance and reads the bow, the arrow, both hands, the fixture's state and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The target and the flight are authored; the rigid bound is the worn-prop bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bows, two bodies, each custody span.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_archery_archery_take(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [label, kind] of [
    ["m-average", BOWS[0]!],
    ["f-small", BOWS[1]!],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    const name: string = `${label} ${kind}`;
    try {
      const bow: ReturnType<typeof createBow> = createBow({ kind });
      const arrow: ReturnType<typeof createProjectile> = createProjectile({
        kind: "arrow",
      });
      const props: IAutoMovieMotionHumanProp[] = [
        // The bow and the arrow lie on a counter in front of the archer.
        HumanObject.prop(
          "counter",
          createTable({ id: "counter", kind: "counter" }),
          {
            at: { x: 0, y: 0, z: 0.65 },
            yaw: 180,
            fixed: true,
          },
        ),
        HumanObject.prop(
          "bow",
          bow,
          onCounter(bow, "grip", { x: 0, y: TOP + 0.03, z: 0.42 }),
        ),
        HumanObject.prop(
          "arrow",
          arrow,
          onCounter(arrow, "nockGrip", { x: -0.18, y: TOP + 0.01, z: 0.42 }),
        ),
        carrier(),
      ];
      const film: HumanPerformance = new HumanPerformance({
        seed: "archery-take-" + kind,
        laws: Object.values(HUMAN_LEXICON).flat(),
        props,
        performers: [
          {
            subject: "a",
            body,
            // Close to the counter, as a performer takes things from it.
            at: { x: 0, y: 0, z: 0.2 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "bow", handle: "grip", hand: "left" }, "bow")
          .registered("takeArrow", { prop: "arrow", hand: "right" }, "take")
          .registered(
            "nockArrow",
            {
              prop: "arrow",
              onto: { prop: "bow", point: "nock" },
              hand: "right",
            },
            "nock",
          )
          .registered(
            "presentBow",
            // Brought up over two seconds, the right hand on the string riding
            // up with the bow from the nocking place.
            {
              gun: "bow",
              hand: "left",
              target: { kind: "point", at: TARGET, frame: "world" },
              hold: 2,
            },
            "present",
          )
          .registered(
            "drawBow",
            {
              kind: {
                kind: "slider",
                at: { kind: "prop", subject: "bow", point: "string" },
                travel: bow.affordance("string").travel!,
              },
              hand: "right",
            },
            "draw",
          )
          .registered(
            "loose",
            {
              continuation: {
                source: "bow",
                prop: "arrow",
                onto: "flight",
                point: "mark",
              },
            },
            "cue",
          )
          .stand({ hold: 0.6, sway: 0 }).node,
      });
      const at: (anchor: string, event: string) => number = (
        anchor: string,
        event: string,
      ): number => film.instant({ of: anchor, event });
      const taken: number = at("take", "end");
      const nocked: number = at("nock", "end");
      const cue: number = at("cue", "open");
      const inHand: (
        prop: string,
        side: AutoMovieHumanSide,
        t: number,
      ) => IAutoMovieRigidTransform = (
        prop: string,
        side: AutoMovieHumanSide,
        t: number,
      ): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(
          HumanPropFrame.bone(film.bones("a", t).get(`${side}Hand`)!),
          film.prop(prop, t),
        );
      // The arrow in the frame of the bow's nock as the string poses it: the
      // nock rides the string, so a nocked arrow is drawn back with it.
      const onBow: (t: number) => IAutoMovieRigidTransform = (
        t: number,
      ): IAutoMovieRigidTransform => {
        const nock: IAutoMovieAffordance = props[1]!.articulate!(
          film.state("bow", t),
        ).affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === "nock",
        )!;
        return HumanPropFrame.relative(
          HumanPropFrame.compose(film.prop("bow", t), {
            position: nock.frame.translation,
            rotation: nock.frame.rotation,
          }),
          film.prop("arrow", t),
        );
      };
      const rigid: (
        read: (t: number) => IAutoMovieRigidTransform,
        from: number,
        to: number,
        what: string,
      ) => void = (
        read: (t: number) => IAutoMovieRigidTransform,
        from: number,
        to: number,
        what: string,
      ): void => {
        const first: IAutoMovieRigidTransform = read(from);
        for (let i: number = 1; i <= 6; ++i) {
          const t: number = from + ((to - from) * i) / 6;
          checks.check(
            `${name}: ${what} at ${t.toFixed(2)}`,
            Vector3.distance(read(t).position, first.position) <= RIGID,
          );
        }
      };
      rigid(
        (t: number) => inHand("bow", "left", t),
        at("bow", "end"),
        film.duration,
        "the bow rides the left hand",
      );
      rigid(
        (t: number) => inHand("arrow", "right", t),
        taken,
        at("nock", "start") + 0.05,
        "the arrow rides the right hand",
      );
      rigid(onBow, nocked, cue - 0.01, "the arrow rides the nock");
      checks.check(
        `${name}: exactly one release cue`,
        film
          .segments("a")
          .filter(
            (s: IAutoMovieMotionHumanSegment): boolean => s.name === "loose",
          ).length === 1,
      );
      // The arrow crosses the target's plane on the face.
      const loosed: IAutoMovieVector3 = film.prop("arrow", cue).position;
      const crossing: IAutoMovieVector3 = film.prop(
        "arrow",
        cue + (TARGET.z - loosed.z) / SPEED,
      ).position;
      const miss: number = Math.hypot(
        crossing.x - TARGET.x,
        crossing.y - TARGET.y,
      );
      checks.check(
        `${name}: the arrow hits the face (${miss.toFixed(3)} m off centre)`,
        miss <= FACE,
      );
      const rested: ReturnType<typeof createBow> = bow.articulate(
        film.state("bow", film.duration),
      );
      checks.check(
        `${name}: the string is back at rest`,
        Vector3.distance(
          rested.affordance("nock").frame.translation,
          bow.affordance("nock").frame.translation,
        ) <= REST,
      );
      assertTakeClean(name, film);
    } catch (error: unknown) {
      checks.check(`${name} refused: ${String(error)}`, false);
    }
  }
  checks.assert("archery take");
}

/** The arrow's authored flight: a carrier travelling down range at `SPEED`; the arrow takes its travel from the cue. */
function carrier(): IAutoMovieMotionHumanProp {
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return {
    subject: "flight",
    frame: { position: start, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      {
        id: "mark",
        kind: "socket",
        frame: Transform.of({ x: 0, y: 0, z: 0 }, Quaternion.identity()),
        extent: null,
      },
    ],
    motion: (seconds: number): IAutoMovieRigidTransform => ({
      position: Vector3.add(start, { x: 0, y: 0, z: SPEED * seconds }),
      rotation: Quaternion.identity(),
    }),
  };
}

/** A model whose named affordances can be read. */
interface IHandled<Handle extends string> {
  /** The affordance by its id. */
  affordance(id: Handle): IAutoMovieAffordance;
}

/** A model lying on its side across the counter, placed so its handle lies at a point within the archer's reach. */
function onCounter<Handle extends string>(
  model: IHandled<Handle>,
  handle: Handle,
  at: IAutoMovieVector3,
): IAutoMovieRigidTransform {
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  return {
    position: Vector3.subtract(
      at,
      Quaternion.rotateVector(
        rotation,
        model.affordance(handle).frame.translation,
      ),
    ),
    rotation,
  };
}
