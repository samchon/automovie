import fs from "node:fs";
import path from "node:path";

import { HumanReferenceFiles } from "./HumanReferenceFiles";

/**
 * Each reference body's own rig as the reference source recorded it, read
 * by each call: every joint's bind frame from
 * `test/.shots/<alias>/body-observations.json`.
 *
 * The file lists the joints of the source's body rig under a `joints` array,
 * each with its name, its parent's name and `bindNativeAffineColumnMajor16`,
 * the joint's bind transform in the source's editor frame (centimetres) as a
 * column-major 4 x 4 matrix: the first three columns are the joint's unit
 * axes, the fourth its origin. The array is found by walking the parsed file
 * for the first array named `joints` whose entries carry that matrix, so the
 * reader follows the record's content and not its nesting. Angles between
 * joints are unchanged by the frame, which is rigid up to a uniform scale.
 */
export namespace HumanReferenceRig {
  /** One joint's bind frame. */
  export interface IJoint {
    /** The source's joint name, such as `thumb_02_l`. */
    name: string;

    /** The parent joint's name. */
    parent: string;

    /** Origin, source editor frame, cm. */
    origin: [number, number, number];

    /** Unit axes x, y, z, in the same frame. */
    axes: [number, number, number][];
  }

  /** A reference body's rig: its joints by name. */
  export type IRig = Map<string, IJoint>;

  /**
   * Whether a reference body's rig record is present in this checkout.
   *
   * @param id Reference alias.
   */
  export function exists(id: string): boolean {
    return fs.existsSync(file(id));
  }

  /**
   * The rig record's path.
   *
   * @param id Reference alias.
   */
  function file(id: string): string {
    return path.join(HumanReferenceFiles.directory(id), "body-observations.json");
  }

  /**
   * Read a rig record.
   *
   * @param id Reference alias.
   */
  export function get(id: string): IRig {
    const record: unknown = JSON.parse(fs.readFileSync(file(id), "utf8"));
    const rows: IRow[] | null = joints(record);

    if (rows === null) throw new Error(`${id}: the rig record holds no joint list with bind frames`);

    const rig: IRig = new Map();

    for (const row of rows) {
      const m: number[] = row.bindNativeAffineColumnMajor16;

      rig.set(row.name, {
        name: row.name,
        parent: row.nativeParentName,
        origin: [m[12]!, m[13]!, m[14]!],
        axes: [
          [m[0]!, m[1]!, m[2]!],
          [m[4]!, m[5]!, m[6]!],
          [m[8]!, m[9]!, m[10]!],
        ],
      });
    }
    return rig;
  }

  /**
   * The first array named `joints` whose entries carry a bind matrix, found
   * depth first.
   *
   * @param node Any parsed JSON value.
   */
  function joints(node: unknown): IRow[] | null {
    if (node === null || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found: IRow[] | null = joints(item);

        if (found !== null) return found;
      }
      return null;
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "joints" && Array.isArray(value) && value.length !== 0 && isRow(value[0])) return value as IRow[];

      const found: IRow[] | null = joints(value);

      if (found !== null) return found;
    }
    return null;
  }

  /**
   * Whether a value is a joint row with a 16-number bind matrix.
   *
   * @param value Any parsed JSON value.
   */
  function isRow(value: unknown): boolean {
    const row: Partial<IRow> = value as Partial<IRow>;

    return typeof row?.name === "string" && Array.isArray(row.bindNativeAffineColumnMajor16) && row.bindNativeAffineColumnMajor16.length === 16;
  }
}

/** One joint row of the source's rig record, as far as this reader needs. */
interface IRow {
  /** Joint name. */
  name: string;

  /** Parent joint name. */
  nativeParentName: string;

  /** Bind transform, column-major 4 x 4, cm. */
  bindNativeAffineColumnMajor16: number[];
}
