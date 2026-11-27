import { AutoMovieEnginePicture } from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieControlRecord,
  IAutoMovieDrawnPass,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

import { guidePassFrameName } from "../../internal/guidePassFrameName";
import { guidePassFramePattern } from "../../internal/guidePassFramePattern";
import { AutoMovieRenderPicture } from "../../picture/AutoMovieRenderPicture";
import { controlConvention } from "../internal/controlConvention";

/*
 * Writes a render's control channels frame by frame and collects what
 * `controls/record.json` lists of them: per pass its convention, input pattern,
 * every frame's file digest and the sequence digest.
 *
 * Each frame's pictures are PNG-encoded and written as
 * `<frameDir>/<guidePassFrameName(index, pass)>`, such as
 * `frame_00042.depth.png`, through the host's `write`, and the SHA-256 of the
 * written bytes is kept, not of the pixels, because a manifest digests files.
 * The `mask` pass's convention is taken from the palette the page reported for
 * the first frame; a later frame painted with another palette is refused, since
 * one channel cannot carry two conventions.
 *
 * Frames must be added once each, in index order; `finish` returns the channels
 * in pass order.
 */
export class AutoMovieControlChannelWriter {
  /*
   * The passes, in request order.
   */
  private readonly passes: readonly Exclude<AutoMovieGuidePass, "beauty">[];

  /*
   * Folder the frame files are written into.
   */
  private readonly frameDir: string;

  /*
   * Store one file whole.
   */
  private readonly write: (path: string, data: Uint8Array) => Promise<void>;

  /*
   * Each pass's frames so far, parallel to `passes`.
   */
  private readonly frames: IAutoMovieControlRecord.IFrame[][];

  /*
   * The mask palette the first frame reported, null for the positional ramp,
   * undefined before any mask frame.
   */
  private mask: IAutoMovieSemanticMask | null | undefined;

  /*
   * Take the admitted passes, their folder and the host's file writer.
   */
  public constructor(props: {
    /*
     * Admitted control passes, in request order.
     */
    passes: readonly Exclude<AutoMovieGuidePass, "beauty">[];

    /*
     * Folder the frame files are written into.
     */
    frameDir: string;

    /*
     * Store one file whole.
     */
    write: (path: string, data: Uint8Array) => Promise<void>;
  }) {
    this.passes = props.passes;
    this.frameDir = props.frameDir;
    this.write = props.write;
    this.frames = props.passes.map((): IAutoMovieControlRecord.IFrame[] => []);
  }

  /*
   * Write one output frame's control pictures, `pictures` holding one drawn
   * pass per control pass in the same order.
   *
   * It rejects when a picture is of another pass than expected, when the mask
   * palette changes between frames, or when a write fails.
   */
  public async add(
    index: number,
    seconds: number,
    pictures: readonly IAutoMovieDrawnPass[],
  ): Promise<void> {
    for (const [slot, pass] of this.passes.entries()) {
      const drawn: IAutoMovieDrawnPass | undefined = pictures[slot];
      if (drawn?.pass !== pass)
        throw new Error(
          `Control frame ${index} has no ${pass} picture in its place`,
        );
      if (pass === "mask") this.admitMask(index, drawn.semanticMask ?? null);
      // The graphics plate keeps its straight alpha as the compositing matte.
      const bytes: Uint8Array = await AutoMovieRenderPicture.encodeRasterPng(
        drawn.picture,
        {
          alpha: pass === "graphics",
        },
      );
      await this.write(
        `${this.frameDir}/${guidePassFrameName(index, pass)}`,
        bytes,
      );
      this.frames[slot]!.push({
        index,
        seconds,
        sha256: hex(AutoMovieEnginePicture.digestAutoMovieBytes(bytes)),
      });
    }
  }

  /*
   * The channels written, in pass order, each with its convention and its
   * sequence digest.
   */
  public finish(): IAutoMovieControlRecord.IChannel[] {
    return this.passes.map(
      (
        pass: Exclude<AutoMovieGuidePass, "beauty">,
        slot: number,
      ): IAutoMovieControlRecord.IChannel => {
        const frames: IAutoMovieControlRecord.IFrame[] = this.frames[slot]!;

        // The sequence digest hashes the frame digests as text lines, so a
        // reader recomputes it from the record alone.
        const lines: string = frames
          .map(
            (frame: IAutoMovieControlRecord.IFrame): string =>
              `${frame.sha256}\n`,
          )
          .join("");
        return {
          pass,
          convention: controlConvention(pass, this.mask ?? null),
          inputPattern: guidePassFramePattern(pass),
          frameCount: frames.length,
          sequenceSha256: hex(
            AutoMovieEnginePicture.digestAutoMovieBytes(new TextEncoder().encode(lines)),
          ),
          frames,
        };
      },
    );
  }

  /*
   * Keep the first mask frame's palette and refuse a later frame painted with
   * another.
   */
  private admitMask(index: number, mask: IAutoMovieSemanticMask | null): void {
    if (this.mask === undefined) {
      this.mask = mask;
      return;
    }
    if ((this.mask?.digest ?? null) !== (mask?.digest ?? null))
      throw new Error(
        `Control frame ${index} painted its mask with another palette than frame 0`,
      );
  }
}

/*
 * The 64 hexadecimal digits of a `sha256:` digest.
 */
function hex(digest: string): string {
  return digest.slice("sha256:".length);
}
