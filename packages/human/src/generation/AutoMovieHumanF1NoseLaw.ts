/**
 * The nose's law in the nose's frame: the median outline from subnasale over the tip to nasion. It reads no family and no figure;
 * `packages/human/docs/techniques/face-one-shot.md` holds the design and the comparison with the f1 reference.
 *
 * Frame: the nose's (origin subnasale, Y to nasion). A station `t` runs from subnasale (0) to nasion along that line; the outline is
 * its distance ahead of the line, millimetres.
 *
 * What is published and what is not:
 * - The three lengths are the person's (`IAutoMovieHumanNose` and `IAutoMovieHumanHeadIdentity.nasalBridgeLength`): height (nasion to
 *   subnasale), protrusion (subnasale to pronasale) and bridge length (nasion to pronasale). Three sides fix the triangle, so the tip's
 *   station and its distance ahead of the line follow in closed form. FaceBase's white adults give 54.7, 20.2 and 47.4 mm in women.
 * - The dorsum from nasion to the tip and the columella from subnasale to the tip are straight lines here. That is a convention of the
 *   surgical literature with no measured population behind it in what was read; on the f1 reference the dorsum runs up to 2.1 mm behind
 *   the straight line and the lobule up to 2.4 mm ahead of the columella's. A person's own outline replaces the two lines when read.
 * - The alar groove's course has no published form and is not in this law.
 */
export namespace AutoMovieHumanF1NoseLaw {
  /** One nose's measures, mm. */
  export interface INose {
    /** Nasion to subnasale. */
    height: number;

    /** Subnasale to pronasale. */
    protrusion: number;

    /** Nasion to pronasale. */
    bridge: number;
  }

  /** Pronasale in the nose's frame: its station from subnasale and its distance ahead of the line, by the law of cosines; the three lengths must close a triangle. */
  export function tip(nose: INose): [number, number] {
    const station: number = (nose.height ** 2 + nose.protrusion ** 2 - nose.bridge ** 2) / (2 * nose.height);
    const ahead: number = nose.protrusion ** 2 - station ** 2;
    if (!(ahead > 0)) throw new Error("nose law: the height, the protrusion and the bridge length close no triangle");
    return [station, Math.sqrt(ahead)];
  }

  /** The median outline's distance ahead of the line at a station from subnasale to nasion: the columella's straight line to the tip, then the dorsum's to nasion. */
  export function outline(nose: INose, t: number): number {
    const [station, ahead]: [number, number] = tip(nose);
    if (t <= 0 || t >= nose.height) return 0;
    return t <= station ? (ahead * t) / station : (ahead * (nose.height - t)) / (nose.height - station);
  }
}
