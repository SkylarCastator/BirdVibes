import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { AudioProvider } from '@/components/audio/AudioContext'
import { Overview } from '@/pages/Overview'
import { Detections } from '@/pages/Detections'
import { Species } from '@/pages/Species'
import { SpeciesDetail } from '@/pages/SpeciesDetail'
import { Collection } from '@/pages/Collection'
import { Recordings } from '@/pages/Recordings'
import { Analytics } from '@/pages/Analytics'
import { LiveStream } from '@/pages/LiveStream'
import { Settings } from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="detections" element={<Detections />} />
            <Route path="species" element={<Species />} />
            <Route path="species/:sciName" element={<SpeciesDetail />} />
            <Route path="collection" element={<Collection />} />
            <Route path="recordings" element={<Recordings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="live" element={<LiveStream />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AudioProvider>
    </QueryClientProvider>
  )
}

export default App
