# Voice preview with VoxCPM

Use this only for a voice preview the user requested under [audio](SKILL.md). [VoxCPM](https://github.com/OpenBMB/VoxCPM) is one local speech option; its README, [installation guide](https://voxcpm.readthedocs.io/en/latest/installation.html) and [quick start](https://voxcpm.readthedocs.io/en/latest/quickstart.html) own model versions, platform requirements and interfaces. Choose against the requested language, performance and the actual machine. Foley and designed sounds follow [sound effects](sound-effects.md).

Before an agent-managed installation, get the user's approval for the environment location, dependencies, model downloads and storage, including downloads the first inference triggers; an existing approval covering that setup is enough. Install in an isolated environment outside the JavaScript dependencies.

Generate one short take in the production's language and voice, measure it and have the user listen to it before any batch, keeping the checkpoint and settings with the take. Adopt accepted takes through [audio acquisition](acquisition.md#adopt-a-take), record the setup in [project context](../production/project-context.md), and document the commands in the README.
