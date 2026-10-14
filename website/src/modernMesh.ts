/**
 * Website alias of the modern production's mesh uploader, preserving its function identity and caller-decoded texture input. The source inspector references the same implementation; serving and executing that inspector remains a separate host responsibility.
 */
import { buildMesh } from "modern-suburban-house/viewer/scene";

/**
 * The production's existing mesh uploader, shared by identity with its inspector and public tour. It constructs a new Three mesh or reflector from each native item; the caller owns geometry, material and reflector-target disposal.
 *
 * Direct aliasing retains buildMesh's positions, normals, indices, finishes and authored mirror-face handling without a second implementation. Invocation copies vertex/index data and constructs one material or a fixed-resolution reflector target. Function identity and caller-loaded textures are shared; geometry/material construction remains independent on each call, with no cross-item cache. Assigning the alias itself acquires no resources.
 */
export const modernMesh: typeof buildMesh = buildMesh;
