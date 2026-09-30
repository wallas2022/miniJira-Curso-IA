import type { Greeting } from '@minijira/shared'

const greeting: Greeting = { message: 'Hola Mundo' }

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <h1 className="text-4xl font-semibold text-gray-900">{greeting.message}</h1>
    </main>
  )
}

export default App
