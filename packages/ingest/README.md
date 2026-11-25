# @automovie/ingest

Decode external media into AutoMovie data. Use it to inspect glTF, GLB or VRM assets, decode WAVE audio or read a P6 PPM image. Your application reads the files and passes in the bytes.

## Start

```powershell
npm install @automovie/ingest
```

| Entry | Use |
| --- | --- |
| `inspectAutoMovieExternalModelBytes` | Check a model against a named asset profile |
| `adoptAutoMovieExternalMotion` | Check whether a motion take can be used or retargeted |
| `decodeProductionAudioAsset` | Decode WAVE audio into mono samples |
| `decodeAutoMoviePpmImage` | Decode P6 pixels under explicit size and transfer limits |

Each function's JSDoc lists supported formats and failure results. [API reference](https://samchon.github.io/automovie/api/).
