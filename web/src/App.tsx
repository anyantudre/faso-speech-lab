import { BrowserRouter, Route, Routes } from 'react-router'
import { Shell } from './components/Shell'
import { DockProvider } from './components/Dock'
import { TermsProvider } from './components/Terms'
import { CatalogProvider } from './lib/catalog'
import { PrefsProvider } from './lib/prefs'
import { LIVE, MODELS } from './tasks'
import Home from './pages/Home'

export default function App() {
  return (
    <PrefsProvider>
      <CatalogProvider>
        <BrowserRouter>
          <TermsProvider>
            <DockProvider>
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<Home />} />
                  {[...LIVE, MODELS].map(({ id, path, page: Page }) => Page && <Route key={id} path={path} element={<Page />} />)}
                  <Route path="*" element={<Home />} />
                </Route>
              </Routes>
            </DockProvider>
          </TermsProvider>
        </BrowserRouter>
      </CatalogProvider>
    </PrefsProvider>
  )
}
