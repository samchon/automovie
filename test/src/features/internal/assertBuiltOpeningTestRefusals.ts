import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtOpeningTestRefusalPaths as refusalPaths } from "./builtOpeningTestRefusalPaths";

/** Run the existing malformed BuiltOpeningTest cases in their authored order. */
export const assertBuiltOpeningTestRefusals = (): void => {
  const malformed: Array<
    readonly [string, (value: IAutoMovieBuiltEnvironment) => void, string]
  > = [
    [
      "non-finite face origin",
      (value) => (value.boundaries[0]!.face!.origin.x = Number.NaN),
      "$input.boundaries[0].face.origin.x",
    ],
    [
      "face rotation that is not a unit quaternion",
      (value) =>
        (value.boundaries[0]!.face!.rotation = { x: 0, y: 0, z: 0, w: 2 }),
      "$input.boundaries[0].face.rotation",
    ],
    [
      "zero boundary thickness",
      (value) => (value.boundaries[0]!.face!.thickness = 0),
      "$input.boundaries[0].face.thickness",
    ],
    [
      "two-point boundary face",
      (value) =>
        (value.boundaries[0]!.face!.outline = [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ]),
      "$input.boundaries[0].face.outline",
    ],
    [
      "non-finite face corner",
      (value) =>
        (value.boundaries[0]!.face!.outline[1]!.y = Number.POSITIVE_INFINITY),
      "$input.boundaries[0].face.outline[1].y",
    ],
    [
      "repeated face corner",
      (value) =>
        (value.boundaries[0]!.face!.outline[1] = {
          ...value.boundaries[0]!.face!.outline[0]!,
        }),
      "$input.boundaries[0].face.outline",
    ],
    [
      "collinear face outline",
      (value) =>
        (value.boundaries[0]!.face!.outline = [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ]),
      "$input.boundaries[0].face.outline",
    ],
    [
      "self-crossing face outline",
      (value) =>
        (value.boundaries[0]!.face!.outline = [
          { x: 0, y: 0 },
          { x: 9, y: 3 },
          { x: 9, y: 0 },
          { x: 0, y: 4 },
        ]),
      "$input.boundaries[0].face.outline",
    ],
    [
      "void on a boundary that declares no face",
      (value) => (value.openings[5]!.profile = { outline: [{ x: 0, y: 0 }] }),
      "$input.openings[5].profile",
    ],
    [
      "one-point opening outline",
      (value) => (value.openings[0]!.profile!.outline = [{ x: 1, y: 0 }]),
      "$input.openings[0].profile.outline",
    ],
    [
      "opening outline with no area",
      (value) =>
        (value.openings[0]!.profile!.outline = [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ]),
      "$input.openings[0].profile.outline",
    ],
    [
      "self-crossing opening outline",
      (value) =>
        (value.openings[0]!.profile!.outline = [
          { x: 1, y: 0 },
          { x: 3, y: 2 },
          { x: 3, y: 0 },
          { x: 1, y: 3 },
        ]),
      "$input.openings[0].profile.outline",
    ],
    [
      "repeated opening corner",
      (value) => (value.openings[0]!.profile!.outline[1] = { x: 1, y: 0 }),
      "$input.openings[0].profile.outline",
    ],
    [
      "non-finite opening corner",
      (value) => (value.openings[0]!.profile!.outline[0]!.x = Number.NaN),
      "$input.openings[0].profile.outline[0].x",
    ],
    [
      "one bulge for four edges",
      (value) => (value.openings[0]!.profile!.bulges = [0]),
      "$input.openings[0].profile.bulges",
    ],
    [
      "an arc longer than a half turn",
      (value) => (value.openings[4]!.profile!.bulges = [0, 0, -1.5, 0]),
      "$input.openings[4].profile.bulges[2]",
    ],
    [
      "non-finite bulge",
      (value) => (value.openings[4]!.profile!.bulges = [0, 0, Number.NaN, 0]),
      "$input.openings[4].profile.bulges[2]",
    ],
    [
      "a void reaching past its host face",
      (value) =>
        (value.openings[0]!.profile!.outline = [
          { x: 1, y: -0.5 },
          { x: 3, y: -0.5 },
          { x: 3, y: 2.1 },
          { x: 1, y: 2.1 },
        ]),
      "$input.openings[0].profile.outline",
    ],
    [
      // Only the arc leaves the face; every stated corner stays inside it.
      "an arch whose bulged head leaves its host face",
      (value) =>
        (value.openings[4]!.profile!.outline = [
          { x: 1, y: 2.3 },
          { x: 2, y: 2.3 },
          { x: 2, y: 2.9 },
          { x: 1, y: 2.9 },
        ]),
      "$input.openings[4].profile.outline",
    ],
    [
      // A concave face is legal, and a void may then have every corner inside
      // the face while an edge still crosses out through the reentrant corner.
      "a void spanning the notch of a concave face",
      (value) => {
        value.boundaries[0]!.face!.outline = [
          { x: 0, y: 0 },
          { x: 9, y: 0 },
          { x: 9, y: 3 },
          { x: 5, y: 3 },
          { x: 5, y: 1.5 },
          { x: 0, y: 1.5 },
        ];
        value.openings[0]!.profile!.outline = [
          { x: 1, y: 1 },
          { x: 8, y: 2.5 },
          { x: 8, y: 1 },
        ];
      },
      "$input.openings[0].profile.outline",
    ],
    [
      "two voids sharing the same part of one boundary",
      (value) =>
        (value.openings[1]!.profile!.outline = [
          { x: 2.5, y: 1 },
          { x: 3.3, y: 1 },
          { x: 3.3, y: 2 },
          { x: 2.5, y: 2 },
        ]),
      "$input.openings[1].profile.outline",
    ],
    [
      "movable panels with no filling element",
      (value) => (value.openings[2]!.fill = null),
      "$input.openings[2].fill",
    ],
    [
      "an operation with no panel",
      (value) => (value.openings[2]!.operation!.panels = []),
      "$input.openings[2].operation.panels",
    ],
    [
      "duplicate panel id",
      (value) =>
        value.openings[0]!.operation!.panels.push(
          value.openings[0]!.operation!.panels[0]!,
        ),
      "$input.openings[0].operation.panels[2].id",
    ],
    [
      "dangling panel element",
      (value) => (value.openings[2]!.operation!.panels[0]!.element = "missing"),
      "$input.openings[2].operation.panels[0].element",
    ],
    [
      // One element carries one displacement, so a second claim on it would
      // lose a travel rather than add one.
      "two panels of one opening driving one element",
      (value) =>
        (value.openings[0]!.operation!.panels[1]!.element = "door-leaf"),
      "$input.openings[0].operation.panels[1].element",
    ],
    [
      // The claim is legal for this opening on its own — the element is its
      // declared fill — so only the collision with the door's inner leaf can
      // be what refuses it.
      "two openings driving one element",
      (value) => {
        value.openings[2]!.fill = "door-fold";
        value.openings[2]!.operation!.panels[0]!.element = "door-fold";
      },
      "$input.openings[2].operation.panels[0].element",
    ],
    [
      "a panel outside the element it fills",
      (value) => (value.openings[2]!.operation!.panels[0]!.element = "wall"),
      "$input.openings[2].operation.panels[0].element",
    ],
    [
      "zero panel width",
      (value) => (value.openings[2]!.operation!.panels[0]!.width = 0),
      "$input.openings[2].operation.panels[0].width",
    ],
    [
      "zero panel height",
      (value) => (value.openings[2]!.operation!.panels[0]!.height = 0),
      "$input.openings[2].operation.panels[0].height",
    ],
    [
      "zero travel axis",
      (value) =>
        (value.openings[2]!.operation!.panels[0]!.motion.axis = {
          x: 0,
          y: 0,
          z: 0,
        }),
      "$input.openings[2].operation.panels[0].motion.axis",
    ],
    [
      "non-finite travel axis",
      (value) =>
        (value.openings[2]!.operation!.panels[0]!.motion.axis.y = Number.NaN),
      "$input.openings[2].operation.panels[0].motion.axis.y",
    ],
    [
      "non-finite pivot",
      (value) => {
        const motion = value.openings[0]!.operation!.panels[0]!.motion;
        if (motion.kind === "revolute") motion.pivot.z = Number.NaN;
      },
      "$input.openings[0].operation.panels[0].motion.pivot.z",
    ],
    [
      "a lowest travel above rest",
      (value) => (value.openings[2]!.operation!.panels[0]!.motion.min = 0.5),
      "$input.openings[2].operation.panels[0].motion.min",
    ],
    [
      "a highest travel below rest",
      (value) => (value.openings[2]!.operation!.panels[0]!.motion.max = -0.5),
      "$input.openings[2].operation.panels[0].motion.max",
    ],
    [
      "a panel with no travel at all",
      (value) => {
        value.openings[2]!.operation!.panels[0]!.motion.max = 0;
        value.openings[2]!.operation!.states[1]!.panels[0]!.value = 0;
      },
      "$input.openings[2].operation.panels[0].motion.max",
    ],
    [
      "a turning panel travelling more than a full turn",
      (value) => {
        const motion = value.openings[1]!.operation!.panels[0]!.motion;
        motion.min = -4;
        motion.max = 4;
      },
      "$input.openings[1].operation.panels[0].motion.max",
    ],
    [
      "an operation with no named state",
      (value) => (value.openings[2]!.operation!.states = []),
      "$input.openings[2].operation.states",
    ],
    [
      "duplicate state id",
      (value) =>
        value.openings[2]!.operation!.states.push(
          value.openings[2]!.operation!.states[0]!,
        ),
      "$input.openings[2].operation.states[2].id",
    ],
    [
      "a state driving an unknown panel",
      (value) =>
        (value.openings[2]!.operation!.states[0]!.panels[0]!.panel = "ghost"),
      "$input.openings[2].operation.states[0].panels[0].panel",
    ],
    [
      "a state driving one panel twice",
      (value) =>
        value.openings[2]!.operation!.states[0]!.panels.push(
          value.openings[2]!.operation!.states[0]!.panels[0]!,
        ),
      "$input.openings[2].operation.states[0].panels[1].panel",
    ],
    [
      "a state leaving a panel unstated",
      (value) => value.openings[0]!.operation!.states[0]!.panels.pop(),
      "$input.openings[0].operation.states[0].panels",
    ],
    [
      "a state outside a panel's travel",
      (value) =>
        (value.openings[2]!.operation!.states[1]!.panels[0]!.value = 2),
      "$input.openings[2].operation.states[1].panels[0].value",
    ],
    [
      "a non-finite state value",
      (value) =>
        (value.openings[2]!.operation!.states[1]!.panels[0]!.value =
          Number.NaN),
      "$input.openings[2].operation.states[1].panels[0].value",
    ],
    [
      "an unresolved current state",
      (value) => (value.openings[2]!.operation!.state = "ajar"),
      "$input.openings[2].operation.state",
    ],
    [
      "duplicate hardware id",
      (value) =>
        value.openings[0]!.operation!.hardware.push(
          value.openings[0]!.operation!.hardware[0]!,
        ),
      "$input.openings[0].operation.hardware[2].id",
    ],
    [
      "blank hardware kind",
      (value) => (value.openings[0]!.operation!.hardware[0]!.kind = " "),
      "$input.openings[0].operation.hardware[0].kind",
    ],
    [
      "dangling hardware element",
      (value) => (value.openings[0]!.operation!.hardware[0]!.element = "gone"),
      "$input.openings[0].operation.hardware[0].element",
    ],
    [
      "a leaf wider than the void it fills",
      (value) => (value.openings[1]!.operation!.panels[0]!.width = 1.4),
      "$input.openings[1].operation.panels[0]",
    ],
    [
      "a leaf resting outside its own void",
      (value) => (value.elements[5]!.transform.translation.x = 7.5),
      "$input.openings[1].operation.panels[0]",
    ],
    [
      // Shut, the leaf is a clean scaled frame; a quarter turn later the same
      // hierarchy carries shear the staged node could not hold. Checking only
      // the state the record stands in would let this pass shut and lie open.
      "a state the scene could not stage even though the current one can",
      (value) => {
        value.elements[2]!.transform.scale = { x: 2, y: 1, z: 1 };
        // A quarter turn about the scaled frame's own up axis stays orthogonal
        // by luck of the right angle; any other angle is where the shear shows.
        value.openings[0]!.operation!.states[1]!.panels[0]!.value = 1;
      },
      "$input.openings[0].operation.states[1]",
    ],
  ];
  malformed.forEach(([name, mutate, path]) =>
    TestValidator.equals(
      `${name} is refused at ${path}`,
      refusalPaths(mutate).includes(path),
      true,
    ),
  );
};
