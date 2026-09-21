cmake_minimum_required(VERSION 3.18)
project(automovie_quadratic C)
include(FetchContent)

# The generated provenance must describe the compiler that actually emitted it.
if(NOT EMSCRIPTEN_VERSION STREQUAL "6.0.9")
  message(FATAL_ERROR "Activate Emscripten 6.0.9 before configuring this kernel.")
endif()

# The upstream source and its QDLDL v0.1.8 dependency remain unmodified.
# Configure through pinned Emscripten 6.0.9, not a host native compiler.
set(OSQP_BUILD_SHARED_LIB OFF CACHE BOOL "" FORCE)
set(OSQP_BUILD_STATIC_LIB ON CACHE BOOL "" FORCE)
set(OSQP_BUILD_DEMO_EXE OFF CACHE BOOL "" FORCE)
set(OSQP_USE_FLOAT OFF CACHE BOOL "" FORCE)
set(OSQP_USE_LONG OFF CACHE BOOL "" FORCE)
set(OSQP_ENABLE_PRINTING OFF CACHE BOOL "" FORCE)
set(OSQP_ENABLE_PROFILING OFF CACHE BOOL "" FORCE)
set(OSQP_ENABLE_INTERRUPT OFF CACHE BOOL "" FORCE)
set(OSQP_CODEGEN OFF CACHE BOOL "" FORCE)
set(OSQP_ENABLE_DERIVATIVES OFF CACHE BOOL "" FORCE)
FetchContent_Declare(qdldl
  GIT_REPOSITORY https://github.com/osqp/qdldl.git
  GIT_TAG 138fdac58b9cd1c4137ff1b99152c8108a6cff5b)
FetchContent_Declare(osqp
  GIT_REPOSITORY https://github.com/osqp/osqp.git
  GIT_TAG 236713ce9a56c182ac3230d52108f952afce1523)
FetchContent_MakeAvailable(osqp)

add_executable(automovie_quadratic bridge.c)
target_link_libraries(automovie_quadratic PRIVATE osqpstatic)
target_compile_options(automovie_quadratic PRIVATE -O3)
target_link_options(automovie_quadratic PRIVATE
  -O3 --no-entry -sSTANDALONE_WASM=1 -sALLOW_MEMORY_GROWTH=1
  "-sEXPORTED_FUNCTIONS=['_automovie_quadratic_solve','_malloc','_free']")
set_target_properties(automovie_quadratic PROPERTIES SUFFIX ".wasm")
add_custom_command(TARGET automovie_quadratic POST_BUILD
  COMMAND ${CMAKE_COMMAND}
    "-DWASM_FILE=$<TARGET_FILE:automovie_quadratic>"
    "-DOUTPUT_FILE=${CMAKE_CURRENT_BINARY_DIR}/quadraticKernelBytes.json"
    -P "${CMAKE_CURRENT_SOURCE_DIR}/emit.cmake")
