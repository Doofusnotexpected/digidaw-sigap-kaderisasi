export default function Memuat() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Memuat">
      <div className="h-9 w-64 rounded-[10px] bg-[#e1e6eb] animate-pulse" />
      <div className="h-40 rounded-[14px] bg-[#e6eaee] animate-pulse" />
      <div className="h-72 rounded-[14px] bg-[#e6eaee] animate-pulse" />
    </div>
  );
}
