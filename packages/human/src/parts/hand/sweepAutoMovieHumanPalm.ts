import { IAutoMovieSweep, IAutoMovieSweepSection } from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { measureAutoMovieHumanWristCollar } from "../../junction/measureAutoMovieHumanWristCollar";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { sliceAutoMovieHumanPalm } from "./sliceAutoMovieHumanPalm";
/**
 * Sweep the palm from the wrist ring to the fingers' roots in the hand frame.
 *
 * The spine runs from the ring's centre along its normal to the collar, then through the centres of four slices of `sliceAutoMovieHumanPalm`: the carpus, mid-palm, the metacarpal heads and the fingers' roots, the last two in planes turned to the oblique knuckle line. The ring and its collar take the ring's own limit curve, the closed B-spline of its control points, so the sweep leaves the collar on the surface the subdivision makes there rather than on the control polygon outside it; the slices are polygons, each turned palmar-first in its plane. Stations sit at the chord shares of the spine's points.
 *
 * @param props The hand, its arm's measurements, its wrist ring and the map from the ring's frame into the hand frame
 * @returns The sweep in metres, its stations' `u`, the roots' slice and the ring's normal, collar and turn
 */
export function sweepAutoMovieHumanPalm(props: {
    hand: readAutoMovieHumanHand.IHand;
    arm: IAutoMovieHumanIdentity.IArm;
    ring: IAutoMovieHumanRingShape;
    toLocal: (direction: IAutoMovieVector3) => IAutoMovieVector3;
}): sweepAutoMovieHumanPalm.IOutput {
    const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
    const SHAPE: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.layout = AUTOMOVIE_HUMAN_HAND_SHAPE.layout;
    const L: number = props.arm.handLength;
    const field: sliceAutoMovieHumanPalm.IField = sliceAutoMovieHumanPalm({
        hand: props.hand,
        breadth: props.arm.handBreadth,
        length: L,
        wristCircumference: props.arm.wristCircumference,
        dorsalFat: props.arm.dorsalHandFat,
    });
    // the wrist ring in the hand frame: its plane, its first direction and the sense of its turn
    const ringNormal: IAutoMovieVector3 = V.normalize(props.toLocal(V.of(-props.ring.frame.normal.x, -props.ring.frame.normal.y, -props.ring.frame.normal.z)));
    const ringFirst: IAutoMovieVector3 = V.normalize(props.toLocal(props.ring.directions[0]!));
    const ringSecond: IAutoMovieVector3 = V.cross(ringNormal, ringFirst);
    const turns: number[] = props.ring.directions.map((d: IAutoMovieVector3): number => {
        const l: IAutoMovieVector3 = props.toLocal(d);
        return Math.round((Math.atan2(V.dot(l, ringSecond), V.dot(l, ringFirst)) /
            (2 * Math.PI)) *
            props.ring.count);
    });
    const sense: 1 | -1 = turns[1] === 1 ? 1 : -1;
    const ringPoints: IAutoMovieSweepSection.IPoint[] = props.ring.positions.map((q: IAutoMovieVector3): IAutoMovieSweepSection.IPoint => {
        const d: IAutoMovieVector3 = props.toLocal(V.offset(q, [props.ring.frame.origin, -1]));
        return { x: V.dot(d, ringFirst) / 1000, y: V.dot(d, ringSecond) / 1000 };
    });
    const ringSection: IAutoMovieSweepSection = {
        type: "bspline",
        points: sense === 1
            ? ringPoints
            : [ringPoints[0]!, ...ringPoints.slice(1).reverse()],
    };
    const ringRotation: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(ringFirst, ringSecond, ringNormal);
    const collar: number = measureAutoMovieHumanWristCollar(L);
    // the palm's stations: ring, collar, carpus, mid-palm, metacarpal support and the fingers' roots
    const axisKnuckle: number = field.knuckle(0);
    const slices: sliceAutoMovieHumanPalm.ISlice[] = [
        field.slice({ origin: SHAPE.carpus * L, tilt: 0 }),
        field.slice({ origin: SHAPE.midPalm * L, tilt: 0 }),
        field.slice({ origin: axisKnuckle - SHAPE.heads * L, tilt: field.tilt }),
        field.slice({ origin: axisKnuckle + SHAPE.roots * L, tilt: field.tilt }),
    ];
    const palmar: IAutoMovieVector3 = V.of(0, 1, 0);
    const centres: IAutoMovieVector3[] = [
        V.of(0, 0, 0),
        V.offset(V.of(0, 0, 0), [ringNormal, collar]),
        ...slices.map((s: sliceAutoMovieHumanPalm.ISlice): IAutoMovieVector3 => s.centre),
    ];
    const lengths: number[] = [0];
    for (let k: number = 1; k < centres.length; ++k)
        lengths.push(lengths[k - 1]! + V.distance(centres[k - 1]!, centres[k]!));
    const at: number[] = lengths.map((l: number): number => l / lengths[lengths.length - 1]!);
    const sweep: IAutoMovieSweep = {
        spine: { points: centres.map(metres), normal: ringFirst },
        stations: [
            { at: at[0]!, section: ringSection, rotation: ringRotation },
            { at: at[1]!, section: ringSection, rotation: ringRotation },
            ...slices.map((s: sliceAutoMovieHumanPalm.ISlice, k: number): IAutoMovieSweep.IStation => ({
                at: at[k + 2]!,
                section: {
                    type: "polygon",
                    points: s.section.points.map((p: IAutoMovieSweepSection.IPoint): IAutoMovieSweepSection.IPoint => ({
                        x: p.x / 1000,
                        y: p.y / 1000,
                    })),
                },
                rotation: quaternionFromAutoMovieBasis(palmar, s.axis, V.cross(palmar, s.axis)),
            })),
        ],
    };
    return {
        sweep,
        at: {
            wrist: at[0]!, collar: at[1]!, carpus: at[2]!, midPalm: at[3]!,
            metacarpals: at[4]!, roots: at[5]!,
        },
        end: slices[3]!,
        tilt: field.tilt,
        ringNormal,
        collar,
        sense,
    };
}
/** Output type of {@link sweepAutoMovieHumanPalm}. */
export namespace sweepAutoMovieHumanPalm {
    /**
     * The palm's sweep.
     *
     * @author Samchon
     */
    export interface IOutput {
        /** The sweep, hand frame, metres. */
        sweep: IAutoMovieSweep;
        /** Physical source stations. The curved four-MCP course belongs to the field, not an extra common plane. */
        at: {
            wrist: number;
            collar: number;
            carpus: number;
            midPalm: number;
            metacarpals: number;
            roots: number;
        };
        /** The fingers' roots' slice, millimetres. */
        end: sliceAutoMovieHumanPalm.ISlice;
        /** Turn of the knuckle line about the palmar axis, radians. */
        tilt: number;
        /** The ring's normal into the hand. */
        ringNormal: IAutoMovieVector3;
        /** Distance of the collar from the ring, millimetres. */
        collar: number;
        /** Whether the ring's order runs with the sweep's turn (1) or against it (-1). */
        sense: 1 | -1;
    }
}
const metres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.x / 1000,
    y: p.y / 1000,
    z: p.z / 1000,
});
