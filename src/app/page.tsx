export default function HomePage() {
  return (
    <div className="min-h-screen bg-mist flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl px-8 py-6 text-center border border-sky/40">
        <h1 className="text-3xl font-semibold text-earth">
          🌱 GreenRoute
        </h1>
        <p className="mt-3 text-gray-600">
          Tailwind v4 + custom eco palette is working!
        </p>
        <button className="mt-6 px-5 py-2 rounded-lg bg-leaf text-white hover:bg-emerald-600 transition">
          Plan a Green Route
        </button>
      </div>
    </div>
  );
}
