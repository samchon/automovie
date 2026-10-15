import { datum } from "./datum";
import { Room } from "./Room";

/** Every room of both storeys with its clear cells and lining finish. */
export const rooms: readonly Room[] = [
  {
    id: "entry",
    level: 0,
    cells: [[-2.84, 2.84, -datum.innerZ, -0.32]],
    finish: "plaster",
  },
  {
    id: "flex-workroom",
    level: 0,
    cells: [[3.02, datum.innerX, -datum.innerZ, -0.32]],
    finish: "felt",
  },
  {
    id: "common-room",
    level: 0,
    cells: [[-datum.innerX, datum.innerX, -0.14, datum.innerZ]],
    finish: "plaster",
  },
  {
    id: "powder-utility",
    level: 0,
    cells: [[-datum.innerX, -3.02, -datum.innerZ, -2.24]],
    finish: "tile",
  },
  {
    id: "storage-1f",
    level: 0,
    cells: [[-datum.innerX, -3.02, -2.06, -0.32]],
    finish: "plaster",
  },
  {
    id: "upper-corridor",
    level: 1,
    cells: [[-2.84, 0.12, -1.8, 2.4]],
    finish: "plaster",
  },
  {
    id: "primary-bedroom",
    level: 1,
    cells: [[-2.84, datum.innerX, 2.58, datum.innerZ]],
    finish: "plaster",
  },
  {
    id: "child-bedroom-1",
    level: 1,
    cells: [
      [1.76, datum.innerX, -datum.innerZ, -0.32],
      [0.3, 1.76, -1.62, -0.32],
    ],
    finish: "plaster",
  },
  {
    id: "child-bedroom-2",
    level: 1,
    cells: [[0.3, datum.innerX, -0.14, 2.4]],
    finish: "plaster",
  },
  {
    id: "upper-bathroom",
    level: 1,
    cells: [[-datum.innerX, -3.02, 1.28, datum.innerZ]],
    finish: "tile",
  },
  {
    id: "upper-storage",
    level: 1,
    cells: [[-datum.innerX, -3.02, -0.14, 1.1]],
    finish: "plaster",
  },
  {
    id: "upper-service",
    level: 1,
    cells: [
      [-datum.innerX, -1.42, -datum.innerZ, -1.98],
      [-datum.innerX, -3.02, -1.98, -0.32],
    ],
    finish: "plaster",
  },
];
