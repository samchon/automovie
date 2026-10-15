import { Room } from "./Room";
import { rooms } from "./rooms";

export const roomById = (id: string): Room => {
  const room = rooms.find((candidate) => candidate.id === id);
  if (!room) throw new Error("Unknown room " + id);
  return room;
};
