import fs from "node:fs";
import path from "node:path";

/**
 * Where the private reference bodies live and how one body's model file is
 * read. Every body is one directory under the ignored `test/.shots`, holding a
 * `reference-model.json` whose parts carry positions in metres and triangle
 * indices; the repository holds none of them, so a checkout without them reads
 * every body as absent.
 *
 * Nothing here caches: each reader of a model keeps what it derives in its own
 * `Singleton`, so a model's large number arrays are released once read.
 */
export namespace HumanReferenceFiles {
  /** One part of a model as far as the geometry: the head, then the body. */
  export interface IPart {
    /** The source's part name. */
    name: string;

    /** The part's mesh: flat positions in metres and flat triangle indices. */
    geometry: { mesh: { positions: number[]; indices: number[] } };
  }

  /** A reference body's model file as far as the meshes. */
  export interface IModel {
    /** The parts in file order, which every body shares. */
    parts: IPart[];
  }

  /** The repository root. */
  export const ROOT: string = path.resolve(__dirname, "../../../../../..");

  /** The ignored directory holding every reference body. */
  export const SHOTS: string = path.join(ROOT, "test/.shots");

  /**
   * Directory of a reference body's private files.
   *
   * @param id Reference alias.
   */
  export function directory(id: string): string {
    return path.join(SHOTS, id);
  }

  /**
   * Whether a reference body's model file is present in this checkout.
   *
   * @param id Reference alias.
   */
  export function exists(id: string): boolean {
    return fs.existsSync(path.join(directory(id), "reference-model.json"));
  }

  /**
   * A reference body's model file, parsed.
   *
   * @param id Reference alias.
   * @throws Error when the file is missing or is not JSON.
   */
  export function model(id: string): IModel {
    return JSON.parse(fs.readFileSync(path.join(directory(id), "reference-model.json"), "utf8")) as IModel;
  }

  /**
   * A reference body's raw positions in millimetres, its parts concatenated in
   * file order: the population's shared vertex order, before any weld.
   *
   * @param id Reference alias.
   */
  export function positions(id: string): Float64Array {
    const parts: IPart[] = model(id).parts;
    const length: number = parts.reduce((s: number, p: IPart): number => s + p.geometry.mesh.positions.length, 0);
    const out: Float64Array = new Float64Array(length);
    let at: number = 0;

    // The source stores metres; every observer reads millimetres.
    for (const part of parts) for (const c of part.geometry.mesh.positions) out[at++] = c * 1000;
    return out;
  }
}
