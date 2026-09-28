/** Whole scene census used by the #1952 before/after regression gate. */
import { createHash } from "node:crypto";
import { buildHouse } from "../spaces/house";
import { buildHouseEnvironment } from "../spaces/environment";
import { deriveHouseObservations } from "../spaces/observations";

const r6 = (value: number): number => Number(value.toFixed(6));
const rounded = (_key: string, value: unknown): unknown => typeof value === "number" ? r6(value) : value;

export const sceneSnapshot = () => {
  const house = buildHouse();
  const environment = buildHouseEnvironment(house);
  const parts: Record<string, unknown> = {};
  for (const part of house.parts) {
    const positions = part.mesh.positions;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3)
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis]!, positions[i + axis]!);
        max[axis] = Math.max(max[axis]!, positions[i + axis]!);
      }
    parts[part.id] = {
      owner: part.owner,
      b: [...min, ...max].map(r6),
      n: positions.length,
      h: createHash("sha1").update(positions.map((value) => value.toFixed(6)).join(",")).digest("hex").slice(0, 12),
      holes: part.wall ? JSON.stringify(part.wall.holes ?? [], rounded) : undefined,
    };
  }
  const rooms: Record<string, unknown> = {};
  for (const room of house.spaces) {
    rooms[room.id] = { outline: JSON.stringify(room.outline), levels: room.levels ? JSON.stringify(room.levels) : undefined };
    for (const reservation of room.reservations ?? [])
      rooms[`res:${reservation.id}`] = JSON.stringify([reservation.x, reservation.z, reservation.y ?? null, reservation.space ?? null]);
  }
  for (const { storage } of house.storages)
    rooms[`storage:${storage.id}`] = JSON.stringify([storage.x, storage.y, storage.z]);
  for (const zone of house.zones) rooms[`zone:${zone.id}`] = JSON.stringify(zone, rounded);
  const env: Record<string, unknown> = {};
  for (const space of environment.spaces)
    env[`space:${space.id}`] = JSON.stringify(space.cells ?? null, rounded);
  for (const opening of environment.openings)
    env[`opening:${opening.id}`] = JSON.stringify(opening, rounded);
  for (const connector of environment.connectors)
    env[`connector:${connector.id}`] = JSON.stringify(connector, rounded);
  for (const boundary of environment.boundaries)
    env[`boundary:${boundary.id}`] = JSON.stringify(boundary, rounded);
  return {
    threw: null,
    parts,
    rooms,
    env,
    elements: environment.elements.length,
    elementRecords: Object.fromEntries(environment.elements.map((element) => [element.id, element])),
    obsJson: deriveHouseObservations(environment, house),
  };
};
