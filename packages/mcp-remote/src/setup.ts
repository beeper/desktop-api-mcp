import path from "path";
import os from "os";

process.env.MCP_REMOTE_CONFIG_DIR = process.env.MCP_REMOTE_CONFIG_DIR || path.join(os.homedir(), '.beeper-mcp-auth')
