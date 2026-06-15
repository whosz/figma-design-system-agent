export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-white">
      <div className="text-center">
        <p className="text-6xl font-bold text-white/10">404</p>
        <p className="mt-4 text-white/50">Page not found</p>
        <a href="/" className="mt-6 inline-block text-[#9747FF] hover:underline text-sm">Go home</a>
      </div>
    </div>
  )
}
