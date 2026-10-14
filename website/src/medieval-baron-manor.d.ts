/**
 * Website names for the production's actual typed manor scene. This hand-authored module augmentation supplies existing host type names; the producer retains its function declaration and full return contract. TypeScript Evidence cannot publish ambient module addresses, so these aliases are reviewed directly without a parallel scene DTO.
 */
import type { createTexturedManorScene } from "../../experimental/medieval-baron-manor/src/instances/manor-textured";

declare module "medieval-baron-manor/textured-scene" {
  /** The actual textured scene delivered by the native production. */
  export type IManorScene = Awaited<
    ReturnType<typeof createTexturedManorScene>
  >;

  /** One authored observation point from the complete native scene. */
  export type IManorView = IManorScene["views"][number];

  /** One authored room from the same scene's manifest. */
  export type IManorRoom = IManorScene["manifest"]["rooms"][number];
}
