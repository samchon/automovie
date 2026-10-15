import { Room } from "./Room";
import { rooms } from "./rooms";

/** Room with the given identity; throws for an unknown room. */
export const roomById = (id: string): Room => {
  const room = rooms.find((candidate) => candidate.id === id);
  if (!room) throw new Error("Unknown room " + id);
  return room;
};
