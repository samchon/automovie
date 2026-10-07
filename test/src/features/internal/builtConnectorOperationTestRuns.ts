import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConvexSpaceCell,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { BUILT_CONNECTOR_OPERATION_TEST_CAR_REST as CAR_REST } from "./BUILT_CONNECTOR_OPERATION_TEST_CAR_REST";
import { BUILT_CONNECTOR_OPERATION_TEST_NO_ROTATION as NO_ROTATION } from "./BUILT_CONNECTOR_OPERATION_TEST_NO_ROTATION";
import { BUILT_CONNECTOR_OPERATION_TEST_STOREY as STOREY } from "./BUILT_CONNECTOR_OPERATION_TEST_STOREY";
import { createModel } from "./fixtures";

const box = (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    { normal: { x: 1, y: 0, z: 0 }, offset: max.x },
    { normal: { x: -1, y: 0, z: 0 }, offset: -min.x },
    { normal: { x: 0, y: 1, z: 0 }, offset: max.y },
    { normal: { x: 0, y: -1, z: 0 }, offset: -min.y },
    { normal: { x: 0, y: 0, z: 1 }, offset: max.z },
    { normal: { x: 0, y: 0, z: -1 }, offset: -min.z },
  ],
});

const place = (x = 0, y = 0, z = 0): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: NO_ROTATION,
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * A three-level work whose runs move: a lift, an escalator, and a one-way
 * chute, beside a stair that does not move at all.
 *
 * The lift is the case a two-ended relation could not state. It stops at a
 * floor neither of its ends names, its car stands somewhere different at each
 * stop, and its counterweight travels the other way and stands at no floor at
 * all. Writing that as three connectors would give one shaft three identities;
 * writing the car's position per state would give one car three placements. The
 * escalator is the powered run the `escalator` kind was named for, and it
 * carries the drive a stair has no use for. The chute is one-way, so the order
 * of its own stops is what decides where it can take somebody.
 */
