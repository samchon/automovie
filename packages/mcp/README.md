# @automovie/mcp

Reads a production's Markdown as compact indices and exact, annotation-free sections, through one provider exposed as a local JSON command and a stdio MCP server. It never runs, authors, or judges the production.

## Use

```bash
npm install @automovie/mcp
automovie-reference --root /absolute/production --request '{"operation":"get_index_of_layer","layer":"settings"}'
automovie-mcp --root /absolute/production
```

| Operation | Returns |
| --- | --- |
| `get_index_of_layer` | Paged indices of one authored layer's files |
| `get_index_of_file` | One file's heading index with source ranges and revision |
| `read_section_without_annotations` | One section, with HTML comments removed and everything else original |
| `read_file_without_annotations` | One whole file, the same way |

Every response stays within a byte budget or is refused whole; a stale revision is refused so the caller rereads the index.
