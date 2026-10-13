import type { AutoMovieExternalModelIngestProfile } from "./AutoMovieExternalModelIngestProfile";
import type { IAutoMovieExternalModelResource } from "./IAutoMovieExternalModelResource";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IAutoMovieExternalMotionInspection } from "./IAutoMovieExternalMotionInspection";

/**
 * Byte-level facts the external-model builder accepts before materializing a source.
 *
 * Inspection is synchronous because the production builder already holds the exact resident bytes and must reject violations of its selected structural/profile contract before anything is built from them. It does not certify complete glTF validity or image media decoding. Hosts still construct the render mesh with their own loader from the same content-addressed asset; these facts only gate it.
 *
 * @evidence contracts/common.md#principled-implementation The record reports only facts read from the declared JSON and checked against resident bytes: counts of the top-level arrays, the extension union, sidecar URIs, profile-proved humanoid slots with weight usage, and motion takes when the motion profile ran.
 * @evidence contracts/common.md#clear-and-simple-design One inspection result serves every profile, with `humanoidBones` empty and `motion` absent where a profile does not compute them, so the production inventory reads one shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `format` reports `vrm` from declared VRM extensions rather than trusting the suffix, and the documentation says so instead of implying the suffix decides.
 * @evidence contracts/common.md#meaningful-documentation The comments state why inspection is synchronous, that hosts still load the render mesh themselves, how `format` is decided, the order of `extensions` and `resources`, how each profile fills `humanoidBones`, and when `motion` is present.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface types the inspector's result and has no code; inspection cost is answered on `inspectAutoMovieExternalModelBytes`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A plain result record has nothing to share between consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds new arrays proportional to extensions, resources, slots and motion data, owned by the caller, and no reference to the container bytes.
 * @author Samchon
 */
export interface IAutoMovieExternalModelInspection {
  /** Profile the caller selected and the inspection enforced. */
  profile: AutoMovieExternalModelIngestProfile;

  /** Container family: `vrm` whenever `VRM` or `VRMC_vrm` appears among the extensions, whatever the file suffix, otherwise `gltf` or `glb` by suffix. */
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
