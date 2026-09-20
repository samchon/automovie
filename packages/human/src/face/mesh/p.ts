import { portraitPoint } from "./portraitPoint";

/**
 * A short alias for {@link portraitPoint}, for expressions dense with points.
 *
 * A patch or a tube writes dozens of points in one expression, and spelling the
 * constructor each time buries the coordinates that are the actual content. It
 * constructs nothing different: this is the same function under a name chosen
 * to keep the arithmetic readable.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Provides the shared head-frame point values consumed by anatomical part builders.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Constructs an XYZ vector without changing its caller-owned millimetre coordinates.
 * @author Samchon
 */
export const p = portraitPoint;
