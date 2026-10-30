# Local speech setup

The adopted speech source is [VoxCPM](https://github.com/OpenBMB/VoxCPM), running locally outside deterministic playback. This computer has a CPU runtime at `D:/github/samchon/.automovie-runtime/voxcpm`, created with Python 3.12.14. The observed installed versions are VoxCPM 2.0.3, Torch 2.15.0+cpu, Torchaudio 2.11.1+cpu and SoundFile 0.14.0. The probe used 12 CPU threads; no CUDA device was used.

Model storage is `D:/github/samchon/.automovie-runtime/huggingface`. The loaded `openbmb/VoxCPM2` snapshot is `32279effe8c19989596f05d353d1447f51d9e915`. Retain model and package identities when selecting actual takes; the current upstream example's `seed` argument is unsupported by this installed `generate` signature. Set the Torch seed before generation instead. A seed does not preserve accepted audio bytes.

The following command produced the actual probe:

```powershell
$env:HF_HOME = 'D:/github/samchon/.automovie-runtime/huggingface'
@'
import torch
import soundfile as sf
from voxcpm import VoxCPM

torch.set_num_threads(12)
torch.manual_seed(42)
model = VoxCPM.from_pretrained(
    'openbmb/VoxCPM2', load_denoiser=False,
    optimize=False, device='cpu', local_files_only=True,
)
wav = model.generate(
    text='Orders to concentrate the corps. Take them.',
    cfg_value=2.0, inference_timesteps=10,
)
sf.write(
    'D:/github/samchon/.automovie-runtime/voxcpm/probe-orders.wav',
    wav, model.tts_model.sample_rate,
)
'@ | & 'D:/github/samchon/.automovie-runtime/voxcpm/Scripts/python.exe'
```

The observed file contains 145,920 mono frames at 48,000 Hz: 3.04 seconds. Its SHA-256 is `789a4782541ededeb48aa371ace9f820bb988785f6c6f557b29f02754c3a6f90`; peak amplitude is 0.6052 and RMS is 0.06980. Loading and generation took about 44 seconds. These measurements establish an actual non-silent file and that invocation, not intelligibility, pronunciation, acting quality or synchronization. The probe has not received listening acceptance and is not an accepted film take.

Generate and audition actual character takes through [audio acquisition](../../.agents/skills/audio/acquisition.md). Retain accepted originals and required derivatives under project-owned static media with source, model/settings, rights and digest records. Measure their durations before shot timing, caption placement and the final mix. Regeneration, conversion or trimming creates a new take requiring its affected checks. The [episode commission](../../PROJECT.md) supplies authority; the current probe does not establish an assembled soundtrack or delivered video.
