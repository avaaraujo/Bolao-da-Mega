import { mcpDiscovery, mcpOptions, mcpPost, mcpMethodNotAllowed } from "@/lib/agent/mcp-http";

export const dynamic = "force-dynamic";

// GET descreve o servidor; POST fala o protocolo (o mesmo servidor de /mcp).
export const GET = mcpDiscovery;
export const POST = mcpPost;
export const OPTIONS = mcpOptions;
export const DELETE = mcpMethodNotAllowed;
