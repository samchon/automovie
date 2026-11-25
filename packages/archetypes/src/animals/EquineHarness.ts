import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { EquineTack } from "./EquineTack";

/**
 * A single horse's driving harness, laid on the horse's body: a breast collar
 * with its neck strap, a driving saddle with its tugs, terrets and girth, a
 * backstrap and crupper, hip straps and a breeching, and a bridle with blinkers
 * and a bit.
 *
 * Every strap lies on the body where the fitting guides read put it. The breast
 * collar runs from just behind one elbow round the front of the chest to the
 * other at the point of shoulder's height (IVC Carriage's measuring chart;
 * Harness Stuff: at the point of shoulder, not rubbing it); its ends are the
 * points of draft, where the traces pull. The driving saddle sits where a
 * riding saddle would, its tugs at the barrel's sides on the trunk's axis,
 * where a cart's shafts are held (Harness Stuff: the tugs stay at the saddle's
 * centre in draft), and its terrets on top carry the driving lines back to the
 * driver. The backstrap runs from behind the saddle along the back to the tail,
 * the hip straps down from the croup to the breeching, and the breeching round
 * the hindquarters `breechingDrop` below the point of buttock (Hammill). The
 * bridle's cheekpieces run from the poll to the bit rings at the mouth, a
 * blinker on each.
 */
export namespace EquineHarness {
  /**
   * The construction sizes no source read gives, metres, each an estimate:
   * `strap`, a strap's radius; `pad`, the driving saddle's width, thickness and
   * length; `terret`, a terret's distance either side of the spine and its rise
   * above the pad; `ring`, a buckle's or ring's radius; `blinker`, a blinker's
   * height and length and its place along the cheekpiece from the poll, as a
   * share, since the model has no eye to centre it on (Harness Stuff: the
   * blinker's middle level with the eye's middle); `arc`, how many straight
   * segments draw a curved strap.
   */
  export const ESTIMATES: Readonly<{
    strap: number;
    pad: Readonly<{ width: number; thickness: number; length: number }>;
    terret: Readonly<{ x: number; rise: number }>;
    ring: number;
    blinker: Readonly<{ height: number; length: number; along: number }>;
    arc: number;
  }> = {
    strap: 0.012,
    pad: { width: 0.24, thickness: 0.04, length: 0.3 },
    terret: { x: 0.08, rise: 0.06 },
    ring: 0.02,
    blinker: { height: 0.08, length: 0.1, along: 0.3 },
    arc: 6,
  };

  /**
   * The parts that ride the head, which a ride turns with it: the head and the
   * bridle.
   */
  export const HEAD: readonly string[] = [
    "head",
    "crown-left",
    "crown-right",
    "cheek-left",
    "cheek-right",
    "blinker-left",
    "blinker-right",
    "bit",
    "bit-left",
    "bit-right",
  ];

  /**
   * The balls a trace or a driving line leaves the horse from, by side: the
   * points of draft at the breast collar's ends, the bit rings, the neck
   * strap's rings and the saddle's terrets. Each is a ball, so a line end names
   * it with the ball's centre, the origin of its own space.
   */
  export const ENDS: Readonly<
    Record<
      "draft" | "bit" | "ring" | "terret",
      Readonly<{ left: string; right: string }>
    >
  > = {
    draft: { left: "draft-left", right: "draft-right" },
    bit: { left: "bit-left", right: "bit-right" },
    ring: { left: "ring-left", right: "ring-right" },
    terret: { left: "terret-left", right: "terret-right" },
  };

  /**
   * A point of the breast collar round the front of the chest, in the horse's
   * space: at the point of draft's height, on the circle through the two points
   * of draft's sides about the shoulder joints' plane, `angle` radians from the
   * `+X` side toward the front.
   *
   * @param rig The horse's rest rig.
   * @param angle Radians from the `+X` side, `pi / 2` the chest's front, `pi`
   *   the `-X` side.
   * @returns The point.
   */
  export function chest(
    rig: AutoMovieArchetypeEquine.IRig,
    angle: number,
  ): IAutoMovieVector3 {
    return Vector3.create(
      rig.draft.x * Math.cos(angle),
      rig.draft.y,
      rig.trunk / 2 + rig.draft.x * Math.sin(angle),
    );
  }

