import { type IAutoMovieChannel } from "@automovie/interface";

/** Create the existing scalar-pointer channel fixture without parsing or resolving its address. */
export function createDriverPointer(pointer: string): IAutoMovieChannel {
  return { kind: "pointer", pointer, valueType: "scalar" };
}
