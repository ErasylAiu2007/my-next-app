import { Suspense } from "react";
import { ServiceDetails } from "../../_components/catalog-interactive";

async function ServiceDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceDetails serviceId={id} />;
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="page-shell standard-page"><p>Загружаем услугу…</p></main>}>
      <ServiceDetailContent params={params} />
    </Suspense>
  );
}
