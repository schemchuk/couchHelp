export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  // Блок 03 — детальна картка клієнта
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Картка клієнта</h1>
      <p className="text-slate-500">Coming in Block 03</p>
    </div>
  )
}
