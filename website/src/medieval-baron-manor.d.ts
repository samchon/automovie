/**
 * Website names for the production's actual typed manor scene.
 * The module augmentation supplies only existing host type names; the normal
 * producer keeps its own function declaration and complete return contract.
 * No parallel scene DTO replaces the authored geometry or view semantics.
 */
import type { createTexturedManorScene } from "../../experimental/medieval-baron-manor/src/instances/manor-textured";

declare module "medieval-baron-manor/textured-scene" {
  /** The actual textured scene delivered by the native production. */
  export type IManorScene = Awaited<ReturnType<typeof createTexturedManorScene>>;
  /** One authored observation point from the complete native scene. */
  export type IManorView = IManorScene["views"][number];
  /** One authored room from the same scene's manifest. */
  export type IManorRoom = IManorScene["manifest"]["rooms"][number];
}
