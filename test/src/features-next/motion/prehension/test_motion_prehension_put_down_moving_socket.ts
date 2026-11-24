import { createGroomingBrush } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A scene's contact function: a contact's world frame at a film second. */
type Contact = (id: string, at: number) => IAutoMovieTransform;

/** The receiving post's socket at rest, in its own frame: a metre up. */
const SOCKET: IAutoMovieTransform = {
  translation: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** The film second the moving socket starts to rise and turn, after the put-down has ended. */
const MOVE: number = 20;

/**
 * A prop put down onto another prop's socket follows that socket where the receiver displays it, and a receiver that publishes no moving socket keeps its declared one.
 *
 * Scenarios:
 * 1. A brush is picked up and put onto a post whose socket rises and turns after the put-down; once moving, the brush's displayed frame is the socket's displayed frame at every sampled second.
 * 2. The same put-down onto a post that publishes no contact frames leaves the brush at the post's frame carrying its declared socket.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both scenarios and what each checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public pick-up and put-down onto a prop socket and reads the performance's displayed prop frames.
 * @evidence contracts/development/testing.md#independent-expectations The moving socket's frame is the scene's own contact function; the static socket's is the post's placement composed with its declared affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases A receiver publishing moving contact frames versus one that publishes none.
 * @evidence contracts/development/testing.md#execution-ownership A deterministic in-memory performance with one performer and two props.
 */
export function test_motion_prehension_put_down_moving_socket(): void {
  const post: IAutoMovieVector3 = { x: -0.05, y: 0, z: 0.45 };
  const moving: Contact = (_id: string, at: number): IAutoMovieTransform => {
    const rise: number = Math.max(0, at - MOVE);
    return {
      translation: { x: post.x, y: post.y + 1 + 0.05 * rise, z: post.z },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 10 * rise),
      scale: { x: 1, y: 1, z: 1 },
    };
  };
  for (const published of [true, false]) {
    const film: HumanPerformance = stage(post, published ? moving : undefined);
    const put: IAutoMovieMotionHumanSegment = film.segments("handler").at(-1)!;
    TestValidator.predicate(
      "the put-down ends before the socket moves",
      put.end < MOVE,
    );
    for (const at of [put.end + 0.5, MOVE + 1, MOVE + 3]) {
      const shown: IAutoMovieRigidTransform = film.prop("brush", at);
      const expected: IAutoMovieTransform = published
        ? moving("socket", at)
        : {
            ...SOCKET,
            translation: Vector3.add(post, SOCKET.translation),
          };
      TestValidator.predicate(
        `${published ? "the moving" : "the static"} socket carries the brush at ${at}`,
        Vector3.distance(shown.position, expected.translation) <= 1e-6 &&
          Quaternion.angle(shown.rotation, expected.rotation) <= 1e-6,
      );
    }
  }
}

/** One handler picks the brush off a shelf and puts it onto the post's socket. */
function stage(
  post: IAutoMovieVector3,
  contact: Contact | undefined,
): HumanPerformance {
  const socket: IAutoMovieAffordance = {
    id: "socket",
    kind: "socket",
    frame: SOCKET,
    extent: null,
  };
  const model: IAutoMovieMotionHumanObject.IModel = {
    affordances: [socket],
    hasArticulations: false,
  };
  return new HumanPerformance({
    seed: "moving-socket",
    performers: [
      {
        subject: "handler",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [],
    props: [
      HumanObject.prop("brush", createGroomingBrush(), {
        at: { x: -0.2, y: 0.95, z: 0.35 },
        yaw: 0,
      }),
      contact === undefined
        ? HumanObject.prop("post", model, { at: post, yaw: 0, fixed: true })
        : HumanObject.prop(
            "post",
            model,
            { at: post, yaw: 0, fixed: true },
            undefined,
            contact,
          ),
    ],
    composition: HumanChain.subject("handler")
      .pickUp({ prop: "brush", handle: "grip", hand: "right" })
      .putDown({
        prop: "brush",
        hand: "right",
        onto: { prop: "post", point: "socket" },
      }).node,
  });
}
