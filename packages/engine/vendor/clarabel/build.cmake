# Rebuild the committed WASM data from the locked, unmodified Rust dependencies.
# Invoke from any directory with an explicit disposable BUILD_DIR. Cargo and
# Rust 1.90.0 with the wasm32-wasip1 target must already be installed. This is a
# maintainer operation; ordinary package builds consume committed JSON bytes.
cmake_minimum_required(VERSION 3.19)
if(NOT DEFINED BUILD_DIR)
  message(FATAL_ERROR "Pass -DBUILD_DIR=<disposable absolute directory>.")
endif()
get_filename_component(BUILD_DIR "${BUILD_DIR}" ABSOLUTE)
set(SOURCE_DIR "${CMAKE_CURRENT_LIST_DIR}")
set(RUST_FLAGS "-C target-feature=-simd128 -C link-arg=-zstack-size=4194304")
execute_process(
  COMMAND "${CMAKE_COMMAND}" -E env "RUSTFLAGS=${RUST_FLAGS}"
    cargo +1.90.0 build --locked --release --target wasm32-wasip1
    --manifest-path "${SOURCE_DIR}/Cargo.toml" --target-dir "${BUILD_DIR}"
  COMMAND_ERROR_IS_FATAL ANY)
set(WASM_FILE "${BUILD_DIR}/wasm32-wasip1/release/automovie_quadratic.wasm")
file(READ "${WASM_FILE}" KERNEL_HEX HEX)
file(SHA256 "${WASM_FILE}" KERNEL_SHA)
file(SHA256 "${SOURCE_DIR}/src/lib.rs" BRIDGE_SHA)
file(SHA256 "${SOURCE_DIR}/Cargo.lock" LOCK_SHA)
configure_file("${SOURCE_DIR}/kernel.json.in"
  "${SOURCE_DIR}/../../src/math/quadraticKernelBytes.json" @ONLY NEWLINE_STYLE UNIX)
