import { dateKey, startOfDay } from "./time";
import type { TimeSegment } from "./types";

const DB_NAME = "01kit-timeline";
const STORE_NAME = "segments";
const DB_VERSION = 1;
const TIMELINE_RETENTION_DAYS = 90;
const MIN_WRITABLE_SEGMENT_MS = 1_000;
const MERGE_GAP_MS = 60_000;

export async function addTimelineSegment(domain: string, startedAt: number, endedAt: number): Promise<void> {
  const ms = Math.max(0, endedAt - startedAt);
  if (!domain || ms < MIN_WRITABLE_SEGMENT_MS) return;

  for (const segment of splitSegmentByDay(domain, startedAt, endedAt)) {
    await upsertTimelineSegment(segment);
  }
  await pruneTimelineSegments();
}

export async function getTimelineSegmentsForDay(day = dateKey()): Promise<TimeSegment[]> {
  const db = await openTimelineDb();
  const segments = await readStore<TimeSegment[]>(db, (store) => store.index("day").getAll(day));
  return segments.sort((a, b) => a.startedAt - b.startedAt);
}

export async function getAllTimelineSegments(): Promise<TimeSegment[]> {
  const db = await openTimelineDb();
  const segments = await readStore<TimeSegment[]>(db, (store) => store.getAll());
  return segments.sort((a, b) => a.startedAt - b.startedAt);
}

async function upsertTimelineSegment(segment: TimeSegment): Promise<void> {
  const db = await openTimelineDb();
  const sameDaySegments = await getTimelineSegmentsForDay(segment.day);
  const previous = sameDaySegments
    .filter((item) => item.endedAt <= segment.startedAt)
    .sort((a, b) => b.endedAt - a.endedAt)[0];

  if (previous && previous.domain === segment.domain && segment.startedAt - previous.endedAt <= MERGE_GAP_MS) {
    await writeStore(db, "readwrite", (store) => store.put({
      ...previous,
      endedAt: Math.max(previous.endedAt, segment.endedAt),
      ms: Math.max(previous.endedAt, segment.endedAt) - previous.startedAt
    }));
    return;
  }

  await writeStore(db, "readwrite", (store) => store.put(segment));
}

export async function restoreTimelineSegments(input: unknown): Promise<number> {
  if (!Array.isArray(input)) return 0;
  const segments = input.flatMap(normalizeTimelineSegment);
  if (segments.length === 0) return 0;

  const db = await openTimelineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    for (const segment of segments) store.put(segment);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  await pruneTimelineSegments();

  return segments.length;
}

export async function clearTimelineSegments(): Promise<void> {
  const db = await openTimelineDb();
  await writeStore(db, "readwrite", (store) => store.clear());
}

function openTimelineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("day", "day", { unique: false });
      store.createIndex("startedAt", "startedAt", { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readStore<T>(db: IDBDatabase, makeRequest: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = makeRequest(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function writeStore(db: IDBDatabase, mode: IDBTransactionMode, makeRequest: (store: IDBObjectStore) => IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    makeRequest(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function pruneTimelineSegments(now = Date.now()): Promise<void> {
  const cutoff = startOfDay(now) - TIMELINE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const db = await openTimelineDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const index = transaction.objectStore(STORE_NAME).index("startedAt");
    const request = index.openCursor(IDBKeyRange.upperBound(cutoff, true));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function normalizeTimelineSegment(item: unknown): TimeSegment[] {
  if (!item || typeof item !== "object" || Array.isArray(item)) return [];
  const value = item as Partial<TimeSegment>;
  const domain = typeof value.domain === "string" ? value.domain : "";
  const startedAt = typeof value.startedAt === "number" ? value.startedAt : 0;
  const endedAt = typeof value.endedAt === "number" ? value.endedAt : 0;
  const ms = typeof value.ms === "number" ? value.ms : endedAt - startedAt;
  if (!domain || !startedAt || !endedAt || endedAt <= startedAt || ms < MIN_WRITABLE_SEGMENT_MS) return [];

  return splitSegmentByDay(domain, startedAt, endedAt);
}

function splitSegmentByDay(domain: string, startedAt: number, endedAt: number): TimeSegment[] {
  const segments: TimeSegment[] = [];
  let cursor = startedAt;

  while (cursor < endedAt) {
    const nextDay = nextStartOfDay(cursor);
    const segmentEnd = Math.min(endedAt, nextDay);
    const ms = Math.max(0, segmentEnd - cursor);
    if (ms >= MIN_WRITABLE_SEGMENT_MS) {
      segments.push({
        id: `${cursor}-${segmentEnd}-${domain}`,
        day: dateKey(cursor),
        domain,
        startedAt: cursor,
        endedAt: segmentEnd,
        ms
      });
    }
    cursor = segmentEnd;
  }

  return segments;
}

function nextStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date.getTime();
}
