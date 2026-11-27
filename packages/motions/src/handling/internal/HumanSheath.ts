import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPutDownAperture,
  IAutoMovieMotionHumanSheath,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanCarrierCustody } from "../../lexicon/internal/HumanCarrierCustody";
import { drawFromCarrier } from "./drawFromCarrier";
import { putDownAperture } from "./putDownAperture";

/*
 * Seat a blade in a carrier and derive the draw line.
 * Parameter carrier: The carrier prop, worn or placed, declaring the mouth.
 * Parameter blade: The blade prop, declaring the tip and the handle; neither worn
 * nor mounted.
 * Parameter params: The affordance ids and the drawn clearance.
 * Returns: The carrier with the seat, entry, slider and slide, the blade
 * mounted on the seat and the staged record.
 * On `mouth`, `tip` or `handle` when the model lacks it,
 * on `tip` when it is off the blade's `+Y`, on `clearance` when it is not
 * positive and finite, and on `blade` when the blade already rides
 * something.
 */
export function HumanSheath(
  carrier: IAutoMovieMotionHumanProp,
  blade: IAutoMovieMotionHumanProp,
  params: IAutoMovieMotionHumanSheath.IParams,
): IAutoMovieMotionHumanSheath.IStaging {
  const mouth: IAutoMovieAffordance = find(carrier, params.mouth, "mouth");
  const tip: IAutoMovieAffordance = find(blade, params.tip, "tip");
  find(blade, params.handle, "handle");
  if (!(params.clearance > 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "clearance",
      value: params.clearance,
      feasible: {
        kind: "range",
        unit: "m",
        minimum: 0,
        maximum: Number.MAX_VALUE,
      },
      reason: "the drawn tip must clear the mouth by a positive distance",
      fix: "give a positive clearance in metres",
    });
  if (
    blade.worn !== undefined ||
    blade.mounted !== undefined ||
    blade.motion !== undefined ||
    blade.fixed === true
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "blade",
      value: blade.subject,
      feasible: { kind: "alternatives", values: ["a free rigid prop"] },
      reason: "a sheathed blade rides its carrier from the start",
      fix: "stage the blade without worn, mounted, motion or fixed",
    });

  // The tip must lie on the blade's own +Y for the seat's turn to aim it.
  const reach: number = Vector3.length(tip.frame.translation);
  const along: IAutoMovieVector3 = Vector3.scale(
    tip.frame.translation,
    1 / reach,
  );
  if (!(reach > 0) || Math.acos(Math.min(1, along.y)) > HumanSheath.AXIS)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "tip",
      value: params.tip,
      feasible: { kind: "alternatives", values: ["a tip on the blade's +Y"] },
      reason:
        "the blade slides along the mouth's axis only when its tip lies on its own +Y",
      fix: "stage a blade modelled along +Y from its shoulder",
    });

  const withdrawal: number = reach + params.clearance;
  const rest: IAutoMovieAffordance[] = sockets(mouth, withdrawal, 0);
  const down: IAutoMovieVector3 = Quaternion.rotateVector(
    mouth.frame.rotation,
    { x: 0, y: -1, z: 0 },
  );

  // The slide socket rides the slider's travel, and a carrier whose own
  // parts move is read posed, so the derived sockets are derived again
  // from each pose of its mouth.
  const posed: (
    state: Readonly<Record<string, number>>,
  ) => IAutoMovieMotionHumanProp.IPosed = (
    state: Readonly<Record<string, number>>,
  ): IAutoMovieMotionHumanProp.IPosed => {
    // The carrier's own model poses only its own articulations.
    const own: Record<string, number> = { ...state };
    delete own[HumanSheath.SLIDER];
    const shown: IAutoMovieMotionHumanProp.IPosed =
      carrier.articulate === undefined
        ? { affordances: carrier.affordances ?? [] }
        : carrier.articulate(own);
    const opening: IAutoMovieAffordance =
      shown.affordances.find(
        (affordance: IAutoMovieAffordance): boolean =>
          affordance.id === params.mouth,
      ) ?? mouth;
    const travel: number = Math.min(
      withdrawal,
      Math.max(0, state[HumanSheath.SLIDER] ?? 0),
    );
    return {
      ...shown,
      affordances: [
        ...shown.affordances,
        ...sockets(opening, withdrawal, travel),
      ],
    };
  };
  return {
    carrier: {
      ...carrier,
      points: {
        ...carrier.points,
        ...Object.fromEntries(
          rest.map((affordance: IAutoMovieAffordance): [string, Point] => [
            affordance.id,
            { point: affordance.frame.translation, normal: down },
          ]),
        ),
      },
      affordances: [...(carrier.affordances ?? []), ...rest],
      hasArticulations: true,
      articulate: posed,
    },
    blade: {
      ...blade,
      mounted: {
        prop: carrier.subject,
        point: HumanSheath.SEAT,
        offset: {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
    },
    sheath: {
      blade: blade.subject,
      carrier: carrier.subject,
      handle: params.handle,
      seat: HumanSheath.SEAT,
      entry: HumanSheath.ENTRY,
      slider: HumanSheath.SLIDER,
      slide: HumanSheath.SLIDE,
    },
  };
}

/*
 * Stage a blade seated in its carrier, draw it out on screen and return it.
 *
 * `of` derives, on the carrier's mouth axis, the seat where the blade's frame
 * sits when sheathed, the entry where it sits once drawn, a slider from the
 * seat toward the entry and a socket riding it, the carrier's guide; it mounts
 * the blade on the seat from the film's start. `draw` grips the handle with the
 * carrier pickup and no lift (`HumanCarrierCustody`), then draws the blade out
 * on the guide to the entry, where the hand takes it (`drawFromCarrier`);
 * `sheathe` brings it to the entry and returns it on the guide to the seat with
 * aperture placement (`putDownAperture`). Register the three laws with the
 * performance. The line is the carrier's own, so it holds for a canted or a
 * worn carrier alike. The prop's identity is the same subject through seat,
 * guide, hand, guide and seat again.
 *
 * Stage practice draws and resheathes along the scabbard's line so the blade
 * never binds or cuts the throat.
 */
export namespace HumanSheath {
  /*
   * The derived seat socket's id on the carrier.
   */
  export const SEAT: string = "sheathSeat";

  /*
   * The derived entry socket's id on the carrier.
   */
  export const ENTRY: string = "sheathEntry";

  /*
   * The derived slider articulation's id on the carrier: its travel, metres,
   * runs from the seat toward the entry.
   */
  export const SLIDER: string = "sheathSlider";

  /*
   * The derived socket's id on the carrier that rides the slider and guides the
   * blade out.
   */
  export const SLIDE: string = "sheathSlide";

  /*
   * The largest angle between the blade's tip direction and its `+Y`, radians:
   * a blade whose tip leaves its own axis by more cannot slide along the
   * mouth's axis.
   */
  export const AXIS: number = 1e-6;

  /*
   * Grip the seated blade's handle, then draw it out of the carrier.
   * Parameter chain: The performer's chain, the blade seated and the hand free.
   * Parameter sheath: The staged pair.
   * Parameter hand: The drawing hand; `right` when absent.
   * Parameter anchor: The action's anchor for cues; none when absent.
   * Parameter pull: The other hand's pull on a worn carrier for a blade longer than
   * the arm draws alone; the carrier holds still when absent.
   * Parameter sync: The instant the manoeuvre starts at
   * (`IAutoMovieMotionHumanChainCore.sync`), its first grip timed to it and
   * the draw following at grip closure; where the chain puts it when absent.
   * Returns: The chain with the grip and the draw appended, after the other
   * hand's grip on the carrier's throat when it pulls; the grip's
   * `gripClosed` marks closure and the draw's `unseated` and `drawn` the
   * start and end of the withdrawal.
   */
  export function draw<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    sheath: IAutoMovieMotionHumanSheath.IStaged,
    hand?: AutoMovieHumanSide,
    anchor?: string,
    pull?: IAutoMovieMotionHumanDrawFromCarrier.IPull,
    sync?: IAutoMovieMotionHumanChainCore.ISync,
  ): Chain {
    const other: AutoMovieHumanSide = hand === "left" ? "right" : "left";
    // The manoeuvre's first grip, cut at its closure and timed when asked.
    const timed: (taken: Chain) => Chain = (taken: Chain): Chain =>
      sync === undefined ? taken : taken.sync(sync);
    const grip: IAutoMovieMotionHumanPickUp.IParams = {
      prop: sheath.blade,
      handle: sheath.handle,
      lift: 0,
      ...(hand === undefined ? {} : { hand }),
    };
    const out: IAutoMovieMotionHumanDrawFromCarrier = {
      prop: sheath.blade,
      from: {
        prop: sheath.carrier,
        aperture: sheath.entry,
        point: sheath.seat,
        slider: sheath.slider,
        slide: sheath.slide,
      },
      ...(hand === undefined ? {} : { hand }),
      ...(pull === undefined ? {} : { pull }),
    };
    // The other hand takes the carrier's throat first, as the drawing hand
    // takes the hilt: each is cut at its grip's closure.
    const held: Chain =
      pull === undefined
        ? chain
        : timed(
            chain
              .registered(HumanCarrierCustody.name, {
                prop: sheath.carrier,
                handle: pull.handle,
                lift: 0,
                hand: other,
              } satisfies IAutoMovieMotionHumanPickUp.IParams)
              .until({ type: "event", event: "gripClosed" }),
          );
    const gripped: Chain = held
      .registered(HumanCarrierCustody.name, grip)
      .until({ type: "event", event: "gripClosed" });
    return (pull === undefined ? timed(gripped) : gripped).registered(
      drawFromCarrier.name,
      out,
      anchor,
    );
  }

  /*
   * Return the held blade through the carrier's entry to its seat.
   * Parameter chain: The performer's chain, the blade in the hand.
   * Parameter sheath: The staged pair.
   * Parameter hand: The holding hand; `right` when absent.
   * Parameter anchor: The action's anchor for cues; none when absent.
   * Returns: The chain with the return appended; its `aperture`, `placed` and
   * `release` events mark the entry, the seat and the opened hand.
   */
  export function sheathe<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    sheath: IAutoMovieMotionHumanSheath.IStaged,
    hand?: AutoMovieHumanSide,
    anchor?: string,
  ): Chain {
    const params: IAutoMovieMotionHumanPutDownAperture = {
      prop: sheath.blade,
      onto: {
        prop: sheath.carrier,
        aperture: sheath.entry,
        point: sheath.seat,
        guide: { slider: sheath.slider, slide: sheath.slide },
      },
      ...(hand === undefined ? {} : { hand }),
    };
    return chain.registered(putDownAperture.name, params, anchor);
  }
}

