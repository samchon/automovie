import type { AutoMovieHumanSide } from "@automovie/interface";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** Height of the fixed kitchen and laundry worktops, metres. */
const TOP: number = SceneBuild.COUNTER_TOP;

/** Refer to a placed object's own contact site. */
function site(subject: string, point: string): SceneBuild.PropTarget {
  return { kind: "prop", subject, point };
}

/** A fixture keeps its authored frame while hands use its contacts. */
function fixture(
  subject: string,
  producer: string,
  kind: string,
  x: number,
  z: number,
  yaw: number = 0,
  y: number = 0,
): IPlaygroundComposition.IObject {
  return { ...object(subject, producer, kind, x, z, yaw, y), fixed: true };
}

/** Move the same hinge's riding handle by a relative swing in degrees. */
function washerDoor(
  hand: AutoMovieHumanSide,
  swing: number,
): SceneBuild.Action {
  return act("operate", {
    hand,
    kind: { kind: "hinge", at: site("washer", "doorHandle"), swing },
  });
}

/**
 * Three played household sequences with real object handoffs.
 *
 * Charades supplies the everyday task taxonomy and ParaHome shows connected
 * stages and operated household fixtures. The floor pass is a straight
 * two-handed push, one documented mopping pattern.
 *
 * https://arxiv.org/abs/1604.01753 https://jlogkim.github.io/parahome/
 * https://pubmed.ncbi.nlm.nih.gov/2753016/
 * https://pubmed.ncbi.nlm.nih.gov/11733124/
 */
export const SCENES_HOUSEHOLD: readonly IScene[] = [
  scene(
    {
      id: "kitchen-prep-and-clear",
      title: "Kitchen prep and cleanup",
      summary:
        "A cook stirs a saucepan, sets the spoon in a cleanup tray, and clears the counter.",
      setting: "work",
      roles: { cook: "cook" },
      needs: [],
    },
    "kitchen-prep-and-clear",
    [
      person("cook", "f1", 0, 0, 0, [
        act("pickUp", {
          prop: "spoon",
          handle: "grip",
          use: { tip: "face", line: "square" },
        }),
        act("useTool", {
          tool: "stir",
          prop: "spoon",
          on: site("pan", "inside"),
          count: 2,
        }),
        act("putDown", {
          prop: "spoon",
          to: { x: -0.31, y: TOP + 0.017, z: 0.345 },
          yaw: 0,
        }),
        act("wipe", {
          hand: "left",
          on: {
            kind: "point",
            at: { x: 0.28, y: TOP, z: 0.35 },
            frame: "world",
          },
          count: 1,
        }),
        act("stand", { hold: 0.3 }),
      ]),
    ],
    [
      fixture("counter", "createTable", "counter", 0, 0.6, 180),
      fixture("pan", "createVessel", "saucepan", 0.02, 0.39, 0, TOP),
      fixture("tray", "createTray", "tray", -0.31, 0.42, 0, TOP),
      {
        ...object("spoon", "createTool", "spoon", -0.18, 0.27, 0, TOP + 0.005, {
          length: 0.15,
          gripDiameter: 0.01,
        }),
        rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
    ],
  ),
  scene(
    {
      id: "load-the-washer",
      title: "Load the washer",
      summary:
        "A folded cloth goes from a basket through the open washer door and stays in the drum after the door closes.",
      setting: "everyday",
      roles: { resident: "resident" },
      needs: [],
    },
    "load-the-washer",
    [
      person("resident", "f1", 0, 0, 0, [
        washerDoor("left", 94),
        act("pickUp", {
          prop: "cloth",
          handle: "grip",
          hand: "right",
          lift: 0.29,
        }),
        act("walk", { to: to(0.02, 0.08), facing: { yaw: 0 }, pace: "slow" }),
        act("stand", { hold: 0.2 }),
        act("putDownAperture", {
          prop: "cloth",
          onto: {
            prop: "washer",
            aperture: "loadOpening",
            point: "drumSeat",
            approach: ["loadApproach", "loadAlign"],
            insertion: ["drumEntry"],
          },
        }),
        act("walk", { to: to(0.12, -0.13), facing: { yaw: 0 }, pace: "slow" }),
        act("stand", { hold: 0.2 }),
        washerDoor("right", -94),
        act("stand", { hold: 0.3 }),
      ]),
    ],
    [
      fixture("stand", "createTable", "counter", -0.04, 0.56, 180),
      fixture("washer", "createAppliance", "washingMachine", 0, 0.77, 180, TOP),
      {
        ...fixture("basket", "createTray", "basket", -0.54, 0.38, 90, TOP),
        seed: 1,
      },
      object("cloth", "createCleaning", "cloth", -0.535, 0.28, 90, TOP + 0.012),
    ],
  ),
  scene(
    {
      id: "mop-the-floor",
      title: "Mop the floor",
      summary:
        "A resident takes the mop by its shaft, walks through one floor pass, and parks it at the end.",
      setting: "everyday",
      roles: { resident: "resident" },
      needs: [],
    },
    "mop-the-floor",
    [
      person("resident", "f1", 0, 0, 0, [
        act("pushPull", {
          prop: "mop",
          way: "push",
          left: "upperGrip",
          right: "lowerGrip",
          load: "light",
          to: to(0, 0.38),
        }),
        act("stand", { hold: 0.35 }),
      ]),
    ],
    [object("mop", "createLongTool", "mop", 0, 0.41)],
  ),
];
