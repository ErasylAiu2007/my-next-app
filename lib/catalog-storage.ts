export const CATALOG_CATEGORIES = [
  "Видеомонтаж",
  "Съёмка",
  "Анимация",
  "Реклама",
  "Цветокоррекция",
] as const;

export type ServiceCategory = (typeof CATALOG_CATEGORIES)[number];
export type ServiceStatus = "published" | "draft";

export type Service = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  imageUrl: string;
  videoUrl: string;
  status: ServiceStatus;
  createdAt: string;
};

export type NewService = Omit<Service, "id" | "createdAt">;
export type ServiceUpdate = Partial<NewService>;

const STORAGE_KEY = "videomarket-services";
export const CATALOG_CHANGE_EVENT = "videomarket-services-changed";

const DEMO_SERVICES: Service[] = [
  {
    id: "service-montage",
    sellerId: "demo",
    title: "Монтаж, который держит внимание",
    description: "Монтаж исходного материала, подбор ритма и музыки, базовая цветокоррекция и один раунд правок.",
    category: "Видеомонтаж",
    price: 15000,
    imageUrl: "",
    videoUrl: "",
    status: "published",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "service-color",
    sellerId: "demo",
    title: "Цвет и настроение кадра",
    description: "Выразительная цветокоррекция для коротких роликов, интервью и рекламных видео.",
    category: "Цветокоррекция",
    price: 8000,
    imageUrl: "",
    videoUrl: "",
    status: "published",
    createdAt: "2025-01-16T10:00:00.000Z",
  },
  {
    id: "service-brand-ad",
    sellerId: "demo",
    title: "Ролик для вашего продукта",
    description: "Короткий рекламный ролик с монтажом, титрами и адаптацией под социальные сети.",
    category: "Реклама",
    price: 18000,
    imageUrl: "",
    videoUrl: "",
    status: "published",
    createdAt: "2025-01-17T10:00:00.000Z",
  },
  {
    id: "service-brand-film",
    sellerId: "seller-marat",
    title: "Сниму историю вашего бренда",
    description: "Съёмка и монтаж истории бренда: от подготовки до готового видео для вашей аудитории.",
    category: "Съёмка",
    price: 28000,
    imageUrl: "",
    videoUrl: "",
    status: "published",
    createdAt: "2025-01-18T10:00:00.000Z",
  },
  {
    id: "service-animation",
    sellerId: "seller-kira",
    title: "Оживлю ваш проект в 3D",
    description: "Создание короткой 3D-анимации для презентации идеи, продукта или нового проекта.",
    category: "Анимация",
    price: 12000,
    imageUrl: "",
    videoUrl: "",
    status: "published",
    createdAt: "2025-01-19T10:00:00.000Z",
  },
  {
    id: "service-event-film",
    sellerId: "seller-marat",
    title: "История вашего события",
    description: "Репортажная съёмка и монтаж яркого фильма о важном для вас событии.",
    category: "Съёмка",
    price: 32000,
    imageUrl: "",
    videoUrl: "",
    status: "published",
    createdAt: "2025-01-20T10:00:00.000Z",
  },
];

function isServiceCategory(value: unknown): value is ServiceCategory {
  return CATALOG_CATEGORIES.some((category) => category === value);
}

function isService(value: unknown): value is Service {
  if (!value || typeof value !== "object") return false;

  const service = value as Record<string, unknown>;
  return (
    typeof service.id === "string" &&
    typeof service.sellerId === "string" &&
    typeof service.title === "string" &&
    typeof service.description === "string" &&
    isServiceCategory(service.category) &&
    typeof service.price === "number" &&
    Number.isFinite(service.price) &&
    typeof service.imageUrl === "string" &&
    typeof service.videoUrl === "string" &&
    (service.status === "published" || service.status === "draft") &&
    typeof service.createdAt === "string"
  );
}

function emitCatalogChange() {
  window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
}

export function getServices(): Service[] {
  if (typeof window === "undefined") return DEMO_SERVICES.map((service) => ({ ...service }));

  const savedServices = window.localStorage.getItem(STORAGE_KEY);
  if (savedServices === null) {
    const initialServices = DEMO_SERVICES.map((service) => ({ ...service }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialServices));
    return initialServices;
  }

  let parsedServices: unknown;
  try {
    parsedServices = JSON.parse(savedServices);
  } catch (error) {
    console.error("Не удалось прочитать сохранённый каталог услуг.", error);
    throw new Error("Сохранённый каталог повреждён. Данные не были перезаписаны.");
  }

  if (!Array.isArray(parsedServices) || !parsedServices.every(isService)) {
    throw new Error("Сохранённый каталог имеет неверный формат. Данные не были перезаписаны.");
  }

  return parsedServices;
}

export function saveServices(services: Service[]): void {
  if (typeof window === "undefined") {
    throw new Error("Сохранение каталога доступно только в браузере.");
  }

  if (!services.every(isService)) {
    throw new Error("Нельзя сохранить каталог с некорректными данными услуги.");
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  emitCatalogChange();
}

export function createService(service: NewService): Service {
  const createdService: Service = {
    ...service,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveServices([...getServices(), createdService]);
  return createdService;
}

export function updateService(id: string, updates: ServiceUpdate): Service | null {
  const services = getServices();
  const existingService = services.find((service) => service.id === id);
  if (!existingService) return null;

  const updatedService = { ...existingService, ...updates, id: existingService.id, sellerId: existingService.sellerId, createdAt: existingService.createdAt };
  saveServices(services.map((service) => (service.id === id ? updatedService : service)));
  return updatedService;
}

export function deleteService(id: string): boolean {
  const services = getServices();
  const remainingServices = services.filter((service) => service.id !== id);
  if (remainingServices.length === services.length) return false;

  saveServices(remainingServices);
  return true;
}
