import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugInspectionPlan as P } from "./IHumanDebugInspectionPlan";

/** Data validation and file identity, without importing or executing Human generation. */
export namespace HumanDebugInspectionPlan {
  /** Default whole-figure directions, in protocol names rather than angle numbers. */
  export const CAMERAS: P.Camera[] = ["front", "left", "top", "back"];
  /** Distinct reference directions; three is the existing duplicate alias. */
  export const REFERENCE_CAMERAS: P.Camera[] = ["front", "back", "left", "right", "top", "bottom", "three-quarter", "three-quarter-back"];
  /** Original defining-edge suffixes. */
  export const EDGES: P.Edge[] = ["front.pos", "front.neg", "side.pos", "side.neg", "axis"];

  /** Digest exact input bytes or a normalized record; neither claims served-module freshness. */
  export function digest(value: string | Buffer): string {
    return createHash("sha256").update(value).digest("hex");
  }

  /** Read an inspection plan and reject unsupported keys so angle-unit typos cannot be ignored. */
  export async function read(file: string): Promise<P> {
    const value: P = JSON.parse(await fs.readFile(file, "utf8")) as P;
    keys(value, ["version", "id", "person", "scope", "raw", "parts", "allParts", "groups", "cameras", "referenceCameras", "final", "size"], "plan");
    if (value.version !== 1 || value.person !== "f1" || typeof value.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(value.id))
      throw new Error("version=1, person=f1 and a safe packet id of at most 40 characters are required");
    if (!Array.isArray(value.parts) || !Array.isArray(value.groups)) throw new Error("parts and groups must be arrays");
    for (const part of value.parts) {
      keys(part, ["name", "outlineCameras", "topCamera"], "part");
      name(part.name);
      if (part.outlineCameras !== undefined) {
        keys(part.outlineCameras, EDGES, "outlineCameras");
        for (const camera of Object.values(part.outlineCameras)) named(camera);
      }
      if (part.topCamera !== undefined) named(part.topCamera);
    }
    for (const group of value.groups) {
      keys(group, ["id", "parts"], "group");
      if (typeof group.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(group.id) || !Array.isArray(group.parts) || group.parts.length === 0 || new Set(group.parts).size !== group.parts.length)
        throw new Error("Each group needs a safe id and at least one actual part");
      group.parts.forEach(name);
    }
    if (new Set(value.parts.map((part: P.Part): string => part.name)).size !== value.parts.length || new Set(value.groups.map((group: P.Group): string => group.id)).size !== value.groups.length)
      throw new Error("Part names and group ids must be unique");
    for (const list of [value.cameras, value.referenceCameras]) {
      if (list === undefined) continue;
      if (!Array.isArray(list) || list.length === 0 || new Set(list).size !== list.length) throw new Error("Camera lists must be nonempty and unique");
      list.forEach(named);
    }
    if (value.size !== undefined && (!Number.isInteger(value.size) || value.size < 400 || value.size > 2000)) throw new Error("size must be 400..2000 pixels");
    if (value.final !== undefined && typeof value.final !== "boolean") throw new Error("final must be a boolean");
    if (value.allParts !== undefined && typeof value.allParts !== "boolean") throw new Error("allParts must be a boolean");
    if (value.raw !== undefined && typeof value.raw !== "boolean") throw new Error("raw must be a boolean");
    if (value.scope !== undefined) {
      if (!Array.isArray(value.scope) || value.scope.length === 0 || new Set(value.scope).size !== value.scope.length || value.scope.some((pattern: string): boolean => typeof pattern !== "string" || !/^[A-Za-z][A-Za-z0-9_.*-]*$/.test(pattern) || pattern === "tree")) throw new Error("scope needs unique named/glob canonical originals; omit it for the complete tree");
      const requested: string[] = [...value.parts.map((part: P.Part): string => part.name), ...value.groups.flatMap((group: P.Group): string[] => group.parts)];
      if (requested.some((part: string): boolean => !HumanDebugPattern.matches(part, value.scope!, ""))) throw new Error("Every explicit part/group member must be included in scope");
    }
    return value;
  }

  /** Current local inputs, not runtime-resolved parameters or a generated model. */
  export async function identity(root: string): Promise<{ input: P.Manifest["input"]; reference: P.Manifest["reference"]; controllerSha256: string }> {
    const file: string = path.join(root, "packages/playground/src/human-parameters/f1.ts");
    const nativeFile: string = path.join(root, "test/.shots/f1/reference-model.json");
    const pack: string = path.join(root, ".references/curves/f1");
    const files: string[] = await jsonFiles(pack);
    const identities: string[] = [];
    for (const item of files) identities.push(path.relative(pack, item) + "\0" + digest(await fs.readFile(item)));
    const controllers: string[] = ["IHumanDebugInspectionPlan", "HumanDebugInspectionPlan", "HumanDebugInspectionRows", "HumanDebugInspectionHttp", "HumanDebugInspectionValidate", "HumanDebugInspectionIndex", "HumanDebugInspectionRun", "HumanDebugInspection"];
    const controller: string[] = [];
    for (const item of controllers) controller.push(item + "\0" + digest(await fs.readFile(path.join(root, "packages/human/debug/capture", item + ".ts"))));
    return {
      controllerSha256: digest(controller.join("\n")),
      input: { alias: "f1", file, sha256: digest(await fs.readFile(file)), resolvedValues: null, resolvedDigest: null, diagnostic: "Runtime-resolved parameter values/digest are not exposed by the existing snapshot; this is the fixed typed input file identity." },
      reference: { nativeFile, nativeSha256: await fileDigest(nativeFile), packSha256: files.length === 0 ? null : digest(identities.join("\n")) },
    };
  }

  /** Safe source names are exact names, not arbitrary selectors or executable input. */
  function name(value: string): void {
    if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9_.-]*$/.test(value)) throw new Error("An exact source part name is required");
  }

  /** Camera names carry their declared degree convention in the existing registry. */
  function named(value: P.Camera): void {
    if (!Object.keys(HUMAN_DEBUG_CAMERAS).includes(value)) throw new Error("Unknown named camera " + String(value));
  }

  /** Unknown plan keys fail before any HTTP request, including unsupported az/el overrides. */
  function keys(value: object, allowed: readonly string[], context: string): void {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(context + " must be an object");
    const extra: string[] = Object.keys(value).filter((key: string): boolean => !allowed.includes(key));
    if (extra.length !== 0) throw new Error(context + " has unsupported keys: " + extra.join(","));
  }

  /** A missing optional reference is explicit rather than a fabricated digest. */
  async function fileDigest(file: string): Promise<string | null> {
    try { return digest(await fs.readFile(file)); }
    catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  }

  /** Conservative section-pack identity includes all JSON members, including unused regions. */
  async function jsonFiles(directory: string): Promise<string[]> {
    let entries: import("node:fs").Dirent[];
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
    const files: string[] = [];
    for (const entry of entries) {
      const file: string = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await jsonFiles(file));
      else if (entry.isFile() && entry.name.endsWith(".json")) files.push(file);
    }
    return files.sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0);
  }
}
