export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">テストページ</h1>
      <p className="mt-4">このページが表示されれば、基本的な機能は動作しています。</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Tailwind CSSのテスト：</p>
        <div className="mt-2 p-2 bg-blue-500 text-white rounded">青い背景</div>
        <div className="mt-2 p-2 bg-red-500 text-white rounded">赤い背景</div>
        <div className="mt-2 p-2 bg-green-500 text-white rounded">緑の背景</div>
      </div>
    </div>
  );
}