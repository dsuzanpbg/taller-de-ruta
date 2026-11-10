/**
 * Pedidos de la tienda (Taller de Ruta).
 *
 * MVP sin base de datos: los pedidos viven en un archivo JSON Lines, una orden
 * por linea, en `store/data/orders.jsonl`.
 *
 * - `appendOrder`  agrega una orden (idempotente: si el id ya existe, la actualiza).
 * - `getOrder`     busca una orden por id.
 * - `listOrders`   devuelve todas las ordenes.
 * - `updateOrder`  cambia una orden y re-escribe el archivo completo.
 *
 * El webhook de Mercado Pago puede llegar varias veces por el mismo pago, y
 * varias peticiones pueden caer al mismo tiempo (dos ventas en el mismo
 * segundo). Por eso todas las escrituras pasan por un lock de archivo
 * (`.lock`) y se escriben de forma atomica (archivo temporal + rename).
 */

import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

export type OrderStatus =
  | "paid"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "paid",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
];

export type OrderItem = {
  /** slug del catalogo de la tienda */
  slug: string;
  name: string;
  qty: number;
  /** precio de venta unitario en MXN */
  unitPrice: number;
};

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  /** direccion de entrega en texto plano (la que se le da al proveedor) */
  address: string;
};

export type OrderSupplier = {
  /** id del item en AliExpress */
  itemId: string;
  /** liga de seguimiento del proveedor */
  trackingUrl?: string;
  /** numero de guia del paquete */
  trackingNumber?: string;
  /** ISO date de cuando se compro al proveedor */
  orderedAt?: string;
  /** costo de la compra al proveedor en MXN */
  costMXN?: number;
};

export type StoreOrder = {
  /** es la `external_reference` de Mercado Pago (TDR-XXXX-XXXX) */
  id: string;
  /** ISO date de creacion */
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: OrderCustomer;
  supplier: OrderSupplier;
  notes: string;
};

export type OrderPatch = Partial<
  Omit<StoreOrder, "id" | "createdAt" | "items" | "customer" | "supplier">
> & {
  items?: OrderItem[];
  customer?: Partial<OrderCustomer>;
  supplier?: Partial<OrderSupplier>;
};

export type ListOrdersOptions = {
  status?: OrderStatus;
  limit?: number;
  /** por defecto las mas recientes primero */
  newestFirst?: boolean;
};

/**
 * Mapa de slug de la tienda -> item de AliExpress.
 * Se usa para saber que comprarle al proveedor cuando entra una venta.
 */
export const SUPPLIER_ITEMS: Record<string, string> = {
  "kit-soporte-celular-moto-antivibracion-360": "1005008713355223",
};

const LOCK_TIMEOUT_MS = 10_000;
const LOCK_STALE_MS = 60_000;
const FILE_ENCODING = "utf8";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

/**
 * Sube desde el directorio actual hasta encontrar la raiz de la tienda
 * (la carpeta que contiene `src/app`). Asi el archivo de pedidos se ubica
 * bien aunque Next arranque desde otra carpeta.
 */
function resolveStoreRoot(): string {
  let dir = process.cwd();

  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(path.join(dir, "src", "app"))) return dir;

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return process.cwd();
}

export function getDataDir(): string {
  const fromEnv = process.env.ORDERS_DIR;
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(resolveStoreRoot(), "data");
}

export function getOrdersFile(): string {
  const fromEnv = process.env.ORDERS_FILE;
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(getDataDir(), "orders.jsonl");
}

function getLockFile(): string {
  return `${getOrdersFile()}.lock`;
}

// ---------------------------------------------------------------------------
// Lock de archivo
// ---------------------------------------------------------------------------

async function acquireLock(lockPath: string): Promise<() => Promise<void>> {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  for (;;) {
    try {
      const handle = await fs.open(lockPath, "wx");
      await handle.close();

      return async () => {
        await fs.rm(lockPath, { force: true });
      };
    } catch {
      // Si el lock lleva mucho tiempo existiendo, el proceso que lo creo
      // murio: lo liberamos para no bloquear la tienda para siempre.
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          await fs.rm(lockPath, { force: true });
          continue;
        }
      } catch {
        // el lock ya no existe: reintentamos tomarlo
      }

      if (Date.now() > deadline) {
        throw new Error("No se pudo obtener el lock de pedidos (timeout).");
      }

      await sleep(40 + Math.random() * 90);
    }
  }
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const lockPath = getLockFile();
  await fs.mkdir(path.dirname(lockPath), { recursive: true });

  const release = await acquireLock(lockPath);

  try {
    return await fn();
  } finally {
    await release();
  }
}

// ---------------------------------------------------------------------------
// Lectura / escritura
// ---------------------------------------------------------------------------

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toStatus(value: unknown): OrderStatus {
  return typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : "paid";
}

