// Shared types for the Jessica 3.0 chat UI

export type MessageRole = "user" | "jessica";

export interface ToolEvent {
  name: string;
  timestamp: number;
}

export interface TerminalOutput {
  tool: string;
  output: string;
  timestamp: number;
}

export interface StatusStep {
  phase: "thinking" | "subagent" | "tool" | "tool_done" | "reading" | "writing" | "searching" | "memory";
  detail: string;
  tool?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolEvents?: ToolEvent[];
  terminalOutputs?: TerminalOutput[];
  statusSteps?: StatusStep[];
  isStreaming?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  messageCount: number;
}

export interface StreamEvent {
  type: "status" | "response" | "token" | "done" | "error" | "todo" | "subagent" | "terminal" | "tool" | "ui";
  data: string | StatusStep | TodoTask[] | { tool: string; output: string; timestamp?: number } | { phase: string; detail: string; tool?: string } | any;
}

export interface TodoTask {
  task_description?: string;
  description?: string;
  task_status?: "pending" | "in-progress" | "in_progress" | "completed";
  status?: "pending" | "in-progress" | "in_progress" | "completed";
}
