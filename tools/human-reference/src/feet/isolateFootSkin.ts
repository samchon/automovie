import { GROUPS } from "../geometry/GROUPS.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * Isolates one separated neutral reference foot and its lower-calf neighborhood.
 * The source uses the published subject-left world frame; its foot rig anchor must
 * lie in its own x half-space. Flesh crossing the midplane is outside this protocol.
 * The upper cutoff bounds observation work and is not a skin cap.
 * Every used source vertex keeps its original coordinates; seam labels are remapped
 * independently so a connectivity weld cannot move the measured surface.
 *
 * @evidence contracts/common.md#principled-implementation A hemisphere and explicit upper observation bound isolate neutral separated feet; original vertex coordinates and canonical seam connectivity are preserved independently.
 * @evidence contracts/common.md#clear-and-simple-design One regional operation compacts source arrays consistently for subsequent plane intersections, retaining the existing shared bone definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference identity, vertex catalogue or fitted anatomy is embedded; a nonpositive rig anchor is rejected and flesh crossing the midplane remains an explicit protocol limit.
 * @evidence contracts/common.md#meaningful-documentation Documents world-frame and neutral-separation premises, the non-geometric crop, unchanged coordinates and remapped connectivity.
 * @evidence contracts/performance.md#efficient-algorithms One triangle scan and linear remapping take O(t plus v times g) time and O(t plus v times g) retained space for selected t triangles, v vertices and fixed g diagnostic groups.
 * @evidence contracts/performance.md#reuse-equivalent-work Selected original and canonical vertex IDs are mapped once for all subsequent cuts; the bones and original coordinate tuples are shared read-only with the input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and compact arrays are invocation-local; no process, file, handle or cross-call cache is acquired, and shared input tuples must remain immutable while the returned skin is consumed.
 */
export function isolateFootSkin(
  skin: Skin,
  side: "l" | "r",
  upperY: number,
): Skin {
  const sign: number = side === "l" ? 1 : -1;
  const ankle: V3 | undefined = skin.bones.get(`foot_${side}`)?.pos;
  if (
    !ankle ||
    sign * ankle[0] <= 0 ||
    !Number.isFinite(upperY) ||
    upperY <= ankle[1]
  )
    throw new Error(
      "Separated neutral foot and finite proximal observation bound required",
    );
  const triangles: [number, number, number][] = skin.triangles.filter(
    (triangle: [number, number, number]): boolean =>
      triangle.every(
        (i: number): boolean =>
          sign * skin.vertices[i][0] > 0 && skin.vertices[i][1] < upperY,
      ),
  );
  const selected: Set<number> = new Set(triangles.flat());
  for (const i of [...selected]) selected.add(skin.canon[i]);
  const ids: number[] = [...selected];
  const local: Map<number, number> = new Map(
    ids.map((id: number, index: number): [number, number] => [id, index]),
  );
  const weights: Float32Array = new Float32Array(ids.length * GROUPS.length);
  for (let i: number = 0; i < ids.length; i++)
    for (let group: number = 0; group < GROUPS.length; group++)
      weights[i * GROUPS.length + group] =
        skin.gw[ids[i] * GROUPS.length + group];
  return {
    ...skin,
    vertices: ids.map((i: number): V3 => skin.vertices[i]),
    triangles: triangles.map(
      (triangle: [number, number, number]): [number, number, number] =>
        triangle.map((i: number): number => local.get(i)!) as [
          number,
          number,
          number,
        ],
    ),
    canon: Int32Array.from(
      ids.map((i: number): number => local.get(skin.canon[i])!),
    ),
    part: Uint8Array.from(ids.map((i: number): number => skin.part[i])),
    gw: weights,
  };
}
