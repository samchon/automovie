import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A body's left surface is the mirror image of its right: every left region
 * and socket, and the spleen against the liver, is its right twin's
 * bone-local frame with the lateral component of its point, normal and
 * forward negated, on the other side's bone, to the bit. The rig rests in
 * its own mirror image, so any difference is rounding a left act would read
 * and its right twin would not.
 *
 * Scenarios, on every body of the sweep:
 * 1. Each left region's bone is its right twin's on the other side, and its
 *    point, normal and radius are the twin's mirrored, compared with `===`.
 * 2. The same for each left socket, its forward with them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the surfaces every motion law aims with, as the body is built; a side placed by its own rays fails with the frame and the component that differ.
 * @evidence contracts/development/testing.md#independent-expectations The mirror is written here as a sign flip of the lateral component, the median-plane reflection of a bone-local vector; nothing is read from the builder's own mirror.
 * @evidence contracts/development/testing.md#distinguishing-cases Every paired region, the liver and spleen pair on a median bone, and every paired socket, on the fourteen bodies of the sweep.
 * @evidence contracts/development/testing.md#execution-ownership Prepares the sweep's polygon men and compares records in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the claim, why it must hold to the bit and the 2 scenarios.
 */
export function test_human_motion_core_surfaces_mirror(): void {
  const complaints: string[] = [];
  const opposite = (bone: string): string =>
    bone.startsWith("left")
      ? `right${bone.slice(4)}`
      : bone.startsWith("right")
        ? `left${bone.slice(5)}`
        : bone;
  const compare = (
    label: string,
    a: Record<string, unknown>,
    b: Record<string, unknown>,
  ): void => {
    if (a.bone !== opposite(b.bone as string))
      complaints.push(
        `${label}: rides ${String(a.bone)}, its twin ${String(b.bone)}`,
      );
    for (const key of ["point", "normal", "forward"] as const) {
      const p = a[key] as IAutoMovieVector3 | undefined;
      const q = b[key] as IAutoMovieVector3 | undefined;
      if (p === undefined && q === undefined) continue;
      if (p === undefined || q === undefined) {
        complaints.push(`${label}: ${key} on one side only`);
        continue;
      }
      if (!(p.x === -q.x && p.y === q.y && p.z === q.z))
        complaints.push(
          `${label}: ${key} (${p.x}, ${p.y}, ${p.z}) against the twin's mirror (${-q.x}, ${q.y}, ${q.z})`,
        );
    }
    if (a.radius !== b.radius)
      complaints.push(
        `${label}: radius ${String(a.radius)} against ${String(b.radius)}`,
      );
  };
  for (const name of motionHumanBody.SWEEP) {
    const { regions, sockets } = motionHumanBody(name).surfaces;
    const regionMap = regions as unknown as Record<
      string,
      Record<string, unknown>
    >;
    for (const region of Object.keys(regionMap)) {
      const twin: string | undefined =
        region === "spleen"
          ? "liver"
          : region.endsWith("Left")
            ? region.replace(/Left$/, "Right")
            : undefined;
      if (twin !== undefined)
        compare(`${name} ${region}`, regionMap[region]!, regionMap[twin]!);
    }
    const socketMap = sockets as unknown as Record<
      string,
      Record<string, unknown>
    >;
    for (const socket of Object.keys(socketMap))
      if (socket.endsWith("Left"))
        compare(
          `${name} socket ${socket}`,
          socketMap[socket]!,
          socketMap[socket.replace(/Left$/, "Right")]!,
        );
  }
  TestValidator.equals(
    "a body's left surface is the mirror of its right",
    complaints.slice(0, 20),
    [],
  );
}
