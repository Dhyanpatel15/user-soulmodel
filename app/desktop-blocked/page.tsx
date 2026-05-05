export default function DesktopBlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-pink-100 flex items-center justify-center">
          <span className="text-3xl">📱</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Mobile Access Only
        </h1>

        <p className="text-gray-500 text-sm leading-6">
          This app is only available on mobile devices. Please open this website
          from your phone.
        </p>
      </div>
    </div>
  );
}