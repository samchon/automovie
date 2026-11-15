import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createHorse } from "./createHorse";

/**
 * A single horse's driving harness, laid on the horse's body: a breast collar with its neck strap, a driving saddle with its tugs, terrets and girth, a backstrap and crupper, hip straps and a breeching, and a bridle with blinkers and a bit.
 *
 * Every strap lies on the body where the fitting guides read put it. The breast collar runs from just behind one elbow round the front of the chest to the other at the point of shoulder's height (IVC Carriage's measuring chart; Harness Stuff: at the point of shoulder, not rubbing it); its ends are the points of draft, where the traces pull. The driving saddle sits where a riding saddle would, its tugs at the barrel's sides on the trunk's axis, where a cart's shafts are held (Harness Stuff: the tugs stay at the saddle's centre in draft), and its terrets on top carry the driving lines back to the driver. The backstrap runs from behind the saddle along the back to the tail, the hip straps down from the croup to the breeching, and the breeching round the hindquarters `breechingDrop` below the point of buttock (Hammill). The bridle's cheekpieces run from the poll to the bit rings at the mouth, a blinker on each.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid, where each strap lies and the source for its place.
 * @evidence contracts/development/design.md#principled-representation Straps as round bars along the body's surface, the curved ones as short straight segments; the ends the traces and the driving lines leave from are small balls a line's end names.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `lay`, the parts that ride the head, the line ends and the construction estimates; `createHorse` calls it for `tack` `harness`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The places come from the horse's own rig, so the harness fits whatever horse is drawn; every value no source gives is a named estimate here.
 */
export namespace HorseHarness {
  /**
   * The construction sizes no source read gives, metres, each an estimate: `strap`, a strap's radius; `pad`, the driving saddle's width, thickness and length; `terret`, a terret's distance either side of the spine and its rise above the pad; `ring`, a buckle's or ring's radius; `blinker`, a blinker's height and length and its place along the cheekpiece from the poll, as a share, since the model has no eye to centre it on (Harness Stuff: the blinker's middle level with the eye's middle); `arc`, how many straight segments draw a curved strap.
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

  /** The parts that ride the head, which a ride turns with it: the head and the bridle. */
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

