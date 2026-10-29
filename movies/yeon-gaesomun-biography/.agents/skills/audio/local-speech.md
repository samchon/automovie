# Optional local speech with VoxCPM

[VoxCPM](https://github.com/OpenBMB/VoxCPM) is one local speech option. Its [current upstream README](https://github.com/OpenBMB/VoxCPM) owns available model versions and Python, CLI and deployment interfaces; choose against the requested language, performance and actual machine rather than assume a historical checkpoint or hardware requirement. Consult its [installation guide](https://voxcpm.readthedocs.io/en/latest/installation.html) for platform and device requirements and its [quick start](https://voxcpm.readthedocs.io/en/latest/quickstart.html) for the existing Python, command-line, and web interfaces. These upstream documents own installation commands, model selection, and synthesis parameters.

For guidance only, explain which upstream path fits the user's machine. For an agent-managed installation, first obtain the user's approval for the environment location, dependencies, model downloads, and expected storage; an existing approval covering that setup is sufficient. Use an isolated environment outside the production's JavaScript dependencies. Account for downloads triggered by first inference, not just package installation.

After an approved setup, generate a short take in the production's language and intended voice using the upstream interface, listen to it, and measure its actual duration before generating a batch. Keep the chosen checkpoint and settings with the take's source record. A successful import alone does not verify speech generation or suitability for the production.

Adopt the accepted bytes and timings through [audio acquisition](acquisition.md#adopt-a-take).


Record the chosen local setup and resource authority through [production decisions](../production/profile.md), document actual commands in the production README, and keep credentials outside source and provenance. Use the existing supported interface before adding a source integration; verify that the real host consumes the accepted bytes.
