import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHeld,
  HumanHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few quaternion rotations, metres. */
const ROUNDING: number = 1e-12;

/** A glass's lip 20 cm up its own +Y. */
const LIP: IAutoMovieAffordance = {
  id: "lip",
  kind: "surface",
  frame: {
    translation: { x: 0, y: 0.2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
};

/**
 * `AutoMovieMotionHumanHeld` keeps a held prop in its hand's grip frame, the
 * grip socket's point with the hand bone's rotation: a prop not yet taken is
 * read into the frame its grip would keep (`grasped`), a contact of a held prop
 * is its translation and its `+Y` carried by that frame (`point`), a name the
 * prop does not declare is refused, and the grip keeping it through an action
 * is a grip window on the hand over the whole action (`grip`).
 *
 * The body is built whole (`humanFixtureBody`) for the grip socket's offset in
 * the hand.
 *
 * Scenarios:
 *
 * 1. A glass held 0.1 m along the grip frame's +X, turned 90 degrees about +Z: its
 *    lip lies at (0.1, 0, 0) + R (0, 0.2, 0) = (−0.1, 0, 0), its +Y along −X.
 * 2. A contact the glass does not declare is refused, naming the one it has.
 * 3. The grip window is the right hand's, over the whole action, on the glass.
 * 4. A glass lying 5 cm past the grip socket of an unturned wrist at (1, 1, 1),
 *    turned 30 degrees about +Y, is held 5 cm along the frame's own axis with
 *    its own turn.
 */
export async function test_unit_motions_compose_human_held(): Promise<void> {
  // 1. A contact in the grip frame.
  const held: IAutoMovieMotionHumanHeld.IHeld = {
    prop: "glass",
    side: "right",
    frame: {
      position: { x: 0.1, y: 0, z: 0 },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
    },
    affordances: [LIP],
  };
  const lip: ReturnType<typeof AutoMovieMotionHumanHeld.point> =
    AutoMovieMotionHumanHeld.point(held, "lip");
  TestValidator.predicate(
    "the lip in the hand's grip frame",
    vclose(lip.point, { x: -0.1, y: 0, z: 0 }, ROUNDING) &&
      vclose(lip.direction, { x: -1, y: 0, z: 0 }, ROUNDING),
  );

  // 2. An undeclared contact.
  TestValidator.predicate(
    "an undeclared contact is refused",
    throwsError(
      (): unknown => AutoMovieMotionHumanHeld.point(held, "spout"),
      "glass declares no contact named spout",
    ),
  );

  // 3. The grip window.
  TestValidator.equals("the grip window", AutoMovieMotionHumanHeld.grip(held), {
    part: "rightHand",
    kind: "grip",
    from: 0,
    to: 1,
    support: { kind: "prop", subject: "glass" },
  });

  // 4. A prop not yet taken.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const wrist: IAutoMovieMotionHumanHeld.IGraspedWrist = {
    point: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const socket: IAutoMovieVector3 = Vector3.add(
    wrist.point,
    HumanHand.offset(body, "right", "grip").point,
  );
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    30,
  );
  const taken: IAutoMovieMotionHumanHeld.IHeld =
    AutoMovieMotionHumanHeld.grasped(
      body,
      "right",
      "glass",
      {
        position: Vector3.add(socket, { x: 0, y: 0, z: 0.05 }),
        rotation: turn,
      },
      [LIP],
      wrist,
    );
  TestValidator.predicate(
    "the grip the hand would keep",
    vclose(taken.frame.position, { x: 0, y: 0, z: 0.05 }, ROUNDING) &&
      Math.abs(
        Math.abs(
          taken.frame.rotation.x * turn.x +
            taken.frame.rotation.y * turn.y +
            taken.frame.rotation.z * turn.z +
            taken.frame.rotation.w * turn.w,
        ) - 1,
      ) <= ROUNDING &&
      taken.side === "right" &&
      taken.prop === "glass",
  );
}