  /** The balls a trace or a driving line leaves the horse from, by side: the points of draft at the breast collar's ends, the bit rings, the neck strap's rings and the saddle's terrets. Each is a ball, so a line end names it with the ball's centre, the origin of its own space. */
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
   * Where a driving line passes on the horse's `+X` side, in the horse's space: the bit ring at the mouth's side, the neck strap's ring and the saddle's terret; the `-X` side's are their mirror. `lay` puts the balls there, and a vehicle reads them to give its lines their length.
   *
   * @param rig The horse's rest rig.
   * @param d The horse's dimensions.
   * @returns The three points, from the bit back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the space, the side and the order.
   * @evidence contracts/development/implementation.md#principled-implementation The same places `lay` builds from: the bit ring a strap's radius outside the head at the mouth, the ring halfway up the neck strap from the collar's front to the crest, the terret on the pad.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three points.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one owner of these places, read by `lay` and by a vehicle's lines.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function passes(
    rig: createHorse.IRig,
    d: Readonly<Partial<Record<createHorse.Dimension, number>>>,
  ): Readonly<{ bit: IAutoMovieVector3; ring: IAutoMovieVector3; terret: IAutoMovieVector3 }> {
    const r: number = ESTIMATES.strap;
    const h: number = d.withersHeight!;
    const half: number = rig.trunk / 2;
    const foot: IAutoMovieVector3 = Vector3.create(
      rig.draft.x * Math.cos(Math.PI / 3),
      rig.draft.y,
      half + rig.draft.x * Math.sin(Math.PI / 3),
    );
    const crest: IAutoMovieVector3 = Vector3.create(0, rig.back + 0.02 * h + r, half);
    return {
      bit: Vector3.create(0.06 * h + r, rig.mouth.y, rig.mouth.z),
      ring: Vector3.scale(Vector3.add(foot, crest), 0.5),
      terret: Vector3.create(ESTIMATES.terret.x, rig.back + ESTIMATES.terret.rise, rig.hitch.z),
    };
  }

  /**
   * Lay the harness on a horse under construction.
   *
   * @param builder The horse under construction, its body laid.
   * @param d The horse's drawn dimensions.
   * @param rig The horse's rest rig.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it adds and what it reads.
   * @evidence contracts/development/implementation.md#principled-implementation Each strap is placed on the body the rig describes: the collar on the barrel's surface at the point of shoulder's height, the saddle at the rig's `hitch`, the breeching on the hindquarters' rounded end at the drop below the point of buttock, the bridle along the head from the poll to the mouth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collar, saddle, backstrap and breeching, bridle, then the hitch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The harness adds a few kilograms the horse's measured mass does not include; each strap's share is a nominal hundredth of a percent, the pad's half a percent, so the body's measured distribution is kept.
   * @evidence contracts/development/implementation.md#efficient-algorithms About forty parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one harness.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lay(
    builder: ArchetypeBuilder<createHorse.Affordance, createHorse.Dimension>,
    d: Readonly<Record<createHorse.Dimension, number>>,
    rig: createHorse.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const r: number = e.strap;
    const h: number = d.withersHeight;
    const barrel: number = d.girth / (2 * Math.PI);
    const half: number = rig.trunk / 2;
    const axis: number = rig.back - barrel;
    const strap = { color: LEATHER, share: 0.01 };
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
        v(sign * w, draft.y, draft.z),
        v(sign * w, draft.y, half),
        strap,
      );
      builder.ball(
        ENDS.draft[side],
        e.ring,
        v(sign * w, draft.y, draft.z),
        { color: METAL, share: 0.01 },
      );
    }
    const chest = (angle: number): IAutoMovieVector3 =>
      v(w * Math.cos(angle), draft.y, half + w * Math.sin(angle));
    rods("collar", arc(chest, 0, Math.PI));

    // The neck strap: from the collar's front up over the neck just ahead of the withers, a ring on each side carrying a driving line.
    const crest: IAutoMovieVector3 = v(0, rig.back + 0.02 * h + r, half);
    const pass: ReturnType<typeof passes> = passes(rig, d);
    const mirror = (p: IAutoMovieVector3, sign: number): IAutoMovieVector3 =>
      v(sign * p.x, p.y, p.z);
    for (const [side, sign] of SIDES) {
      const foot: IAutoMovieVector3 = chest(sign > 0 ? Math.PI / 3 : (2 * Math.PI) / 3);
      builder.rod(`neck-strap-${side}`, r, foot, crest, strap);
      builder.ball(ENDS.ring[side], e.ring, mirror(pass.ring, sign), {
        color: METAL,
        share: 0.01,
      });
    }

    // The driving saddle at the hitch, its terrets on top, and the girth round the barrel through the tugs.
    const saddle: number = rig.hitch.z;
    builder.box(
      "pad",
      v(e.pad.width, e.pad.thickness, e.pad.length),
      v(0, rig.back + e.pad.thickness / 2, saddle),
      { color: LEATHER, share: 0.5 },
    );
    for (const [side, sign] of SIDES) {
      builder.ball(ENDS.terret[side], e.ring, mirror(pass.terret, sign), {
        color: METAL,
        share: 0.01,
      });
      builder.ball(`tug-${side}`, 2 * e.ring, v(sign * (barrel + r), axis, saddle), {
        color: LEATHER,
        share: 0.01,
      });
    }
    const girth = (angle: number): IAutoMovieVector3 =>
      v(
        (barrel + r) * Math.cos(angle),
        axis + (barrel + r) * Math.sin(angle),
        saddle,
      );
    rods("girth", arc(girth, Math.PI / 3, -(4 * Math.PI) / 3));

    // The backstrap from behind the saddle along the back to the croup, the crupper down to the tail's root.
    const quarters: IAutoMovieVector3 = v(0, rig.buttock.y, rig.buttock.z + barrel);
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
        Vector3.scale(Vector3.normalize(Vector3.subtract(rig.dock, quarters)), barrel + r),
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
    const head: number = 0.06 * h;
    const crown: IAutoMovieVector3 = v(0, rig.poll.y + head + r, rig.poll.z);
    for (const [side, sign] of SIDES) {
      const top: IAutoMovieVector3 = v(sign * (head + r), rig.poll.y, rig.poll.z);
      const ring: IAutoMovieVector3 = mirror(pass.bit, sign);
      builder.rod(`crown-${side}`, r, crown, top, strap);
      builder.rod(`cheek-${side}`, r, top, ring, strap);
      builder.ball(ENDS.bit[side], e.ring, ring, { color: METAL, share: 0.01 });
      builder.box(
        `blinker-${side}`,
        v(0.01, e.blinker.height, e.blinker.length),
        Vector3.add(
          Vector3.add(top, Vector3.scale(Vector3.subtract(ring, top), e.blinker.along)),
          v(sign * r, 0, 0),
        ),
        { color: LEATHER, share: 0.01 },
      );
    }
    builder.rod(
      "bit",
      e.ring / 2,
      v(head + r, rig.mouth.y, rig.mouth.z),
      v(-(head + r), rig.mouth.y, rig.mouth.z),
      { color: METAL, share: 0.01 },
    );

    // The hitch: the middle between the tugs, where a cart's shafts are held.
    builder.affordance({
      id: "hitch",
      kind: "hook",
      frame: ArchetypeFrame.upright(rig.hitch),
      extent: null,
    });
  }
}

/** The two sides, `+X` first. */
const SIDES: readonly (readonly ["left" | "right", number])[] = [
  ["left", 1],
  ["right", -1],
];

/** Harness leather. */
const LEATHER: string = "#1f1a17";

/** Buckles, rings and the bit. */
const METAL: string = "#b9bcc0";
