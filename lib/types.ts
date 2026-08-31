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
  | "events"
  | "copy"
  | "billing"
  | "other";

export type TriageBucket = "now" | "next" | "someday" | "waiting";

export type ProjectStatus = "active" | "paused" | "done" | "archived";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  visibleToCollaborators?: boolean;
}

export interface Link {
  id: string;
  label: string;
  url: string;
  visibleToCollaborators?: boolean;
}

export type BillingItemStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export interface BillingLineItem {
  description: string;
  quantity: number;
  amountCents: number;
  hours?: number;
}

export interface BillingItem {
  id: string;
  description: string;
  amountCents: number;
  currency: string;
  status: BillingItemStatus;
  stripeCustomerId: string;
  stripeInvoiceId: string;
  invoiceNumber?: string;
  hostedInvoiceUrl?: string;
  lineItems: BillingLineItem[];
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
  visibleToCollaborators?: boolean;
}

export const BILLING_STATUS_LABELS: Record<BillingItemStatus, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  void: "Void",
  uncollectible: "Uncollectible",
};

export interface SessionLog {
  id: string;
  // Calendar day the work happened, in Pacific time (YYYY-MM-DD). Stored as a
  // string rather than derived from a timestamp so "search by day" is a plain
  // string match and never drifts across a UTC boundary.
  day: string;
  startedAt: number;
  endedAt: number;
  durationMin: number;
  // Groups many logs under one long-running effort so a project accumulates
  // phases instead of spawning new projects for every stretch of work.
  phase?: string;
  summary: string;
  body?: string;
  tasksTouched: string[];
  // Path to the durable markdown file on disk. That file is the source of
  // truth; this record is a browsable copy of it.
  filePath: string;
  repo?: string;
  sessionId?: string;
  billable?: boolean;
  createdAt: number;
  updatedAt: number;
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
  links: Link[];
  tasks: Task[];
  billingItems: BillingItem[];
  // Internal work notes. Deliberately has no visibleToCollaborators flag
  // anywhere in this type: session logs are owner-only, unconditionally,
  // and lib/visibility.ts strips them on every non-owner path.
  sessionLogs: SessionLog[];
  notes?: string;
  collaborators: string[];
  shareToken?: string;
  gated?: boolean;
  teaserMessage?: string;
  teaserTitle?: string;
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
  events: "Events",
  copy: "Copy",
  billing: "Billing",
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
