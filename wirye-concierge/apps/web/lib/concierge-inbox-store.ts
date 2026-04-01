import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type ConciergeInboxStatus =
  | "new"
  | "triage"
  | "assigned"
  | "pending_guest"
  | "resolved";

export type ConciergeInboxPriority = "normal" | "high" | "urgent";

export type ConciergeInboxProvider = "gemini" | "fallback" | "manual";

export type ConciergeInboxNote = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type ConciergeInboxItem = {
  id: string;
  hotelId: string;
  question: string;
  answer: string;
  route: string;
  provider: ConciergeInboxProvider;
  reason: string;
  status: ConciergeInboxStatus;
  priority: ConciergeInboxPriority;
  assignee: string | null;
  tags: string[];
  notes: ConciergeInboxNote[];
  createdAt: string;
  updatedAt: string;
};

type ConciergeInboxStore = {
  items: ConciergeInboxItem[];
};

type ListInboxParams = {
  status?: ConciergeInboxStatus | "open" | "all";
  limit?: number;
  query?: string;
};

type CreateInboxInput = {
  hotelId?: string | null;
  question: string;
  answer: string;
  route?: string;
  provider?: ConciergeInboxProvider;
  reason: string;
  status?: ConciergeInboxStatus;
  priority?: ConciergeInboxPriority;
  assignee?: string | null;
  tags?: string[];
  note?: {
    text: string;
    author?: string;
  };
};

type UpdateInboxInput = {
  status?: ConciergeInboxStatus;
  priority?: ConciergeInboxPriority;
  assignee?: string | null;
  tags?: string[];
  note?: {
    text: string;
    author?: string;
  };
};

type InboxSummary = {
  total: number;
  open: number;
  new: number;
  assigned: number;
  pendingGuest: number;
  resolved: number;
  urgent: number;
};

const DEFAULT_HOTEL_ID =
  process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID ?? "HOTEL_WIRYE_MILITOPIA_001";

let writeQueue: Promise<void> = Promise.resolve();

function isOpenStatus(status: ConciergeInboxStatus): boolean {
  return status !== "resolved";
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  ).slice(0, 12);
}

function resolveStorePath(): string {
  const configured = process.env.CONCIERGE_INBOX_STORE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }

  const cwd = process.cwd();
  if (cwd.endsWith(`${path.sep}apps${path.sep}web`)) {
    return path.join(cwd, ".concierge", "inbox.json");
  }
  if (existsSync(path.join(cwd, "apps", "web"))) {
    return path.join(cwd, "apps", "web", ".concierge", "inbox.json");
  }
  return path.join(cwd, ".concierge", "inbox.json");
}

const STORE_PATH = resolveStorePath();

async function ensureStoreFile() {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  if (existsSync(STORE_PATH)) {
    return;
  }
  const empty: ConciergeInboxStore = { items: [] };
  await writeFile(STORE_PATH, JSON.stringify(empty, null, 2), "utf8");
}

async function readStore(): Promise<ConciergeInboxStore> {
  await ensureStoreFile();
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as ConciergeInboxStore;
    if (!Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return {
      items: parsed.items.filter(Boolean),
    };
  } catch {
    return { items: [] };
  }
}

async function writeStore(store: ConciergeInboxStore) {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function nextId() {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `inbox_${now}_${rand}`;
}

function sortItems(items: ConciergeInboxItem[]): ConciergeInboxItem[] {
  return [...items].sort((a, b) => {
    if (a.status === "resolved" && b.status !== "resolved") {
      return 1;
    }
    if (a.status !== "resolved" && b.status === "resolved") {
      return -1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

async function withStoreMutation<T>(
  handler: (store: ConciergeInboxStore) => T | Promise<T>,
): Promise<T> {
  let result!: T;
  writeQueue = writeQueue.then(async () => {
    const store = await readStore();
    result = await handler(store);
    await writeStore(store);
  });
  await writeQueue;
  return result;
}

export async function listInboxItems(params?: ListInboxParams): Promise<ConciergeInboxItem[]> {
  const store = await readStore();
  const statusFilter = params?.status ?? "all";
  const limitRaw = params?.limit ?? 200;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, limitRaw) : 200;
  const query = (params?.query ?? "").trim().toLowerCase();

  const filtered = store.items.filter((item) => {
    if (statusFilter === "open" && !isOpenStatus(item.status)) {
      return false;
    }
    if (
      statusFilter !== "open" &&
      statusFilter !== "all" &&
      typeof statusFilter === "string" &&
      item.status !== statusFilter
    ) {
      return false;
    }
    if (!query) {
      return true;
    }
    const bucket = [
      item.question,
      item.answer,
      item.reason,
      item.assignee ?? "",
      item.tags.join(" "),
      ...item.notes.map((note) => note.text),
    ]
      .join(" ")
      .toLowerCase();
    return bucket.includes(query);
  });

  return sortItems(filtered).slice(0, limit);
}

export async function createInboxItem(input: CreateInboxInput): Promise<ConciergeInboxItem> {
  const now = new Date().toISOString();
  const initialStatus: ConciergeInboxStatus = input.status ?? "new";
  const tags = normalizeTags(input.tags);

  return withStoreMutation((store) => {
    const item: ConciergeInboxItem = {
      id: nextId(),
      hotelId: input.hotelId?.trim() || DEFAULT_HOTEL_ID,
      question: input.question.trim(),
      answer: input.answer.trim(),
      route: input.route?.trim() || "/faq",
      provider: input.provider ?? "fallback",
      reason: input.reason.trim() || "handoff_requested",
      status: initialStatus,
      priority: input.priority ?? "normal",
      assignee: input.assignee?.trim() || null,
      tags,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };

    if (input.note?.text?.trim()) {
      item.notes.push({
        id: nextId(),
        author: input.note.author?.trim() || "system",
        text: input.note.text.trim(),
        createdAt: now,
      });
    }

    store.items.push(item);
    return item;
  });
}

export async function updateInboxItem(
  itemId: string,
  patch: UpdateInboxInput,
): Promise<ConciergeInboxItem | null> {
  const now = new Date().toISOString();
  return withStoreMutation((store) => {
    const item = store.items.find((entry) => entry.id === itemId);
    if (!item) {
      return null;
    }

    if (patch.status) {
      item.status = patch.status;
    }
    if (patch.priority) {
      item.priority = patch.priority;
    }
    if (patch.assignee !== undefined) {
      item.assignee = patch.assignee?.trim() || null;
    }
    if (patch.tags) {
      item.tags = normalizeTags(patch.tags);
    }
    if (patch.note?.text?.trim()) {
      item.notes.push({
        id: nextId(),
        author: patch.note.author?.trim() || "admin",
        text: patch.note.text.trim(),
        createdAt: now,
      });
    }

    item.updatedAt = now;
    return item;
  });
}

export async function getInboxSummary(): Promise<InboxSummary> {
  const store = await readStore();
  const items = store.items;
  return {
    total: items.length,
    open: items.filter((item) => isOpenStatus(item.status)).length,
    new: items.filter((item) => item.status === "new").length,
    assigned: items.filter((item) => item.status === "assigned").length,
    pendingGuest: items.filter((item) => item.status === "pending_guest").length,
    resolved: items.filter((item) => item.status === "resolved").length,
    urgent: items.filter((item) => item.priority === "urgent").length,
  };
}
