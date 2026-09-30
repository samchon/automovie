/**
 * Render every document of a face study at its measured pose through the
 * resident viewer and write one PNG per subject and a `captures.json`. From
 * the test package, with the viewer already running (`human-shot.mts ensure`):
 *
 *   pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/capture-face-references.mts STUDY OUTPUT POSE_FILE
 *
 * STUDY holds `subjects.json` and optionally a candidate `basis.json.gz`, which
 * must keep the published basis identity (the documents name it); the study is
 * dropped into the viewer's inputs directory under a label derived from OUTPUT,
 * so a candidate renders without replacing the published basis. POSE_FILE maps
 * a subject id to a measured camera (`resolveHumanViewerPose` admits it), and a
 * subject without one is skipped. Each frame is the product face stage at the
 * pose, 900 pixels square; `OCCLUSION=off` bakes no ambient occlusion. The
 * record lists the renderer the server reported, the pose file's SHA-256, each
 * capture with its camera, and the documents the numerical builder refused,
 * and holds no image bytes. Frames stay under the given directory (use a path
 * inside `.shots`), and a software renderer refuses on the server before any
 * frame is drawn.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectHumanViewer } from "./connectHumanViewer";
import { createNodeHumanViewerClientIo } from "./createNodeHumanViewerClientIo";
import { resolveHumanViewerPose } from "./resolveHumanViewerPose";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

async function main(): Promise<void> {
  const [study, output, poseFile] = process.argv.slice(2);
  if (study === undefined || output === undefined || poseFile === undefined)
    throw new Error("Supply a study directory, an output directory and a pose file.");
  const viewer = await connectHumanViewer({
    io: createNodeHumanViewerClientIo(root),
    origin: "http://127.0.0.1:5175",
  });
  const label = "study-" + path.basename(path.resolve(output)).replace(/[^A-Za-z0-9._-]/g, "-");
  const documents = JSON.parse(
    fs.readFileSync(path.join(study, "subjects.json"), "utf8"),
  ) as { id: string }[];
  const candidate = path.join(study, "basis.json.gz");
  await viewer.drop({
    label,
    documents,
    candidateBasis: fs.existsSync(candidate) ? candidate : null,
  });
  const poseBytes = fs.readFileSync(poseFile);
  const poses = JSON.parse(poseBytes.toString("utf8"));
  const occlusion = process.env.OCCLUSION !== "off";
  fs.mkdirSync(output, { recursive: true });
  const captures: Record<string, unknown>[] = [];
  const refused: { model: string; reason: string }[] = [];
  for (const document of documents) {
    const subject = document.id.replace(/-connected$/u, "");
    if (poses[subject] === undefined) continue;
    const look = resolveHumanViewerPose(poses, subject);
    const frame = await viewer.render({
      doc: `file:${label}/${document.id}`,
      look,
      size: "900",
      ao: occlusion ? "on" : "off",
    });
    if (!frame.ok) {
      console.error(`${subject} refused: ${frame.error}`);
      refused.push({ model: subject, reason: frame.error });
      continue;
    }
    const file = `${subject}__reference-yaw.png`;
    fs.writeFileSync(path.join(output, file), frame.bytes);
    const [yaw, pitch, distance, x, y, z, fov] = look.split(",").map(Number);
    captures.push({
      model: subject,
      view: "reference-yaw",
      file,
      camera: { yaw, pitch, distance, target: [x, y, z], fov },
    });
    console.log(subject, "captured");
  }
  fs.writeFileSync(
    path.join(output, "captures.json"),
    JSON.stringify(
      {
        renderer: viewer.renderer,
        occlusion,
        poseFileSha256: createHash("sha256").update(poseBytes).digest("hex"),
        captures,
        refused,
      },
      null,
      2,
    ) + "\n",
  );
}
void main().catch((error: unknown) => {
  console.error(String(error));
  process.exitCode = 1;
});
