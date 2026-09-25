/**
 * Read the authored model population and the one scale-owned texture contract.
 * This checks every prototype/part address against one binding row, a physical
 * repeat, a UV rule, and a fallback. It does not require bitmap files.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { modelSections } from "./model-tessellation-census.mjs";

const root = new URL("../../docs/models/", import.meta.url);
const methods = new Set(["평면", "회전", "장축", "관", "잎"]);

/** @param {string} source @param {string} heading */
const tableRows = (source, heading) => {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => line === heading);
  if (start < 0 || !lines[start + 1]?.startsWith("| ---")) return [];
  /** @type {string[][]} */
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith("|")) break;
    rows.push(line.split("|").slice(1, -1).map((cell) => cell.trim()));
  }
  return rows;
};

/**
 * @param {readonly { path:string;source:string }[]} documents
 * @param {string} scaleSource
 */
export const modelSurfaceBindingCensus = (documents, scaleSource) => {
  /** @type {string[]} */
  const failures = [];
  const groups = new Map();
  for (const cells of tableRows(
    scaleSource,
    "| 결속 키 | 반복 길이 U·V (m) | 비트맵 부재 시 단색 fallback |",
  )) {
    const key = cells[0]?.match(/^`([^`]+)`$/)?.[1];
    const repeat = cells[1]?.match(/^(\d+(?:\.\d+)?)·(\d+(?:\.\d+)?)$/);
    const fallback = cells[2]?.match(/^`(#[0-9a-fA-F]{6})`$/)?.[1];
    if (!key || !repeat || !fallback || Number(repeat[1]) <= 0 || Number(repeat[2]) <= 0 || groups.has(key))
      failures.push(`invalid or duplicate texture group: ${cells.join(" | ")}`);
    else groups.set(key, {
      u: Number(repeat[1]),
      v: Number(repeat[2]),
      fallback,
    });
  }
  if (groups.size === 0) failures.push("no texture binding groups");

  const bindings = new Map();
  let bindingRows = 0;
  for (const cells of tableRows(
    scaleSource,
    "| 모델 H2 | part 표면 | 결속 키 | UV0 방식 |",
  )) {
    bindingRows++;
    const ids = [...(cells[0] ?? "").matchAll(/`([^`]+)`/g)].map(
      (match) => match[1],
    );
    const parts = [...(cells[1] ?? "").matchAll(/`([^`]+)`/g)].map(
      (match) => match[1],
    );
    const key = cells[2]?.match(/^`([^`]+)`$/)?.[1];
    const uv = (cells[3] ?? "").split("·");
    if (ids.length === 0 || parts.length === 0 || !groups.has(key) || uv.some((method) => !methods.has(method)))
      failures.push(`invalid surface binding row: ${cells.join(" | ")}`);
    for (const id of ids) for (const part of parts) {
      const address = `${id}|${part}`;
      if (bindings.has(address)) failures.push(`duplicate surface binding ${address}`);
      else bindings.set(address, { key, uv });
    }
  }
  if (bindingRows === 0) failures.push("no surface binding rows");

  const expected = new Set();
  let prototypes = 0;
  for (const { path, source } of documents) {
    if (path === "scale.md") continue;
    for (const section of modelSections(source)) {
      prototypes++;
      const id = `${path.replace(/\.md$/, "")}#${section.id}`;
      const declaration = section.body.match(/part와 표면은([^\n]*)/)?.[1]?.split(
        "다.",
      )[0];
      const parts = [...(declaration ?? "").matchAll(/`([^`]+)`/g)].map(
        (match) => match[1],
      );
      if (parts.length === 0) failures.push(`${id}: no part declaration`);
      for (const part of new Set(parts)) {
        const address = `${id}|${part}`;
        expected.add(address);
        if (!bindings.has(address)) failures.push(`${address}: no surface/scale/UV/fallback binding`);
      }
    }
  }
  if (prototypes === 0) failures.push("no model prototypes");
  for (const address of bindings.keys()) if (!expected.has(
    address,
  )) failures.push(`${address}: binding has no model part`);
  return {
    prototypes,
    parts: expected.size,
    groups: groups.size,
    bindingRows,
    failures,
  };
};

export const checkModelSurfaceBinding = () => {
  const files = readdirSync(root).filter((file) => file.endsWith(".md")).sort(
    (a, b) => a.localeCompare(b),
  );
  const documents = files.map((path) => ({
    path,
    source: readFileSync(new URL(path, root), "utf8"),
  }));
  const scale = documents.find((document) => document.path === "scale.md")?.source ?? "";
  const result = modelSurfaceBindingCensus(documents, scale);
  console.log(
    `model surface binding: ${result.prototypes} prototypes, ${result.parts} parts, ${result.groups} texture groups, ${result.bindingRows} binding rows, ${result.failures.length} failures`,
  );
  for (const failure of result.failures) console.error(failure);
  return result;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  process.exitCode = checkModelSurfaceBinding().failures.length ? 1 : 0;
