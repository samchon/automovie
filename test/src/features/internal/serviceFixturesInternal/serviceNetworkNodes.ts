import type { IAutoMovieServiceNode } from "@automovie/interface";

import { node } from "./node";
import { port } from "./port";

/** Return the network's fourteen original fittings and ordered typed ports as fresh records. */
export function serviceNetworkNodes(): IAutoMovieServiceNode[] {
  return [
    node({
      id: "cold-main",
      kind: "source",
      space: "plant",
      element: "root",
      position: { x: 8, y: 2.5, z: 1 },
      ports: [
        port({
          id: "cold-main-out",
          system: "cold",
          medium: "cold-water",
          direction: "out",
          section: 0.002,
          position: { x: 8, y: 2.5, z: 1 },
        }),
      ],
    }),
    node({
      id: "hot-main",
      kind: "source",
      space: "plant",
      position: { x: 8, y: 2.5, z: 1.4 },
      ports: [
        port({
          id: "hot-main-out",
          system: "hot",
          medium: "hot-water",
          direction: "out",
          section: 0.002,
          position: { x: 8, y: 2.5, z: 1.4 },
        }),
      ],
    }),
    node({
      id: "stack",
      kind: "source",
      space: "plant",
      position: { x: 9, y: 0.1, z: 1 },
      ports: [
        port({
          id: "stack-in",
          system: "waste",
          medium: "waste-water",
          direction: "in",
          section: 0.004,
          position: { x: 9, y: 0.1, z: 1 },
        }),
      ],
    }),
    node({
      id: "vent-head",
      kind: "source",
      space: "plant",
      position: { x: 9, y: 2.8, z: 2 },
      ports: [
        port({
          id: "vent-head-in",
          system: "vent",
          medium: "vent-air",
          direction: "in",
          position: { x: 9, y: 2.8, z: 2 },
        }),
      ],
    }),
    node({
      id: "panel",
      kind: "source",
      space: "plant",
      position: { x: 8.5, y: 2.95, z: 3 },
      maintenance: {
        min: { x: -0.4, y: -2.6, z: -0.8 },
        max: { x: 0.4, y: 0.05, z: 0 },
      },
      ports: [
        port({
          id: "panel-out",
          system: "lighting",
          medium: "electric-power",
          unit: "watt",
          direction: "out",
          position: { x: 8.5, y: 2.95, z: 3 },
        }),
      ],
    }),
    node({
      id: "ahu",
      kind: "equipment",
      space: "plant",
      position: { x: 8, y: 2.7, z: 4.5 },
      maintenance: {
        min: { x: -0.5, y: -2.5, z: -0.5 },
        max: { x: 0.5, y: 0.3, z: 0.5 },
      },
      ports: [
        port({
          id: "ahu-out",
          system: "air",
          medium: "supply-air",
          direction: "out",
          section: 0.05,
          position: { x: 8, y: 2.7, z: 4.5 },
        }),
      ],
    }),
    node({
      id: "fire-main",
      kind: "source",
      space: "plant",
      position: { x: 9.5, y: 2.6, z: 2 },
      ports: [
        port({
          id: "fire-main-out",
          system: "fire",
          medium: "fire-water",
          direction: "out",
          section: 0.003,
          position: { x: 9.5, y: 2.6, z: 2 },
        }),
      ],
    }),
    node({
      id: "hall-diffuser",
      kind: "terminal",
      space: "hall",
      position: { x: 5.5, y: 2.7, z: 4.5 },
      ports: [
        port({
          id: "hall-diffuser-in",
          system: "air",
          medium: "supply-air",
          direction: "in",
          demand: 0.05,
          section: 0.05,
          position: { x: 5.5, y: 2.7, z: 4.5 },
        }),
      ],
    }),
    node({
      id: "bath-valve",
      kind: "valve",
      space: "bath",
      position: { x: 3.5, y: 2.5, z: 1 },
      state: { name: "open", opening: 1 },
      ports: [
        port({
          id: "bath-valve-in",
          system: "cold",
          medium: "cold-water",
          direction: "in",
          section: 0.002,
          position: { x: 3.5, y: 2.5, z: 1 },
        }),
        port({
          id: "bath-valve-out",
          system: "cold",
          medium: "cold-water",
          direction: "out",
          section: 0.002,
          position: { x: 3.5, y: 2.5, z: 1 },
        }),
      ],
    }),
    node({
      id: "basin",
      kind: "fixture",
      space: "bath",
      position: { x: 1, y: 0.9, z: 1 },
      ports: [
        port({
          id: "basin-cold",
          system: "cold",
          medium: "cold-water",
          direction: "in",
          demand: 0.0002,
          section: 0.002,
          position: { x: 1, y: 0.9, z: 1 },
        }),
        port({
          id: "basin-hot",
          system: "hot",
          medium: "hot-water",
          direction: "in",
          demand: 0.0002,
          section: 0.002,
          position: { x: 1, y: 0.9, z: 1.4 },
        }),
        port({
          id: "basin-waste",
          system: "waste",
          medium: "waste-water",
          direction: "out",
          demand: 0.0004,
          section: 0.004,
          position: { x: 1, y: 0.6, z: 1 },
        }),
        port({
          id: "basin-vent",
          system: "vent",
          medium: "vent-air",
          direction: "out",
          position: { x: 1, y: 1.2, z: 1 },
        }),
      ],
    }),
    node({
      id: "waste-tee",
      kind: "junction",
      space: "bath",
      position: { x: 2, y: 0.1, z: 1 },
      ports: [
        port({
          id: "tee-basin",
          system: "waste",
          medium: "waste-water",
          direction: "in",
          section: 0.004,
          position: { x: 2, y: 0.1, z: 1 },
        }),
        port({
          id: "tee-gully",
          system: "waste",
          medium: "waste-water",
          direction: "in",
          section: 0.004,
          position: { x: 2, y: 0.1, z: 1 },
        }),
        port({
          id: "tee-out",
          system: "waste",
          medium: "waste-water",
          direction: "out",
          section: 0.004,
          position: { x: 2, y: 0.1, z: 1 },
        }),
      ],
    }),
    node({
      id: "floor-gully",
      kind: "fixture",
      space: "bath",
      position: { x: 2.5, y: 0.1, z: 3 },
      ports: [
        port({
          id: "gully-waste",
          system: "waste",
          medium: "waste-water",
          direction: "out",
          demand: 0.0006,
          section: 0.004,
          position: { x: 2.5, y: 0.1, z: 3 },
        }),
      ],
    }),
    node({
      id: "sprinkler-head",
      kind: "terminal",
      space: "bath",
      position: { x: 2, y: 2.6, z: 2 },
      ports: [
        port({
          id: "sprinkler-in",
          system: "fire",
          medium: "fire-water",
          direction: "in",
          demand: 0.001,
          section: 0.003,
          position: { x: 2, y: 2.6, z: 2 },
        }),
      ],
    }),
    node({
      id: "bath-light",
      kind: "terminal",
      space: "bath",
      position: { x: 2, y: 2.95, z: 3 },
      ports: [
        port({
          id: "bath-light-in",
          system: "lighting",
          medium: "electric-power",
          unit: "watt",
          direction: "in",
          demand: 60,
          position: { x: 2, y: 2.95, z: 3 },
        }),
      ],
    }),
  ];
}
