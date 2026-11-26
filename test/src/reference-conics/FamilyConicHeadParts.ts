import { AutoMovieHumanF1FaceCentres as C } from "@automovie/human/capture";

/**
 * The head's parts as the fit will take them, as far as they go before the fit tool exports its part record: each part's course, the
 * direction its chart starts from, its layout's kind and its clip, all built from landmarks by `AutoMovieHumanF1FaceCentres`
 * (`packages/human/docs/techniques/face-one-shot.md`, The design).
 *
 * The clips are complementary by construction: the eye keeps the skin inside its orbit's cylinder, the lips the skin inside their wedge,
 * and the wall keeps what neither keeps above the ring, reading the same two surfaces with the opposite sign. So no skin is fitted twice
 * and none is left out, which `FamilyConicFace.ts --divides` counts on the reference's vertices. A paired part is declared on +Z only;
 * the wall, which is fitted as one half, reads a -Z point through its reflection.
 *
 * Where two parts' surfaces overlap (the eye's cylinder and the nose's plane beside the nose's root, the nose's plane and the lips' wedge
 * under the columella) the part joined later keeps the skin: the nose stands on the eye and on the lips, so their clips leave the nose's
 * skin out. `--divides` counts every vertex two parts keep and every vertex none keeps.
 *
 * Not here yet: the auricle, whose root surface is the joints batch's; the stations each family ends at, which are read on the skin
 * when it is fitted.
 */
export namespace FamilyConicHeadParts {
  /** A point or a direction in the reference frame, mm. */
  export type V = [number, number, number];

  /** The landmarks the parts are built from, on +Z and the median plane. */
  export interface ILandmarks {
    /** The root of the nose on the median profile. */
    nasion: V;

    /** The +Z alar base: the facial insertion of the ala, on the crease where it meets the cheek. */
    alarBase: V;

    /** Where the columella meets the upper lip. */
    subnasale: V;

    /** The middle of the lips' line. */
    stomion: V;

    /** The +Z mouth corner. */
    cheilion: V;

    /** The deepest point of the sulcus under the lower lip. */
    sublabiale: V;

    /** The corner between the floor under the jaw and the neck's front. */
    cervical: V;

    /** The +Z globe's centre. */
    globe: V;

    /** The +Z inner canthus. */
    endocanthion: V;

    /** The +Z outer canthus. */
    exocanthion: V;
  }

  /** One part as the fit will take it. */
  export interface IPart {
    /** The family's name. */
    name: string;

    /** The course's two centres, mm: its sections are square to the line through them. */
    centres: [V, V];

    /**
     * The stations the family's face runs over along its course, mm from its first centre. The eye, the lips and the nose run from one
     * centre to the other; the wall starts at the ring and ends where the skin does, at the crown, which is read on the skin when it is
     * fitted and is null here.
     */
    domain: [number, number | null];

    /** The direction the chart's phase 0 starts from. */
    up: V;

    /** The section layout's kind: `bilateral` for a part the median plane halves, `inflected` for one with grooves along its course. */
    layout: "bilateral" | "inflected";

    /**
     * Whether a point is this part's skin. A point exactly on a surface is the part's whose surface it is (the nose's on its plane, the
     * eye's on its cylinder, the lips' on their wedge) and never a neighbour's, so every point above the ring is exactly one part's: the
     * nose's where it stands on or inside the nose's surface; else the eye's on or inside its cylinder; else the lips' on or inside their
     * wedge; else the wall's.
     */
    keeps: (p: V) => boolean;

    /** How far a point stands outside the part's own skin, mm, positive outside. */
    outside: (p: V) => number;
  }

  /** How far past each canthus the eye's course runs, mm: it ends inside the wall, past the fissure's rounded end. */
  export const PAST_CANTHUS_MM: number = 8;

  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const along = (o: V, d: V, t: number): V => [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];

  /**
   * The head's wall, the +Z eye and the lips.
   *
   * @param m The landmarks.
   * @param axes The head frame's X (forward), Y and Z (toward +Z).
   * @param origin The head's origin, the bitragion midpoint.
   * @param neck The neck's base centre, where the course to the head's origin starts.
   */
  export function build(m: ILandmarks, axes: [V, V, V], origin: V, neck: V): IPart[] {
    const ring: C.IPlane = C.ring(neck, origin, m.cervical);
    const frame: ReturnType<typeof C.eye> = C.eye(m.globe, m.endocanthion, m.exocanthion, axes[0]);
    const orbit: (p: V) => number = C.orbit(frame);
    const mouth: C.IMuzzle = C.muzzle(m.stomion, m.cheilion, axes[0], axes[2]);
    const wedge: (p: V) => number = C.wedge(mouth, m.sublabiale, m.subnasale);
    const line: V = frame.axes[2];
    const tent: (p: V) => number = C.nasal(m.nasion, m.subnasale, m.alarBase);

    // The nose's course: parallel to subnasale to nasion, through the median point level with the alar bases and as deep as they stand.
    const root: V = [m.alarBase[0], m.alarBase[1], 0];
    const bridge: V = sub(m.nasion, m.subnasale);
    const parts: Omit<IPart, "domain">[] = [
      {
        name: "head",
        keeps: (p: V): boolean => dot(sub(p, ring.point), ring.normal) >= 0 && tent(p) > 0 && orbit([p[0], p[1], Math.abs(p[2])]) > 0 && wedge(p) > 0,
        centres: [ring.point, origin],
        up: axes[0],
        layout: "bilateral",

        // The wall keeps what stands above the ring and inside none of the eye's cylinder (its twin's by reflection), the lips' wedge and the nose's planes.
        outside: (p: V): number => Math.max(-dot(sub(p, ring.point), ring.normal), -orbit([p[0], p[1], Math.abs(p[2])]), -wedge(p), -tent(p)),
      },
      {
        name: "nose",
        keeps: (p: V): boolean => tent(p) <= 0,
        centres: [root, [root[0] + bridge[0], root[1] + bridge[1], root[2] + bridge[2]]],
        up: axes[0],
        layout: "bilateral",
        outside: tent,
      },
      {
        name: "eye",
        keeps: (p: V): boolean => tent(p) > 0 && orbit(p) <= 0,
        centres: [along(m.globe, line, dot(sub(m.endocanthion, m.globe), line) - PAST_CANTHUS_MM), along(m.globe, line, dot(sub(m.exocanthion, m.globe), line) + PAST_CANTHUS_MM)],
        up: frame.axes[0],
        layout: "inflected",

        // The nose is joined after the eye and stands on it beside the root, so the skin both surfaces hold is the nose's.
        outside: (p: V): number => Math.max(orbit(p), -tent(p)),
      },
      {
        name: "lips",
        keeps: (p: V): boolean => tent(p) > 0 && orbit([p[0], p[1], Math.abs(p[2])]) > 0 && wedge(p) <= 0,
        centres: [along(mouth.frame.origin, mouth.frame.axes[2], -mouth.half), along(mouth.frame.origin, mouth.frame.axes[2], mouth.half)],
        up: mouth.frame.axes[0],
        layout: "inflected",

        // As the eye: under the columella the skin both surfaces hold is the nose's.
        outside: (p: V): number => Math.max(wedge(p), -tent(p)),
      },
    ];
    return parts.map((one: Omit<IPart, "domain">): IPart => ({ ...one, domain: [0, one.name === "head" ? null : Math.hypot(...sub(one.centres[1], one.centres[0]))] }));
  }
}
