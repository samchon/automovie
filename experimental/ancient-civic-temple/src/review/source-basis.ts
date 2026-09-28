/**
 * 관찰·측정 기록이 함께 적는 source 식별자(`.agents/skills/source-authoring/compilation.md`).
 * basis는 저작 입력 bytes(src, public, docs/spaces, docs/settings, package.json, lint.config.ts)의
 * sha256 앞 16자로, 뷰어 화면과 자가검사가 같은 값을 보인다. revision은 production 경로의
 * Git에서 이 production 경로를 마지막으로 바꾼 커밋과 작업 트리 변경 여부다.
 * 커밋되지 않은 변경이 있으면 dirty이며 그 결과는 기록된 커밋의 결과가 아니다.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const productionRoot = resolve(__dirname, "../..");

export const sourceBasis = (): string => {
  const hash = createHash("sha256");
  const visit = (relative: string): void => {
    const entries = readdirSync(resolve(productionRoot, relative), { withFileTypes: true });
    for (const item of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const child = `${relative}/${item.name}`;
      if (item.isDirectory()) visit(child);
      else if (item.isFile()) hash.update(child).update(readFileSync(resolve(productionRoot, child)));
    }
  };
  for (const directory of ["src", "public", "docs/spaces", "docs/settings", "docs/materials"]) visit(directory);
  for (const file of ["package.json", "lint.config.ts"]) hash.update(file).update(readFileSync(resolve(productionRoot, file)));
  return hash.digest("hex").slice(0, 16);
};

export interface SourceRevision {
  commit: string;
  dirty: boolean;
}

/** Git을 읽을 수 없으면 null이다(값을 지어내지 않는다). */
export const sourceRevision = (): SourceRevision | null => {
  try {
    const git = (...args: string[]) => execFileSync("git", args, { cwd: productionRoot, encoding: "utf8" }).trim();
    return { commit: git("log", "-1", "--format=%H", "--", "."), dirty: git("status", "--porcelain", "--", ".").length > 0 };
  } catch {
    return null;
  }
};