  /**
   * Where a driving line passes on the horse's `+X` side, in the horse's space,
   * and the neck strap it passes through: the bit ring at the mouth's side, the
   * neck strap's foot on the collar and its top over the crest, the strap's
   * ring halfway between, and the saddle's terret; the `-X` side's are their
   * mirror. `lay` builds on these places, and a vehicle reads them to give its
   * lines their length.
   *
   * @param rig The horse's rest rig.
   * @returns The places, from the bit back.
   */
  export function passes(rig: AutoMovieArchetypeEquine.IRig): Readonly<{
    bit: IAutoMovieVector3;
    foot: IAutoMovieVector3;
    crest: IAutoMovieVector3;
    ring: IAutoMovieVector3;
    terret: IAutoMovieVector3;
  }> {
    const r: number = ESTIMATES.strap;
    const foot: IAutoMovieVector3 = chest(rig, Math.PI / 3);
    const crest: IAutoMovieVector3 = Vector3.add(
      rig.crest,
      Vector3.create(0, r, 0),
    );
    return {
      bit: Vector3.create(rig.headRadius + r, rig.mouth.y, rig.mouth.z),
      foot,
      crest,
      ring: Vector3.scale(Vector3.add(foot, crest), 0.5),
      terret: Vector3.create(
        ESTIMATES.terret.x,
        rig.back + ESTIMATES.terret.rise,
        rig.hitch.z,
      ),
    };
  }