export const builtConnectorOperationTestRuns =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "runs",
    units: "meter",
    buildings: [{ id: "unit", element: "root", space: "whole" }],
    models: [{ ...createModel(null), id: "box" }],
    modelReferences: [],
    elements: [
      {
        id: "root",
        kind: "building",
        parent: null,
        transform: place(),
        model: null,
        space: "whole",
      },
      {
        id: "shaft",
        kind: "lift-shaft",
        parent: "root",
        transform: place(),
        model: "box",
        space: null,
      },
      {
        // The car rests at the lowest stop; every state is a travel from here.
        id: "car",
        kind: "lift-car",
        parent: "shaft",
        transform: place(0, CAR_REST, 0),
        model: "box",
        space: null,
      },
      {
        // Counterweights hang at the far end of the same rope, so this one is
        // high when the car is low and serves no floor in any state.
        id: "counterweight",
        kind: "counterweight",
        parent: "shaft",
        transform: place(1.2, CAR_REST + 2 * STOREY, 0),
        model: "box",
        space: null,
      },
      {
        id: "band",
        kind: "escalator-band",
        parent: "root",
        transform: place(6, 0, -6),
        model: "box",
        space: null,
      },
      {
        id: "gate-drum",
        kind: "revolving-door",
        parent: "root",
        transform: place(2, 0, 2),
        model: "box",
        space: "lobby",
      },
      {
        // A wing that turns about the drum's own axis: the same travel record a
        // sliding car uses, on its other arm.
        id: "gate-wing",
        kind: "revolving-door-wing",
        parent: "gate-drum",
        transform: place(),
        model: "box",
        space: "lobby",
      },
    ],
    spaces: [
      { id: "whole", kind: "building", parent: null, cells: [] },
      {
        id: "level-0",
        kind: "storey",
        parent: "whole",
        cells: [
          box("level-0-cell", { x: -8, y: 0, z: -8 }, { x: 8, y: 3, z: 8 }),
        ],
      },
      {
        id: "level-1",
        kind: "storey",
        parent: "whole",
        cells: [
          box("level-1-cell", { x: -8, y: 3, z: -8 }, { x: 8, y: 6, z: 8 }),
        ],
      },
      {
        id: "level-2",
        kind: "storey",
        parent: "whole",
        cells: [
          box("level-2-cell", { x: -8, y: 6, z: -8 }, { x: 8, y: 9, z: 8 }),
        ],
      },
      {
        id: "lobby",
        kind: "room",
        parent: "level-0",
        cells: [box("lobby-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 4 })],
      },
      // A plant deck nobody bounded: it is a place the escalator stops at, and
      // deliberately not a volume anything can be found inside.
      { id: "plant", kind: "plant", parent: "whole", cells: [] },
    ],
    boundaries: [],
    openings: [],
    connectors: [
      {
        id: "lift",
        kind: "lift",
        from: "level-0",
        to: "level-2",
        bidirectional: true,
        route: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 2 * STOREY, z: 0 },
        ],
        landings: [{ space: "level-1", at: 0.5 }],
        width: 1.6,
        clearHeight: 2.4,
        // Naming the shaft is enough: the car and the counterweight hang below
        // it, so the run owns them without listing every part twice.
        elements: ["shaft"],
        operation: {
          carriages: [
            {
              id: "car",
              element: "car",
              motion: {
                kind: "prismatic",
                axis: { x: 0, y: 1, z: 0 },
                min: 0,
                max: 2 * STOREY,
              },
            },
            {
              id: "counterweight",
              element: "counterweight",
              motion: {
                kind: "prismatic",
                axis: { x: 0, y: 1, z: 0 },
                min: -2 * STOREY,
                max: 0,
              },
            },
          ],
          states: [
            {
              id: "at-level-0",
              drive: "still",
              carriages: [
                { carriage: "car", value: 0, serves: "level-0" },
                { carriage: "counterweight", value: 0, serves: null },
              ],
            },
            {
              id: "at-level-1",
              drive: "still",
              carriages: [
                { carriage: "car", value: STOREY, serves: "level-1" },
                { carriage: "counterweight", value: -STOREY, serves: null },
              ],
            },
            {
              id: "at-level-2",
              drive: "still",
              carriages: [
                { carriage: "car", value: 2 * STOREY, serves: "level-2" },
                { carriage: "counterweight", value: -2 * STOREY, serves: null },
              ],
            },
            {
              // Between floors, so the car serves nothing while it is driven.
              id: "ascending",
              drive: "forward",
              carriages: [
                { carriage: "car", value: STOREY / 2, serves: null },
                { carriage: "counterweight", value: -STOREY / 2, serves: null },
              ],
            },
            {
              // The twin of the refusal below: a run that goes both ways may be
              // driven backwards, and only a one-way run may not.
              id: "descending",
              drive: "reverse",
              carriages: [
                { carriage: "car", value: (3 * STOREY) / 2, serves: null },
                {
                  carriage: "counterweight",
                  value: (-3 * STOREY) / 2,
                  serves: null,
                },
              ],
            },
          ],
          state: "at-level-0",
        },
      },
      {
        id: "escalator",
        kind: "escalator",
        from: "level-0",
        to: "level-1",
        bidirectional: false,
        route: [
          { x: 6, y: 0, z: -6 },
          { x: 6, y: STOREY, z: -1.5 },
        ],
        landings: [{ space: "plant", at: 0.5 }],
        width: 1,
        clearHeight: 2.3,
        elements: ["band"],
        operation: {
          carriages: [
            {
              id: "steps",
              element: "band",
              motion: {
                kind: "prismatic",
                axis: { x: 0, y: STOREY, z: 4.5 },
                min: 0,
                max: 1,
              },
            },
          ],
          states: [
            {
              id: "stopped",
              drive: "still",
              carriages: [{ carriage: "steps", value: 0, serves: null }],
            },
            {
              // The plant deck bounds no volume, so the stop is a fact about the
              // run rather than a claim the geometry has to settle.
              id: "running",
              drive: "forward",
              carriages: [{ carriage: "steps", value: 0.4, serves: "plant" }],
            },
          ],
          state: "stopped",
        },
      },
      {
        // A one-way descent: its stops are ordered, so where it can take somebody
        // depends on where they board it.
        id: "chute",
        kind: "other",
        from: "level-2",
        to: "level-0",
        bidirectional: false,
        route: [
          { x: -6, y: 2 * STOREY, z: 0 },
          { x: -6, y: 4, z: 0 },
          { x: -6, y: 0, z: 0 },
        ],
        landings: [{ space: "level-1", at: 0.5 }],
        width: 1,
        clearHeight: 1,
        elements: [],
      },
      {
        // A revolving door: the run turns rather than travels, on the same one
        // degree of freedom a car slides on.
        id: "gate",
        kind: "passage",
        from: "level-0",
        to: "lobby",
        bidirectional: true,
        route: [
          { x: 2, y: 0, z: -1 },
          { x: 2, y: 0, z: 2 },
        ],
        width: 1.2,
        clearHeight: 2.1,
        elements: ["gate-drum"],
        operation: {
          carriages: [
            {
              id: "wing",
              element: "gate-wing",
              motion: {
                kind: "revolute",
                axis: { x: 0, y: 1, z: 0 },
                pivot: { x: 0, y: 0, z: 0 },
                min: 0,
                max: Math.PI,
              },
            },
          ],
          states: [
            {
              id: "shut",
              drive: "still",
              carriages: [{ carriage: "wing", value: 0, serves: "lobby" }],
            },
            {
              id: "half-turned",
              drive: "forward",
              carriages: [
                { carriage: "wing", value: Math.PI / 3, serves: null },
              ],
            },
          ],
          state: "shut",
        },
      },
      {
        // The static twin: a stair is the whole of itself at all times.
        id: "stair",
        kind: "stair",
        from: "level-0",
        to: "level-1",
        bidirectional: true,
        route: [
          { x: -4, y: 0, z: 0 },
          { x: -4, y: STOREY, z: 4 },
        ],
        width: 1.4,
        clearHeight: 2.2,
        elements: [],
      },
    ],
    surfaces: [],
    walkable: [],
  });
