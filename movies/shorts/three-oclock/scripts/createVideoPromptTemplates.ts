import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

/**
 * Serialize the five authored English requests without submitting any job.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reads the exact planned-text sections as the single creative text owners and creates tracked nonsecret payload templates. Placeholder URLs and missing clip identities stay explicitly pending; no network, upload, secret or provider call occurs. A later exact clip receipt is required before these become executable requests.
 * @evidence contracts/common.md#authoring-interface Run from the production root with ttsx. Each symbolic Markdown record must contain exactly one planned text section followed by its source mapping. Retains text digests and causal global/local frame plans at24fps; a planned frame range is not an observed export. Re-running intentionally replaces only the derived template JSON.
 */
export async function createVideoPromptTemplates(): Promise<void> {
  const plans: { name: string; start: number; end: number }[] = [
    { name: "empty-bench-rehearsal", start: 0, end: 13 },
    { name: "overheard-invitation", start: 13, end: 25 },
    { name: "withdrawn-note", start: 25, end: 36 },
    { name: "mirrored-reach", start: 36, end: 48 },
    { name: "three-oclock-handoff", start: 48, end: 60 },
  ];
  const requests: object[] = [];
  for (const plan of plans) {
    const record: string = `docs/prompts/videos/${plan.name}.md`;
    const source: string = await readFile(record, "utf8");
    const sections: RegExpMatchArray[] = [...source.matchAll(/## Exact planned text\r?\n\r?\n([\s\S]*?)\r?\n\r?\n## Source and field mapping/g)];
    if (sections.length !== 1) throw new Error(`Expected one exact prompt section in ${record}`);
    const text: string = sections[0]![1]!;
    requests.push({
      record, status: "planned-unsubmitted", sourceClip: { path: `output/segments/${plan.name}.mp4`, status: "not-yet-encoded-or-probed", sha256: null, bytes: null },
      plannedTime: { globalStartSeconds: plan.start, globalEndSeconds: plan.end, localStartSeconds: 0, localEndSeconds: plan.end - plan.start, fps: 24, firstFrameInclusive: plan.start * 24, lastFrameExclusive: plan.end * 24 },
      textSha256: createHash("sha256").update(text).digest("hex"),
      payloadTemplate: { model: "dreamina-seedance-2-5-260628", content: [
        { type: "text", text },
        { type: "video_url", video_url: { url: "{{SOURCE_CLIP_PUBLIC_URL}}" }, role: "reference_video" },
      ], generate_audio: false, ratio: "9:16", duration: plan.end - plan.start, omni_reference_task_type: "reference", watermark: true },
      unresolved: ["Actual accepted source clip and format/digest receipt", "Authorized provider-readable source URL", "Account/model access and request admission", "Observed generated output compatibility; no job submitted"],
    });
  }
  await writeFile("docs/prompts/videos/three-oclock-request-templates.json", JSON.stringify({ status: "planned-unsubmitted", boundary: "No paid call, uploaded asset, actual job or generated result. Local file paths are not provider URLs.", requests }, null, 2) + "\n");
  console.log("Wrote five planned request templates; all actual source clip receipts remain pending.");
}

void createVideoPromptTemplates();
