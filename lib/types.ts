export type EntityColor =
  | "brass" | "rust" | "teal" | "plum" | "olive" | "slate" | "rose";

export interface Entity {
  id: string;
  name: string;
  kind: "business" | "personal_creative" | "internal_tools" | "other";
  color: EntityColor;
  note?: string;
  createdAt: number;
}

export type ProjectType =
  | "brand_system"
  | "website"
  | "marketing_brief"
  | "business_launch"
  | "personal_creative"
  | "internal_app"
  | "template_redesign"
  | "display_ad"
  | "email_template"
  | "production"
  | "other";

export type TriageBucket = "now" | "next" | "someday" | "waiting";

export type ProjectStatus = "active" | "paused" | "done" | "archived";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
}

export interface Project {
  id: string;
  entityId: string;
  title: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  triage: TriageBucket;
  dueDate?: string;
  tags: string[];
  links: { label: string; url: string }[];
  tasks: Task[];
  notes?: string;
  collaborators: string[];
  shareToken?: string;
  createdAt: number;
  updatedAt: number;
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  brand_system: "Brand system",
  website: "Website",
  marketing_brief: "Marketing brief",
  business_launch: "Business launch",
  personal_creative: "Personal creative",
  internal_app: "Internal app / tool",
  template_redesign: "Template redesign",
  display_ad: "Display ad",
  email_template: "Email template",
  production: "Production",
  other: "Other",
};

export const TRIAGE_LABELS: Record<TriageBucket, string> = {
  now: "Now",
  next: "Next",
  someday: "Someday",
  waiting: "Waiting on someone",
};

export interface Collaborator {
  email: string;
  name: string;
  allowedEntityIds: string[];
  createdAt: number;
}

export const ENTITY_COLOR_HEX: Record<EntityColor, string> = {
  brass: "#d4a24e",
  rust: "#b8552f",
  teal: "#3f7268",
  plum: "#7a4f6b",
  olive: "#767a3f",
  slate: "#5b6b7a",
  rose: "#a4586b",
};
