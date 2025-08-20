import dynamic from "next/dynamic";

export const ActivityMapDynamic = dynamic(
  () => import("./map-component").then((mod) => ({ default: mod.MapComponent })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">地図を読み込み中...</p>
      </div>
    ),
  }
);