import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { CarBody } from "./CarBody";
import { createCar } from "./createCar";

/**
 * What a car carries behind its cabin, built on `CarBody`'s layout: a sedan's or a hatchback's boot, a van's cargo body, a pickup's bed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and on what.
 * @evidence contracts/development/design.md#principled-representation Each class's rear as boxes on the layout's planes, with its lid, door or gate as an articulation and its floor as a surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder, `build`, called by `createCar`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One branch per class, each reading the layout.
 */
export namespace CarRear {
  /**
   * The class's rear: the boot of a sedan or a hatchback, the van's cargo body, the pickup's bed.
   *
   * @param builder The car under construction.
   * @param l The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which class gets which rear.
   * @evidence contracts/development/implementation.md#principled-implementation A sedan's boot lid lies on the boot and lifts at its rear edge, its hinge's `+Y` along `+X`; a hatchback's tailgate hangs from the roof's rear edge and swings up and out; the van's bulkhead stands `loadLength` ahead of its rear doors with the sliding door's opening behind it; the pickup's bed floor is at its lift-in height and its tailgate drops to level about its foot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper per class.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None beyond the layout's marked constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms A handful of parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function build(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    if (l.kind === "sedan" || l.kind === "hatchback") boot(builder, l);
    else if (l.kind === "van") van(builder, l);
    else bed(builder, l);
  }
  /** A sedan's or a hatchback's boot: its floor, walls and lid on a hinge, and the `load` surface on its floor. */
  function boot(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const width: number = l.d.width!;
    const length: number = l.back - l.rear;
    const middle: number = (l.back + l.rear) / 2;
    const rim: number = l.kind === "sedan" ? l.belt : l.top - 0.04;
    builder.box("boot", v(width, 0.1, length), v(0, l.floor + 0.05, middle), {
      color: BODY,
    });
    for (const [name, x] of [
      ["boot-left", l.half - 0.02],
      ["boot-right", -l.half + 0.02],
    ] as const)
      builder.box(
        name,
        v(0.04, rim - l.floor - 0.1, length),
        v(x, (rim + l.floor + 0.1) / 2, middle),
        { color: BODY },
      );

    // A sedan's lid lies on the boot and lifts at its rear edge; a hatchback's tailgate stands at the back and swings up from the roof.
    if (l.kind === "sedan") {
      builder.box(
        "boot-back",
        v(width, l.belt - l.floor - 0.1, 0.04),
        v(0, (l.belt + l.floor + 0.1) / 2, l.rear + 0.02),
        { color: BODY },
      );
      builder.box(
        "boot-lid",
        v(width - 0.04, 0.03, length),
        v(0, l.belt + 0.015, middle),
        { color: BODY },
      );
    } else {
      builder.box("boot-roof", v(width, 0.04, length), v(0, l.top - 0.02, middle), {
        color: BODY,
      });
      builder.box(
        "boot-lid",
        v(width - 0.04, l.top - 0.04 - (l.floor + 0.1), 0.04),
        v(0, (l.top - 0.04 + l.floor + 0.1) / 2, l.rear + 0.02),
        { color: BODY },
      );
    }
    builder.affordance({
      id: "boot",
      kind: "hinge",
      frame: ArchetypeFrame.facing(
        l.kind === "sedan"
          ? v(0, l.belt + 0.03, l.back)
          : v(0, l.top - 0.04, l.rear + 0.02),
        v(1, 0, 0),
        l.kind === "sedan" ? v(0, 0, -1) : v(0, -1, 0),
      ),
      extent: null,
      travel: l.d.bootSwing!,
      parts: ["boot-lid"],
    });
    builder.affordance({
      id: "load",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, l.floor + 0.1, middle)),
      extent: null,
      width: width - 0.08,
      depth: length - 0.04,
    });
  }

  /** A van's body behind its front doors: a bulkhead behind the seats, the cargo floor, the side walls with the sliding door's opening on the kerb side, and the rear doors. */
  function van(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const width: number = l.d.width!;
    const bulkhead: number = CarBody.bulkhead(l);
    const opening: number = l.d.sideDoorWidth!;
    const cargo: number = l.d.cargoFloor!;
    builder.box("bulkhead", v(width, l.top - l.floor, 0.04), v(0, (l.top + l.floor) / 2, bulkhead + 0.02), {
      color: BODY,
    });
    builder.box(
      "cargo-floor",
      v(width, cargo - l.floor, bulkhead - l.rear),
      v(0, (cargo + l.floor) / 2, (bulkhead + l.rear) / 2),
      { color: BODY },
    );
    builder.box(
      "rear-doors",
      v(width, l.top - cargo, 0.04),
      v(0, (l.top + cargo) / 2, l.rear + 0.02),
      { color: BODY },
    );

    // The kerb side's wall leaves the sliding door's opening behind the bulkhead; the driver's side is closed from the middle pillar back.
    const kerb: number = -l.side;
    for (const [name, x, from, to] of [
      ["side-driver", l.side * (l.half - 0.02), l.pillar, l.rear],
      ["side-kerb-front", kerb * (l.half - 0.02), l.pillar, bulkhead],
      ["side-kerb-rear", kerb * (l.half - 0.02), bulkhead - opening, l.rear],
    ] as const)
      builder.box(
        name,
        v(0.04, l.top - l.floor, from - to),
        v(x, (l.top + l.floor) / 2, (from + to) / 2),
        { color: BODY },
      );
    builder.affordance({
      id: "cargo",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, cargo, (bulkhead + l.rear) / 2)),
      extent: null,
      width: width - 0.08,
      depth: bulkhead - l.rear - 0.04,
    });
  }

  /** A pickup's bed behind its cab: the floor at the lift-in height, the sides and front, the tailgate on a hinge at its foot, and the `bed` surface. */
  function bed(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const inner: number = l.d.bedWidth!;
    const floor: number = l.d.bedFloor!;
    const length: number = l.d.bedLength!;
    const middle: number = (l.back + l.rear) / 2;
    const rail: number = l.belt;
    builder.box(
      "cab-back",
      v(l.d.width!, l.top - l.floor, 0.04),
      v(0, (l.top + l.floor) / 2, l.back + 0.02),
      { color: BODY },
    );
    builder.box("bed-floor", v(inner, 0.06, length), v(0, floor - 0.03, middle), {
      color: BODY,
    });
    for (const [name, x] of [
      ["bed-left", (inner + l.d.width!) / 4],
      ["bed-right", -(inner + l.d.width!) / 4],
    ] as const)
      builder.box(
        name,
        v((l.d.width! - inner) / 2, rail - floor + 0.06, length),
        v(x, (rail + floor - 0.06) / 2, middle),
        { color: BODY },
      );
    builder.box(
      "tailgate",
      v(inner, rail - floor, 0.04),
      v(0, (rail + floor) / 2, l.rear + 0.02),
      { color: BODY },
    );

    // The tailgate's hinge lies along its foot with `+Y` along `-X`, so a positive turn lowers its top toward `-Z`, out of the bed; it opens to level.
    builder.affordance({
      id: "tailgate",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0, floor, l.rear + 0.02), v(-1, 0, 0), v(0, 1, 0)),
      extent: null,
      travel: createCar.TAILGATE,
      parts: ["tailgate"],
    });
    builder.affordance({
      id: "bed",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, floor, middle)),
      extent: null,
      width: inner,
      depth: length,
    });
  }
}

/** The body's colour. */
const BODY: string = "#3f6c8f";