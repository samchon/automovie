# CMake emits data, not a second JavaScript implementation of the solver.
# Normal TypeScript builds consume this committed JSON without fetching tools.
file(READ "${WASM_FILE}" KERNEL_HEX HEX)
file(SHA256 "${WASM_FILE}" KERNEL_SHA)
configure_file("${CMAKE_CURRENT_LIST_DIR}/kernel.json.in" "${OUTPUT_FILE}" @ONLY)