/** Convierte cualquier objeto leido del disco en una orden valida. */
export function normalizeOrder(input: unknown): StoreOrder | undefined {
  if (!input || typeof input !== "object") return undefined;

  const raw = input as Record<string, unknown>;
  const id = toText(raw.id).trim();
  if (!id) return undefined;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: OrderItem[] = rawItems.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const slug = toText(item.slug).trim();
    if (!slug) return [];
    return [
      {
        slug,
        name: toText(item.name, slug),
        qty: Math.max(1, Math.trunc(toNumber(item.qty, 1))),
        unitPrice: toNumber(item.unitPrice, 0),
      },
    ];
  });

  const rawCustomer = (raw.customer ?? {}) as Record<string, unknown>;
  const rawSupplier = (raw.supplier ?? {}) as Record<string, unknown>;

  const supplier: OrderSupplier = {
    itemId: toText(rawSupplier.itemId).trim(),
  };
  if (rawSupplier.trackingUrl) supplier.trackingUrl = toText(rawSupplier.trackingUrl);
  if (rawSupplier.trackingNumber)
    supplier.trackingNumber = toText(rawSupplier.trackingNumber);
  if (rawSupplier.orderedAt) supplier.orderedAt = toText(rawSupplier.orderedAt);
  if (rawSupplier.costMXN !== undefined)
    supplier.costMXN = toNumber(rawSupplier.costMXN, 0);

  return {
    id,
    createdAt: toText(raw.createdAt, new Date().toISOString()),
    status: toStatus(raw.status),
    items,
    subtotal: toNumber(raw.subtotal, 0),
    shipping: toNumber(raw.shipping, 0),
    total: toNumber(raw.total, 0),
    customer: {
      name: toText(rawCustomer.name),
      email: toText(rawCustomer.email),
      phone: toText(rawCustomer.phone),
      address: toText(rawCustomer.address),
    },
    supplier,
    notes: toText(raw.notes),
  };
}

async function readAll(): Promise<StoreOrder[]> {
  const file = getOrdersFile();

  let raw: string;
  try {
    raw = await fs.readFile(file, FILE_ENCODING);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const orders: StoreOrder[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const order = normalizeOrder(JSON.parse(trimmed));
      if (order) orders.push(order);
    } catch {
      // linea corrupta: la saltamos para no perder el resto del archivo
    }
  }

  return orders;
}

/** Escribe todas las ordenes de forma atomica (temporal + rename). */
async function writeAll(orders: StoreOrder[]): Promise<void> {
  const file = getOrdersFile();
  await fs.mkdir(path.dirname(file), { recursive: true });

  const body =
    orders.length > 0
      ? `${orders.map((order) => JSON.stringify(order)).join("\n")}\n`
      : "";

  const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  await fs.writeFile(tmp, body, FILE_ENCODING);
  await fs.rename(tmp, file);
}

// ---------------------------------------------------------------------------
// API publica
// ---------------------------------------------------------------------------

/**
 * Agrega una orden. Si ya existe una orden con el mismo id (el webhook de
 * Mercado Pago puede repetirse) se actualiza en su lugar.
 */
export async function appendOrder(order: StoreOrder): Promise<StoreOrder> {
  const normalized = normalizeOrder(order);
  if (!normalized) {
    throw new Error("No se pudo guardar la orden: falta el id.");
  }

  return withLock(async () => {
    const orders = await readAll();
    const index = orders.findIndex((entry) => entry.id === normalized.id);

    if (index >= 0) {
      const current = orders[index];
      const merged: StoreOrder = {
        ...current,
        ...normalized,
        id: current.id,
        createdAt: current.createdAt,
        customer: { ...current.customer, ...normalized.customer },
        supplier: { ...current.supplier, ...normalized.supplier },
      };

      orders[index] = merged;
      await writeAll(orders);
      return merged;
    }

    orders.push(normalized);
    await writeAll(orders);
    return normalized;
  });
}

/** Busca una orden por id. Regresa `undefined` si no existe. */
export async function getOrder(id: string): Promise<StoreOrder | undefined> {
  const wanted = id.trim();
  if (!wanted) return undefined;

  const orders = await readAll();
  return orders.find((order) => order.id === wanted);
}

/** Lista las ordenes guardadas (mas recientes primero, por defecto). */
export async function listOrders(
  options: ListOrdersOptions = {},
): Promise<StoreOrder[]> {
  const orders = await readAll();

  let result = orders;
  if (options.status) {
    result = result.filter((order) => order.status === options.status);
  }

  const sorted = [...result].sort((a, b) => {
    const diff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (Number.isFinite(diff) && diff !== 0) return diff;
    return orders.indexOf(b) - orders.indexOf(a);
  });

  const ordered = options.newestFirst === false ? sorted.reverse() : sorted;

  return typeof options.limit === "number" && options.limit >= 0
    ? ordered.slice(0, options.limit)
    : ordered;
}

/**
 * Actualiza una orden (estado, guia, notas, etc.) y re-escribe el archivo.
 * Regresa la orden actualizada o `undefined` si el id no existe.
 */
export async function updateOrder(
  id: string,
  patch: OrderPatch,
): Promise<StoreOrder | undefined> {
  const wanted = id.trim();
  if (!wanted) return undefined;

  return withLock(async () => {
    const orders = await readAll();
    const index = orders.findIndex((order) => order.id === wanted);
    if (index < 0) return undefined;

    const current = orders[index];
    const next: StoreOrder = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      status: patch.status ?? current.status,
      items: patch.items ?? current.items,
      notes: patch.notes ?? current.notes,
      customer: { ...current.customer, ...(patch.customer ?? {}) },
      supplier: { ...current.supplier, ...(patch.supplier ?? {}) },
    };

    orders[index] = next;
    await writeAll(orders);
    return next;
  });
}

/** Atajo para pegar la guia del proveedor a una orden. */
export async function attachTracking(
  id: string,
  tracking: {
    trackingNumber?: string;
    trackingUrl?: string;
    costMXN?: number;
    orderedAt?: string;
    itemId?: string;
  },
): Promise<StoreOrder | undefined> {
  const supplier: Partial<OrderSupplier> = {};
  if (tracking.itemId !== undefined) supplier.itemId = tracking.itemId;
  if (tracking.trackingNumber !== undefined)
    supplier.trackingNumber = tracking.trackingNumber;
  if (tracking.trackingUrl !== undefined)
    supplier.trackingUrl = tracking.trackingUrl;
  if (tracking.costMXN !== undefined) supplier.costMXN = tracking.costMXN;
  if (tracking.orderedAt !== undefined) supplier.orderedAt = tracking.orderedAt;

  return updateOrder(id, { supplier });
}
