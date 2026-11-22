import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, seat, to }: typeof SceneBuild = SceneBuild;

/** One complete wardrobe change and restoration using the displayed props. */
export const SCENES_WARDROBE: readonly IScene[] = [
  scene(
    {
      id: "wardrobe-change",
      title: "Wardrobe change",
      summary:
        "An actor puts on a short jacket, closes its zip, and changes one shoe while seated. They stand, then return the shoe and jacket to their places.",
      setting: "everyday",
      roles: { actor: "actor" },
      needs: [],
    },
    "wardrobe-change",
    [
      person("actor", "m1", 0, 0, 0, [
        act("stand", { seconds: 0.3 }),
        act("pickUp", {
          prop: "jacket",
          handle: "hold",
          hand: "left",
          lift: 0.02,
        }),
        act("wardrobe", { kind: "jacketOn", prop: "jacket", hand: "left" }),
        act("wardrobe", { kind: "sleeveIn", prop: "jacket", side: "left" }),
        act("wardrobe", { kind: "closeZip", prop: "jacket", side: "right" }),
        act("pickUp", {
          prop: "shoe",
          handle: "hold",
          hand: "left",
          lift: 0.04,
        }),
        act("sit", { seat: seat("chair"), seconds: 0.8 }),
        act("wardrobe", {
          kind: "footwearOn",
          prop: "shoe",
          side: "right",
          hand: "left",
        }),
        act("rise"),
        act("stand", { seconds: 0.35 }),
        act("sit", { seat: seat("chair"), seconds: 0.8 }),
        act("wardrobe", {
          kind: "footwearOff",
          prop: "shoe",
          side: "right",
          hand: "left",
        }),
        act("rise"),
        act("putDown", {
          prop: "shoe",
          at: { x: 0.43, y: 0.73, z: 0.25 },
          hand: "left",
        }),
        act("wardrobe", { kind: "openZip", prop: "jacket", side: "right" }),
        act("wardrobe", { kind: "sleeveOut", prop: "jacket", side: "right" }),
        act("wardrobe", { kind: "sleeveOut", prop: "jacket", side: "left" }),
        act("pickUp", {
          prop: "jacket",
          handle: "hold",
          hand: "left",
          lift: 0,
        }),
        act("putDown", {
          prop: "jacket",
          at: { x: 0, y: 1.06, z: 0.24 },
          hand: "left",
        }),
        act("walk", { to: to(0.65, 0.4) }),
      ]),
    ],
    [
      object("chair", "createSeat", "office", 0, -0.25, 0, 0, {
        seatHeight: 0.42,
      }),
      object("table", "createTable", "desk", 0.62, 0.25, 180),
      object("jacket", "createStageJacket", undefined, 0, 0.24, 0, 1.06, {
        width: 0.39,
        depth: 0.3,
        sleeveWidth: 0.19,
        sleeveLength: 0.04,
        length: 0.48,
        zipTravel: 0.15,
      }),
      object("shoe", "createStageFootwear", "shoe", 0.43, 0.25, 0, 0.73, {
        width: 0.15,
        length: 0.34,
        height: 0.045,
      }),
    ],
  ),
];
