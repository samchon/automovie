import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairBending } from "./AutoMovieHumanHairBending";
import { AutoMovieHumanHairCard } from "./AutoMovieHumanHairCard";
import { AutoMovieHumanHairEnvelope } from "./AutoMovieHumanHairEnvelope";
import { AutoMovieHumanHairFeather } from "./AutoMovieHumanHairFeather";
import { AutoMovieHumanHairGuideClearance } from "./AutoMovieHumanHairGuideClearance";
import { AutoMovieHumanHairGuideEnd } from "./AutoMovieHumanHairGuideEnd";
import { AutoMovieHumanHairGuideRest } from "./AutoMovieHumanHairGuideRest";
import { AutoMovieHumanHairGuideStart } from "./AutoMovieHumanHairGuideStart";
import { AutoMovieHumanHairGuideStep } from "./AutoMovieHumanHairGuideStep";
import { AutoMovieHumanHairRoots } from "./AutoMovieHumanHairRoots";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpBoundary } from "./AutoMovieHumanScalpBoundary";
import type { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairGuideState } from "./IAutoMovieHumanHairGuideState";

/**
 * Scalp hair guides: one polyline per root, solved from the root's scalp
 * address, the style's direction field, gravity and the head surface, as a
 * loop over the pieces of one step.
 *
 * Roots: the mirrored lattice of `AutoMovieHumanHairRoots`, each kept when the
 * skin there lies above the scalp boundary (`AutoMovieHumanScalpBoundary`)
 * raised by its own jitter (`AutoMovieHumanHairFeather`), so a root's identity
 * never depends on the skin's tessellation; it moves with the skin when the
 * head changes shape. A root and its mirror share one seed, and every noise
 * read here takes the azimuth's magnitude, so a symmetric style gives
 * mirrored guides.
 *
 * Integration: each guide marches in equal steps along its length, from its
 * start (`AutoMovieHumanHairGuideStart`): the heading of a step is the
 * style's (`AutoMovieHumanHairGuideStep`), the point is held at its clearance
 * over the hair mass's envelope (`AutoMovieHumanHairGuideClearance`, ending
 * lying hair where the drape rises over a bump,
 * `AutoMovieHumanHairGuideDrapeEnd`), settled on the body when it reaches it
 * (`AutoMovieHumanHairGuideRest`) and grown or ended at the level cut or the
 * resting arc (`AutoMovieHumanHairGuideEnd`). This is a kinematic sweep, not
 * a strand simulation: there is no bending energy or collision between
 * strands, and its coefficients are conventions of this prototype.
 *
 * Normals: the envelope's outward normal at the point's direction, whether a
 * strand lies on the head or hangs, so the whole cut shades as one smooth
 * hair mass, and halfway between that and the body's surface normal where it
 * rests on the body.
 */
export namespace AutoMovieHumanHairGuide {
  /** One solved guide. */
  export interface IGuide {
    /** Root index; stable across tessellation and shape changes. */
    root: number;

    /** Seed shared by the root and its mirror. */
    seed: number;

    /** Whether the root is the reflection of a canonical one. */
    mirror: boolean;

    /** Points from root to tip, head-local millimetres. */
    points: Array<[number, number, number]>;

    /** Outward unit normal of the hair mass at each point. */
    normals: Array<[number, number, number]>;

    /** Arc length of the polyline, millimetres. */
    length: number;

    /**
     * Share of its full length the root grows by its nearness to the
     * hairline, 0 to 1.
     */
    feather: number;

    /**
     * Height the strand stands over the scalp at its full length, millimetres
     * (`AutoMovieHumanHairBending`): the hair mass over the scalp reaches this
     * far above the skin.
     */
    stand: number;
  }

