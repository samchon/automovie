import type { FinishRole } from "../parts";

/** Shared face semantics for measured furniture variants. */
export const woodenChairFinishes = {
  seat:"furniture-wood",leg:"furniture-wood",back:"furniture-wood",
} as const satisfies Readonly<Record<string,FinishRole>>;
export const woodenStoolFinishes = {
  seat:"furniture-wood",leg:"furniture-wood",footrest:"furniture-wood",
} as const satisfies Readonly<Record<string,FinishRole>>;
export const upholsteredSeatFinishes = {
  base:"upholstery","seat-cushion":"upholstery",back:"upholstery",arm:"upholstery",
} as const satisfies Readonly<Record<string,FinishRole>>;

export const finishFaces = (role:FinishRole,...faces:string[]):Readonly<Record<string,FinishRole>> =>
  Object.fromEntries(faces.map((face)=>[face,role]));
