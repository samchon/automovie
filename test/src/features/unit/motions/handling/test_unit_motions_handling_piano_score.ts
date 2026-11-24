import { createInstrument, createSeat } from "@automovie/archetypes";
import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPianoScore,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  pianoScore,
  poseBones,
  resolveHumanPosture,
  sit,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * How near a pressing fingertip lies to its key's top, metres: 20 mm, the
 * skin's 10 mm give plus 10 mm (`HumanSignature.CONTACT`), which holds a key's
 * travel as well.
 */
const CONTACT: number = 0.02;

/**
 * `pianoScore.plan` plays a score on a keyboard from the seat: each note's
 * digit comes down on its key by the note's `at` and leaves it by `to`.
 *
 * Scenario, the average man seated on a bench before an upright piano at the
 * origin, facing it, playing the right index on `key45` from 0.75 s, down at
 * 0.95 s, released at 1.05 s and clear at 1.15 s:
 *
 * 1. At 0.95 s the right index tip lies within 20 mm of the key's top, and within
 *    the key's width across the keyboard.
 * 2. At 0.75 s, before it comes down, it lies higher than at 0.95 s.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_piano_score(): Promise<void> {
  // Plans the arms and the digits on the whole body: the rig, the arm chains, the hands and the seat.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const piano: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "uprightPiano" },
    5,
  );
  const front: number = archetypeExtent(piano, "z", ["case"]).high;
  const stanceZ: number = front + body.measure.footLength + 0.095;
  const bench: ReturnType<typeof createSeat> = createSeat(
    { kind: "bench", places: 1 },
    2,
  );
  const placed: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(bench, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 180,
  });
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(bench, {
    at: { x: 0, y: 0, z: stanceZ - placed.at.z },
    yaw: 180,
  });
  const upright = HumanObject.prop("upright", piano, {
    fixed: true,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
  });
  const where = { at: { x: seat.at.x, y: 0, z: stanceZ }, yaw: 180 };
  const sitting: IAutoMovieMotionHumanSit.IParams = { seat, hold: 1 };
  const seated: IAutoMovieMotionHumanActionPlan = sit.plan(
    motionActionContext(body, sitting, where),
  );
  const note: IAutoMovieMotionHumanPianoScore.INote = {
    key: "key45",
    hand: "right",
    digit: "index",
    from: 0.75,
    at: 0.95,
    release: 1.05,
    to: 1.15,
  };
  const params: IAutoMovieMotionHumanPianoScore.IParams = {
    prop: "upright",
    notes: [note],
  };
  const plan: IAutoMovieMotionHumanActionPlan = pianoScore.plan(
    motionActionContext.after(body, seated, params, {
      ...where,
      props: [upright],
      supports: [
        { part: "seat", kind: "seat", support: { kind: "ground" } },
        { part: "leftFoot", kind: "plant", support: { kind: "ground" } },
        { part: "rightFoot", kind: "plant", support: { kind: "ground" } },
      ],
    }),
  );
  const tip = (seconds: number): IAutoMovieVector3 => {
    const bones = poseBones(
      body,
      resolveHumanPosture(body, plan.posture(seconds)),
    );
    const frame = body.surfaces.regions.indexTipRight;
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
      .point;
  };
  const top: number = archetypeExtent(piano, "y", ["key45-part"]).high;
  const across = archetypeExtent(piano, "x", ["key45-part"]);
  const down: IAutoMovieVector3 = tip(note.at);
  TestValidator.predicate(
    "on the key",
    Math.abs(down.y - top) <= CONTACT &&
      down.x >= across.low - CONTACT &&
      down.x <= across.high + CONTACT,
  );
  TestValidator.predicate("coming down", tip(note.from).y > down.y);
}
