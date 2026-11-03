import fs from "node:fs";

import type { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceBodySingleton } from "../bodies/HumanReferenceBodySingleton";
import { HumanReferenceFiles } from "../bodies/HumanReferenceFiles";

/**
 * The population of private reference bodies whose spread bounds what real
 * bodies do. All of them share one vertex order, so a vertex index names the
 * same point of anatomy on every body. Each body is read by each call of
 * `HumanReferenceBodySingleton`, which the layer comparison shares.
 */
export namespace HumanReferenceSurfacePopulation {
  /** One population body, as read. */
  export type IBody = HumanReferenceBodySingleton.IBody;

  /** Every population body. */
  export interface IPopulation {
    /** The bodies, in alias order. */
    bodies: IBody[];
  }

  /** References outside every population: `c0` repeats f1's body; `e3` and `e6` are held out. */
  export const EXCLUDED: readonly string[] = ["c0", "e3", "e6"];

  /** Fewest bodies a population spread may stand on. */
  export const MINIMUM: number = 20;

  /** Every reference body in the population, present in this checkout, in alias order. */
  export function population(): string[] {
    if (!fs.existsSync(HumanReferenceFiles.SHOTS)) return [];
    return fs
      .readdirSync(HumanReferenceFiles.SHOTS)
      .filter((id: string): boolean => !EXCLUDED.includes(id) && HumanReferenceFiles.exists(id))
      .sort((a: string, b: string): number => a.localeCompare(b));
  }

  /**
   * Every population body, refusing a population too small to give a spread
   * and a body that does not share the vertex order's size.
   *
   * @throws Error when fewer than {@link MINIMUM} bodies are present or a body's vertex count differs.
   */
  export function load(): IPopulation {
    const ids: string[] = population();

    if (ids.length < MINIMUM)
      throw new Error(`the reference population holds ${ids.length} bodies, fewer than ${MINIMUM}; the surface limits have no basis`);

    const bodies: IBody[] = ids.map((id: string): IBody => HumanReferenceBodySingleton.get(id));

    for (const b of bodies)
      if (b.P.length !== bodies[0]!.P.length)
        throw new Error(`${b.id} holds ${b.P.length / 3} reference vertices, not the shared ${bodies[0]!.P.length / 3}`);
    return { bodies };
  }

  /**
   * Whether every triangle around a welded vertex belongs to the head part.
   * A vertex shared with the body, such as the neck seam, reads the body.
   *
   * @param mesh The welded reference mesh.
   * @returns 1 for a head-only vertex and 0 for any other, per vertex.
   */
  export function headOnly(mesh: HumanReference.IMesh): Uint8Array {
    const n: number = mesh.P.length / 3;
    const head: Uint8Array = new Uint8Array(n);
    const body: Uint8Array = new Uint8Array(n);

    for (let t: number = 0; t < mesh.part.length; t++)
      for (let k: number = 0; k < 3; k++) (mesh.part[t] === 0 ? head : body)[mesh.I[3 * t + k]!] = 1;
    for (let v: number = 0; v < n; v++) if (body[v] === 1) head[v] = 0;
    return head;
  }
}
