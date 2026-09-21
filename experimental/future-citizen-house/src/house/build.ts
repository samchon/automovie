import { auditHouse } from "./audit";
import { Assembly, initialState, type State } from "./assembly";
import { structure } from "../spaces/structure";
import { envelope } from "../spaces/envelope";
import { garden } from "./site/garden";
import { entry } from "./rooms/entry";
import { flex } from "./rooms/flex";
import { common } from "./rooms/common";
import { powder } from "./rooms/powder";
import { storageGround } from "./rooms/storage-ground";
import { primary } from "./rooms/primary";
import { childOne } from "./rooms/child-one";
import { childTwo } from "./rooms/child-two";
import { corridor } from "./rooms/corridor";
import { bathroom } from "./rooms/bathroom";
import { storageUpper } from "./rooms/storage-upper";
import { serviceUpper } from "./rooms/service-upper";
export function buildHouse(state: State = initialState) {
  const a = new Assembly(state);
  structure(a); envelope(a); garden(a);
  entry(a); flex(a); common(a); powder(a); storageGround(a);
  primary(a); childOne(a); childTwo(a); corridor(a); bathroom(a); storageUpper(a); serviceUpper(a);
  a.environment.walkable = a.environment.surfaces.map((s) => s.surface.id);
  const result = auditHouse(a.environment);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  return a.environment;
}
