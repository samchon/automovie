import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanAnatomyAudit } from "../../HumanAnatomyAudit";
import { HumanPeople } from "../../HumanPeople";
import { HumanReferenceFiles } from "./HumanReferenceFiles";
import { HumanReferenceMeshSingleton } from "./HumanReferenceMeshSingleton";
import { HumanReferenceSkinSingleton } from "./HumanReferenceSkinSingleton";

/**
 * The private reference bodies f1, f2, m1 and m2: closed skins captured from
 * the reference source, read from the ignored `test/.shots` directory when the
 * checkout holds them. Each shares its person's public inputs, frame and
 * standing pose, so one observer reads a reference and the generated person
 * alike, and a reference proves an observer green on a real body.
 *
 * Every mesh and skin is built by the call that asks, in its own file
 * beside this one; this namespace is the layer's one entry to them.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanReference {
  /** A reference body as captured. */
  export interface IMesh {
    /** Reference alias. */
    id: string;

    /** Flat vertex positions, mm; the head and body welded where they meet. */
    P: Float64Array;

    /** Flat triangle vertex indices. */
    I: Uint32Array;

    /** Index of the source part of every triangle: 0 the head, 1 the body. */
    part: Uint8Array;
  }

  /** The references whose head and body both answer their person's inputs. */
  export const IDS: readonly string[] = ["f1", "f2", "m1", "m2"];

  /**
   * Directory of a reference's private files.
   *
   * @param id Reference alias.
   */
  export function directory(id: string): string {
    return HumanReferenceFiles.directory(id);
  }

  /** The references present in this checkout. */
  export function available(): string[] {
    return IDS.filter((id: string): boolean => HumanReferenceFiles.exists(id));
  }

  /**
   * A reference's welded mesh, built by this call.
   *
   * @param id Reference alias.
   */
  export function mesh(id: string): IMesh {
    return HumanReferenceMeshSingleton.get(id);
  }

  /**
   * A reference as a skin the anatomy observers read, labelled by the
   * generated person's chains and joints, built by this call.
   *
   * @param id Reference alias.
   */
  export function skin(id: string): HumanAnatomy.ISkin {
    return HumanReferenceSkinSingleton.get(id);
  }

  /**
   * A reference as an anatomy subject: its own skin against its person's
   * inputs, with no mouth, construction or straightened pose to read.
   *
   * @param id Reference alias.
   */
  export function subject(id: string): HumanAnatomyAudit.ISubject {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);

    // The labelled skin is made on first read and kept on this subject alone.
    let own: HumanAnatomy.ISkin | undefined;
    return {
      name: `${id} reference`,
      params,
      bind: (): HumanAnatomy.ISkin => (own ??= skin(id)),
      neutral: (): HumanAnatomy.ISkin => (own ??= skin(id)),
      mouth: false,
      construction: false,
      straightened: false,
    };
  }
}
