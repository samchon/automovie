import type {
  IAutoMovieAxis,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieLoftWorldJetWorld,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftSectionNative } from "../../AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "../../AutoMovieLoftViewRead";
import { AutoMovieLoftWorldJet } from "./AutoMovieLoftWorldJet";

/**
 * Read an original positive section's world total2 without first lofting it.
 *
 * Source and axis must belong to the same immutable original part. The axis's
 * physical jet must differentiate its at map in this same station coordinate.
 * This reads no chain, fitted frame, lift, relief or Cartesian Taylor
 * extension. A finite jet is not a regularity, outward-orientation or
 * owned-domain proof. Closed-pole/source failures and absent axis2 return a
 * named string. Exceptions from the actual axis callback or its returned
 * getters keep their identity.
 */
export function AutoMovieLoftViewWorldJet(
  source: IAutoMovieLoftViewSource.ISource,
  axis: IAutoMovieAxis,
  station: number,
  phase: number,
): IAutoMovieSolidSurface.IJet | string {
  const readAxis: IAutoMovieAxis["jet"] = axis.jet;
  if (readAxis === undefined)
    return "Original view world2 requires actual axis2, not frame values alone.";
  const inputs: IAutoMovieLoftViewRead.IJets | string =
    AutoMovieLoftViewRead.jets(source, station);
  if (typeof inputs === "string") return `Original view world2: ${inputs}`;

  // Foreign code and getters remain outside the numeric admission boundary.
  const frame: unknown = readAxis.call(axis, station);
  const rows: number[][] | null = frameRows(frame);
  if (rows === null)
    return `Original view world2 has no complete finite axis2 at station ${station} mm.`;

  // Both callees below read only the freshly owned numeric arrays above.
  try {
    const local: ReturnType<(phi: number) => IAutoMovieLoftSectionJet> =
      AutoMovieLoftSectionNative.jet(inputs)(phase);
    const world: IAutoMovieLoftWorldJetWorld = AutoMovieLoftWorldJet(
      local,
      rows,
    );
    return {
      p: world.p,
      u: world.s,
      v: world.t,
      uu: world.ss,
      uv: world.st,
      vv: world.tt,
    };
  } catch (error: unknown) {
    return `Original view world2: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Copy value/first/second origin/u/v data without inventing an absent
 * component.
 */
function frameRows(value: unknown): number[][] | null {
  if (value === null || typeof value !== "object") return null;
  const jet: Record<string, unknown> = value as Record<string, unknown>;
  const rows: number[][] = [];
  for (const order of ["value", "first", "second"]) {
    const frame: unknown = jet[order];
    if (frame === null || typeof frame !== "object") return null;
    const data: Record<string, unknown> = frame as Record<string, unknown>;
    const row: number[] = [];
    for (const key of ["origin", "u", "v"]) {
      const vector: unknown = data[key];
      if (!Array.isArray(vector) || vector.length !== 3) return null;
      for (const index of [0, 1, 2]) {
        const component: unknown = vector[index];
        if (typeof component !== "number") return null;
        row.push(component);
      }
    }
    rows.push(row);
  }
  return rows;
}
