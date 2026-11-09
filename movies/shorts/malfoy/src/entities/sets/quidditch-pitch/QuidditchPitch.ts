import type { IAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IStageSet } from "../IStageSet";
import { SetGeometry } from "../SetGeometry";

/**
 * The practice pitch: a 152 × 55 m oval lawn with three goal posts at each
 * end and a 100 m east runoff, as named places in the air and on the ground.
 * World frame: the oval's centre at the origin, +X east, +Z south, +Y height
 * above the grass in metres.
 *
 * ```ts
 * const pitch = new QuidditchPitch();
 * pitch.places.eastSouthGap.point; // between the east goal's south and middle posts, below the hoops
 * ```
 *
 * @evidence docs/body/settings/sets/quidditch-pitch.md#lawn 152 × 55 m oval; lawn 20 m beyond it and a 100 m east runoff.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#goals Goal lines 66 m from the centre; posts at 8 m south, on the axis and 8 m north; 0.3 m pale-gold posts; hoops of 2.4 m inside diameter, centred 15 m up in the middle and 13 m at the sides.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#boundary The boundary is the lawn including the runoff, up to 60 m.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#zone-list Middle third, goal fronts, Seekers' height, south gaps, east runoff.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#landmarks Posts, centre, the forest band ringing the grounds.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#lanes The Seekers' lanes, the hook, the runoff chase, the course home, the Snitch's path and the Keeper's run.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#light Clear sky, high sun in the south.
 * @evidence contracts/development/entities.md#settings-realization Every dimension is the record's.
 * @evidence contracts/development/entities.md#object-shape A frozen class of places and a figure builder; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and the places.
 */
export class QuidditchPitch implements IStageSet {
  /** Stable set id. */
  public readonly id: string = "quidditch-pitch";

  /** Named places. */
  public readonly places: Readonly<Record<string, IStageSet.IPlace>>;

  /** The places as engine zones. */
  public readonly zones: readonly IAutoMovieZone[];

  /** Camera stations. */
  public readonly stations: Readonly<Record<string, IAutoMovieVector3>>;

  /** Clear pale-blue sky. */
  public readonly sky: number = 0xa9c9e6;

  /** Light preset. */
  public readonly light = "pitch-early-afternoon" as const;

  /** The boundary the Snitch never leaves: x and z ranges of the lawn and a ceiling, metres. */
  public readonly boundary = Object.freeze({ minX: -96, maxX: 176, minZ: -47.5, maxZ: 47.5, ceiling: 60 });

