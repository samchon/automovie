import type { IAutoMovieModelPart } from "@automovie/interface";
import { createHash } from "node:crypto";

import type { IAutoMovieHumanGenerated } from "../../../src/structures/IAutoMovieHumanGenerated";

/**
 * Ordinary Human publication byte and canonical parsed-model commitments.
 * This wire representation preserves Float32 viewer attributes, rather than
 * claiming byte equality with the generated model's original double values.
 * Mannequin's actual posed-snapshot commitments use their separate owner.
 * Static members remain executable in the worker's native type-stripping host.
 */
export class HumanImagePublication {
  /** Wire precision contract, shared by the producer and byte reader. */
  public static readonly ENCODING: string = "human-mesh-float32-json-v1";

  /** Model and construction hashes consume JSON.stringify of parsed wire data. */
  public static readonly CANONICAL: string = "json-stringify-parsed-model-v1";

  /** Existing maximum admitted publication, 256 MiB. */
  public static readonly MAX_BYTES: number = 268435456;

  /**
   * Commit actual wire bytes and the same parsed projections readers receive.
   * The page owns parameter/model admission. This operation does not substitute
   * generated geometry or an original-double digest for the parsed wire model.
   * Checks the unchanged cap before Buffer allocation. One parse and two
   * sequential canonical encodings cost O(B); only bytes and digests escape.
   */
  public static commit(json: string): HumanImagePublication.ICommitted {
    const length: number = Buffer.byteLength(json, "utf8");
    if (length < 1 || length > HumanImagePublication.MAX_BYTES)
      throw new Error("Human publication exceeds its 256 MiB byte budget");
    const parsed: IAutoMovieHumanGenerated = JSON.parse(json) as IAutoMovieHumanGenerated;
    const bytes: Buffer = Buffer.from(json, "utf8");
    return {
      bytes,
      sha256: digest(bytes),
      modelSha256: digest(JSON.stringify(parsed.model)),
      constructionSha256: digest(JSON.stringify(parsed.model.parts.filter((part: IAutoMovieModelPart): boolean => part.id.startsWith("human.construction.")))),
    };
  }
}

/** Erased type members preserve the publication API in the native Node host. */
export namespace HumanImagePublication {
  /** Owned byte publication and its distinct byte/model/construction domains. */
  export interface ICommitted {
    /** Exact UTF-8 wire bytes, owned by the worker until handoff completes. */
    bytes: Buffer;

    /** Digest of the complete exact publication bytes. */
    sha256: string;

    /** Canonical parsed wire model, excluding top-level input parameters. */
    modelSha256: string;

    /** Canonical parsed wire construction parts, retaining their model order. */
    constructionSha256: string;
  }
}

/** Hash an explicitly selected canonical text or exact byte domain. */
function digest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
