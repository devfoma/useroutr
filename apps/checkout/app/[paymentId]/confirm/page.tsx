import { ConfirmPageClient } from "@/components/ConfirmPageClient";

export default function ConfirmPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  return <ConfirmPageClient params={params} />;
}