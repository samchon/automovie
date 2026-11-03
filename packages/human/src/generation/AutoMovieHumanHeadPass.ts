import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import type { AutoMovieHumanHeadConstruction } from "./AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadJawBody } from "./AutoMovieHumanHeadJawBody";
import { AutoMovieHumanHeadLandmarks } from "./AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadNeckBase } from "./AutoMovieHumanHeadNeckBase";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadSkinReading } from "./AutoMovieHumanHeadSkinReading";

import type { IAutoMovieHumanHeadBuilt } from "./IAutoMovieHumanHeadBuilt";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadCorrections } from "./IAutoMovieHumanHeadCorrections";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";
import type { IAutoMovieHumanHeadSetup } from "./IAutoMovieHumanHeadSetup";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * One secant pass of the head: the head's own setup from the neck chain and
 * the public inputs, and the head built once from that setup and the
 * corrections found so far. Splitting it from the whole head's generation lets
 * any piece be built from the fixed setup of one person without the body.
 */
export namespace AutoMovieHumanHeadPass {
  /**
   * The setup of a head: its neck ring and the scale that closes the stature.
   *
   * @param neckChain The neck chain the head stands on (named `head` in the calibration).
   * @param inputs The public inputs.
   * @returns The head's fixed inputs.
   */
  export function prepare(
    neckChain: IAutoMovieHumanLoftChain,
    inputs: AutoMovieHumanHeadConstruction.IInputs,
  ): IAutoMovieHumanHeadSetup {
    const compiled: IAutoMovieHumanHeadCompiled = AutoMovieHumanHeadLandmarks.compile();
    const prior: AutoMovieHumanHeadPrior.IPrior = compiled.prior;
    const top: number = neckChain.layers[neckChain.layers.length - 1]!.y;
    const dense: number[] = Array.from(
      { length: 720 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 720,
    );
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(neckChain, top, dense);
    const xs: number[] = ring.map((p: [number, number, number]): number => p[0]);
    const level: number = AutoMovieHumanHeadMath.mean(
      ring.map((p: [number, number, number]): number => p[1]),
    );

    // The vertex is the stature: the neck ring stays in calibration and the
    // head above it is in world lengths, so the scale closes on itself.
    const rise: number = prior.ratios.neck * inputs.neckLength + inputs.head.height;
    const scale: number = level / (inputs.height - rise);
    const flat: [number, number][] = ring.map(
      (p: [number, number, number]): [number, number] => [p[0], p[2]],
    );
    const step: number = Math.min(
      AutoMovieHumanHeadNeckBase.NECK_STEP * scale,
      (top - neckChain.layers[0]!.y) / 2,
    );
    const beneath: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      neckChain,
      top - step,
      dense,
    );
    const drop: number =
      level -
      AutoMovieHumanHeadMath.mean(beneath.map((p: [number, number, number]): number => p[1]));
    const under: [number, number][] = beneath.map(
      (p: [number, number, number]): [number, number] => [p[0], p[2]],
    );

    // The ring's back on the midline, and its run with height from the ring
    // under it, which the back profile leaves the neck with.
    const cx: number = AutoMovieHumanHeadMath.mean(xs);
    const rearOf = (loop: readonly [number, number][]): number =>
      cx -
      AutoMovieHumanPolarSection.radius(
        loop,
        [cx, 0],
        Math.PI - AutoMovieHumanHeadNeckBase.OFF_VERTEX,
      );
    const neck: IAutoMovieHumanHeadNeck = {
      level,
      x: cx,
      radius: (inputs.neck * scale) / (2 * Math.PI),
      back: rearOf(flat),
      backSlope: (rearOf(flat) - rearOf(under)) / drop,
    };
    return { inputs, compiled, neck, scale, ring, flat, under, drop };
  }

  /**
   * The head built once: the landmark skeleton with the corrections on its
   * keys, the skin cut over the neck's hand-over, the two ears placed on it,
   * the globes' seat and the jaw built from the chin's skin. The next pass
   * reads the measures an input names on this skin.
   *
   * @param setup The head's fixed inputs.
   * @param fix The corrections found so far.
   * @returns The pass's head before its chains are cut.
   */
  export function build(
    setup: IAutoMovieHumanHeadSetup,
    fix: IAutoMovieHumanHeadCorrections,
  ): IAutoMovieHumanHeadBuilt {
    const { inputs, compiled, neck, scale, ring, flat, under, drop } = setup;
    const prior: AutoMovieHumanHeadPrior.IPrior = compiled.prior;
    const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLandmarks.layout(compiled, inputs, neck, scale, fix);
    const surface: IAutoMovieHumanHeadSurface = {
      compiled,
      plan,
      neckLeft: AutoMovieHumanHeadNeckBase.neckDelta(compiled, plan, flat, 1),
      neckRight: AutoMovieHumanHeadNeckBase.neckDelta(compiled, plan, flat, -1),
      slopeLeft: AutoMovieHumanHeadNeckBase.neckSlope(compiled, plan, flat, under, drop, 1),
      slopeRight: AutoMovieHumanHeadNeckBase.neckSlope(compiled, plan, flat, under, drop, -1),
      riseLeft: AutoMovieHumanHeadNeckBase.neckRise(compiled, plan, ring, 1),
      riseRight: AutoMovieHumanHeadNeckBase.neckRise(compiled, plan, ring, -1),
      cut: new Map(),
    };

    // Ears, from the skull's side.
    const place = (e: PublicEar): AutoMovieHumanEarConstruction.IEar =>
      AutoMovieHumanEarConstruction.place(
        {
          length: e.length * scale,
          breadth: e.breadth * scale,
          protrusion: e.protrusion * scale,
        },
        plan.eye,
        plan.centre,
        scale,
      );
    const left: AutoMovieHumanEarConstruction.IEar = place(inputs.head.earPair.left);
    const right: AutoMovieHumanEarConstruction.IEar = place(inputs.head.earPair.right);


    // The eyes stand a fixed depth behind the nasion's skin, and the sockets
    // fall to them: a socket is a subtractive piece, so where the skin
    // already stands behind the seat it falls by nothing.
    const seat: number =
      AutoMovieHumanHeadSkinReading.frontAt(surface, plan.nasion, 0) - prior.face.eyeRecess * scale;
    plan.left.seat = Math.max(0, AutoMovieHumanHeadSkinReading.frontAt(surface, plan.eye, plan.left.place) - seat);
    plan.right.seat = Math.max(0, AutoMovieHumanHeadSkinReading.frontAt(surface, plan.eye, -plan.right.place) - seat);

    // The jaw, from the chin's skin, the ears, the jaw width and the cheek
    // at the zygomatic arch, which runs forward from the ear at about the
    // height of its centre.
    const arch: number = (left.bottom + left.top + right.bottom + right.top) / 4;
    plan.mandible = AutoMovieHumanHeadJawBody.jawOf(
      plan,
      prior.mandible,
      AutoMovieHumanHeadSkinReading.frontAt(
        surface,
        plan.border +
          prior.mandible.round *
            AutoMovieHumanHeadJawBody.softness(prior.mandible, plan.fat) *
            prior.mandible.taper *
            scale,
        0,
      ),
      (left.x + right.x) / 2,
      2 * plan.mandibularWidth,
      [AutoMovieHumanHeadSkinReading.widest(compiled, plan, arch), arch],
    );
    surface.cut.clear();
    return { plan, surface, left, right, seat };
  }
}

/** The public ear. */
type PublicEar = AutoMovieHumanHeadConstruction.IInputs["head"]["earPair"]["left"];