/*
 * One named point of a prop in its own frame, with its outward normal.
 */
type Point = IAutoMovieMotionHumanProp["points"][string];

/*
 * The seat on the mouth, turned half about its `X` so a blade's `+Y` runs into
 * the carrier; the entry the withdrawal out along the mouth's `+Y`; the slider
 * from the seat toward the entry, its `+X` along that line; and the slide
 * socket at the slider's travel.
 */
function sockets(
  mouth: IAutoMovieAffordance,
  withdrawal: number,
  travel: number,
): IAutoMovieAffordance[] {
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      mouth.frame.rotation,
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180),
    ),
  );
  const out: IAutoMovieVector3 = Quaternion.rotateVector(mouth.frame.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const at: (distance: number) => IAutoMovieVector3 = (
    distance: number,
  ): IAutoMovieVector3 =>
    Vector3.add(mouth.frame.translation, Vector3.scale(out, distance));
  return [
    {
      id: HumanSheath.SEAT,
      kind: "socket",
      frame: {
        translation: mouth.frame.translation,
        rotation,
        scale: mouth.frame.scale,
      },
      extent: null,
    },
    {
      id: HumanSheath.ENTRY,
      kind: "socket",
      frame: {
        translation: at(withdrawal),
        rotation,
        scale: mouth.frame.scale,
      },
      extent: null,
    },
    {
      id: HumanSheath.SLIDER,
      kind: "slider",
      frame: {
        translation: mouth.frame.translation,
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            mouth.frame.rotation,
            Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
          ),
        ),
        scale: mouth.frame.scale,
      },
      extent: null,
      travel: withdrawal,
    },
    {
      id: HumanSheath.SLIDE,
      kind: "socket",
      frame: {
        translation: at(travel),
        rotation,
        scale: mouth.frame.scale,
      },
      extent: null,
    },
  ];
}

/*
 * The named affordance of a prop, or a refusal naming the ones it has.
 */
function find(
  prop: IAutoMovieMotionHumanProp,
  id: string,
  axis: string,
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = prop.affordances?.find(
    (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
  );
  if (found === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis,
      value: id,
      feasible: {
        kind: "alternatives",
        values: (prop.affordances ?? []).map(
          (affordance: IAutoMovieAffordance): string => affordance.id,
        ),
      },
      reason: `${prop.subject} declares no affordance ${id}`,
      fix: `name one of ${prop.subject}'s affordances`,
    });
  return found;
}