  /**
   * Lay the harness on a horse under construction.
   *
   * @param builder The horse under construction, its body laid.
   * @param d The horse's drawn dimensions.
   * @param rig The horse's rest rig.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const r: number = e.strap;
    const barrel: number = rig.barrel;
    const half: number = rig.trunk / 2;
    const axis: number = rig.back - barrel;
    const strap = { color: LEATHER, share: 0 };
    const metal = { color: METAL, share: 0 };
    const pass: ReturnType<typeof passes> = passes(rig);
    const mirror = (p: IAutoMovieVector3, sign: number): IAutoMovieVector3 =>
      v(sign * p.x, p.y, p.z);
    const rods = (prefix: string, points: readonly IAutoMovieVector3[]): void =>
      points.slice(1).forEach((to: IAutoMovieVector3, k: number): void => {
        builder.rod(`${prefix}-${k + 1}`, r, points[k]!, to, strap);
      });
    const arc = (
      at: (angle: number) => IAutoMovieVector3,
      from: number,
      to: number,
    ): IAutoMovieVector3[] =>
      Array.from(
        { length: e.arc + 1 },
        (_: unknown, k: number): IAutoMovieVector3 =>
          at(from + ((to - from) * k) / e.arc),
      );

    // The breast collar: along each side from the point of draft to the shoulder joint's plane, and round the front of the chest between.
    const draft: IAutoMovieVector3 = rig.draft;
    const w: number = draft.x;
    for (const [side, sign] of SIDES) {
      builder.rod(
        `collar-${side}`,
        r,
        mirror(draft, sign),
        v(sign * w, draft.y, half),
        strap,
      );
      builder.ball(ENDS.draft[side], e.ring, mirror(draft, sign), metal);
    }
    rods(
      "collar",
      arc((angle: number): IAutoMovieVector3 => chest(rig, angle), 0, Math.PI),
    );

    // The neck strap: from the collar's front up over the neck just ahead of the withers, a ring on each side carrying a driving line.
    for (const [side, sign] of SIDES) {
      builder.rod(
        `neck-strap-${side}`,
        r,
        mirror(pass.foot, sign),
        pass.crest,
        strap,
      );
      builder.ball(ENDS.ring[side], e.ring, mirror(pass.ring, sign), metal);
    }

    // The driving saddle at the hitch, its terrets on top, and the girth round the barrel through the tugs.
    const saddle: number = rig.hitch.z;
    builder.box(
      "pad",
      v(e.pad.width, e.pad.thickness, e.pad.length),
      v(0, rig.back + e.pad.thickness / 2, saddle),
      { color: LEATHER, share: 0 },
    );
    for (const [side, sign] of SIDES) {
      builder.ball(ENDS.terret[side], e.ring, mirror(pass.terret, sign), metal);
      builder.ball(
        `tug-${side}`,
        2 * e.ring,
        v(sign * (barrel + r), axis, saddle),
        {
          color: LEATHER,
          share: 0,
        },
      );
    }
    const girth = (angle: number): IAutoMovieVector3 =>
      v(
        (barrel + r) * Math.cos(angle),
        axis + (barrel + r) * Math.sin(angle),
        saddle,
      );
    rods("girth", arc(girth, Math.PI / 3, -(4 * Math.PI) / 3));

    // The backstrap from behind the saddle along the back to the croup, the crupper down to the tail's root.
    const quarters: IAutoMovieVector3 = rig.quarters;
    const croup: IAutoMovieVector3 = v(0, quarters.y + barrel + r, quarters.z);
    builder.rod(
      "backstrap",
      r,
      v(0, rig.back + r, saddle - e.pad.length / 2),
      croup,
      strap,
    );
    builder.rod(
      "crupper",
      r,
      croup,
      Vector3.add(
        quarters,
        Vector3.scale(
          Vector3.normalize(Vector3.subtract(rig.dock, quarters)),
          barrel + r,
        ),
      ),
      strap,
    );

    // The breeching round the hindquarters' rear end at its drop below the point of buttock, held up by a hip strap on each side.
    const seat: number = rig.buttock.y - d.breechingDrop;
    const reach: number =
      Math.sqrt(Math.max(0, barrel * barrel - d.breechingDrop ** 2)) + r;
    const behind = (angle: number): IAutoMovieVector3 =>
      v(reach * Math.cos(angle), seat, quarters.z - reach * Math.sin(angle));
    rods("breeching", arc(behind, 0, Math.PI));
    const flank: number = rig.limbs.leftHind[1]!.z;
    for (const [side, sign] of SIDES) {
      builder.rod(
        `breeching-${side}`,
        r,
        v(sign * reach, seat, quarters.z),
        v(sign * reach, seat, flank),
        strap,
      );
      const shoulder: IAutoMovieVector3 = v(
        sign * (barrel + r) * Math.SQRT1_2,
        quarters.y + (barrel + r) * Math.SQRT1_2,
        quarters.z,
      );
      builder.rod(`hip-${side}`, r, croup, shoulder, strap);
      builder.rod(
        `hip-${side}-drop`,
        r,
        shoulder,
        v(sign * reach, seat, quarters.z),
        strap,
      );
    }

    // The bridle: the crownpiece over the poll, a cheekpiece down each side to its bit ring with a blinker on it, and the bit across the mouth.
    const head: number = rig.headRadius;
    const crown: IAutoMovieVector3 = v(0, rig.poll.y + head + r, rig.poll.z);
    for (const [side, sign] of SIDES) {
      const top: IAutoMovieVector3 = v(
        sign * (head + r),
        rig.poll.y,
        rig.poll.z,
      );
      const ring: IAutoMovieVector3 = mirror(pass.bit, sign);
      builder.rod(`crown-${side}`, r, crown, top, strap);
      builder.rod(`cheek-${side}`, r, top, ring, strap);
      builder.ball(ENDS.bit[side], e.ring, ring, metal);
      builder.box(
        `blinker-${side}`,
        v(0.01, e.blinker.height, e.blinker.length),
        Vector3.add(
          Vector3.add(
            top,
            Vector3.scale(Vector3.subtract(ring, top), e.blinker.along),
          ),
          v(sign * r, 0, 0),
        ),
        { color: LEATHER, share: 0 },
      );
    }
    builder.rod(
      "bit",
      e.ring / 2,
      mirror(pass.bit, 1),
      mirror(pass.bit, -1),
      metal,
    );

    // The hitch: the middle between the tugs, where a cart's shafts are held.
    builder.affordance({
      id: "hitch",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(rig.hitch),
      extent: null,
    });
  }

  /**
   * A hooked trace or strap hanging slack between its two world ends: `count`
   * points on a parabola whose middle hangs `sag` metres below the chord, an
   * authored look rather than a cable simulation.
   *
   * @param from The end on the horse, world metres.
   * @param to The end on the vehicle or bar, world metres.
   * @param sag The middle's drop below the chord, metres.
   * @param count The points laid, ends included, at least three.
   * @returns The points in order.
   */
  export function slack(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    sag: number,
    count: number,
  ): IAutoMovieVector3[] {
    return Array.from(
      { length: count },
      (_: unknown, k: number): IAutoMovieVector3 => {
        const u: number = k / (count - 1);
        return Vector3.add(Vector3.lerp(from, to, u), {
          x: 0,
          y: -4 * sag * u * (1 - u),
          z: 0,
        });
      },
    );
  }

  /**
   * The two sides, `+X` first, with the sign of `X` on each: the one list a
   * harness and a harnessed vehicle iterate.
   */
  export const SIDES: readonly (readonly ["left" | "right", number])[] = [
    ["left", 1],
    ["right", -1],
  ];
}

/** Harness leather. */
const LEATHER: string = "#1f1a17";

/** Buckles, rings and the bit. */
const METAL: string = "#b9bcc0";
