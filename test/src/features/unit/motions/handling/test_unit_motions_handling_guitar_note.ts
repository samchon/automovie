import { createInstrument } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGuitarNote,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  guitarNote,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * How near a stopping fingertip lies to its string, metres: 20 mm, the skin's
 * 10 mm give plus 10 mm (`HumanSignature.CONTACT`).
 */
const CONTACT: number = 0.02;

/**
 * `guitarNote.plan` stops a string at a fret with the left hand and plucks it
 * with the right: the stopping fingertip comes onto the string by `stopAt` and
 * holds it through the pluck to `releaseAt`.
 *
 * Scenario, the average man standing at the origin facing +Z before a guitar
 * held fixed ahead of his right arm, stopping `string2` at `fret5` from 0.5 s,
 * plucking at 0.9 s and releasing at 1.3 s: midway between the stop and the
 * pluck, 0.7 s, the left index tip lies on the string, within 20 mm of its
 * line, and it lies farther from it before the stop, at 0 s; at the pluck the
 * right index tip lies on the string too. The same holds with the string's bar
 * frame reversed along its length: the line the hands meet does not depend on
 * the frame's sign.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_guitar_note(): Promise<void> {
  // Plans both arms and the digits on the whole body: the rig, the arm chains and the hands.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const guitar: ReturnType<typeof createInstrument> = createInstrument({
    kind: "guitar",
  });
  const params: IAutoMovieMotionHumanGuitarNote = {
    prop: "instrument",
    fret: "fret5",
    string: "string2",
    stopAt: 0.5,
    pluckAt: 0.9,
    releaseAt: 1.3,
    duration: 1.6,
  };
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
    "instrument",
    guitar,
    {
      position: {
        x: -0.06,
        y:
          body.measure.shoulderHeight -
          body.measure.upperArm -
          guitar.dimensions.bodyDepth!,
        z: body.rest.get("rightUpperArm")!.z + 0.8 * body.measure.forearm,
      },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 9),
      fixed: true,
    },
  );
  const string: IAutoMovieAffordance = guitar.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "string2",
  )!;
  // The same guitar with the string's bar frame reversed along its length.
  const flipped: IAutoMovieMotionHumanProp = {
    ...prop,
    affordances: guitar.affordances.map(
      (a: IAutoMovieAffordance): IAutoMovieAffordance =>
        a.id === "string2"
          ? {
              ...a,
              frame: {
                ...a.frame,
                rotation: Quaternion.multiply(a.frame.rotation, {
                  x: 0,
                  y: 1,
                  z: 0,
                  w: 0,
                }),
              },
            }
          : a,
    ),
  };
  const start: IAutoMovieVector3 = Vector3.add(
    prop.frame.position,
    Quaternion.rotateVector(prop.frame.rotation, string.frame.translation),
  );
  const along: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(prop.frame.rotation, string.frame.rotation),
    { x: 1, y: 0, z: 0 },
  );
  // A fingertip's distance from the string's line, either frame giving one line.
  const off = (
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
    region: "indexTipLeft" | "indexTipRight",
  ): number => {
    const bones = poseBones(
      body,
      resolveHumanPosture(body, plan.posture(seconds)),
    );
    const frame = body.surfaces.regions[region];
    const tip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      bones.get(frame.bone)!,
    ).point;
    const d: IAutoMovieVector3 = Vector3.subtract(tip, start);
    return Vector3.length(
      Vector3.subtract(d, Vector3.scale(along, Vector3.dot(d, along))),
    );
  };
  const stages: readonly (readonly [string, IAutoMovieMotionHumanProp])[] = [
    ["as modelled", prop],
    ["with the string's frame reversed", flipped],
  ];
  for (const [label, staged] of stages) {
    const plan: IAutoMovieMotionHumanActionPlan = guitarNote.plan(
      motionActionContext(body, params, { props: [staged] }),
    );
    const stopped: number = off(plan, 0.7, "indexTipLeft");
    TestValidator.predicate(
      `${label}: stopped, then plucked`,
      stopped <= CONTACT &&
        off(plan, 0, "indexTipLeft") > stopped &&
        off(plan, params.pluckAt, "indexTipRight") <= CONTACT,
    );
  }
}
