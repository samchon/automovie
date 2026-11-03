import { AutoMovieHumanHeadJawJoint } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadJawJoint";
import { AutoMovieHumanHeadLipFrame } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadLipFrame";
import { AutoMovieHumanHeadLowerLip } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadLowerLip";
import { AutoMovieHumanHeadNose } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadNose";
import { AutoMovieHumanHeadUpperLip } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadUpperLip";
import type { IAutoMovieHumanHeadCompiled } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadLayout";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanHeadPieceSingleton } from "../../../internal/head/HumanHeadPieceSingleton";
import { HumanMergeProof } from "../../../internal/region/HumanMergeProof";
import { HumanMergeRows } from "../../../internal/region/HumanMergeRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's protruding head pieces (the jaw joint's fullness, the nose,
 * the upper and lower lips) merge onto the head's base by adding volume only:
 * each piece's height over the base is never negative, vanishes with its slope
 * at its support's edge, and stays inside its window.
 *
 * Scenarios:
 * 1. A made bump of 2 mm and 14 mm radius, cos squared in its distance (its edge bends at a 14 mm radius), passes all three rows.
 * 2. The bump with a 0.5 mm dent, cut at 10 mm of its radius, or with a wide 0.2 mm skirt fails the least-height, edge-rise and border rows in turn.
 * 3. Every person of `HumanPeople`: each piece's height read on its grid, every row listed by person and piece.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's head piece from its fixed setup and evaluates each additive piece's own radial height (`AutoMovieHumanHeadJawJoint.height`, `AutoMovieHumanHeadNose.height`, `AutoMovieHumanHeadUpperLip.bulge` and `AutoMovieHumanHeadLowerLip.bulge` in `AutoMovieHumanHeadLipFrame.at`) every 0.5 mm over a grid of height and half width that holds the piece's anatomical region with room round it, then reads the least height, the largest height on the grid's border and the largest rise beside the support's edge. It catches a piece that cuts into the base (a nose or lip that dents the face where it should only add), a window cut short (a ring printed round the piece) and a piece that leaks over the whole face.
 * @evidence contracts/testing.md#independent-expectations The owner's merge rule: pieces join their base by adding volume only, recesses belonging to the base or to declared subtractive pieces (the orbit's socket, the alar crease, the philtrum and the oral groove are such and are not read). So the height is never below zero; it vanishes with its slope at its edge, the rise over one step beside the edge bounded by a bend of the crease limit's 12.5 mm radius, step^2 / 25 mm; and the base outside the window is the base unchanged, nothing on the grid's border. The grids come from the layout's landmarks (eye, nasion, subnasale, stomion, menton, half nose width, half mouth width, head breadth), not from the pieces' own window constants. Proven here on the made bump, green whole and red in each of the three made defects. Oracle limits: the blend's width against the piece's size has no published band and is not read; a piece's height is read over the base's coordinates, so its fade over the face (`AutoMovieHumanHeadRelief`) is not.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends. The subtractive pieces, the ears and the composed skin belong to their own tests; the seams between chains to the head seam test.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_merge`, building each person's head piece once per process in a `Singleton`, on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_merge(): void {
  assertHumanProvenRows("head merge", HumanMergeProof.failures, (name: string): HumanAnatomyAudit.IRow[] => {
    const piece: HumanHeadPieceSingleton.IPiece = HumanHeadPieceSingleton.get(name);
    const plan: IAutoMovieHumanHeadLayout = piece.built.plan;
    const compiled: IAutoMovieHumanHeadCompiled = piece.built.surface.compiled;
    const k: number = piece.scale;
    const step: number = 0.5 * k;
    const lips: (bulge: (frame: AutoMovieHumanHeadLipFrame.IFrame, y: number) => number) => HumanMergeRows.Height =
      (bulge: (frame: AutoMovieHumanHeadLipFrame.IFrame, y: number) => number): HumanMergeRows.Height =>
      (y: number, a: number): number => {
        const frame: AutoMovieHumanHeadLipFrame.IFrame | null = AutoMovieHumanHeadLipFrame.at(plan, a);
        return frame === null ? 0 : bulge(frame, y);
      };
    const mouth: HumanMergeRows.IGrid = { u: [plan.menton, plan.subnasale], v: [0, 2 * plan.mouthWidth], step, midline: true };
    return [
      ...HumanMergeRows.rows(
        name,
        "jaw joint",
        (y: number, a: number): number => AutoMovieHumanHeadJawJoint.height({ plan, base: compiled.prior.frame.base }, y, a),
        { u: [plan.menton, plan.eye + 20 * k], v: [0, plan.breadth / 2 + 15 * k], step, midline: false },
        k,
      ),
      ...HumanMergeRows.rows(
        name,
        "nose",
        (y: number, a: number): number => AutoMovieHumanHeadNose.height({ plan, face: compiled.prior.face, compiled }, y, a),
        { u: [plan.stomion, plan.nasion + 0.6 * (plan.nasion - plan.subnasale)], v: [0, 2 * plan.noseWidth + 20 * k], step, midline: true },
        k,
      ),
      ...HumanMergeRows.rows(name, "upper lip", lips((f: AutoMovieHumanHeadLipFrame.IFrame, y: number): number => AutoMovieHumanHeadUpperLip.bulge(plan, f, y)), mouth, k),
      ...HumanMergeRows.rows(name, "lower lip", lips((f: AutoMovieHumanHeadLipFrame.IFrame, y: number): number => AutoMovieHumanHeadLowerLip.bulge(plan, f, y)), mouth, k),
    ];
  });
}
