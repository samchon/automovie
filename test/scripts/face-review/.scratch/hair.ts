import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHumanFaceBasisBuilder } from "@automovie/human";
const basis = JSON.parse(gunzipSync(fs.readFileSync("studies/human-face/connected-basis/global-face/basis.json.gz")).toString("utf8"));
const before = JSON.parse(fs.readFileSync("studies/human-face/connected-basis/global-face/subjects.json", "utf8")).find((d: any) => d.id === "alan-rickman-connected");
const after = JSON.parse(fs.readFileSync("C:/Users/samch/AppData/Local/Temp/claude/D--github-samchon-automovie-face/1abb4cbb-2d9f-4f68-9d5e-6b6a34ee5e15/scratchpad/fit1-subjects.json", "utf8")).find((d: any) => d.id === "alan-rickman-connected");
const build = createHumanFaceBasisBuilder(basis);
for (const f of [1, 1.5, 2]) {
  const shape: Record<string, number> = {};
  for (const k of new Set([...Object.keys(before.shape), ...Object.keys(after.shape)])) shape[k] = (before.shape[k] ?? 0) + f * ((after.shape[k] ?? 0) - (before.shape[k] ?? 0));
  try { build({ ...after, shape }); console.log(f, "ok"); } catch (e) { console.log(f, (e as Error).message); fs.writeFileSync("C:/Users/samch/AppData/Local/Temp/claude/D--github-samchon-automovie-face/1abb4cbb-2d9f-4f68-9d5e-6b6a34ee5e15/scratchpad/alan-fail.json", JSON.stringify({ ...after, shape })); break; }
}
const diff = Object.entries(after.shape as Record<string, number>).map(([k, v]) => [k, v - (before.shape[k] ?? 0)] as const).filter(([, d]) => Math.abs(d) > 0.2).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
console.log(diff.slice(0, 20));
