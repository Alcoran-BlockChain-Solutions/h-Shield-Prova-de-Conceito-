import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Analytics } from './pages/Analytics'
import { Devices } from './pages/Devices'
import { Blockchain } from './pages/Blockchain'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="devices" element={<Devices />} />
          <Route path="blockchain" element={<Blockchain />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
