import type { IHumanPersonHairContactMesh } from "./IHumanPersonHairContactMesh";

/**
 * Actual posed body and placed hair consumed by the person contact stage.
 *
 * @author Samchon
 */
export interface IHumanPersonHairContactProps {
  /** Posed shared body positions, metres in the person model frame. */
  readonly positions: readonly number[];

  /** Retained source triangles over the shared body vertices. */
  readonly indices: readonly number[];

  /** Actual generated hair meshes in the same frame. */
  readonly hair: readonly IHumanPersonHairContactMesh[];

  /** Legacy ribbon gap in metres; emitted layouts retain their own part gaps. */
  readonly clearance: number;
}
