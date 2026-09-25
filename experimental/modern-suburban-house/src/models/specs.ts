/** Converts one owner's compact dimensional rows into named prototypes. */
import type { Size } from "./parts";
import type { PrototypeKind, PrototypeSpec } from "./templates";
import { buildHouse } from "../spaces/house";

export type PrototypeRow = readonly [string, PrototypeKind, Size, string, { bodyTop?: number; mattressTop?: number }?];
export const group = (design: string, owner: string, rows: readonly PrototypeRow[]): PrototypeSpec[] =>
  rows.map(([id,kind,size,faces,details])=>({id,design,owner,kind,size,faces:faces.split(" "),...details}));

/** Consume a reviewed spaces reservation once, in the same producer that
 * constructs the house. Axis selects the model's local width/depth orientation;
 * no room coordinate or body size is retyped into a model owner. */
const house = buildHouse();
const reservations = new Map(house.spaces.flatMap((space)=>space.reservations??[]).map((r)=>[r.id,r]));
const storages = new Map(house.storages.map(({storage})=>[storage.id,storage]));
export const fromReservation = (id:string,widthAxis:"x"|"z"="x"):Size => {
  const r=reservations.get(id);
  if(!r?.y || !Number.isFinite(r.y[1]-r.y[0])) throw Error(`model reservation missing height: ${id}`);
  const width=widthAxis==="x"?r.x[1]-r.x[0]:r.z[1]-r.z[0];
  const depth=widthAxis==="x"?r.z[1]-r.z[0]:r.x[1]-r.x[0];
  return [width,r.y[1]-r.y[0],depth];
};
export const fromStorage = (id:string):Size => {
  const storage=storages.get(id);
  if(!storage) throw Error(`model storage missing: ${id}`);
  return [storage.x[1]-storage.x[0],storage.y[1]-storage.y[0],storage.z[1]-storage.z[0]];
};
