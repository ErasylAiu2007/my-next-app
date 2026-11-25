import { Suspense } from "react";
import { SellerProfile } from "../../_components/catalog-interactive";

async function SellerProfileContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerProfile sellerId={id} />;
}

export default function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="page-shell standard-page"><p>Загружаем профиль продавца…</p></main>}>
      <SellerProfileContent params={params} />
    </Suspense>
  );
}
