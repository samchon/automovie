import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieLoftWorldJet } from "./AutoMovieLoftWorldJet";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** The original view's actual frame owner, in physical station millimetres. */
type Axis = IAutoMovieViewPart["axis"];

/**
 * Read an original positive section's world total2 without first lofting it.
 *
 * Source and axis must belong to the same immutable original part. The axis's
 * physical jet must differentiate its at map in this same station coordinate.
 * This reads no chain, fitted frame, lift, relief or Cartesian Taylor extension.
 * A finite jet is not a regularity, outward-orientation or owned-domain proof.
 * Closed-pole/source failures and absent axis2 return a named string. Exceptions
 * from the actual axis callback or its returned getters keep their identity.
 *
 * @evidence contracts/common.md#principled-implementation Reads actual scalar station2 and axis2, then delegates P=o+xU+zW and all six derivatives to the identical product-rule owner used by LoftJet.
 * @evidence contracts/common.md#clear-and-simple-design Original source preparation remains caller-owned; this one query performs admission, frame layout adaptation and shared world lifting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never creates a fake chain, samples a replacement axis, fills missing derivatives or changes the original source/clock. Only pure numeric preparation/lifting failures become strings; foreign axis exceptions stay outside that catch.
 * @evidence contracts/common.md#meaningful-documentation States source/axis coherence, mm/radian coordinates, unavailable capabilities, exception effects and the absence of skin/domain/orientation certification.
 * @evidence contracts/performance.md#efficient-algorithms One original scalar2 reading, one actual axis2 call, fixed 27-component copying and one native station/phase preparation; source knot searches, axis cost and the bounded numeric inverse remain their owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller reuses its admitted scalar source; one axis reading and one local native reading supply the complete world jet through the existing arithmetic owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh frame rows and result vectors belong to this call; its temporary native closure dies on return and no source, station, callback or global cache is retained.
 */
export function AutoMovieLoftViewWorldJet(
  source: AutoMovieLoftViewSource.ISource,
  axis: Axis,
  station: number,
  phase: number,
): IAutoMovieSolidSurface.IJet | string {
  if (!Number.isFinite(station) || !Number.isFinite(phase))
    return "Original view world2 requires a finite station and phase.";
  if (axis === null || typeof axis !== "object")
    return "Original view world2 has no actual axis owner.";
  const readAxis: Axis["jet"] = axis.jet;
  if (typeof readAxis !== "function")
    return "Original view world2 requires actual axis2, not frame values alone.";
  const inputs: AutoMovieLoftViewRead.IJets | string =
    AutoMovieLoftViewRead.jets(source, station);
  if (typeof inputs === "string") return `Original view world2: ${inputs}`;

  // Foreign code and getters remain outside the numeric admission boundary.
  const frame: unknown = readAxis.call(axis, station);
  const rows: number[][] | null = frameRows(frame);
  if (rows === null)
    return `Original view world2 has no complete finite axis2 at station ${station} mm.`;

  // Both callees below read only the freshly owned numeric arrays above.
  try {
    const local: ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>> =
      AutoMovieLoftSectionNative.jet(inputs)(phase);
    const world: ReturnType<typeof AutoMovieLoftWorldJet> =
      AutoMovieLoftWorldJet(local, rows);
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

/** Copy value/first/second origin/u/v data without inventing an absent component. */
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
        if (typeof component !== "number" || !Number.isFinite(component))
          return null;
        row.push(component);
      }
    }
    rows.push(row);
  }
  return rows;
}
