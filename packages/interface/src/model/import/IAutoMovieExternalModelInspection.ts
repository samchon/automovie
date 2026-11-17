import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieExternalMotionInspection } from "../../motion/import/IAutoMovieExternalMotionInspection";

import type { AutoMovieExternalModelIngestProfile } from "./AutoMovieExternalModelIngestProfile";
import type { IAutoMovieExternalModelResource } from "./IAutoMovieExternalModelResource";

/**
 * Byte-level facts the external-model builder accepts before materializing a source.
 *
 * `inspectAutoMovieExternalModelBytes` synchronously admits resident bytes against the selected profile and allocates this mutable result without retaining container or sidecar storage. Current repository callers exercise it through inspection and adoption tests. A host still needs its own loader to construct a render mesh; these facts do not certify complete glTF validity or image decoding.
 *
 * @evidence contracts/development/design.md#principled-representation The record reports only facts read from the declared JSON and checked against resident bytes: counts of the top-level arrays, the extension union, sidecar URIs, profile-proved humanoid slots with weight usage, and motion takes when the motion profile ran.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One inspection result serves every profile, with humanoidBones empty and motion absent where a profile does not compute them; adoption and inspection tests read this common report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `format` is a family label: a `.vrm` suffix or declared VRM extension produces `vrm`, while `vrm-humanoid-v1` separately checks VRM metadata; the label alone certifies no rig.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state why inspection is synchronous, that hosts still load the render mesh themselves, how `format` is decided, the order of `extensions` and `resources`, how each profile fills `humanoidBones`, and when `motion` is present.
 */
export interface IAutoMovieExternalModelInspection {
  /** Profile the caller selected and the inspection enforced. */
  profile: AutoMovieExternalModelIngestProfile;

  /** Container family: `vrm` for a `.vrm` suffix or an extension union containing `VRM` or `VRMC_vrm`, otherwise `gltf` or `glb` by suffix; this label alone does not prove VRM metadata. */
  format: "gltf" | "glb" | "vrm";

  /** GlTF asset version; only 2.0 is accepted. */
  version: "2.0";

  /** Lengths of the declared top-level arrays; an absent array counts zero. */
  counts: {
    /** Number of `nodes` entries. */
    nodes: number;

    /** Number of `meshes` entries. */
    meshes: number;

    /** Number of `skins` entries. */
    skins: number;

    /** Number of `animations` entries, read even when no motion is inspected. */
    animations: number;
  };

  /** Union of `extensionsUsed` and the root `extensions` keys, deduplicated and sorted in code-unit order. */
  extensions: string[];

  /** Sidecar buffers and images, one entry per distinct URI, sorted by URI in code-unit order. */
  resources: IAutoMovieExternalModelResource[];

  /** Humanoid slots the profile proved, empty for the static and motion profiles. `gltf-humanoid-v1` lists skin joints in node order whose names map to a slot, first node per slot; `vrm-humanoid-v1` lists the VRM declaration, with VRM 0.x thumb names migrated to their VRM 1.0 slots. */
  humanoidBones: Array<{
    /** Normalized humanoid slot. */
    bone: AutoMovieHumanoidBone;

    /** Zero-based index of the node carrying the slot. */
    node: number;

    /** Whether some skinned vertex gives this joint a positive weight. */
    weighted: boolean;
  }>;

  /** Normalized takes; present only under `gltf-motion-v1`. */
  motion?: IAutoMovieExternalMotionInspection;
}

/** Parameters of the synchronous resident-byte inspection gate. */
export namespace IAutoMovieExternalModelInspection {
  /**
   * Borrowed container and sidecar access for one explicit admission profile.
   *
   * The ingest inspector throws on its first container, structural, resource or
   * profile violation; it does not repair data or certify complete glTF validity.
   *
   * @evidence contracts/development/design.md#principled-representation Container bytes and URI resolution share one synchronous lifetime; profile strings remain open so the runtime guard can diagnose unsupported selections.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These are the four arguments the byte inspector reads; hosts own filesystem and asset-namespace policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default profile, asynchronous fetch, fallback bytes or inferred container convention is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation States suffix selection, borrowed lifetimes, absent resolver behavior, callback frequency and error propagation.
   */
  export interface IProps {
    /** Source identity whose case-insensitive .gltf, .glb or .vrm suffix selects decoding; no file is opened or path normalized. */
    path: string;

    /** Complete container bytes, borrowed unchanged until inspection returns or throws. */
    bytes: Uint8Array;

    /** Required profile spelling; the ingest runtime guard rejects values outside AutoMovieExternalModelIngestProfile. */
    profile: string;

    /** Synchronous resolver called per external buffer/image declaration, including repeated URIs. Returns borrowed exact bytes or null for unavailable data; omission also means unavailable. Keep returned bytes stable through inspection. Caller effects and thrown errors propagate; ingest performs no fetch or URI caching. */
    resolveResource?: (uri: string) => Uint8Array | null;
  }
}
