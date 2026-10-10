import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../face/structures/IAutoMovieHumanFaceHair";
import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanPersonHairContactProps } from "./IHumanPersonHairContactProps";

/**
 * What keeping a person's generated hair off the posed body reads: the placed
 * face parts, which of them are actual emitted hair, the hair document's
 * clearance layers, and the posed body skin in metres in the shared Y-up,
 * +Z-forward frame.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHairClearanceProps {
  /** The face parts, placed on the head, whose meshes may be replaced. */
  parts: IAutoMovieModel["parts"];

  /**
   * Whether a part ID belongs to the face producer's actual hair emission.
   */
  isGenerated: (id: string) => boolean;

  /**
   * This emission's geometry-owned per-part stations, source seats and gaps.
   * A supplied map must cover every actual generated part. Absence is only
   * the existing ribbon transport and does not support terminal shafts.
   */
  contactLayouts?: ReadonlyMap<string, IHumanFaceHairContactLayout>;

  /** The hair document's layers, or none. */
  layers: readonly Pick<
    IAutoMovieHumanFaceHair["layers"][number],
    "clearance" | "samplingStep"
  >[];

  /** The body's posed skin positions, metres. */
  positions: readonly number[];

  /** The body's retained skin triangles, as flat vertex index triples. */
  indices: readonly number[];

  /**
   * Observe a frozen copy of the actual pre-contact input in the shared metre
   * frame. Omission allocates no snapshot. The observer sees neither mutable
   * body arrays nor mutable generated parts, so it cannot change contact.
   */
  observe?: (snapshot: IHumanPersonHairContactProps) => void;
}
