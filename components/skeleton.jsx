export function SkeletonCard() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="skeleton h-36 rounded-2xl" />
      <div className="skeleton mt-5 h-5 w-2/3 rounded-full" />
      <div className="skeleton mt-3 h-4 w-full rounded-full" />
    </div>
  );
}
