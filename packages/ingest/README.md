# @automovie/ingest

Brings external media into AutoMovie's types, deterministically: glTF, GLB, and VRM documents become models, skeletons, and clips, and RIFF/WAVE audio becomes observed source facts with a finite sample buffer. The same bytes always produce the same records.

It reads only the bytes a host hands it. Files, downloads, browsers, mixing, and delivery checks belong to the host, `engine`, and `production`.

## Use

```bash
npm install @automovie/ingest
```

| Callable | Purpose |
| --- | --- |
| `inspectAutoMovieExternalModelBytes` | Validate glTF, GLB, or VRM bytes against a closed ingest profile, with their exact sidecars |
| `ingestDocument`, `humanoidSkeleton` | Convert a parsed document into models, skeletons, and clips |
| `decodeProductionAudioAsset` | Decode RIFF/WAVE bytes into observed format facts and a mono sample buffer |
| `decodeAutoMoviePpmImage` | Decode one bounded P6 RGB8 image with an explicit `srgb`, `bt709` or `linear` sample convention |

A structural defect, such as an unknown attached bone, is refused with its cause; nothing is guessed or substituted.

The standalone `@automovie/ingest/ppm` entry exports `decodeAutoMoviePpmImage` without importing the glTF SDK or its declaration-library requirements. The P6 decoder accepts maxval 255 and exactly one whitespace delimiter after it. It retains raster bytes, including whitespace and `#`, without gamma conversion or orientation changes. Supply `maxPixels` and `maxHeaderBytes`; P3, 16-bit samples, multiple images, trailing bytes and truncated rasters refuse. Filesystem paths and expected byte hashes belong to the calling host.
