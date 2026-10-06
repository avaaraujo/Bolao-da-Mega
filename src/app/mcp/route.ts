import { mcpMethodNotAllowed, mcpOptions, mcpPost } from "@/lib/agent/mcp-http";

export const dynamic = "force-dynamic";

export const POST = mcpPost;
export const OPTIONS = mcpOptions;
export const GET = mcpMethodNotAllowed;
export const DELETE = mcpMethodNotAllowed;
