import { AUTOMOVIE_HUMAN_RINGS } from "./AUTOMOVIE_HUMAN_RINGS";
import { IAutoMovieHumanCage } from "./IAutoMovieHumanCage";
import { IAutoMovieHumanJunction } from "./IAutoMovieHumanJunction";
import { IAutoMovieHumanRing } from "./IAutoMovieHumanRing";
/**
 * The human profile's junction: welds the two rings of a site into one edge loop of the joined cage.
 *
 * Both rings are placed on the same `shapeAutoMovieHumanRing` boundary, so they have the same count and start mark and their vertices coincide: proximal vertex `k` pairs with distal vertex `(count - k) % count`, because the distal ring runs the other way about the common axis. Each pair becomes the one control point both parts put there, so no part is moved and both keep their own faces; rings that do not coincide within {@link TOLERANCE} are refused, naming the site and the gap, rather than reconciled. Faces keep their corner addresses, so a welded vertex sits on the proximal chart for the proximal part's faces and on the distal chart for the distal part's; the ring becomes a chart boundary of the joined cage.
 *
 * No transition patch is needed in the human profile, whose counts are equal at every site; rings of different counts are refused rather than patched, because such a patch would be a new topology the profile has not fixed. Every vertex near the ring then has valence four, so the single subdivision of the joined cage makes the seam a regular, C2 region of one limit surface.
 *
 * @author Samchon
 */
export class AutoMovieHumanJunction implements IAutoMovieHumanJunction {
    /**
     * @throws {Error} When either cage lacks the site's ring, the rings break the site's definition, or the ring vertices do not pair
     */
    public join(props: IAutoMovieHumanJunction.IProps): IAutoMovieHumanCage {
        const definition: typeof AUTOMOVIE_HUMAN_RINGS[typeof props.site] = AUTOMOVIE_HUMAN_RINGS[props.site];
        function find(cage: IAutoMovieHumanCage, role: string): number {
            const index: number = cage.rings.findIndex((r: IAutoMovieHumanRing): boolean => r.site === props.site && r.side === props.side);
            if (index === -1)
                throw new Error(`${role} cage opens no ${props.side === null ? "" : `${props.side} `}${props.site} ring`);
            const ring: IAutoMovieHumanRing = cage.rings[index]!;
            if (ring.vertices.length !== definition.count ||
                ring.start !== definition.start)
                throw new Error(`${role} ${props.site} ring has ${ring.vertices.length} vertices from ${ring.start}; the site fixes ${definition.count} from ${definition.start}`);
            return index;
        }
        const pi: number = find(props.proximal, "proximal");
        const di: number = find(props.distal, "distal");
        const proximal: IAutoMovieHumanRing = props.proximal.rings[pi]!;
        const distal: IAutoMovieHumanRing = props.distal.rings[di]!;
        const n: number = definition.count;
        const vertices: IAutoMovieHumanCage.IVertex[] = props.proximal.vertices.map((v: IAutoMovieHumanCage.IVertex): IAutoMovieHumanCage.IVertex => ({
            position: { ...v.position },
            fitting: v.fitting === undefined ? undefined : structuredClone(v.fitting),
        }));
        const map: number[] = new Array<number>(props.distal.vertices.length).fill(-1);
        let worst: number = 0;
        for (let k: number = 0; k < n; ++k) {
            const p: number = proximal.vertices[k]!;
            const d: number = distal.vertices[(n - k) % n]!;
            if (map[d] !== -1)
                throw new Error(`distal ${props.site} ring repeats a vertex`);
            map[d] = p;
            if (vertices[p]!.fitting === undefined && props.distal.vertices[d]!.fitting !== undefined)
                vertices[p]!.fitting = structuredClone(props.distal.vertices[d]!.fitting);
            const a: IAutoMovieHumanCage.IVertex["position"] = props.proximal.vertices[p]!.position;
            const b: IAutoMovieHumanCage.IVertex["position"] = props.distal.vertices[d]!.position;
            worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
        }
        if (worst > TOLERANCE)
            throw new Error(`${props.side === null ? "" : `${props.side} `}${props.site} rings do not coincide: vertices lie up to ${worst.toFixed(3)} mm apart; both parts must place them on shapeAutoMovieHumanRing`);
        props.distal.vertices.forEach((v: IAutoMovieHumanCage.IVertex, i: number): void => {
            if (map[i] !== -1)
                return;
            map[i] = vertices.length;
            vertices.push({ position: { ...v.position }, fitting: v.fitting === undefined ? undefined : structuredClone(v.fitting) });
        });
        function remap(i: number): number { return map[i]!; }
        return {
            vertices,
            faces: [
                ...props.proximal.faces.map((f: IAutoMovieHumanCage.IFace): IAutoMovieHumanCage.IFace => ({
                    fitting: f.fitting,
                    vertices: [...f.vertices],
                    ...(f.uvs === undefined
                        ? {}
                        : {
                            uvs: f.uvs.map((uv: [
                                number,
                                number
                            ]): [
                                number,
                                number
                            ] => [
                                ...uv,
                            ]) as IAutoMovieHumanCage.IFace["uvs"],
                        }),
                    coordinates: f.coordinates.map((c: IAutoMovieHumanCage.IFace["coordinates"][number]): IAutoMovieHumanCage.IFace["coordinates"][number] => ({
                        ...c,
                    })) as IAutoMovieHumanCage.IFace["coordinates"],
                })),
                ...props.distal.faces.map((f: IAutoMovieHumanCage.IFace): IAutoMovieHumanCage.IFace => ({
                    fitting: f.fitting,
                    ...(f.uvs === undefined
                        ? {}
                        : {
                            uvs: f.uvs.map((uv: [
                                number,
                                number
                            ]): [
                                number,
                                number
                            ] => [
                                ...uv,
                            ]) as IAutoMovieHumanCage.IFace["uvs"],
                        }),
                    vertices: f.vertices.map(remap) as IAutoMovieHumanCage.IFace["vertices"],
                    coordinates: f.coordinates.map((c: IAutoMovieHumanCage.IFace["coordinates"][number]): IAutoMovieHumanCage.IFace["coordinates"][number] => ({
                        ...c,
                    })) as IAutoMovieHumanCage.IFace["coordinates"],
                })),
            ],
            creases: [
                ...props.proximal.creases.map((c: IAutoMovieHumanCage.ICrease): IAutoMovieHumanCage.ICrease => ({
                    edge: [...c.edge] as [
                        number,
                        number
                    ],
                    sharpness: c.sharpness,
                })),
                ...props.distal.creases.map((c: IAutoMovieHumanCage.ICrease): IAutoMovieHumanCage.ICrease => ({
                    edge: [remap(c.edge[0]), remap(c.edge[1])] as [
                        number,
                        number
                    ],
                    sharpness: c.sharpness,
                })),
            ],
            rings: [
                ...props.proximal.rings
                    .filter((_: IAutoMovieHumanRing, i: number): boolean => i !== pi)
                    .map((r: IAutoMovieHumanRing): IAutoMovieHumanRing => structuredClone(r)),
                ...props.distal.rings
                    .filter((_: IAutoMovieHumanRing, i: number): boolean => i !== di)
                    .map((r: IAutoMovieHumanRing): IAutoMovieHumanRing => ({
                    ...structuredClone(r),
                    vertices: r.vertices.map(remap),
                })),
            ],
        };
    }
}
/** Largest distance between paired ring vertices that still counts as one point, millimetres: rounding of the shared boundary computed on two sides, far below any modelled feature. */
const TOLERANCE: number = 1e-6;