  /**
   * Solve every guide of one haircut.
   *
   * @param field Head chart of the generated skin
   * @param shoulders Body surface heights under the head
   * @param hair Scalp hair input
   * @param boundary The head's assembled scalp boundary for `hair.hairline`
   * @returns Guides, empty for zero length
   */
  export function generate(
    field: AutoMovieHumanHeadField.IField,
    shoulders: AutoMovieHumanShoulderField.IField,
    hair: IAutoMovieHumanScalpHair,
    boundary: AutoMovieHumanScalpBoundary.IBoundary,
  ): IGuide[] {
    if (!(hair.length > 0)) return [];

    const guides: IGuide[] = [];
    const envelope: AutoMovieHumanHairEnvelope.IEnvelope =
      AutoMovieHumanHairEnvelope.create(field);
    for (const root of AutoMovieHumanHairRoots.lattice(
      AutoMovieHumanHairCard.width(hair.style),
    )) {
      const u: [number, number, number] = root.u;

      // Keep roots on measured skin above the hair-bearing boundary, each
      // against its own raised boundary; the transition zone's roots grow
      // shorter hair the closer they lie (their feather).
      if (!AutoMovieHumanHeadField.covered(field, u)) continue;

      const distance: number = AutoMovieHumanHeadField.radius(field, u);
      const above: number = field.centre[1] + u[1] * distance - field.eyeLevel;
      const feather: number = AutoMovieHumanHairFeather.feather(
        above -
          AutoMovieHumanScalpBoundary.height(boundary, Math.atan2(u[2], u[0])),
        root.seed,
      );
      if (feather < 0) continue;

      const guide: IGuide | null = solve(
        field,
        envelope,
        shoulders,
        hair,
        root,
        feather,
      );
      if (guide !== null) guides.push(guide);
    }
    return guides;
  }
}

/**
 * Solve one guide from its root direction.
 *
 * @param field Head chart
 * @param envelope Smooth envelope of the hair mass
 * @param shoulders Body surface heights under the head
 * @param hair Scalp hair input
 * @param root The root
 * @param feather Share of the length grown at the hairline's edge, 0 to 1
 * @returns The guide, or null when it would be shorter than its card is wide
 */
function solve(
  field: AutoMovieHumanHeadField.IField,
  envelope: AutoMovieHumanHairEnvelope.IEnvelope,
  shoulders: AutoMovieHumanShoulderField.IField,
  hair: IAutoMovieHumanScalpHair,
  root: AutoMovieHumanHairRoots.IRoot,
  feather: number,
): AutoMovieHumanHairGuide.IGuide | null {
  const { context, state }: AutoMovieHumanHairGuideStart.IStart =
    AutoMovieHumanHairGuideStart.create(
      field,
      envelope,
      shoulders,
      hair,
      root,
      feather,
    );
  const guide: IAutoMovieHumanHairGuideState = state;

  for (
    let i: number = 1;
    i <= context.steps && guide.travelled < context.length;
    ++i
  ) {
    guide.heading = AutoMovieHumanHairGuideStep.heading(context, guide);
    const candidate: AutoMovieHumanSkinVector.Vec3 =
      AutoMovieHumanSkinVector.add(
        guide.p,
        AutoMovieHumanSkinVector.scale(guide.heading, context.step),
      );

    // Held over the head, settled on the body, grown or ended.
    const held: AutoMovieHumanHairGuideClearance.IHeld =
      AutoMovieHumanHairGuideClearance.hold(context, guide, candidate);
    guide.heading = held.heading;
    if (held.ended) break;

    const rest: AutoMovieHumanHairGuideRest.IRest =
      AutoMovieHumanHairGuideRest.settle(context, guide, held.next);
    if (rest.ended) break;
    if (
      AutoMovieHumanHairGuideEnd.advance(context, guide, rest.next, rest.normal)
    )
      break;
  }

  // A card shorter than it is wide is a patch, not a strand: it shows neither
  // a root nor a tip band, only a dark fleck apart from the hair, as at the
  // frontotemporal corner where lying hair ends over a bump.
  if (
    guide.points.length < 2 ||
    guide.travelled < AutoMovieHumanHairCard.width(hair.style)
  )
    return null;
  return {
    root: root.index,
    seed: root.seed,
    mirror: root.mirror,
    points: guide.points,
    normals: guide.normals,
    length: guide.travelled,
    feather,
    stand: AutoMovieHumanHairBending.rise(
      context.exit,
      context.reach,
      context.bending,
      guide.travelled,
    ),
  };
}
