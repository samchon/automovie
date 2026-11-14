import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieHumanF1Frames, AutoMovieHumanF1Joints as J, AutoMovieHumanSegmentFrame as F } from "@automovie/human";

/**
 * The receipt of f1's segment-frame tree: every segment's parent, rule, origin (in the figure's frame and in its parent's), axes and
 * reference rotation, and the reference pose read as ISB joint-coordinate angles where ISB defines a sequence, each angle named for its
 * positive sense with the source of that sign, and the two readings that look unanatomical beside their measured causes.
 *
 * Usage, from `test/`: `pnpm conic:build` then `node .shots/esbuild/FamilyConicFrames.cjs`. It writes `frames.txt` under
 * `test/.shots/family-conic-landmarks/<time>/`. It reads only the tree's tables, never the reference.
 */
namespace FamilyConicFrames {
  /** Write the receipt. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const v = (p: readonly number[], digits: number = 2): string => "[" + p.map((x: number): string => x.toFixed(digits)).join(", ") + "]";
    const degrees = (r: number): string => ((r * 180) / Math.PI).toFixed(1);
    const segments: AutoMovieHumanF1Frames.ISegment[] = AutoMovieHumanF1Frames.segments();
    const joints: Map<string, F.IJoint> = new Map(AutoMovieHumanF1Frames.joints().map((j: F.IJoint): [string, F.IJoint] => [j.name, j]));
    const lines: string[] = ["f1 segment frames, reference pose; mm; the stored side (+Z), whose twin is the reflection in z = 0", "R = parent axes^T x child axes (rows); a joint is at zero when R is the identity", ""];

    // The angles first, so the pose reads as anatomy at a glance.
    lines.push("ISB joint-coordinate angles at the reference pose, degrees:");
    for (const angles of AutoMovieHumanF1Frames.ANGLES) {
      const r: F.M3 = joints.get(angles.segment)!.rotation;
      const read: [number, number, number] = angles.sequence === "YXY" ? F.eulerYXY(r) : F.cardanZXY(r);
      lines.push("  " + angles.joint + " (" + angles.segment + ", " + angles.sequence + "): " + angles.names.map((name: string, k: number): string => name + " " + degrees(read[k]!)).join(", "));
    }
    lines.push(
      "  signs as the published text gives them (`AutoMovieHumanF1Frames.ANGLES`): shoulder elevation is negative by ISB's definition (Wu et al. 2005 2.4.7, footnote 5);",
      "  elbow flexion and pronation positive (2005 3.4.1); ankle dorsiflexion, inversion and internal rotation positive (Wu et al. 2002 3.5);",
      "  the hip's names carry no sign in the text (2002 4.5) and the knee has no section there: both are named by the sense of a positive rotation.",
      "",
    );

    // The two readings that look unanatomical, beside the lines they are not.
    const frames: Map<string, F.IFrame> = new Map(segments.map((s: AutoMovieHumanF1Frames.ISegment): [string, F.IFrame] => [s.name, s.frame]));
    const apart = (a: F.V3, b: F.V3): string => degrees(Math.acos(Math.max(-1, Math.min(1, F.dot(F.unit(a), F.unit(b))))));
    lines.push(
      "elbow: the joint-centre lines (GH to the elbow centre, the elbow centre to the wrist centre) stand " + apart(F.sub(J.lowerarm, J.upperarm), F.sub(J.hand, J.lowerarm)) + " degrees apart;",
      "  ISB's long axes (the humerus's Y from the epicondyles' midpoint to GH, the forearm's Y from US to that midpoint) stand " + apart(frames.get("humerus")!.axes[1], frames.get("forearm")!.axes[1]) + " apart, which the flexion reads.",
      "wrist: the forearm's Z (from the plane of US, RS and the epicondyles' midpoint) and the hand's Z (across the knuckles, pinky1 to index1) stand " + apart(frames.get("forearm")!.axes[2], frames.get("hand")!.axes[2]) + " degrees apart;",
      "  they are different substitutes, and their angle about the long axis is the axial rotation the wrist reads.",
      "",
    );

    for (const s of segments) {
      const joint: F.IJoint = joints.get(s.name)!;
      lines.push(
        s.name + " (parent " + (s.parent ?? "none") + ")",
        "  rule: " + s.rule,
        "  origin " + v(s.frame.origin) + (s.parent === null ? "" : ", in the parent " + v(joint.offset)),
        "  X " + v(s.frame.axes[0], 4) + "  Y " + v(s.frame.axes[1], 4) + "  Z " + v(s.frame.axes[2], 4),
        "  R " + joint.rotation.map((row: F.V3): string => v(row, 4)).join(" "),
        "",
      );
    }
    const out: string = path.join(root, "test/.shots/family-conic-landmarks", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "frames.txt"), lines.join("\n"));
    process.stdout.write(lines.slice(0, 22).join("\n") + "\nout " + out + "\n");
  }
}
void FamilyConicFrames.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
