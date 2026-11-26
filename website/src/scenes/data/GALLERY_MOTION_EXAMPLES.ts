import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, seat, to }: typeof SceneBuild = SceneBuild;

/** A practice basket in the centre of its ring, in world metres. */
const RING = { x: 0, y: 3.05, z: -0.474 };

/** Short takes that show how separate actions share a performance. */
export const GALLERY_MOTION_EXAMPLES: readonly IScene[] = [
  scene(
    {
      id: "collect-and-shoot",
      title: "Collect and shoot",
      summary:
        "A player walks to the ball, gathers it and shoots from a settled stance.",
      setting: "sport",
      roles: { nia: "player" },
      needs: [],
      view: "side",
    },
    "collect-and-shoot",
    [
      person("nia", "f2", 0, 3.25, 180, [
        act("walk", { to: to(0, 2.2), face: 180 }),
        act("pickUp", { prop: "ball", handle: "grip", lift: 0.15 }),
        act("stand", { hold: 0.4 }),
        // WABC Level 1, sections 2.7.3 to 2.7.5, describes the balanced
        // stance, grip and release that the planted shot composes.
        act("ballSport", {
          kind: "setShot",
          prop: "ball",
          at: RING,
          flightSeconds: 1.05,
        }),
        act("stand", { hold: 0.6 }),
      ]),
    ],
    [
      object("ball", "createSphericalBall", "basketball", 0, 1.72),
      {
        ...object("hoop", "createBasketballHoop", undefined, 0, -0.85, 0, 0, {
          ring: 0.45,
          thickness: 0.013,
        }),
        fixed: true,
      },
    ],
  ),
  scene(
    {
      id: "waiting-room",
      title: "Waiting room",
      summary:
        "A visitor sits, checks the time, shifts across the seat and stands to leave.",
      setting: "everyday",
      roles: { sol: "visitor" },
      needs: [],
    },
    "waiting-room",
    [
      person("sol", "m2", 0, 0.3, 0, [
        act("sit", { seat: seat("chair"), hold: 0.7 }),
        act("checkWatch"),
        act("shift", { by: -0.08 }),
        act("rise"),
        act("walk", { to: to(0.2, 1.55) }),
      ]),
    ],
    [object("chair", "createSeat", "office", 0, 0)],
  ),
  scene(
    {
      id: "floor-circuit",
      title: "Floor circuit",
      summary:
        "One athlete holds a plank after a push-up while another returns to standing.",
      setting: "gym",
      roles: { ana: "athlete", bo: "athlete" },
      needs: [],
      view: "three-quarter",
    },
    "floor-circuit",
    [
      person("ana", "f1", -0.7, 0, 0, [
        act("pushUp", { count: 1, stay: true }),
        act("plank", { hold: 1 }),
      ]),
      person("bo", "m2", 0.7, 0, 0, [
        act("squats", { count: 2 }),
        act("crouch", { depth: "partial", hold: 0.35 }),
        act("stand", { hold: 0.5 }),
      ]),
    ],
  ),
];