  /** Build the pitch from its settings. */
  public constructor() {
    const p = (x: number, y: number, z: number, radius: number = 2): IStageSet.IPlace => ({ point: { x, y, z }, radius });
    const places: Record<string, IStageSet.IPlace> = {
      centre: p(0, 0, 0, 5),
      middleThird: p(0, 13, 0, 25),
      westGoalFront: p(-58, 15, 0, 10),
      eastGoalFront: p(58, 15, 0, 10),
      seekersHeight: p(0, 22, 0, 30),
      westSouthGap: p(-66, 8, 4, 1.5),
      eastSouthGap: p(66, 8, 4, 1.5),
      eastRunoff: p(120, 12, 4, 30),
      "eastRunoff.far": p(150, 14, 6, 20),
      "eastRunoff.chase": p(110, 15, 4, 10),
      "seekersHeight.north": p(0, 20, -12, 6),
      "seekersHeight.south": p(0, 20, 12, 6),
      "eastSouthGap.north": p(66, 8, 2, 0.8),
      "eastSouthGap.south": p(66, 8, 6, 0.8),
      "eastSouthPost.hookInside": p(68, 9, 6.5, 0.8),
      "eastSouthPost.hookOutside": p(66, 9, 11, 0.8),
      // Each supporting player's home station in its role's zone: Slytherin attacks east, Gryffindor marks goal-side (east).
      "station.S-C1": p(-10, 13, -6),
      "station.S-C2": p(-4, 14, 4),
      "station.S-C3": p(-16, 12, 8),
      "station.G-C1": p(-5, 13, -6),
      "station.G-C2": p(1, 14, 4),
      "station.G-C3": p(-11, 12, 8),
      "station.S-B1": p(-20, 16, -16),
      "station.S-B2": p(12, 15, -14),
      "station.G-B1": p(-15, 17, -12),
      "station.G-B2": p(16, 16, -10),
      "station.S-K": p(-58, 15, 0),
      "station.G-K": p(58, 15, 0),
      // Flight lanes: the Seekers' race, the hook round the east south post, the runoff chase, the two riders' course home, the Snitch's path and the Keeper's run.
      "seekers.north.start": p(-46, 24, -1.2, 1),
      "seekers.north.scan": p(-40, 24, -1.2, 1),
      "seekers.north.race": p(-20, 23, -1, 1),
      "seekers.north.approach": p(40, 18, -0.8, 1),
      "seekers.north.dive": p(58, 9, 1.6, 1),
      "seekers.south.start": p(-46, 24, 1.2, 1),
      "seekers.south.scan": p(-40, 24, 1.2, 1),
      "seekers.south.race": p(-24, 23, 1, 1),
      "seekers.south.level": p(0, 21, 1, 1),
      "seekers.south.approach": p(40, 17, 1.2, 1),
      "seekers.south.dive": p(58, 9, 4.6, 1),
      "hook.north": p(73, 8.3, 6.5, 0.8),
      "hook.south": p(69.5, 8.2, 9.2, 0.8),
      "eastSouthPost.hookInsideOut": p(75, 9, 12, 0.8),
      "eastSouthPost.hookOutsideOut": p(81, 9.5, 12, 0.8),
      "runoff.north": p(96, 12, 11, 1),
      "runoff.south": p(95, 12, 12.5, 1),
      "climb.north": p(110, 15, 10.3, 1),
      "climb.south": p(110, 15, 11.5, 1),
      "chase.north": p(119, 15.5, 10, 1),
      "chase.south": p(120, 15.5, 11, 1),
      "dance.north": p(124, 15.6, 9.8, 1),
      "dance.south": p(127, 15.6, 10.8, 1),
      "dance.northAhead": p(131.5, 15.7, 9.8, 1),
      "under.north": p(143.2, 12.9, 10.2, 1),
      "tandem.level": p(165, 10.5, 9.8, 2),
      "tandem.out": p(172, 12, 6, 2),
      "tandem.turn": p(171, 13, -2, 2),
      "tandem.back": p(162, 14, -6, 2),
      "tandem.home": p(135, 15, -6, 2),
      "snitch.waits": p(63, 11, 6.5, 0.5),
      "snitch.gap": p(66, 7.8, 4.5, 0.5),
      "snitch.hook": p(70, 8.2, 9.5, 0.5),
      "snitch.hookOut": p(78, 9.3, 12.5, 0.5),
      "snitch.runoff": p(95, 12.5, 12, 0.5),
      "snitch.climb": p(112, 15.6, 11.2, 0.5),
      "snitch.ahead": p(128.2, 16.3, 10.6, 0.5),
      "snitch.first": p(128.9, 16.8, 9.9, 0.5),
      "snitch.away": p(130.5, 17.3, 9.0, 0.5),
      "snitch.beyond": p(135.8, 16.7, 9.4, 0.5),
      "snitch.atNorthRider": p(135.2, 16.6, 10.1, 0.5),
      "snitch.pastShoulder": p(135.5, 17.1, 10.0, 0.5),
      "snitch.climbing": p(128, 20, 11, 0.5),
      "snitch.high": p(115, 27, 8, 0.5),
      "snitch.gone": p(100, 34, 2, 0.5),
      "snitch.glint": p(160, 30, 0, 0.5),
      "keeper.runoff": p(100, 13, -3, 2),
      "keeper.short": p(135, 15, -10, 2),
      "keeper.alongside": p(150, 15, -12, 2),
      "keeper.home": p(125, 15, -12, 2),
    };
    for (const [end, x] of [["east", 66], ["west", -66]] as const)
      for (const [post, z] of [["south", 8], ["middle", 0], ["north", -8]] as const) {
        places[`${end}Post.${post}`] = p(x, 0, z, 0.15);
        places[`${end}Hoop.${post}`] = p(x, post === "middle" ? 15 : 13, z, 1.2);
      }
    this.places = Object.freeze(places);
    this.zones = Object.freeze(
      Object.entries(this.places).map(([id, place]) => ({ id, center: place.point, radius: place.radius })),
    );
    this.stations = Object.freeze({
      aboveWestGoalFront: { x: -92, y: 30, z: 6 },
      behindEastHoops: { x: 82, y: 14, z: -2 },
      southTouchline: { x: 0, y: 6, z: 45 },
      eastRunoffSouth: { x: 115, y: 10, z: 30 },
    });
    Object.freeze(this);
  }

  /** @returns The pitch's scenery: lawn, the oval, the runoff, the six goals and the distant forest band. */
  public figure(): IStageSet.IFigure {
    const g: SetGeometry = new SetGeometry();
    g.box([400, 0.1, 300], [40, -0.06, 0], 0x5d7f3e); // land beyond the lawn
    g.box([272, 0.04, 95], [40, -0.02, 0], 0x6f9a48); // mown lawn with the runoff
    g.oval(76, 27.5, 0.005, 0x78a650); // the oval pitch
    for (const x of [66, -66])
      for (const z of [8, 0, -8]) {
        const height: number = z === 0 ? 15 : 13;
        g.cylinder(0.15, height - 1.35, [x, 0, z], 0xd9c27a);
        g.ring(1.2, 0.12, [x, height, z], 0xd9c27a);
      }
    // The forest band rings the grounds 450 m out, so the horizon is unbroken from every point of the pitch and the runoff.
    for (let k = 0; k < 36; k++) {
      const a: number = (k * 2 * Math.PI) / 36;
      g.box([82, 30, 4], [40 + 450 * Math.sin(a), 15, 450 * Math.cos(a)], 0x2f4a2c).rotation.y = a;
    }
    return g.done();
  }
}
