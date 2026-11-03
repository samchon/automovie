import { AutoMovieHumanFootConstruction } from "../../../src/generation/AutoMovieHumanFootConstruction";
import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "../HumanDebugChainLoft";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.loft`: the left foot and its toes lofted alone by the skin generator from the foot
 * construction's own chains on an empty calibration (no skeleton, leg or rest of the person), with
 * the generator's sections, axes, guides and web paths.
 *
 * The inputs are the person's left foot dimensions and its fat and muscularity controls, at scale 1.
 * The ankle ring has no leg above it, so it closes as a flat fan: that lid is the cut.
 */
export const HumanDebugPieceFootLoft: IHumanDebugPiece = {
  name: "foot.loft",
  region: "foot",
  description: "Left foot and toes lofted alone from the foot construction's chains, with construction curves",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    const controls: { fat: { value: number | null }; muscularity: { value: number | null } } =
      person.parameters.body.controls;

    // The foot construction adds its chains to whatever calibration it is given; an empty one
    // keeps the loft to the foot alone. The stature only sizes defaults the foot does not read.
    const empty: IAutoMovieHumanBodyCalibration = {
      stature: 1700,
      chains: [],
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
    } as unknown as IAutoMovieHumanBodyCalibration;
    const calibration: IAutoMovieHumanBodyCalibration = AutoMovieHumanFootConstruction.add(empty, {
      left: f.dimensions,
      right: f.dimensions,
      fat: controls.fat.value ?? 0,
      muscularity: controls.muscularity.value ?? 0,
      scale: 1,
    });
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(calibration, ["foot.left", "foot.left.*", "toe.left", "toe.left.*"]);
    return {
      parts: document.parts,
      provenance: { ...document.provenance, piece: "foot.loft", dimensions: f.dimensions, person: person.alias },
    };
  },
};
